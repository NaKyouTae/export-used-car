import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearAuthCookies } from "@/lib/api-proxy";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:18090";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("euc_at")?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: { authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await response.json();
    return NextResponse.json({ authenticated: true, user });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  return clearAuthCookies(response);
}
