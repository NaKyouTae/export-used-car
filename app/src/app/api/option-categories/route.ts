import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api-proxy";

export async function GET(request: NextRequest) {
  return proxyToApi("/option-categories", request);
}
