import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:3000';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const token = (await cookies()).get('token')?.value;
  const searchParams = request.nextUrl.searchParams;
  const parentReplyId = searchParams.get('parentReplyId') ?? undefined;

  const url = new URL(`${API_URL}/posts/${params.id}/replies`);
  if (parentReplyId) url.searchParams.set('parentReplyId', parentReplyId);

  try {
    const res = await fetch(url.toString(), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return NextResponse.json([], { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch replies', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const token = (await cookies()).get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.body) {
      return NextResponse.json({ error: 'Body is required' }, { status: 400 });
    }

    const res = await fetch(`${API_URL}/posts/${params.id}/replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Failed to create reply', error);
      return NextResponse.json({ error: 'Failed to create reply' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating reply', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}