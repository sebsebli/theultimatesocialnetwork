import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApiUrl, createSecureErrorResponse } from '@/lib/security';

const API_URL = getApiUrl();

export async function GET() {
  const token = (await cookies()).get('token')?.value;
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Clear invalid token
        (await cookies()).delete('token');
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    // Don't log sensitive errors in production
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error fetching user', error);
    }
    const errorResponse = createSecureErrorResponse('Internal Error', 500);
    return NextResponse.json({ error: errorResponse.error }, { status: errorResponse.status });
  }
}

export async function PATCH(request: Request) {
  const token = (await cookies()).get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  const res = await fetch(`${API_URL}/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
