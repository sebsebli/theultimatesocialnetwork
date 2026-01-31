"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

const TAGLINE = "History is written by those who write.";
const ERROR_COLOR = "#B85C5C";

function SignInForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [token, setToken] = useState("");

  const [step, setStep] = useState<"email" | "token">("email");
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedCooldown = sessionStorage.getItem("signin_cooldown");
    if (savedCooldown) {
      const remaining = Math.ceil(
        (parseInt(savedCooldown) - Date.now()) / 1000,
      );
      if (remaining > 0) setCooldown(remaining);
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            sessionStorage.removeItem("signin_cooldown");
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
    sessionStorage.setItem(
      "signin_cooldown",
      (Date.now() + duration * 1000).toString(),
    );
  };

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setInviteCode(code);
      setShowInviteInput(true);
    }
  }, [searchParams]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          inviteCode: showInviteInput ? inviteCode : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (
          res.status === 400 &&
          data.message === "Invite code required for registration"
        ) {
          setShowInviteInput(true);
          throw new Error(
            "You are new here! Please enter your invite code to join the beta.",
          );
        }
        if (
          res.status === 400 &&
          data.message === "Please wait before sending another code"
        ) {
          startCooldown();
          throw new Error(
            "Please wait 60 seconds before requesting another code.",
          );
        }
        throw new Error(data.message || "Failed to send verification code");
      }
      setStep("token");
      startCooldown();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      if (!res.ok) throw new Error("Invalid code or expired.");
      window.location.href = "/home";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const errorBoxClass = `p-3 text-sm rounded-xl border transition-all`;
  const errorBoxStyle = {
    color: ERROR_COLOR,
    borderColor: ERROR_COLOR,
    backgroundColor: `${ERROR_COLOR}18`,
  };

  const inputClass =
    "w-full h-14 px-4 bg-white/5 border border-divider rounded-xl text-paper placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 text-base";
  const buttonPrimary =
    "w-full h-14 bg-primary hover:bg-primaryDark text-ink font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  const buttonSecondary =
    "w-full h-14 border border-divider bg-transparent hover:bg-white/5 text-paper font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  if (step === "token") {
    return (
      <div className="space-y-6 animate-in fade-in w-full max-w-md">
        <div className="text-center space-y-2">
          <h1 className="text-[28px] font-serif font-semibold text-paper tracking-tight">
            Check your email
          </h1>
          <p className="text-secondary text-base">
            We sent a verification code to{" "}
            <span className="text-paper font-medium">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          {error && (
            <div className={errorBoxClass} style={errorBoxStyle}>
              {error}
            </div>
          )}

          <input
            type="text"
            value={token}
            onChange={(e) =>
              setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className={`${inputClass} text-center text-2xl tracking-[0.4em] font-mono`}
            placeholder="000000"
            autoFocus
            maxLength={6}
          />

          <button
            type="submit"
            disabled={loading || token.length < 6}
            className={buttonPrimary}
          >
            {loading ? "Verifying..." : "Verify & Login"}
          </button>
        </form>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => handleLogin()}
            disabled={cooldown > 0 || loading}
            className={buttonSecondary}
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setToken("");
              setCooldown(0);
            }}
            className="w-full text-primary hover:text-primaryDark text-sm font-medium transition-colors pt-1"
          >
            Wrong email? Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleLogin}
      className="space-y-6 w-full max-w-md animate-in fade-in"
    >
      {error && (
        <div
          className={`${errorBoxClass} animate-in slide-in-from-top-2`}
          style={errorBoxStyle}
        >
          {error}
        </div>
      )}

      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className={inputClass}
        placeholder="Email"
        autoComplete="email"
      />

      {showInviteInput && (
        <input
          id="inviteCode"
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          className={`${inputClass} uppercase tracking-wider`}
          placeholder="Invite code (required for sign up)"
          required
          autoFocus
        />
      )}

      <button type="submit" disabled={loading} className={buttonPrimary}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Sending...
          </span>
        ) : (
          "Send verification code"
        )}
      </button>

      <p className="text-center text-sm text-tertiary">
        No password. We&apos;ll email you a code.
      </p>

      <div className="text-center">
        <Link
          href="/waiting-list"
          className="text-sm text-primary hover:text-primaryDark transition-colors font-medium"
        >
          Need an invite? Join the waiting list
        </Link>
      </div>
    </form>
  );
}

function SignInPageContent() {
  return (
    <div className="min-h-screen bg-ink flex flex-col py-8 px-6 md:py-10">
      <div className="flex-1 flex flex-col justify-center items-center gap-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center w-full max-w-md">
          <Image
            src="/icon.png"
            alt="Citewalk"
            width={88}
            height={88}
            className="object-contain"
            priority
          />
          <h1 className="text-[48px] font-serif font-semibold text-paper tracking-tight leading-none">
            Citewalk
          </h1>
          <p className="text-lg font-serif font-semibold text-secondary max-w-[300px] leading-relaxed">
            {TAGLINE}
          </p>
        </div>

        <div className="w-full flex justify-center">
          <SignInForm />
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-2 pt-6 pb-2 text-xs font-medium text-tertiary">
        <Link href="/privacy" className="hover:text-paper transition-colors">
          Privacy
        </Link>
        <span className="w-0.5 h-0.5 rounded-full bg-tertiary" aria-hidden />
        <Link href="/terms" className="hover:text-paper transition-colors">
          Terms
        </Link>
        <span className="w-0.5 h-0.5 rounded-full bg-tertiary" aria-hidden />
        <Link href="/imprint" className="hover:text-paper transition-colors">
          Imprint
        </Link>
      </footer>
    </div>
  );
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
