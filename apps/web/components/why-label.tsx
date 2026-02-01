"use client";

import { memo } from "react";

export interface WhyLabelProps {
  reasons: string[];
}

function WhyLabelInner({ reasons }: WhyLabelProps) {
  if (!reasons || reasons.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-md border border-primary/20">
      <svg
        className="w-3 h-3 text-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="text-[11px] font-medium text-primary uppercase tracking-wide">
        {reasons[0]}
      </span>
    </div>
  );
}

export const WhyLabel = memo(WhyLabelInner);
