import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  const token = (await cookies()).get('token')?.value;
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q');
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';

    if (!q || !q.trim()) {
      return NextResponse.json({ hits: [] });
    }

    const params = new URLSearchParams();
    params.set('q', q.trim());
    params.set('limit', limit);
    params.set('offset', offset);
    const res = await fetch(
      `${API_URL}/search/topics?${params.toString()}`,
      { headers }
    );

    if (!res.ok) {
      return NextResponse.json({ hits: [] });
    }

    const data = await res.json();
    return NextResponse.json({ hits: data.hits || [] });
  } catch (error) {
    console.error('Error searching topics', error);
    return NextResponse.json({ hits: [] });
  }
}
