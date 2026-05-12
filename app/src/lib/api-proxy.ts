import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:18090";

const COOKIE_ACCESS = "euc_at";
const COOKIE_REFRESH = "euc_rt";

export async function proxyToApi(
  path: string,
  request: Request,
  options?: { auth?: boolean }
) {
  const url = new URL(request.url);
  const targetUrl = `${API_URL}${path}${url.search}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  let accessToken: string | undefined;
  if (options?.auth) {
    const cookieStore = await cookies();
    accessToken = cookieStore.get(COOKIE_ACCESS)?.value;
    if (accessToken) {
      headers.set("authorization", `Bearer ${accessToken}`);
    }
  }

  const isBodyMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(
    request.method
  );
  const body = isBodyMethod ? await request.arrayBuffer() : undefined;

  try {
    let response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: body ? Buffer.from(body) : undefined,
    });

    // Auto-refresh: if 401 and we have a refresh token, try refreshing
    if (response.status === 401 && options?.auth) {
      const refreshed = await tryRefreshTokens();
      if (refreshed) {
        // Retry with new access token
        headers.set("authorization", `Bearer ${refreshed.accessToken}`);
        response = await fetch(targetUrl, {
          method: request.method,
          headers,
          body: body ? Buffer.from(body) : undefined,
        });

        // Return response with updated cookies
        const responseData = await response.arrayBuffer();
        const res = new Response(responseData, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            "content-type":
              response.headers.get("content-type") || "application/json",
          },
        });
        return setAuthCookies(
          res,
          refreshed.accessToken,
          refreshed.refreshToken
        );
      }
    }

    const responseData = await response.arrayBuffer();

    return new Response(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "content-type":
          response.headers.get("content-type") || "application/json",
      },
    });
  } catch {
    return Response.json(
      { error: "API server is unavailable" },
      { status: 502 }
    );
  }
}

export async function proxyMultipartToApi(
  path: string,
  request: Request,
  options?: { auth?: boolean }
) {
  const targetUrl = `${API_URL}${path}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (options?.auth) {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_ACCESS)?.value;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  const body = await request.arrayBuffer();

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: Buffer.from(body),
    });

    const responseData = await response.text();

    return new Response(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "content-type":
          response.headers.get("content-type") || "application/json",
      },
    });
  } catch {
    return Response.json(
      { error: "API server is unavailable" },
      { status: 502 }
    );
  }
}

async function tryRefreshTokens(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(COOKIE_REFRESH)?.value;
    if (!refreshToken) return null;

    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.accessToken && data.refreshToken) {
      return { accessToken: data.accessToken, refreshToken: data.refreshToken };
    }
    return null;
  } catch {
    return null;
  }
}

export function getAccessToken(
  cookieStore: Awaited<ReturnType<typeof cookies>>
) {
  return cookieStore.get(COOKIE_ACCESS)?.value;
}

export function getRefreshToken(
  cookieStore: Awaited<ReturnType<typeof cookies>>
) {
  return cookieStore.get(COOKIE_REFRESH)?.value;
}

export function setAuthCookies(
  response: Response,
  accessToken: string,
  refreshToken: string
) {
  // access token cookie: match JWT expiry (1h)
  response.headers.append(
    "set-cookie",
    `${COOKIE_ACCESS}=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60}`
  );
  // refresh token cookie: match JWT expiry (7d)
  response.headers.append(
    "set-cookie",
    `${COOKIE_REFRESH}=${refreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
  );
  return response;
}

export function clearAuthCookies(response: Response) {
  response.headers.append(
    "set-cookie",
    `${COOKIE_ACCESS}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  response.headers.append(
    "set-cookie",
    `${COOKIE_REFRESH}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return response;
}
