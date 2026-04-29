import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/api-proxy";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:18090";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const apiResponse = await fetch(`${API_URL}/auth/verify-code`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await apiResponse.json();

  if (!apiResponse.ok) {
    return NextResponse.json(data, { status: apiResponse.status });
  }

  // If tokens are returned (existing user), set cookies
  const response = NextResponse.json(data, { status: 200 });
  if (data.accessToken && data.refreshToken) {
    return setAuthCookies(response, data.accessToken, data.refreshToken);
  }

  return response;
}
