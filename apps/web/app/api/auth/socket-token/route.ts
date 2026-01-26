import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // In a real production scenario, we might want to issue a short-lived, specific "socket token"
  // rather than exposing the main JWT. For simplicity in this demo, we reuse the JWT.
  return NextResponse.json({ token });
}
