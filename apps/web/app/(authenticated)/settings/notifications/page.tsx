"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast";

interface Prefs {
  push_enabled: boolean;
  replies: boolean;
  quotes: boolean;
  mentions: boolean;
  dms: boolean;
  follows: boolean;
  saves: boolean;
  email_marketing: boolean;
  email_product_updates: boolean;
}

const defaultPrefs: Prefs = {
  push_enabled: true,
  replies: true,
  quotes: true,
  mentions: true,
  dms: true,
  follows: true,
  saves: false,
  email_marketing: false,
  email_product_updates: false,
};

export default function SettingsNotificationsPage() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const { error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);

  useEffect(() => {
    fetch("/api/me/notification-prefs")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Prefs | null) => {
        if (data && typeof data === "object") {
          setPrefs((prev) => ({
            ...prev,
            push_enabled: data.push_enabled ?? prev.push_enabled,
            replies: data.replies ?? prev.replies,
            quotes: data.quotes ?? prev.quotes,
            mentions: data.mentions ?? prev.mentions,
            dms: data.dms ?? prev.dms,
            follows: data.follows ?? prev.follows,
            saves: data.saves ?? prev.saves,
            email_marketing: data.email_marketing ?? prev.email_marketing,
            email_product_updates:
              data.email_product_updates ?? prev.email_product_updates,
          }));
        }
      })
      .catch(() => { /* prefs load best-effort */ })
      .finally(() => setLoading(false));
  }, []);

  const togglePref = async (key: keyof Prefs) => {
    const newVal = !prefs[key];
    setPrefs((prev) => ({ ...prev, [key]: newVal }));
    try {
      const res = await fetch("/api/me/notification-prefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: newVal }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      setPrefs((prev) => ({ ...prev, [key]: !newVal }));
      toastError(tCommon("error"));
    }
  };

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/settings"
            className="p-2 text-tertiary hover:text-primary transition-colors"
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
          <h1 className="text-xl font-bold text-paper">{t("notifications")}</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-tertiary mb-4">
                Push
              </h2>
              <NotificationRow
                label="Enable push notifications"
                checked={prefs.push_enabled}
                onToggle={() => togglePref("push_enabled")}
              />
            </section>

            {prefs.push_enabled && (
              <section className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-wider text-tertiary mb-4">
                  Notification types
                </h2>
                <div className="space-y-0 border-b border-white/5">
                  <NotificationRow
                    label="Replies"
                    checked={prefs.replies}
                    onToggle={() => togglePref("replies")}
                  />
                  <NotificationRow
                    label="Quotes"
                    checked={prefs.quotes}
                    onToggle={() => togglePref("quotes")}
                  />
                  <NotificationRow
                    label="Mentions"
                    checked={prefs.mentions}
                    onToggle={() => togglePref("mentions")}
                  />
                  <NotificationRow
                    label="Direct messages"
                    checked={prefs.dms}
                    onToggle={() => togglePref("dms")}
                    description="When someone sends you a direct message"
                  />
                  <NotificationRow
                    label="New followers"
                    checked={prefs.follows}
                    onToggle={() => togglePref("follows")}
                  />
                  <NotificationRow
                    label="Saves"
                    checked={prefs.saves}
                    onToggle={() => togglePref("saves")}
                    description="When someone saves your post to a public collection"
                  />
                </div>
              </section>
            )}

            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-tertiary mb-4">
                Email
              </h2>
              <p className="text-tertiary text-sm mb-4">
                System messages (sign-in, security, account) are always sent.
              </p>
              <div className="space-y-0 border-b border-white/5">
                <NotificationRow
                  label="Marketing & promotions"
                  description="News, offers and product updates from Citewalk"
                  checked={prefs.email_marketing}
                  onToggle={() => togglePref("email_marketing")}
                />
                <NotificationRow
                  label="Product updates & tips"
                  description="New features and how to get the most out of Citewalk"
                  checked={prefs.email_product_updates}
                  onToggle={() => togglePref("email_product_updates")}
                />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function NotificationRow({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
      <div className="flex-1 pr-4">
        <p className="font-medium text-paper">{label}</p>
        {description && (
          <p className="text-sm text-secondary mt-1">{description}</p>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="sr-only"
        />
        <span
          className={`w-11 h-6 rounded-full inline-block relative transition-colors duration-200 ${checked ? "bg-primary" : "bg-white/10"}`}
        >
          <span
            className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-transform duration-200 ${checked ? "left-6" : "left-[2px]"}`}
          />
        </span>
      </label>
    </div>
  );
}
