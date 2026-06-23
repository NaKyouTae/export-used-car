import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api-proxy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; messageId: string }> }
) {
  const { roomId, messageId } = await params;
  return proxyToApi(
    `/chat/rooms/${roomId}/messages/${messageId}/translate`,
    request,
    { auth: true }
  );
}
