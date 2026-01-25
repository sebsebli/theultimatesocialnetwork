import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl, validateOrigin, createSecureErrorResponse } from '@/lib/security';

function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/\0/g, '').trim().slice(0, maxLength);
}

const API_URL = getApiUrl();

export async function POST(request: Request) {
  // Validate origin (CSRF protection)
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    // Input validation
    const email = sanitizeString(body.email);
    const inviteCode = body.inviteCode ? sanitizeString(body.inviteCode) : undefined;
    
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, inviteCode }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      // Don't leak specific error details unless needed
      if (res.status === 429) {
        return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
      }
      return NextResponse.json({ error: data.message || 'Failed to send magic link' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorResponse = createSecureErrorResponse('Internal Error', 500);
    return NextResponse.json({ error: errorResponse.error }, { status: errorResponse.status });
  }
}
