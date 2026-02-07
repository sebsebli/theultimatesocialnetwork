"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SuggestedAccount {
  id: string;
  handle: string;
  displayName?: string;
  bio?: string;
}

export default function OnboardingStarterPacksPage() {
  const router = useRouter();
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [accounts, setAccounts] = useState<SuggestedAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetch("/api/users/suggested");
        if (res.ok) {
          const data = await res.json();
          setAccounts(Array.isArray(data) ? (data as SuggestedAccount[]) : []);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production")
          console.error("Failed to load suggested accounts", error);
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
      const method = isFollowing ? "DELETE" : "POST";
      await fetch(`/api/users/${id}/follow`, { method });
    } catch (e) {
      if (process.env.NODE_ENV !== "production")
        console.error("Failed to toggle follow", e);
      // Revert on failure
      setFollowing(following);
    }
  };

  const handleFinish = () => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("onboarding_stage");
      sessionStorage.setItem("onboarding_complete", "true");
    }
    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-ink px-6 md:px-12 py-8 md:py-12">
      <div className="max-w-md md:max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
              4
            </div>
            <span className="text-xs text-tertiary uppercase tracking-wider">
              Step 4 of 4
            </span>
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-paper mb-2">
            Follow some writers
          </h1>
          <p className="text-secondary text-sm">
            Optionally follow some writers. You already have topics in your
            feed!
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={handleFinish}
              className="text-primary text-sm font-medium"
            >
              Skip
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="text-secondary text-sm text-center py-8">
              Finding writers for you...
            </p>
          ) : accounts.length === 0 ? (
            <p className="text-secondary text-sm text-center py-8">
              No suggestions right now. You can always find people later.
            </p>
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
                  <div className="font-semibold text-paper">
                    {account.displayName || account.handle}
                  </div>
                  <div className="text-tertiary text-sm">@{account.handle}</div>
                  {account.bio && (
                    <div className="text-secondary text-xs mt-1 line-clamp-1">
                      {account.bio}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => toggleFollow(account.id)}
                  className={`px-4 py-2 rounded-full border transition-colors shrink-0 ${
                    following.has(account.id)
                      ? "bg-primary border-primary text-white"
                      : "border-primary text-primary hover:bg-primary/10"
                  }`}
                >
                  {following.has(account.id) ? "Following" : "Follow"}
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={handleFinish}
          className="w-full h-14 bg-primary hover:bg-[#7d8b9d] transition-colors text-white font-semibold rounded-lg"
        >
          Let&apos;s go
        </button>
      </div>
    </div>
  );
}
