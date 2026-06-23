import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api-proxy";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  return proxyToApi(`/chat/rooms/${roomId}/desired-price`, request, {
    auth: true,
  });
}
