"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { DesktopRightSidebar } from "@/components/desktop-right-sidebar";

type InviteStatus = "PENDING" | "ACTIVATED" | "EXPIRED" | "REVOKED";

interface Invite {
  code: string;
  email?: string | null;
  status?: InviteStatus;
  sentAt?: string;
  expiresAt?: string | null;
  lastSentAt?: string | null;
}

interface InviteData {
  invites: Invite[];
  remaining: number;
}

export default function InvitesPage() {
  const [data, setData] = useState<InviteData | null>(null);
  const [betaMode, setBetaMode] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBetaMode = async () => {
    try {
      const res = await fetch("/api/invites/beta-mode", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setBetaMode(json.betaMode !== false);
      }
    } catch {
      setBetaMode(true);
    }
  };

  const fetchInvites = async () => {
    try {
      await fetchBetaMode();
      const res = await fetch("/api/invites/my", { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setData({
          invites: json.invites ?? json.codes ?? [],
          remaining: json.remaining ?? 0,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const generateCode = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/invites/generate", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        fetchInvites();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err?.error ?? "Failed to generate code");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/invites/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setEmail("");
        fetchInvites();
      } else {
        setError(json?.error ?? "Failed to send invitation");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/sign-in?code=${code}`;
    navigator.clipboard.writeText(url);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const statusLabel = (status: InviteStatus) => {
    switch (status) {
      case "PENDING":
        return "Pending";
      case "ACTIVATED":
        return "Activated";
      case "EXPIRED":
        return "Expired";
      case "REVOKED":
        return "Revoked";
      default:
        return status;
    }
  };

  return (
    <div className="flex min-h-screen bg-ink">
      <DesktopSidebar />
      <main className="flex-1 flex justify-center lg:max-w-4xl xl:max-w-5xl">
        <div className="w-full border-x border-divider">
          <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 py-3">
            <div className="flex items-center gap-4">
              <Link
                href="/settings"
                className="lg:hidden text-secondary hover:text-paper"
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
              <h1 className="text-xl font-bold text-paper">Invite Friends</h1>
            </div>
          </header>

          <div className="p-6 max-w-2xl mx-auto space-y-8">
            {betaMode ? (
              <>
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-2">
                    <svg
                      className="w-8 h-8 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-paper">
                    Invite by email
                  </h2>
                  <p className="text-secondary max-w-md mx-auto">
                    Enter your friend&apos;s email. We&apos;ll send them a
                    one-time invitation code. You can invite up to 3 people.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                  <span className="text-tertiary">Invites remaining</span>
                  <span className="text-2xl font-bold text-primary tabular-nums">
                    {loading ? "…" : data?.remaining ?? 0}
                  </span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <form onSubmit={handleSendInvite} className="space-y-4">
                    <label htmlFor="invite-email" className="sr-only">
                      Friend&apos;s email
                    </label>
                    <input
                      id="invite-email"
                      type="email"
                      placeholder="Friend's email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-ink border border-white/10 text-paper placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      disabled={sending}
                    />
                    {error && (
                      <p className="text-sm text-red-400">{error}</p>
                    )}
                    <button
                      type="submit"
                      disabled={
                        sending ||
                        !email.trim() ||
                        (data != null && data.remaining <= 0)
                      }
                      className="w-full px-6 h-12 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-ink font-semibold rounded-lg transition-all active:scale-[0.98]"
                    >
                      {sending ? "Sending…" : "Send invitation"}
                    </button>
                  </form>
                </div>

                {data?.invites && data.invites.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-secondary uppercase tracking-wider">
                      Sent invitations
                    </h3>
                    <div className="space-y-3">
                      {data.invites.map((inv) => (
                        <div
                          key={inv.code}
                          className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white/5 border border-white/10 rounded-xl"
                        >
                          <div>
                            <p className="font-medium text-paper">
                              {inv.email ?? "No email"}
                            </p>
                            <p className="text-sm text-tertiary">
                              {inv.sentAt
                                ? `Sent ${formatDate(inv.sentAt)}`
                                : ""}
                              {inv.status && (
                                <span>
                                  {inv.sentAt ? " · " : ""}
                                  {statusLabel(inv.status)}
                                </span>
                              )}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyLink(inv.code)}
                            className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                              copied === inv.code
                                ? "bg-green-500/20 text-green-400"
                                : "bg-white/5 text-secondary hover:text-primary hover:bg-white/10"
                            }`}
                          >
                            {copied === inv.code ? "Copied!" : "Copy link"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-2">
                    <svg
                      className="w-8 h-8 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-paper">
                    Build the Network
                  </h2>
                  <p className="text-secondary max-w-md mx-auto">
                    Citewalk is built on trust. Invite people whose writing and
                    thinking you value.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                  <div className="text-sm text-tertiary uppercase tracking-wider font-semibold mb-2">
                    Invites Remaining
                  </div>
                  <div className="text-4xl font-bold text-primary mb-6">
                    {loading ? "..." : data?.remaining ?? 0}
                  </div>

                  <button
                    onClick={generateCode}
                    disabled={
                      !data || data.remaining <= 0 || generating
                    }
                    className="w-full sm:w-auto px-8 h-12 bg-primary hover:bg-[#7d8b9d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-all active:scale-[0.98]"
                  >
                    {generating ? "Generating..." : "Generate New Code"}
                  </button>
                </div>

                {data?.invites && data.invites.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-secondary ml-1">
                      Active Codes
                    </h3>
                    <div className="space-y-3">
                      {data.invites.map((inv) => (
                        <div
                          key={inv.code}
                          className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl group hover:border-primary/30 transition-colors"
                        >
                          <div className="font-mono text-lg text-paper tracking-wider">
                            {inv.code}
                          </div>
                          <button
                            onClick={() => copyLink(inv.code)}
                            className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                              copied === inv.code
                                ? "bg-green-500/20 text-green-400"
                                : "bg-white/5 text-secondary hover:text-primary hover:bg-white/10"
                            }`}
                          >
                            {copied === inv.code ? "Copied Link!" : "Copy Link"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <DesktopRightSidebar />
    </div>
  );
}
