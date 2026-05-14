import { NextRequest, NextResponse } from 'next/server';
import { adminProxy } from '@/lib/api-proxy';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.toString();
    const res = await adminProxy(`/admin/users${query ? `?${query}` : ''}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
