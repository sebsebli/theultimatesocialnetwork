import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const token = (await cookies()).get('token')?.value;
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q');
    const limit = searchParams.get('limit') || '15';

    if (!q || !q.trim()) {
      return NextResponse.json({ posts: [], users: [], topics: [] });
    }

    const res = await fetch(
      `${API_URL.replace(/\/$/, '')}/search/all?q=${encodeURIComponent(q.trim())}&limit=${encodeURIComponent(limit)}`,
      { headers }
    );

    if (!res.ok) {
      return NextResponse.json({ posts: [], users: [], topics: [] });
    }

    const data = await res.json();
    return NextResponse.json({
      posts: data.posts || [],
      users: data.users || [],
      topics: data.topics || [],
    });
  } catch (error) {
    console.error('Search all error', error);
    return NextResponse.json({ posts: [], users: [], topics: [] });
  }
}
