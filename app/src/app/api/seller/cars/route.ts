import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api-proxy";

export async function GET(request: NextRequest) {
  return proxyToApi("/sellers/me/cars", request, { auth: true });
}

export async function POST(request: NextRequest) {
  return proxyToApi("/cars", request, { auth: true });
}
