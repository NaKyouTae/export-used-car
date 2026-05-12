import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api-proxy";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToApi(`/cars/${id}/options`, request, { auth: true });
}
