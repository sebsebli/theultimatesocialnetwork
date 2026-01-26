'use client';

import { useRouter } from 'next/navigation';

export function ComposeEditor() {
  const router = useRouter();

  return (
    <div className="border-b border-divider p-4">
      <button
        onClick={() => router.push('/compose')}
        className="w-full text-left group"
      >
        <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-200">
          <svg className="w-5 h-5 text-tertiary group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-sm text-secondary group-hover:text-paper transition-colors">What are you reading? Link with [[Topic]]...</span>
        </div>
      </button>
    </div>
  );
}
