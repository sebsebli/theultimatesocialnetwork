'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SignInForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) setInviteCode(code);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, inviteCode }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send magic link');
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-6 relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')`}}></div>
        
        <div className="w-full max-w-md space-y-6 relative z-10 animate-in fade-in">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-paper">Check your email</h1>
            <p className="text-secondary text-base">
              We sent a magic link to <span className="text-paper font-medium">{email}</span>
            </p>
            <p className="text-tertiary text-sm mt-4">
              (Check the API console logs for the link in development)
            </p>
          </div>
          
          <div className="space-y-3 pt-4">
            <button
              onClick={() => {
                setSent(false);
                setEmail('');
              }}
              className="w-full h-14 bg-primary hover:bg-[#7d8b9d] transition-all duration-200 text-white font-semibold rounded-lg active:scale-[0.98] shadow-lg shadow-primary/20"
            >
              Resend
            </button>
            <button
              onClick={() => {
                setSent(false);
                setEmail('');
              }}
              className="w-full text-primary text-center font-medium hover:text-[#7d8b9d] transition-colors"
            >
              Change email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')`}}></div>
      
      <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center mb-8">
          <Link href="/" className="group relative flex items-center justify-center w-16 h-16 rounded-lg bg-white/5 border border-white/10 shadow-[0_0_40px_-10px_rgba(255,255,255,0.05)] backdrop-blur-sm transition-transform duration-500 hover:scale-[1.02]">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M11 5H7C4.5 9 4.5 15 7 19H11"></path>
              <path d="M13 5H17V19H13"></path>
            </svg>
          </Link>
        </div>
        
        <SignInForm />
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
      <SignInWrapper />
    </Suspense>
  );
}

function SignInWrapper() {
  return <SignInPageContent />;
}

// Renaming the main component logic to separate concerns
function SignInPageContent() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')`}}></div>
        <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in">
            <div className="flex items-center justify-center mb-8">
            <Link href="/" className="group relative flex items-center justify-center w-16 h-16 rounded-lg bg-white/5 border border-white/10 shadow-[0_0_40px_-10px_rgba(255,255,255,0.05)] backdrop-blur-sm transition-transform duration-500 hover:scale-[1.02]">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M11 5H7C4.5 9 4.5 15 7 19H11"></path>
                <path d="M13 5H17V19H13"></path>
                </svg>
            </Link>
            </div>
            <SignInForm />
        </div>
    </div>
  )
}
