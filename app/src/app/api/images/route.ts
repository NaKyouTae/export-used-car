import { NextRequest } from "next/server";
import { proxyMultipartToApi } from "@/lib/api-proxy";

export async function POST(request: NextRequest) {
  return proxyMultipartToApi("/images", request, { auth: true });
}
