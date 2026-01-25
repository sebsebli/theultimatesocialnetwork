import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    (await cookies()).delete('token');
    return NextResponse.json({ success: true });
  } catch (error) {
    // Even if delete fails, return success (cookie may not exist)
    return NextResponse.json({ success: true });
  }
}
