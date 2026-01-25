import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const handle = searchParams.get('handle');

    if (!handle) {
      return NextResponse.json({ error: 'Handle is required' }, { status: 400 });
    }

    // Check if handle exists
    const res = await fetch(`${API_URL}/users/${handle}`);

    if (res.status === 404) {
      return NextResponse.json({ available: true });
    }

    if (res.ok) {
      return NextResponse.json({ available: false });
    }

    return NextResponse.json({ available: true }); // Default to available on error
  } catch (error) {
    console.error('Error checking handle', error);
    return NextResponse.json({ available: true }); // Default to available
  }
}
