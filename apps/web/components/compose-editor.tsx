"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function ComposeEditor() {
  const router = useRouter();
  const t = useTranslations("compose");

  return (
    <div className="border-b border-divider p-4">
      <button
        onClick={() => router.push("/compose")}
        className="w-full text-left group"
      >
        <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-200">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>
          <span className="text-secondary group-hover:text-paper transition-colors font-medium">
            {t("placeholder", {
              defaultValue: "What are you reading? Link with [[Topic]]...",
            })}
          </span>
        </div>
      </button>
    </div>
  );
}
