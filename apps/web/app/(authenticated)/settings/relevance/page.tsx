"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const DEFAULT_SLIDERS = {
  topicsYouFollow: 80,
  languageMatch: 70,
  citations: 90,
  replies: 50,
  likes: 30,
  networkProximity: 40,
  depth: 50,
};

export default function RelevanceSettingsPage() {
  const [enabled, setEnabled] = useState(true);
  const [showWhy, setShowWhy] = useState(true);
  const [sliders, setSliders] = useState(DEFAULT_SLIDERS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.ok ? res.json() : null)
      .then((user: { preferences?: { explore?: Record<string, unknown> } } | null) => {
        if (user?.preferences?.explore) {
          const ex = user.preferences.explore as Record<string, unknown>;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { showWhy: _s, recommendationsEnabled, ...rest } = ex;
          setSliders((prev) => ({ ...prev, ...rest }));
          setEnabled((recommendationsEnabled as boolean) !== false);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSliderChange = (key: string, value: number) => {
    setSliders((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: {
            explore: { recommendationsEnabled: enabled, showWhy, ...sliders },
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      window.history.back();
    } catch {
      // no toast wired here; could add later
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSliders(DEFAULT_SLIDERS);
  };

  return (
    <div className="max-w-[680px] mx-auto min-h-screen border-x border-divider bg-ink">
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
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
            <h1 className="text-xl font-bold text-paper">Explore Relevance</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="text-primary font-semibold hover:opacity-80 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </header>

      <div className="px-6 py-6 space-y-8">
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <>
            {/* Enable Recommendations */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-paper mb-1">
                  Enable recommendations
                </h3>
                <p className="text-sm text-secondary">
                  Show graph-based content suggestions in Explore based on topics you follow, citations, and reading activity
                </p>
              </div>
              <button
                onClick={() => setEnabled(!enabled)}
                className={`w-12 h-6 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-white/10"
                  }`}
                aria-label={enabled ? "Disable recommendations" : "Enable recommendations"}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                />
              </button>
            </div>

            {enabled && (
              <>
                {/* Sliders */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-paper">
                        Topics you follow
                      </label>
                      <span className="text-sm text-tertiary">
                        {sliders.topicsYouFollow}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliders.topicsYouFollow}
                      onChange={(e) =>
                        handleSliderChange(
                          "topicsYouFollow",
                          parseInt(e.target.value),
                        )
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-paper">
                        Language match
                      </label>
                      <span className="text-sm text-tertiary">
                        {sliders.languageMatch}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliders.languageMatch}
                      onChange={(e) =>
                        handleSliderChange(
                          "languageMatch",
                          parseInt(e.target.value),
                        )
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-paper">
                        Citations/quotes
                      </label>
                      <span className="text-sm text-tertiary">
                        {sliders.citations}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliders.citations}
                      onChange={(e) =>
                        handleSliderChange("citations", parseInt(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-paper">
                        Replies/discussion
                      </label>
                      <span className="text-sm text-tertiary">
                        {sliders.replies}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliders.replies}
                      onChange={(e) =>
                        handleSliderChange("replies", parseInt(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-paper">
                        Likes (private signal)
                      </label>
                      <span className="text-sm text-tertiary">
                        {sliders.likes}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliders.likes}
                      onChange={(e) =>
                        handleSliderChange("likes", parseInt(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-paper">
                        Network proximity
                      </label>
                      <span className="text-sm text-tertiary">
                        {sliders.networkProximity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliders.networkProximity}
                      onChange={(e) =>
                        handleSliderChange(
                          "networkProximity",
                          parseInt(e.target.value),
                        )
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-paper">
                        Depth / Length
                      </label>
                      <span className="text-sm text-tertiary">
                        {sliders.depth}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliders.depth}
                      onChange={(e) =>
                        handleSliderChange("depth", parseInt(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Show Why Toggle */}
                <div className="flex items-center justify-between pt-4 border-t border-divider">
                  <div>
                    <h3 className="text-base font-semibold text-paper mb-1">
                      Show why I&apos;m seeing this
                    </h3>
                    <p className="text-sm text-secondary">
                      Display explanation labels on recommendations
                    </p>
                  </div>
                  <button
                    onClick={() => setShowWhy(!showWhy)}
                    className={`w-12 h-6 rounded-full transition-colors ${showWhy ? "bg-primary" : "bg-white/10"
                      }`}
                    aria-label={showWhy ? "Hide explanation labels" : "Show explanation labels"}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${showWhy ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                </div>

                {/* Reset Defaults */}
                <button
                  onClick={handleReset}
                  className="w-full px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
                >
                  Reset defaults
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
