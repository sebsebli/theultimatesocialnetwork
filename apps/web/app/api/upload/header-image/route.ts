import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const token = (await cookies()).get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Forward to API
    const apiFormData = new FormData();
    apiFormData.append('image', file);

    const res = await fetch(`${API_URL}/upload/header-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: apiFormData,
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to upload image' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error uploading image', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
