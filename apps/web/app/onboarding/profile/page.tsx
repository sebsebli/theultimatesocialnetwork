'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [isProtected, setIsProtected] = useState(false);
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);

  const checkHandle = async (value: string) => {
    if (value.length < 3) {
      setHandleAvailable(null);
      return;
    }
    try {
      const res = await fetch(`/api/users/check-handle?handle=${encodeURIComponent(value)}`);
      if (res.ok) {
        const data = await res.json();
        setHandleAvailable(data.available);
      }
    } catch (error) {
      console.error('Error checking handle', error);
      setHandleAvailable(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !handle) return;
    
    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          handle,
          bio,
          isProtected,
        }),
      });
      
      if (res.ok) {
        router.push('/onboarding/languages');
      } else {
        alert('Failed to create profile');
      }
    } catch (error) {
      console.error('Error creating profile', error);
      alert('Failed to create profile');
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-paper mb-2">Create your profile</h1>
          <p className="text-secondary text-sm">Set up your CITE identity</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Display name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-lg text-paper placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Handle
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary">@</span>
              <input
                type="text"
                value={handle}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  setHandle(value);
                  checkHandle(value);
                }}
                placeholder="username"
                className="w-full h-12 pl-8 pr-4 bg-white/5 border border-white/10 rounded-lg text-paper placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
                required
                minLength={3}
              />
              {handleAvailable !== null && (
                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs ${
                  handleAvailable ? 'text-green-400' : 'text-red-400'
                }`}>
                  {handleAvailable ? '✓ Available' : '✗ Taken'}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-paper placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Privacy
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="radio"
                  name="privacy"
                  checked={!isProtected}
                  onChange={() => setIsProtected(false)}
                  className="w-4 h-4 text-primary"
                />
                <div>
                  <div className="text-paper font-medium">Open</div>
                  <div className="text-secondary text-xs">Anyone can follow you</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="radio"
                  name="privacy"
                  checked={isProtected}
                  onChange={() => setIsProtected(true)}
                  className="w-4 h-4 text-primary"
                />
                <div>
                  <div className="text-paper font-medium">Protected</div>
                  <div className="text-secondary text-xs">Protected accounts approve followers.</div>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={!displayName || !handle}
            className="w-full h-14 bg-primary hover:bg-[#7d8b9d] transition-colors text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
