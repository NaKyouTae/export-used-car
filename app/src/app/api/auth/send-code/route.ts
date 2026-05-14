import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:18090";

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const response = await fetch(`${API_URL}/auth/send-code`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });

    const text = await response.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text || "Unexpected response from server" };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error("[send-code] proxy failed:", err);
    const message =
      err instanceof Error && err.name === "TimeoutError"
        ? "Email server timed out. Please try again."
        : "Failed to reach email server. Please try again.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
