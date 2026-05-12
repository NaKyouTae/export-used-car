import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api-proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  return proxyToApi(`/chat/rooms/${roomId}/messages`, request, { auth: true });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  return proxyToApi(`/chat/rooms/${roomId}/messages`, request, { auth: true });
}
