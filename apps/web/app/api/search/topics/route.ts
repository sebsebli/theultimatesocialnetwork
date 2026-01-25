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

    if (!q) {
      return NextResponse.json([]);
    }

    // Search topics via explore endpoint
    const res = await fetch(`${API_URL}/explore/topics`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const topics = await res.json();
    // Filter by query
    const filtered = topics.filter((t: any) =>
      t.title.toLowerCase().includes(q.toLowerCase()) ||
      t.slug.toLowerCase().includes(q.toLowerCase())
    );

    return NextResponse.json(filtered.slice(0, 10));
  } catch (error) {
    console.error('Error searching topics', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
