"use client";

import { useState } from "react";
import Link from "next/link";

const CONSENT_LABEL =
  "I agree to be contacted at the email address above about Citewalk project updates and my invitation to the open beta program.";

export default function WaitingListPage() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!consent) {
      setError(
        "Please confirm that you agree to be contacted as described above.",
      );
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/waiting-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent: true }),
      });

      if (!res.ok) {
        throw new Error("Failed to join waiting list");
      }

      setSuccess(true);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- error intentionally not used
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6 relative overflow-hidden">
      {/* Refined Mesh Gradient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute -bottom-[20%] -right-[5%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-white/5 border border-white/10 mb-4 transition-all hover:scale-105 hover:bg-white/10 hover:border-white/20 shadow-2xl"
          >
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M11 5H7C4.5 9 4.5 15 7 19H11"></path>
              <path d="M13 5H17V19H13"></path>
            </svg>
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-paper">
            Join the Waiting List
          </h1>
          <p className="text-secondary text-lg">
            Citewalk is currently in closed beta. We&apos;re testing the network
            before opening the open beta. Join the waiting list to receive
            project updates and your invitation when we open.
          </p>
        </div>

        {success ? (
          <div className="p-6 bg-primary/10 border border-primary/20 rounded-xl text-center space-y-4 animate-in zoom-in">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-paper">
                You&apos;re on the list!
              </h2>
              <p className="text-secondary">
                We&apos;ll contact you at{" "}
                <span className="text-paper">{email}</span> with project updates
                and your invitation when we open the open beta.
              </p>
            </div>
            <Link
              href="/"
              className="block w-full py-3 text-primary hover:underline font-medium"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-secondary mb-2"
              >
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

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-2 focus:ring-offset-0 focus:ring-offset-ink"
                  required
                />
                <span className="text-sm text-secondary group-hover:text-paper transition-colors">
                  {CONSENT_LABEL}
                </span>
              </label>
              <p className="text-[11px] text-tertiary">
                By submitting, you confirm this consent. You can withdraw it at
                any time by contacting us at{" "}
                <a
                  href="mailto:hello@citewalk.com"
                  className="underline hover:text-secondary"
                >
                  hello@citewalk.com
                </a>
                . See our{" "}
                <Link
                  href="/privacy"
                  className="underline hover:text-secondary"
                >
                  Privacy Policy
                </Link>{" "}
                for how we process your data.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading || !consent}
                className="w-full h-14 bg-primary hover:bg-[#7d8b9d] transition-all duration-200 text-white font-semibold rounded-lg disabled:opacity-50 shadow-lg shadow-primary/20 active:scale-[0.98]"
              >
                {loading ? "Joining..." : "Join the Waiting List"}
              </button>

              <p className="text-[11px] text-tertiary text-center">
                You also agree to our{" "}
                <Link href="/terms" className="underline hover:text-secondary">
                  Terms of Service
                </Link>
                .
              </p>
            </div>

            <p className="text-center text-sm">
              <Link
                href="/sign-in"
                className="text-secondary hover:text-primary transition-colors"
              >
                Already have an invite?{" "}
                <span className="text-primary font-medium">Sign in</span>
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
