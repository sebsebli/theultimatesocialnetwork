'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [token, setToken] = useState('');
  
  // 'email' = initial step, 'token' = verification step
  const [step, setStep] = useState<'email' | 'token'>('email');
  const [cooldown, setCooldown] = useState(0);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for existing cooldown
    const savedCooldown = sessionStorage.getItem('signin_cooldown');
    if (savedCooldown) {
      const remaining = Math.ceil((parseInt(savedCooldown) - Date.now()) / 1000);
      if (remaining > 0) setCooldown(remaining);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            sessionStorage.removeItem('signin_cooldown');
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const startCooldown = () => {
    const duration = 60;
    setCooldown(duration);
    sessionStorage.setItem('signin_cooldown', (Date.now() + duration * 1000).toString());
  };

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setInviteCode(code);
      setShowInviteInput(true);
    }
  }, [searchParams]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        body: JSON.stringify({ email, inviteCode: showInviteInput ? inviteCode : undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        
        // Check for specific beta invite requirement
        if (res.status === 400 && data.message === 'Invite code required for registration') {
          setShowInviteInput(true);
          throw new Error('You are new here! Please enter your invite code to join the beta.');
        }

        // Check for rate limit
        if (res.status === 400 && data.message === 'Please wait before sending another code') {
          startCooldown();
          throw new Error('Please wait 60 seconds before requesting another code.');
        }

        throw new Error(data.message || 'Failed to send verification code');
      }

      setStep('token');
      startCooldown();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });

      if (!res.ok) {
        throw new Error('Invalid code or expired.');
      }

      const data = await res.json();
      
      // Set cookie for middleware
      document.cookie = `token=${data.accessToken}; path=/; max-age=604800; SameSite=Lax`;
      
      // Redirect
      window.location.href = '/home';
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'token') {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-paper">Enter Code</h1>
          <p className="text-secondary text-sm">
            We sent a verification code to <span className="text-paper font-medium">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-900/10 border border-red-900/20 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-paper placeholder-secondary/50 text-center text-2xl tracking-[0.5em] font-mono"
              placeholder="000000"
              autoFocus
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading || token.length < 6}
            className="w-full h-12 bg-primary hover:bg-[#7d8b9d] text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 active:scale-[0.98]"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
        
        <div className="space-y-3 pt-4">
          <button
            type="button"
            onClick={() => handleLogin()}
            disabled={cooldown > 0 || loading}
            className="w-full h-12 border border-white/10 hover:bg-white/5 text-paper font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </button>

          <button
            onClick={() => {
              setStep('email');
              setToken('');
              setCooldown(0);
            }}
            className="w-full text-secondary hover:text-paper text-sm transition-colors pt-2"
          >
            Wrong email? Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-6 w-full max-w-md animate-in fade-in">
      {error && (
        <div className="p-3 text-sm text-red-400 bg-red-900/10 border border-red-900/20 rounded-lg animate-in slide-in-from-top-2">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-secondary">
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-paper placeholder-secondary/50 transition-all"
          placeholder="you@example.com"
        />
      </div>

      {showInviteInput && (
        <div className="space-y-2 animate-in slide-in-from-top-4 fade-in duration-300">
          <label htmlFor="inviteCode" className="block text-sm font-medium text-secondary">
            Invite Code (Beta)
          </label>
          <input
            id="inviteCode"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-paper placeholder-secondary/50 transition-all uppercase tracking-wider"
            placeholder="INVITE-CODE"
            required
            autoFocus
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-primary hover:bg-[#7d8b9d] text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 active:scale-[0.98]"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Sending...
          </span>
        ) : (
          'Send verification code'
        )}
      </button>

      <div className="text-center">
        <Link 
          href="/waiting-list"
          className="text-sm text-primary hover:text-[#7d8b9d] transition-colors font-medium"
        >
          Need an invite? Join the waiting list
        </Link>
      </div>
      
      <p className="text-center text-sm text-tertiary">
          No password. We'll email you a code.
      </p>
    </form>
  );
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

function SignInWrapper() {
  return <SignInPageContent />;
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
      <SignInWrapper />
    </Suspense>
  );
}