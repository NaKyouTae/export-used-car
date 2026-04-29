import { NextResponse } from 'next/server';
import { adminProxy } from '@/lib/api-proxy';

export async function GET() {
  try {
    const res = await adminProxy('/admin/dashboard');
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
