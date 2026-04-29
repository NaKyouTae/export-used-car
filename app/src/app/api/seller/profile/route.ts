import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api-proxy";

export async function GET(request: NextRequest) {
  return proxyToApi("/sellers/me", request, { auth: true });
}

export async function PATCH(request: NextRequest) {
  return proxyToApi("/sellers/me", request, { auth: true });
}
