"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

interface PrivacySettings {
  disableRecommendations?: boolean;
  disableModerationProfiling?: boolean;
  disableAnalytics?: boolean;
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
    </label>
  );
}

export default function PrivacyPreferencesPage() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [settings, setSettings] = useState<PrivacySettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me/privacy-settings")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        setSettings(data ?? {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateSetting = async (key: keyof PrivacySettings, value: boolean) => {
    const prev = { ...settings };
    setSettings({ ...settings, [key]: value });
    try {
      const res = await fetch("/api/me/privacy-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error();
      toastSuccess("Preferences saved");
    } catch {
      setSettings(prev);
      toastError("Couldn't save changes");
    }
  };

  return (
    <div className="max-w-[680px] mx-auto min-h-screen border-x border-divider bg-ink">
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 py-2">
        <div className="flex items-center justify-between gap-3">
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
          <h1 className="text-xl font-bold text-paper">
            Data Processing Preferences
          </h1>
          <div className="w-6" />
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        <p className="text-secondary text-sm leading-relaxed">
          Control how Citewalk processes your data. Disabling these features
          limits certain functionality but gives you more privacy.
        </p>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-white/5 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {/* Recommendations */}
            <div className="flex items-start justify-between gap-4 py-3 px-4 border-b border-divider/50">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-paper">
                  Personalized recommendations
                </div>
                <div className="text-secondary text-xs mt-1 leading-relaxed">
                  Uses your reading and follow history to suggest relevant
                  content. Disable to see only chronological feeds.
                </div>
                <div className="text-tertiary text-[10px] mt-1 font-mono uppercase tracking-wider">
                  Legal basis: Legitimate interest
                </div>
              </div>
              <Toggle
                checked={!settings.disableRecommendations}
                onChange={(v) => updateSetting("disableRecommendations", !v)}
              />
            </div>

            {/* Moderation profiling */}
            <div className="flex items-start justify-between gap-4 py-3 px-4 border-b border-divider/50">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-paper">
                  Moderation profiling
                </div>
                <div className="text-secondary text-xs mt-1 leading-relaxed">
                  Automated analysis of content patterns to detect spam and
                  abuse. Disabling may increase exposure to unwanted content.
                </div>
                <div className="text-tertiary text-[10px] mt-1 font-mono uppercase tracking-wider">
                  Legal basis: Legal obligation + Legitimate interest
                </div>
              </div>
              <Toggle
                checked={!settings.disableModerationProfiling}
                onChange={(v) =>
                  updateSetting("disableModerationProfiling", !v)
                }
              />
            </div>

            {/* Analytics */}
            <div className="flex items-start justify-between gap-4 py-3 px-4 border-b border-divider/50">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-paper">
                  Product analytics
                </div>
                <div className="text-secondary text-xs mt-1 leading-relaxed">
                  Anonymous usage data that helps us improve the product. No
                  personal data is sold or shared with third parties.
                </div>
                <div className="text-tertiary text-[10px] mt-1 font-mono uppercase tracking-wider">
                  Legal basis: Legitimate interest
                </div>
              </div>
              <Toggle
                checked={!settings.disableAnalytics}
                onChange={(v) => updateSetting("disableAnalytics", !v)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
