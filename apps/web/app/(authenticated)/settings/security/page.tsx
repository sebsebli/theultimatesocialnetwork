"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithRetry } from "@/lib/fetchWithRetry";
import { useToast } from "@/components/ui/toast";
import QRCode from "react-qr-code";

type Session = {
  id: string;
  ipAddress: string;
  deviceInfo: string;
  lastActiveAt: string;
  createdAt: string;
};

export default function SecuritySettings() {
  const router = useRouter();
  const { error, success } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // 2FA State
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetchWithRetry("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await fetchWithRetry(`/api/sessions/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
      success("Session revoked");
    } catch {
      error("Failed to revoke session");
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm("Are you sure? This will log you out of all devices.")) return;
    try {
      await fetchWithRetry("/api/sessions", { method: "DELETE" });
      setSessions([]);
      success("All sessions revoked");
      router.push("/"); // Force logout
    } catch {
      error("Failed to revoke sessions");
    }
  };

  const start2FASetup = async () => {
    try {
      const res = await fetchWithRetry("/api/auth/2fa/setup", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setQrValue(data.otpauthUrl);
        setSecret(data.secret);
        setIs2FASetupOpen(true);
      } else {
        error("Failed to start 2FA setup");
      }
    } catch {
      error("Network error");
    }
  };

  const confirm2FA = async () => {
    if (!secret || !totpCode) return;
    setVerifyLoading(true);
    try {
      const res = await fetchWithRetry("/api/auth/2fa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: totpCode, secret }),
      });
      if (res.ok) {
        success("2FA Enabled Successfully");
        setIs2FASetupOpen(false);
        setQrValue(null);
        setSecret(null);
        setTotpCode("");
      } else {
        error("Invalid code. Try again.");
      }
    } catch {
      error("Failed to verify code");
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 md:px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href="/settings" className="text-secondary hover:text-paper">
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
          <h1 className="text-xl font-bold text-paper">Security</h1>
        </div>
      </header>

      <div className="p-6 max-w-2xl mx-auto space-y-8">
        {/* 2FA Section */}
        <section>
          <h2 className="text-sm font-bold uppercase text-tertiary mb-4">
            Two-Factor Authentication
          </h2>
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <p className="text-secondary text-sm mb-4">
              Secure your account with an authenticator app (Google
              Authenticator, Authy, etc.).
            </p>
            <button
              onClick={start2FASetup}
              className="px-4 py-2 bg-primary text-ink font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Enable 2FA
            </button>

            {is2FASetupOpen && qrValue && (
              <div className="mt-6 p-4 bg-white rounded-lg">
                <div className="flex justify-center mb-4">
                  <QRCode value={qrValue} size={192} />
                </div>
                <p className="text-black text-center text-sm mb-4 font-mono break-all">
                  Secret: {secret}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={totpCode}
                    onChange={(e) =>
                      setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-black"
                  />
                  <button
                    onClick={confirm2FA}
                    disabled={verifyLoading || totpCode.length !== 6}
                    className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
                  >
                    {verifyLoading ? "Verifying..." : "Verify"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Sessions Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold uppercase text-tertiary">
              Active Sessions
            </h2>
            <button
              onClick={handleRevokeAll}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Revoke all
            </button>
          </div>

          <div className="space-y-3">
            {loadingSessions ? (
              <div className="text-tertiary text-sm">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="text-tertiary text-sm">
                No active sessions found.
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white/5 rounded-lg border border-white/10 p-4 flex justify-between items-center"
                >
                  <div>
                    <div className="text-paper text-sm font-medium">
                      {session.deviceInfo || "Unknown Device"}
                    </div>
                    <div className="text-tertiary text-xs mt-1">
                      IP: {session.ipAddress || "Unknown"} • Active:{" "}
                      {new Date(session.lastActiveAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevoke(session.id)}
                    className="text-secondary hover:text-red-400 p-2"
                    title="Revoke Session"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
