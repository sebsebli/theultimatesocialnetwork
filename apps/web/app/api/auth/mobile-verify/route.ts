import { NextResponse } from 'next/server';
import { getApiUrl, validateOrigin, createSecureErrorResponse } from '@/lib/security';

// ... (validation functions same as verify/route.ts) ...
function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function validateToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  return /^[a-zA-Z0-9-]{4,50}$/.test(token);
}

function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/\0/g, '').trim().slice(0, maxLength);
}

const API_URL = getApiUrl();

export async function POST(request: Request) {
  // Mobile app might not send Origin header in the same way, 
  // but we can check if the request looks legitimate or skip Origin check for mobile if needed.
  // For now, let's assume validateOrigin handles null/missing origin gracefully or we skip it.
  // const origin = request.headers.get('origin');
  
  try {
    const body = await request.json();
    
    // Input validation
    const email = sanitizeString(body.email);
    const token = sanitizeString(body.token);
    
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    
    if (!validateToken(token)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const res = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const data = await res.json();
    const { accessToken, user } = data;

    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json({ error: 'Invalid response' }, { status: 500 });
    }

    // Return token in body for mobile app to store in SecureStore
    return NextResponse.json({ success: true, accessToken, user });
  } catch (error) {
    const errorResponse = createSecureErrorResponse('Internal Error', 500);
    return NextResponse.json({ error: errorResponse.error }, { status: errorResponse.status });
  }
}
