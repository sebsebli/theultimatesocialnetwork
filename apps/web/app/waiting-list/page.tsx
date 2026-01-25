'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function WaitingListPage() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error('Failed to join waiting list');
      }

      setSuccess(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')`}}></div>
      
      <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in">
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-white/5 border border-white/10 mb-4 transition-transform hover:scale-105">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M11 5H7C4.5 9 4.5 15 7 19H11"></path>
              <path d="M13 5H17V19H13"></path>
            </svg>
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-paper">Join the Waitlist</h1>
          <p className="text-secondary text-lg">CITE is currently in invite-only beta. Be the first to know when we open up or when your invite is ready.</p>
        </div>

        {success ? (
          <div className="p-6 bg-primary/10 border border-primary/20 rounded-xl text-center space-y-4 animate-in zoom-in">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-paper">You're on the list!</h2>
              <p className="text-secondary">We'll reach out to <span className="text-paper">{email}</span> as soon as space opens up.</p>
            </div>
            <Link href="/" className="block w-full py-3 text-primary hover:underline font-medium">
              Back to home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-14 px-4 bg-white/5 border border-white/10 rounded-lg text-paper placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-primary hover:bg-[#7d8b9d] transition-all duration-200 text-white font-semibold rounded-lg disabled:opacity-50 shadow-lg shadow-primary/20 active:scale-[0.98]"
              >
                {loading ? 'Joining...' : 'Join Waitlist'}
              </button>
              
              <div className="text-[11px] text-tertiary space-y-2 text-center">
                <p>By joining, you agree to our <Link href="/terms" className="underline hover:text-secondary">Waitlist Terms</Link> and <Link href="/privacy" className="underline hover:text-secondary">Privacy Policy</Link>.</p>
                <p>Waitlist members are processed in the order received. Providing a referral code later will skip you to the front.</p>
              </div>
            </div>
            
            <p className="text-center text-sm">
              <Link href="/sign-in" className="text-secondary hover:text-primary transition-colors">
                Already have an invite? <span className="text-primary font-medium">Sign in</span>
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
