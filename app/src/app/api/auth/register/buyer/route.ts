import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/api-proxy";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:18090";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { tempToken, ...registerData } = body;

  const apiResponse = await fetch(`${API_URL}/auth/buyer/register`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${tempToken}`,
    },
    body: JSON.stringify(registerData),
  });

  const data = await apiResponse.json();

  if (!apiResponse.ok) {
    return NextResponse.json(data, { status: apiResponse.status });
  }

  const response = NextResponse.json(data, { status: 201 });
  if (data.accessToken && data.refreshToken) {
    return setAuthCookies(response, data.accessToken, data.refreshToken);
  }

  return response;
}
