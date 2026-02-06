"use client";

import { useRouter } from "next/navigation";

interface Target {
  type: "topic" | "post" | "url";
  id?: string;
  slug?: string;
  url?: string;
  title: string;
  excerpt?: string;
}

interface MultiTargetSheetProps {
  targets: Target[];
  onClose: () => void;
}

export function MultiTargetSheet({ targets, onClose }: MultiTargetSheetProps) {
  const router = useRouter();

  const handleTargetClick = (target: Target) => {
    if (target.type === "post" && target.id) {
      onClose();
      router.push(`/post/${target.id}`);
    } else if (target.type === "topic" && target.slug) {
      onClose();
      router.push(`/topic/${encodeURIComponent(target.slug)}`);
    } else if (target.type === "url" && target.url) {
      window.open(target.url, "_blank");
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-auto bg-ink border-t border-divider rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-full duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-ink/95 backdrop-blur-md border-b border-divider px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-paper tracking-tight">
            Select target
          </h3>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-tertiary hover:text-paper hover:bg-white/5 rounded-full transition-all"
            aria-label="Close sheet"
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
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-4 py-6 space-y-3 overflow-y-auto custom-scrollbar">
          {targets.map((target, index) => (
            <button
              key={target.id ?? target.slug ?? target.url ?? `target-${index}`}
              onClick={() => handleTargetClick(target)}
              className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/10 transition-all duration-200 group active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/20 transition-colors shadow-inner">
                  {target.type === "topic" && (
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
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                  )}
                  {target.type === "post" && (
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  )}
                  {target.type === "url" && (
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
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-paper truncate">
                    {target.title}
                  </div>
                  {target.excerpt && (
                    <div className="text-sm text-secondary line-clamp-2 mt-1">
                      {target.excerpt}
                    </div>
                  )}
                  <div className="text-xs text-tertiary mt-1">
                    {target.type === "topic" && "Topic"}
                    {target.type === "post" && "Post"}
                    {target.type === "url" &&
                      new URL(target.url || "").hostname}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
