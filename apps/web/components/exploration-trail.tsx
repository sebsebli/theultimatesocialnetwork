"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { useExplorationTrail } from "@/context/exploration-trail";

const STEP_ICONS: Record<string, React.ReactNode> = {
  topic: (
    <span className="w-3 h-3 inline-flex items-center justify-center font-mono font-bold text-[8px] leading-none">
      [[]]
    </span>
  ),
  user: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  post: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  explore: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
};

function ExplorationTrailInner() {
  const { trail, jumpTo, clearTrail, isActive } = useExplorationTrail();
  const router = useRouter();

  if (!isActive) return null;

  const handleStepClick = (index: number) => {
    const step = trail[index];
    if (!step) return;
    jumpTo(index);
    router.push(step.href);
  };

  const handleHomeClick = () => {
    clearTrail();
    router.push("/home");
  };

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-30 bg-ink/95 backdrop-blur-md border-t border-divider/50">
      <div className="max-w-[680px] mx-auto flex items-center gap-1 px-4 py-2 overflow-x-auto no-scrollbar">
        {/* Home button — always first */}
        <button
          onClick={handleHomeClick}
          className="shrink-0 p-1.5 text-secondary hover:text-paper transition-colors rounded hover:bg-white/5"
          title="Home"
          aria-label="Home"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>

        {trail.map((step, i) => (
          <span
            key={`${step.type}-${step.id}-${i}`}
            className="flex items-center shrink-0"
          >
            <svg
              className="w-3 h-3 text-tertiary mx-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <button
              onClick={() => handleStepClick(i)}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors whitespace-nowrap max-w-[160px] truncate ${i === trail.length - 1
                  ? "text-paper bg-white/10"
                  : "text-tertiary hover:text-paper hover:bg-white/5"
                }`}
              title={step.label}
            >
              <span className={i === trail.length - 1 ? "text-paper" : "text-tertiary"}>
                {STEP_ICONS[step.type] ?? STEP_ICONS.post}
              </span>
              {step.label}
            </button>
          </span>
        ))}

        {/* Clear button */}
        <button
          onClick={clearTrail}
          className="ml-auto shrink-0 p-1 text-tertiary hover:text-paper transition-colors"
          title="Clear exploration trail"
          aria-label="Clear exploration trail"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export const ExplorationTrail = memo(ExplorationTrailInner);
