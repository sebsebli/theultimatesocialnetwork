'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingStarterPacksPage() {
  const router = useRouter();
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [accounts, setAccounts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetch('/api/users/suggested');
        if (res.ok) {
          const data = await res.json();
          setAccounts(data);
        }
      } catch (error) {
        console.error('Failed to load suggested accounts', error);
      } finally {
        setLoading(false);
      }
    };
    loadAccounts();
  }, []);

  const toggleFollow = async (id: string) => {
    const isFollowing = following.has(id);

    // Optimistic update
    const newFollowing = new Set(following);
    if (isFollowing) {
      newFollowing.delete(id);
    } else {
      newFollowing.add(id);
    }
    setFollowing(newFollowing);

    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      await fetch(`/api/users/${id}/follow`, { method });
    } catch (e) {
      console.error('Failed to toggle follow', e);
      // Revert on failure
      setFollowing(following);
    }
  };

  const handleFinish = () => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('onboarding_stage');
    }
    router.push('/home');
  };

  return (
    <div className="min-h-screen bg-ink px-6 md:px-12 py-8 md:py-12">
      <div className="max-w-md md:max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-paper mb-2">Follow a few voices</h1>
            <p className="text-secondary text-sm">Discover interesting perspectives</p>
          </div>
          <button
            onClick={handleFinish}
            className="text-primary text-sm font-medium"
          >
            Skip
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="text-secondary text-sm text-center py-8">Loading suggestions...</p>
          ) : accounts.length === 0 ? (
            <p className="text-secondary text-sm text-center py-8">No suggestions found.</p>
          ) : (
            accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg"
              >
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold shrink-0">
                  {account.displayName?.charAt(0) || account.handle?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-paper">{account.displayName || account.handle}</div>
                  <div className="text-tertiary text-sm">@{account.handle}</div>
                  {account.bio && (
                    <div className="text-secondary text-xs mt-1 line-clamp-1">{account.bio}</div>
                  )}
                </div>
                <button
                  onClick={() => toggleFollow(account.id)}
                  className={`px-4 py-2 rounded-full border transition-colors shrink-0 ${following.has(account.id)
                      ? 'bg-primary border-primary text-white'
                      : 'border-primary text-primary hover:bg-primary/10'
                    }`}
                >
                  {following.has(account.id) ? 'Following' : 'Follow'}
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={handleFinish}
          className="w-full h-14 bg-primary hover:bg-[#7d8b9d] transition-colors text-white font-semibold rounded-lg"
        >
          Finish
        </button>
      </div>
    </div>
  );
}
