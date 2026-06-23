import { NextRequest } from "next/server";
import { proxyMultipartToApi } from "@/lib/api-proxy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  return proxyMultipartToApi(`/chat/rooms/${roomId}/images`, request, {
    auth: true,
  });
}
