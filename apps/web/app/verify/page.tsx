'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      setStatus('error');
      setErrorMessage('Invalid verification link.');
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
        const data = await res.json();
        // Set cookie for middleware
        document.cookie = `token=${data.accessToken}; path=/; max-age=604800; SameSite=Lax`;
        
        setStatus('success');
        setTimeout(() => {
          window.location.href = '/home';
        }, 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setErrorMessage(data.message || 'Verification failed. The link may have expired.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('A network error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-primary/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-sm text-center relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {status === 'loading' && (
          <div className="space-y-6">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <h1 className="text-2xl font-bold text-paper">Verifying your account</h1>
            <p className="text-secondary">Please wait while we confirm your credentials...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-primary/20 animate-in zoom-in duration-500">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-paper">Verified successfully</h1>
            <p className="text-secondary">Redirecting you to your home feed...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 shadow-lg shadow-red-500/10 animate-in zoom-in duration-500">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-paper">Verification failed</h1>
            <p className="text-secondary">{errorMessage}</p>
            <Link href="/sign-in" className="inline-block px-8 py-3 bg-white/5 border border-white/10 text-paper font-semibold rounded-full hover:bg-white/10 transition-colors">
              Return to sign in
            </Link>
          </div>
        )}
      </div>
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