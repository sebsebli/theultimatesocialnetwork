import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:3000';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const limit = searchParams.get('limit') || '20';
  const offset = searchParams.get('offset') || '0';

  if (!q) return NextResponse.json({ hits: [] });

  const token = (await cookies()).get('token')?.value;
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const params = new URLSearchParams({ q, limit, offset });
  const res = await fetch(`${API_URL}/search/users?${params.toString()}`, {
    headers,
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}