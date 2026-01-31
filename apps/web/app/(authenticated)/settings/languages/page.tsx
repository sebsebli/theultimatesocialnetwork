"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast";
import { CONTENT_LANGUAGES } from "@/lib/languages";

export default function SettingsLanguagesPage() {
  const router = useRouter();
  const t = useTranslations("settings");
  const tOnboarding = useTranslations("onboarding.languages");
  const { success: toastSuccess, error: toastError } = useToast();
  const [selected, setSelected] = useState<string[]>(["en"]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((u: { languages?: string[] } | null) => {
        if (u?.languages?.length) setSelected(u.languages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleLanguage = (code: string) => {
    if (selected.includes(code)) {
      if (selected.length <= 1) return;
      setSelected(selected.filter((c) => c !== code));
    } else {
      if (selected.length >= 3) return;
      setSelected([...selected, code]);
    }
  };

  const handleSave = async () => {
    if (selected.length < 1) {
      toastError(
        t("failedSaveLanguages") || "Select at least one content language.",
      );
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languages: selected }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toastSuccess(t("languagesUpdated") || "Languages updated.");
      router.back();
    } catch {
      toastError(t("failedSaveLanguages") || "Failed to save languages.");
    } finally {
      setSaving(false);
    }
  };

  const filteredLanguages = CONTENT_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.native && l.native.toLowerCase().includes(search.toLowerCase())),
  );

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
          <h1 className="text-xl font-bold text-paper">{t("languages")}</h1>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || selected.length < 1}
            className="text-primary font-semibold text-base disabled:opacity-50"
          >
            {saving ? "..." : "Save"}
          </button>
        </div>
      </header>

      <div className="px-4 py-4">
        <p className="text-secondary text-sm mb-1">
          Content languages: which languages you want in Explore and
          recommendations. App language follows your device.
        </p>
        <p className="text-tertiary text-xs mb-4">Select 1–3 languages.</p>

        <input
          type="search"
          placeholder={tOnboarding("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 bg-white/5 border border-divider rounded-xl px-4 text-paper placeholder-tertiary text-base mb-4"
        />

        {loading ? (
          <p className="text-secondary">Loading...</p>
        ) : (
          <div className="flex flex-wrap gap-3 justify-center">
            {filteredLanguages.map((lang) => {
              const isSelected = selected.includes(lang.code);
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => toggleLanguage(lang.code)}
                  className={`relative w-[47%] rounded-xl p-4 border text-left transition-colors ${
                    isSelected
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-white/5 border-divider text-paper hover:border-white/20"
                  }`}
                >
                  <span className="block font-semibold">{lang.name}</span>
                  <span className="block text-sm text-secondary">
                    {lang.native}
                  </span>
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-ink"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
