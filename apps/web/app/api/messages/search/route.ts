import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  const token = (await cookies()).get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q') ?? '';
  const limit = searchParams.get('limit') || '30';

  try {
    const res = await fetch(
      `${API_URL}/messages/search?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return NextResponse.json([], { status: res.status });
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Messages search error', error);
    return NextResponse.json([], { status: 500 });
  }
}
