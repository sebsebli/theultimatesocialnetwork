import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:3000';

export async function DELETE(request: Request) {
  const token = (await cookies()).get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${API_URL}/users/me`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed' }, { status: res.status });
  }

  // Clear cookie
  (await cookies()).delete('token');

  return NextResponse.json({ success: true });
}
