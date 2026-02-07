"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

export interface ActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the action is in an "active" state (e.g., liked, saved) */
  active?: boolean;
  /** Active color class (e.g., "text-like", "text-primary") */
  activeColor?: string;
  /** Optional count to display next to the icon */
  count?: number;
  /** The SVG icon element */
  icon: React.ReactNode;
  /** The SVG icon element for the active state (if different) */
  activeIcon?: React.ReactNode;
  /** Size variant */
  size?: "sm" | "md";
}

/**
 * Standardized action button for post interactions (like, comment, quote, save, share, etc.)
 * Used consistently across PostItem, PostDetail, ReadingMode, and ReplySection.
 */
export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  (
    {
      active = false,
      activeColor = "text-primary",
      count,
      icon,
      activeIcon,
      size = "md",
      className = "",
      ...props
    },
    ref,
  ) => {
    const sizeClasses =
      size === "sm"
        ? "min-h-[36px] min-w-[36px]"
        : "min-h-[44px] min-w-[44px]";

    return (
      <button
        ref={ref}
        type="button"
        className={`flex items-center gap-1 ${sizeClasses} items-center justify-center rounded-lg hover:text-primary transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? activeColor : "text-tertiary"
          } ${className}`}
        {...props}
      >
        {active && activeIcon ? activeIcon : icon}
        {count != null && count > 0 && (
          <span className="text-xs">{count}</span>
        )}
      </button>
    );
  },
);

ActionButton.displayName = "ActionButton";

/* ──────────── Standard SVG Icons ──────────── */

export const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    className={`w-5 h-5 transition-transform duration-150 ${filled ? "fill-current" : ""}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
);

export const CommentIcon = () => (
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
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

export const QuoteIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
  </svg>
);

export const BookmarkIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    className="w-5 h-5"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
    />
  </svg>
);

export const AddCircleIcon = () => (
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
      d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export const ShareIcon = () => (
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
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
    />
  </svg>
);
