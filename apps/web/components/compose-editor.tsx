'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ComposeEditor() {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleBlur = () => {
    if (!body.trim()) {
      setIsExpanded(false);
    }
  };

  if (!isExpanded) {
    return (
      <div className="border-b border-divider p-4">
        <button
          onClick={() => router.push('/compose')}
          className="w-full text-left text-secondary hover:text-paper transition-colors"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-sm">What are you reading? Link with [[Topic]]...</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="border-b border-divider p-4">
      <div className="space-y-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="What are you reading? Link with [[Topic]]..."
          className="w-full bg-transparent text-lg placeholder-secondary outline-none resize-none min-h-[120px] text-paper"
          autoFocus
        />
        <div className="flex justify-end">
          <button
            onClick={() => router.push('/compose')}
            disabled={!body.trim()}
            className="px-4 py-2 bg-primary text-white font-semibold rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
