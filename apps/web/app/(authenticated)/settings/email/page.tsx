"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SettingsEmailPage() {
  const router = useRouter();
  const t = useTranslations("settings");
  const { success: toastSuccess, error: toastError } = useToast();

  const [currentEmail, setCurrentEmail] = useState<string>("");
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((user: { email?: string } | null) => {
        if (user?.email) setCurrentEmail(user.email);
        setLoadingUser(false);
      })
      .catch(() => setLoadingUser(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) {
      toastError(t("invalidEmail"));
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      toastError(t("invalidEmail"));
      return;
    }
    if (trimmed === currentEmail.toLowerCase()) {
      toastError(t("invalidEmail"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toastSuccess(t("emailUpdated"));
        router.push("/settings");
        router.refresh();
      } else {
        const msg =
          data.message ?? data.error ?? null;
        toastError(
          msg && msg.includes("already in use")
            ? t("emailInUse")
            : msg || t("updateFailed"),
        );
      }
    } catch {
      toastError(t("updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 md:px-6 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/settings"
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
          <h1 className="text-xl font-bold text-paper">{t("changeEmail")}</h1>
          <div className="w-6" />
        </div>
      </header>

      <div className="px-6 py-8 max-w-md mx-auto">
        {loadingUser ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {currentEmail && (
              <div>
                <label className="block text-sm font-medium text-tertiary mb-1">
                  {t("currentEmail")}
                </label>
                <p className="text-paper font-medium">{currentEmail}</p>
              </div>
            )}
            <div>
              <label
                htmlFor="new-email"
                className="block text-sm font-medium text-tertiary mb-2"
              >
                {t("newEmail")}
              </label>
              <input
                id="new-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t("newEmailPlaceholder")}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-paper placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={
                loading ||
                !newEmail.trim() ||
                !EMAIL_REGEX.test(newEmail.trim().toLowerCase()) ||
                newEmail.trim().toLowerCase() === currentEmail.toLowerCase()
              }
              className="w-full py-3 rounded-lg font-semibold bg-primary text-ink hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? "Saving…" : t("saveEmail")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
