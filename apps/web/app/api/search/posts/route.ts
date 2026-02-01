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
    const topicSlug = searchParams.get('topicSlug');
    const limit = searchParams.get('limit') || '20';
    const offset = searchParams.get('offset') || '0';

    if (!q || !q.trim()) {
      return NextResponse.json({ hits: [], estimatedTotalHits: 0 });
    }

    const params = new URLSearchParams();
    params.set('q', q.trim());
    params.set('limit', limit);
    params.set('offset', offset);
    if (topicSlug) params.set('topicSlug', topicSlug);

    const res = await fetch(
      `${API_URL.replace(/\/$/, '')}/search/posts?${params.toString()}`,
      { headers }
    );

    if (!res.ok) {
      return NextResponse.json({ hits: [], estimatedTotalHits: 0 });
    }

    const data = await res.json();
    return NextResponse.json({
      hits: data.hits || [],
      estimatedTotalHits: data.estimatedTotalHits ?? (data.hits?.length ?? 0),
    });
  } catch (error) {
    console.error('Search posts error', error);
    return NextResponse.json({ hits: [], estimatedTotalHits: 0 });
  }
}
