"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useBetaMode } from "@/context/beta-mode-provider";

const TAGLINE = "History is written by those who write.";
const ERROR_COLOR = "#B85C5C";

function SignInForm() {
  const searchParams = useSearchParams();
  const { betaMode } = useBetaMode();
  const codeFromUrl = searchParams.get("code");
  const showInviteInput = betaMode || !!codeFromUrl;

  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState(codeFromUrl ?? "");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [token, setToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [tempToken, setTempToken] = useState("");

  const [step, setStep] = useState<"email" | "token" | "2fa">("email");
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
    if (codeFromUrl) setInviteCode(codeFromUrl);
  }, [codeFromUrl]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (showInviteInput && !inviteCode.trim()) {
      setError("Please enter your invite code to continue.");
      setLoading(false);
      return;
    }

    if (showInviteInput && !acceptedTerms) {
      setError(
        "Please accept the Terms of Service and Privacy Policy to continue",
      );
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

      const data = await res.json().catch(() => ({}));
      const msg = data.error ?? data.message;

      if (!res.ok) {
        if (
          res.status === 400 &&
          (msg === "Invite code required for registration" ||
            data.message === "Invite code required for registration")
        ) {
          setShowInviteInput(true);
          setError(
            "You’re new here — enter your invite code below, then we’ll send you a verification code by email.",
          );
          setLoading(false);
          return;
        }
        if (
          res.status === 400 &&
          (msg === "Please wait before sending another code" ||
            data.message === "Please wait before sending another code")
        ) {
          startCooldown();
          setError("Please wait 60 seconds before requesting another code.");
          setLoading(false);
          return;
        }
        setError(msg || "Failed to send verification code");
        setLoading(false);
        return;
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

      const data = await res.json();

      if (data.twoFactorRequired) {
        setTempToken(data.tempToken);
        setStep("2fa");
        setLoading(false);
        return;
      }

      if (data.needsOnboarding) {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem("onboarding_stage", "languages");
        }
        window.location.href = "/onboarding";
      } else {
        window.location.href = "/home";
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handle2FALogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: totpCode, tempToken }),
      });

      if (!res.ok) throw new Error("Invalid 2FA code.");

      window.location.href = "/home";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "2FA Verification failed");
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

  if (step === "2fa") {
    return (
      <div className="space-y-6 animate-in fade-in w-full max-w-md">
        <div className="text-center space-y-2">
          <h1 className="text-[28px] font-serif font-semibold text-paper tracking-tight">
            Two-Factor Auth
          </h1>
          <p className="text-secondary text-base">
            Enter the code from your authenticator app.
          </p>
        </div>

        <form onSubmit={handle2FALogin} className="space-y-6">
          {error && (
            <div className={errorBoxClass} style={errorBoxStyle}>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={totpCode}
              onChange={(e) =>
                setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className={`${inputClass} text-center text-2xl tracking-[0.4em] font-mono`}
              placeholder="000000"
              autoFocus
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading || totpCode.length < 6}
            className={`${buttonPrimary} min-h-[44px]`}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    );
  }

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

          <div className="space-y-2">
            <label
              htmlFor="verification-code"
              className="block text-sm font-medium text-secondary"
            >
              Verification code
            </label>
            <input
              id="verification-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={token}
              onChange={(e) =>
                setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className={`${inputClass} text-center text-2xl tracking-[0.4em] font-mono`}
              placeholder="000000"
              autoFocus
              maxLength={6}
              aria-label="Enter the 6-digit code from your email"
            />
            <p className="text-xs text-tertiary">
              Enter the 6-digit code we sent to your email.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || token.length < 6}
            className={`${buttonPrimary} min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ink`}
          >
            {loading ? "Verifying..." : "Verify & Login"}
          </button>
        </form>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => handleLogin()}
            disabled={cooldown > 0 || loading}
            className={`${buttonSecondary} min-h-[44px] rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ink`}
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

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-secondary"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
          placeholder="you@example.com"
          autoComplete="email"
          aria-required="true"
        />
      </div>

      {showInviteInput && (
        <div className="space-y-2">
          <label
            htmlFor="inviteCode"
            className="block text-sm font-medium text-secondary"
          >
            Invite code
          </label>
          <input
            id="inviteCode"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase().trim())}
            className={`${inputClass} uppercase tracking-wider`}
            placeholder="e.g. A1B2C3D4"
            required
            minLength={4}
            autoComplete="off"
            autoFocus={!email}
            aria-required="true"
            aria-describedby="invite-code-hint"
          />
          <p id="invite-code-hint" className="text-xs text-tertiary">
            Required for new sign-ups. Enter the code you received by email or
            from someone who invited you.
          </p>
        </div>
      )}

      {showInviteInput && (
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-2 focus:ring-offset-0 focus:ring-offset-ink"
          />
          <span className="text-sm text-secondary group-hover:text-paper transition-colors">
            By signing up, you agree to our{" "}
            <Link
              href="/terms"
              className="text-primary hover:text-primaryDark underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-primary hover:text-primaryDark underline"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>
      )}

      <button
        type="submit"
        disabled={
          loading ||
          (showInviteInput && !acceptedTerms) ||
          (showInviteInput && !inviteCode.trim())
        }
        className={`${buttonPrimary} min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ink`}
      >
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
    <div className="min-h-screen bg-ink flex flex-col md:flex-row">
      {/* Desktop: left panel — branding */}
      <div className="hidden md:flex md:flex-1 md:flex-col md:justify-center md:px-12 lg:px-16 xl:px-24 md:border-r md:border-divider">
        <div className="max-w-md">
          <Image
            src="/icon.png"
            alt="Citewalk"
            width={72}
            height={72}
            className="object-contain mb-8"
            priority
          />
          <h1 className="text-4xl lg:text-5xl font-serif font-semibold text-paper tracking-tight leading-tight mb-4">
            Citewalk
          </h1>
          <p className="text-lg lg:text-xl font-serif font-light text-secondary leading-relaxed">
            {TAGLINE}
          </p>
          <p className="mt-8 text-sm text-tertiary max-w-sm">
            No password. We&apos;ll email you a code to sign in or create your
            account.
          </p>
          <div className="mt-12 flex flex-wrap gap-6 text-sm font-medium text-secondary">
            <Link href="/about" className="hover:text-paper transition-colors">
              About
            </Link>
            <Link
              href="/manifesto"
              className="hover:text-paper transition-colors"
            >
              Manifesto
            </Link>
            <Link
              href="/roadmap"
              className="hover:text-paper transition-colors"
            >
              Roadmap
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile: centered branding + form. Desktop: form panel */}
      <div className="flex-1 flex flex-col py-8 px-6 md:py-12 md:px-10 lg:px-16 md:justify-center md:min-w-0">
        <div className="flex flex-col justify-center items-center gap-8 md:items-stretch md:max-w-md md:mx-auto w-full">
          <div className="flex flex-col items-center gap-4 text-center md:hidden">
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

          <div className="w-full flex justify-center md:justify-stretch">
            <SignInForm />
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-8 pb-2 mt-auto text-xs font-medium text-tertiary md:justify-start md:max-w-md md:mx-auto">
          <Link href="/about" className="hover:text-paper transition-colors">
            About
          </Link>
          <Link
            href="/manifesto"
            className="hover:text-paper transition-colors"
          >
            Manifesto
          </Link>
          <Link href="/roadmap" className="hover:text-paper transition-colors">
            Roadmap
          </Link>
          <Link href="/privacy" className="hover:text-paper transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-paper transition-colors">
            Terms
          </Link>
          <Link href="/imprint" className="hover:text-paper transition-colors">
            Imprint
          </Link>
          <Link
            href="/ai-transparency"
            className="hover:text-paper transition-colors"
          >
            AI Safety
          </Link>
        </footer>
      </div>
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
