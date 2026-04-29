import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:18090";

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/makes`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
