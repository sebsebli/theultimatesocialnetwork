"use client";

import { memo } from "react";
import Link from "next/link";

export interface PublicSignInBarProps {
  /** Short line above the button, e.g. "Sign in to follow and interact" */
  message?: string;
}

function PublicSignInBarInner({
  message = "Sign in to follow, like, and comment",
}: PublicSignInBarProps) {
  return (
    <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-40 bg-ink/95 backdrop-blur-md border-t border-divider px-4 py-4 safe-area-pb">
      <div className="max-w-[680px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
        <p className="text-secondary text-sm text-center sm:text-left">
          {message}
        </p>
        <Link
          href="/sign-in"
          className="w-full sm:w-auto shrink-0 inline-flex justify-center items-center px-6 py-2.5 bg-paper text-ink font-semibold text-sm rounded-lg hover:bg-white transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

export const PublicSignInBar = memo(PublicSignInBarInner);
