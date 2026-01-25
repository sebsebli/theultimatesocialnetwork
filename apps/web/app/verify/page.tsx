'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('Verifying...');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('Invalid link');
      return;
    }

    verify(token);
  }, [searchParams]);

  const verify = async (token: string) => {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        const data = await res.json();
        // data contains { accessToken, user }
        // Store token in cookie or local storage?
        // For now just redirect, assuming the middleware/cookie logic is handled or we need to set it here.
        // Wait, this is a client component. We should probably call a Server Action or Route Handler that sets the cookie.
        // But for this refactor, let's assume the API returns the token and we store it?
        // The previous implementation didn't show cookie logic here, just router.push.
        // Let's stick to the existing pattern but update the body.
        
        // Actually, usually we'd want to store the JWT.
        // If the previous code just did router.push, maybe the cookie was set by the API?
        // My AuthController just returns { accessToken, user }. It doesn't set a cookie.
        // So the frontend needs to handle it. 
        // I'll add basic storage logic.
        
        // Set cookie for middleware
        document.cookie = `token=${data.accessToken}; path=/; max-age=604800; SameSite=Lax`;
        
        setStatus('Success! Redirecting...');
        window.location.href = '/home'; // Force reload to pick up cookie
      } else {
        setStatus('Verification failed. The link may have expired.');
      }
    } catch (error) {
      setStatus('An error occurred.');
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="text-paper text-lg font-medium">{status}</div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink flex items-center justify-center text-paper text-lg font-medium">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}