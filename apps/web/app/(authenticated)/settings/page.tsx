"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/auth-provider";

export default function SettingsPage() {
  const router = useRouter();
  const t = useTranslations("settings");
  const { error: toastError, success: toastSuccess } = useToast();
  const { user } = useAuth();
  const userHandle = (user as { handle?: string } | null)?.handle;
  const [pushEnabled, setPushEnabled] = useState(true);
  const [showSaves, setShowSaves] = useState(true);
  const [enableRecommendations, setEnableRecommendations] = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [emailProductUpdates, setEmailProductUpdates] = useState(false);
  const [emailPrefsLoading, setEmailPrefsLoading] = useState(true);

  // Email to display (fallback if not loaded yet) – reserved for future display
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for future email display
  const userEmail = (user as { email?: string } | null)?.email ?? "Loading...";

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for export progress UI
  const [isExporting, setIsExporting] = useState(false);
  const [requestExportLoading, setRequestExportLoading] = useState(false);
  const [requestDataModalOpen, setRequestDataModalOpen] = useState(false);

  const handleRequestMyData = async () => {
    setRequestDataModalOpen(false);
    setRequestExportLoading(true);
    try {
      const res = await fetch("/api/me/request-export", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toastSuccess(
          data.message ??
            "Check your email for a download link. The link expires in 7 days and can only be used once.",
        );
      } else {
        toastError(data.error ?? "Failed to request your data");
      }
    } catch {
      toastError("Failed to request your data");
    } finally {
      setRequestExportLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-ink">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 md:px-6 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/home"
            className="text-secondary hover:text-paper"
            aria-label="Back"
          >
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
        {/* Account — match mobile: Edit profile, Invite Friends, Languages */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-tertiary mb-3">
            Account
          </h2>
          <div className="space-y-1">
            <Link
              href="/settings/profile"
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg text-paper hover:bg-white/10 transition-colors"
            >
              <span className="font-medium">Edit profile</span>
              <svg
                className="w-5 h-5 text-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            <Link
              href="/invites"
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg text-paper hover:bg-white/10 transition-colors"
            >
              <span className="font-medium">Invite Friends</span>
              <svg
                className="w-5 h-5 text-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            <Link
              href="/settings/email"
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg text-paper hover:bg-white/10 transition-colors"
            >
              <span className="font-medium">{t("changeEmail")}</span>
              <svg
                className="w-5 h-5 text-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            <Link
              href="/settings/languages"
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg text-paper hover:bg-white/10 transition-colors"
            >
              <span className="font-medium">Languages</span>
              <svg
                className="w-5 h-5 text-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            <Link
              href="/settings/security"
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg text-paper hover:bg-white/10 transition-colors"
            >
              <span className="font-medium">Security (2FA & Sessions)</span>
              <svg
                className="w-5 h-5 text-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </Link>
            <Link
              href="/settings/danger-zone"
              className="flex items-center justify-between p-4 bg-white/5 border border-red-500/20 rounded-lg text-red-400/90 hover:bg-red-500/10 transition-colors"
            >
              <div>
                <span className="font-medium block">Danger zone</span>
                <span className="text-xs text-tertiary mt-0.5 block">
                  Delete account, request data export
                </span>
              </div>
              <svg
                className="w-5 h-5 text-tertiary shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </section>

        {/* Content — match mobile order: Relevance, Notifications, then push/email/feed/explore */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-tertiary mb-3">
            Content
          </h2>
          <div className="space-y-1 mb-6">
            <Link
              href="/settings/relevance"
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg text-paper hover:bg-white/10 transition-colors"
            >
              <span className="font-medium">Relevance</span>
              <svg
                className="w-5 h-5 text-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            <Link
              href="/settings/notifications"
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg text-paper hover:bg-white/10 transition-colors"
            >
              <span className="font-medium">Notifications</span>
              <svg
                className="w-5 h-5 text-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
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

          {/* Email notifications (under Content) */}
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-tertiary mb-2">
              Email
            </h3>
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
          </div>

          {/* Feed (under Content) */}
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-tertiary mb-2">
              Feed
            </h3>
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
          </div>

          {/* Explore relevance (under Content) */}
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-tertiary mb-2">
              Explore relevance
            </h3>
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
          </div>
        </section>

        {/* Safety — match mobile */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-tertiary mb-3">
            Safety
          </h2>
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

        {/* Legal — match mobile: Terms, Privacy, Imprint, RSS, Request data, Danger zone */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-tertiary mb-3">
            Legal
          </h2>
          <div className="space-y-1">
            <Link
              href="/terms"
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg text-paper hover:bg-white/10 transition-colors"
            >
              <span className="font-medium">Terms of Service</span>
              <svg
                className="w-5 h-5 text-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            <Link
              href="/privacy"
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg text-paper hover:bg-white/10 transition-colors"
            >
              <span className="font-medium">Privacy Policy</span>
              <svg
                className="w-5 h-5 text-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            <Link
              href="/imprint"
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg text-paper hover:bg-white/10 transition-colors"
            >
              <span className="font-medium">Imprint</span>
              <svg
                className="w-5 h-5 text-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            {userHandle && (
              <button
                type="button"
                onClick={async () => {
                  const base =
                    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
                  const url = `${base}/rss/${encodeURIComponent(userHandle)}`;
                  const title = "My RSS Feed";
                  if (typeof navigator !== "undefined" && navigator.share) {
                    try {
                      await navigator.share({
                        url,
                        title,
                        text: title,
                      });
                    } catch (err) {
                      if ((err as Error).name !== "AbortError") {
                        window.open(url, "_blank", "noopener,noreferrer");
                      }
                    }
                  } else {
                    window.open(url, "_blank", "noopener,noreferrer");
                  }
                }}
                className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg text-left text-paper hover:bg-white/10 transition-colors"
              >
                <span className="font-medium">My RSS Feed</span>
                <svg
                  className="w-5 h-5 text-tertiary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </button>
            )}
            <button
              onClick={() => setRequestDataModalOpen(true)}
              disabled={requestExportLoading}
              className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg text-left text-paper hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <span className="font-medium">Request my data</span>
              {requestExportLoading ? (
                <span className="text-xs text-primary animate-pulse">
                  Sending…
                </span>
              ) : (
                <svg
                  className="w-5 h-5 text-tertiary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </button>
            {/* Request my data confirmation modal */}
            {requestDataModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60"
                onClick={() => setRequestDataModalOpen(false)}
                aria-modal="true"
                role="dialog"
                aria-labelledby="request-data-title"
              >
                <div
                  className="w-full max-w-sm rounded-xl border border-white/10 bg-ink p-6 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2
                    id="request-data-title"
                    className="text-xl font-semibold text-paper text-center mb-3"
                  >
                    Request my data
                  </h2>
                  <p className="text-secondary text-sm leading-relaxed text-center mb-6">
                    We will send an email to your account address with a secure
                    download link for your data (ZIP). The link expires in 7
                    days and can only be used once. Continue?
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleRequestMyData}
                      disabled={requestExportLoading}
                      className="w-full py-3.5 rounded-xl font-semibold bg-primary text-ink hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {requestExportLoading ? "Sending…" : "Send link"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestDataModalOpen(false)}
                      disabled={requestExportLoading}
                      className="w-full py-3.5 rounded-xl font-semibold border border-white/20 text-paper hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Sign out — separate section, clearly distinct from Danger zone */}
        <section className="pt-6 mt-2 border-t border-divider/50">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg text-left text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <span className="font-medium">Sign out</span>
            <svg
              className="w-5 h-5 text-tertiary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </section>
      </div>
    </div>
  );
}
