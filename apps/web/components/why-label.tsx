'use client';

interface WhyLabelProps {
  reasons: string[];
}

export function WhyLabel({ reasons }: WhyLabelProps) {
  if (reasons.length === 0) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg">
      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-xs font-medium text-primary">
        Why: {reasons.join(' + ')}
      </span>
    </div>
  );
}
