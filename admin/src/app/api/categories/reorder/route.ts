import { NextRequest, NextResponse } from 'next/server';
import { adminProxy } from '@/lib/api-proxy';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await adminProxy('/categories/reorder', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
