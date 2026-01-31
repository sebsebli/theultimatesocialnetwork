"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const router = useRouter();
  const { error: toastError } = useToast();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [showSaves, setShowSaves] = useState(true);
  const [enableRecommendations, setEnableRecommendations] = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [emailProductUpdates, setEmailProductUpdates] = useState(false);
  const [emailPrefsLoading, setEmailPrefsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me/notification-prefs")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setEmailMarketing(!!data.email_marketing);
          setEmailProductUpdates(!!data.email_product_updates);
        }
      })
      .catch(() => {})
      .finally(() => setEmailPrefsLoading(false));
  }, []);

  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    // Simulate slight delay for feedback
    await new Promise((resolve) => setTimeout(resolve, 500));
    window.open("/api/me/export", "_blank");
    setIsExporting(false);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action is irreversible.",
      )
    )
      return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/me/delete", { method: "DELETE" });
      if (res.ok) {
        router.push("/sign-in");
      } else {
        toastError("Failed to delete account");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-secondary hover:text-paper">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-paper">Settings</h1>
          <div className="w-6"></div>
        </div>
      </header>

      <div className="px-6 py-6 space-y-8">
        {/* Account */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-paper">Account</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
              <div>
                <div className="text-paper font-medium">Email</div>
                <div className="text-secondary text-sm">dev@Citewalk.local</div>
              </div>
              <button className="text-primary text-sm font-medium">
                Change
              </button>
            </div>
            <button className="w-full p-4 bg-white/5 border border-white/10 rounded-lg text-left text-paper hover:bg-white/10 transition-colors">
              Sign out
            </button>
          </div>
        </section>

        {/* Privacy */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-paper">Privacy</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
              <div>
                <div className="text-paper font-medium">Account type</div>
                <div className="text-secondary text-sm">Open</div>
              </div>
              <button className="text-primary text-sm font-medium">
                Change
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
              <div>
                <div className="text-paper font-medium">Follow approvals</div>
                <div className="text-secondary text-sm">Disabled</div>
              </div>
              <button className="text-primary text-sm font-medium">
                Change
              </button>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-paper">
            Notifications
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
              <div>
                <div className="text-paper font-medium">Push notifications</div>
                <div className="text-secondary text-sm">
                  Enable push notifications
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={(e) => setPushEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="pl-4 space-y-2 text-sm text-secondary">
              <div className="flex items-center justify-between">
                <span>Replies</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-primary"
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Quotes</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-primary"
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Mentions</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-primary"
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Follows</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-primary"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Email notifications */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-paper">Email</h2>
          <p className="text-secondary text-sm mb-3">
            System messages (sign-in, security, account) are always sent.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
              <div>
                <div className="text-paper font-medium">
                  Marketing & promotions
                </div>
                <div className="text-secondary text-sm">
                  News, offers and product updates from Citewalk
                </div>
              </div>
              {!emailPrefsLoading && (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailMarketing}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setEmailMarketing(v);
                      fetch("/api/me/notification-prefs", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email_marketing: v }),
                      }).catch(() => setEmailMarketing(!v));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              )}
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
              <div>
                <div className="text-paper font-medium">
                  Product updates & tips
                </div>
                <div className="text-secondary text-sm">
                  New features and how to get the most out of Citewalk
                </div>
              </div>
              {!emailPrefsLoading && (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailProductUpdates}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setEmailProductUpdates(v);
                      fetch("/api/me/notification-prefs", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email_product_updates: v }),
                      }).catch(() => setEmailProductUpdates(!v));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              )}
            </div>
          </div>
        </section>

        {/* Feed */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-paper">Feed</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
              <div>
                <div className="text-paper font-medium">
                  Show saves from people I follow
                </div>
                <div className="text-secondary text-sm">
                  See when people you follow save posts
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSaves}
                  onChange={(e) => setShowSaves(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Explore Relevance */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-paper">
            Explore relevance
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
              <div>
                <div className="text-paper font-medium">
                  Enable recommendations
                </div>
                <div className="text-secondary text-sm">
                  Use relevance algorithms
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableRecommendations}
                  onChange={(e) => setEnableRecommendations(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <Link
              href="/settings/relevance"
              className="block p-4 bg-white/5 border border-white/10 rounded-lg text-paper hover:bg-white/10 transition-colors"
            >
              <div className="font-medium">Relevance controls</div>
              <div className="text-secondary text-sm mt-1">
                Adjust recommendation weights
              </div>
            </Link>
          </div>
        </section>

        {/* Languages */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-paper">Languages</h2>
          <Link
            href="/settings/languages"
            className="block p-4 bg-white/5 border border-white/10 rounded-lg text-paper hover:bg-white/10 transition-colors"
          >
            <div className="font-medium">Manage languages</div>
            <div className="text-secondary text-sm mt-1">English, German</div>
          </Link>
        </section>

        {/* Safety */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-paper">Safety</h2>
          <div className="space-y-3">
            <Link
              href="/settings/blocked"
              className="block p-4 bg-white/5 border border-white/10 rounded-lg text-paper hover:bg-white/10 transition-colors"
            >
              <div className="font-medium">Blocked accounts</div>
            </Link>
            <Link
              href="/settings/muted"
              className="block p-4 bg-white/5 border border-white/10 rounded-lg text-paper hover:bg-white/10 transition-colors"
            >
              <div className="font-medium">Muted accounts</div>
            </Link>
          </div>
        </section>

        {/* Data */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-paper">Data</h2>
          <div className="space-y-3">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-lg text-left text-paper hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <div className="font-medium flex items-center justify-between">
                Export archive
                {isExporting && (
                  <span className="text-xs text-primary animate-pulse">
                    Starting...
                  </span>
                )}
              </div>
              <div className="text-secondary text-sm mt-1">
                Download your data
              </div>
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full p-4 bg-white/5 border border-red-500/50 rounded-lg text-left text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <div className="font-medium flex items-center justify-between">
                Delete account
                {isDeleting && (
                  <span className="text-xs text-red-400 animate-pulse">
                    Processing...
                  </span>
                )}
              </div>
              <div className="text-secondary text-sm mt-1">
                Permanently delete your account
              </div>
            </button>
          </div>
        </section>

        {/* Legal */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-paper">Legal</h2>
          <div className="space-y-2">
            <Link href="/terms" className="block text-primary hover:underline">
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="block text-primary hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/ai-transparency"
              className="block text-primary hover:underline"
            >
              AI Transparency
            </Link>
            <Link
              href="/imprint"
              className="block text-primary hover:underline"
            >
              Imprint
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
