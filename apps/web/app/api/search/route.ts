import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const token = (await cookies()).get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q');
    const type = searchParams.get('type') || 'posts';

    if (!q) {
      return NextResponse.json({ results: [] });
    }

    if (type === 'posts') {
      const res = await fetch(`${API_URL}/search/posts?q=${encodeURIComponent(q)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ results: data.hits || [] });
      }
    }

    // For users and topics, we'll need to implement those endpoints
    // For now, return empty
    return NextResponse.json({ results: [] });
  } catch (error) {
    console.error('Error searching', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
