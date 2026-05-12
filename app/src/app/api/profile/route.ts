import { NextRequest } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:18090";

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("euc_at")?.value;

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user type from profile first
  const profileRes = await fetch(`${API_URL}/auth/profile`, {
    headers: { authorization: `Bearer ${token}` },
  });

  if (!profileRes.ok) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await profileRes.json();
  const endpoint =
    user.userType === "SELLER" ? "/sellers/me" : "/buyers/me";

  const body = await request.text();

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body,
  });

  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
