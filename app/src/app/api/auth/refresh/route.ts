import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { setAuthCookies } from "@/lib/api-proxy";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:18090";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("euc_rt")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  try {
    const apiResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!apiResponse.ok) {
      return NextResponse.json({ error: "Refresh failed" }, { status: 401 });
    }

    const data = await apiResponse.json();
    const response = NextResponse.json({ success: true });

    if (data.accessToken && data.refreshToken) {
      return setAuthCookies(response, data.accessToken, data.refreshToken);
    }

    return response;
  } catch {
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
