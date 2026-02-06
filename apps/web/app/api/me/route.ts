import { NextResponse } from 'next/server';
import { createSecureErrorResponse } from '@/lib/security';
import { serverFetch } from '@/lib/server-fetch';

export async function GET() {
  try {
    const result = await serverFetch('/users/me');

    if (!result.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: result.status });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error fetching user', error);
    }
    const errorResponse = createSecureErrorResponse('Internal Error', 500);
    return NextResponse.json({ error: errorResponse.error }, { status: errorResponse.status });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const result = await serverFetch('/users/me', {
      method: 'PATCH',
      body,
    });

    if (!result.ok) {
      const errData = result.data as Record<string, unknown> | null;
      return NextResponse.json(
        { error: errData?.message ?? errData?.error ?? 'Failed' },
        { status: result.status },
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error updating user', error);
    }
    const errorResponse = createSecureErrorResponse('Internal Error', 500);
    return NextResponse.json({ error: errorResponse.error }, { status: errorResponse.status });
  }
}
