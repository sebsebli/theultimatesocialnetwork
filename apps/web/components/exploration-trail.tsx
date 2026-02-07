"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { useExplorationTrail } from "@/context/exploration-trail";

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

  return (
    <div className="sticky top-[57px] z-30 bg-ink/95 backdrop-blur-md border-b border-divider/50">
      <div className="max-w-[680px] mx-auto flex items-center gap-1 px-4 py-2 overflow-x-auto no-scrollbar">
        {/* Compass icon */}
        <svg
          className="w-4 h-4 text-primary shrink-0 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0020 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>

        {trail.map((step, i) => (
          <span
            key={`${step.type}-${step.id}-${i}`}
            className="flex items-center shrink-0"
          >
            {i > 0 && (
              <svg
                className="w-3 h-3 text-tertiary mx-1"
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
            )}
            <button
              onClick={() => handleStepClick(i)}
              className={`text-xs font-medium px-2 py-1 rounded transition-colors whitespace-nowrap max-w-[140px] truncate ${
                i === trail.length - 1
                  ? "text-paper bg-white/10"
                  : "text-tertiary hover:text-paper hover:bg-white/5"
              }`}
              title={step.label}
            >
              {step.type === "topic" && "# "}
              {step.type === "user" && "@ "}
              {step.label}
            </button>
          </span>
        ))}

        {/* Clear button */}
        <button
          onClick={clearTrail}
          className="ml-auto shrink-0 p-1 text-tertiary hover:text-paper transition-colors"
          title="Clear exploration trail"
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
