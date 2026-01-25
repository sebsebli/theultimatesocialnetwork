'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('Verifying...');

  useEffect(() => {
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email || !token) {
      setStatus('Invalid link');
      return;
    }

    verify(email, token);
  }, [searchParams]);

  const verify = async (email: string, token: string) => {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });

      if (res.ok) {
        setStatus('Success! Redirecting...');
        router.push('/home');
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