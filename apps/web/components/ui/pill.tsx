"use client";

import Link from "next/link";
import { Avatar } from "../avatar";

export type PillVariant =
  | "topic"
  | "profile"
  | "collection"
  | "post"
  | "source"
  | "comment";

interface PillBaseProps {
  /** Visual variant of the pill */
  variant: PillVariant;
  /** Optional count badge (e.g., post count, shared posts) */
  count?: number;
  /** Whether pill is clickable */
  navigable?: boolean;
  /** Optional additional className */
  className?: string;
  /** Size variant */
  size?: "sm" | "md";
}

interface TopicPillProps extends PillBaseProps {
  variant: "topic";
  title: string;
  slug: string;
}

interface ProfilePillProps extends PillBaseProps {
  variant: "profile";
  handle: string;
  displayName: string;
  avatarKey?: string | null;
  avatarUrl?: string | null;
}

interface CollectionPillProps extends PillBaseProps {
  variant: "collection";
  name: string;
  collectionId: string;
}

interface PostPillProps extends PillBaseProps {
  variant: "post";
  title: string;
  postId: string;
}

interface SourcePillProps extends PillBaseProps {
  variant: "source";
  title: string;
  url: string;
  hostname?: string;
}

interface CommentPillProps extends PillBaseProps {
  variant: "comment";
  body: string;
  postId: string;
  replyId: string;
  authorHandle: string;
}

export type PillProps =
  | TopicPillProps
  | ProfilePillProps
  | CollectionPillProps
  | PostPillProps
  | SourcePillProps
  | CommentPillProps;

const VARIANT_ICONS: Record<PillVariant, React.ReactNode> = {
  topic: (
    <span className="w-3.5 h-3.5 shrink-0 inline-flex items-center justify-center font-mono font-bold text-[9px] leading-none">
      [[]]
    </span>
  ),
  profile: (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  collection: (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  post: (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  source: (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  comment: (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
};

function getHref(props: PillProps): string | undefined {
  switch (props.variant) {
    case "topic":
      return `/topic/${encodeURIComponent(props.slug)}`;
    case "profile":
      return `/user/${props.handle}`;
    case "collection":
      return `/collections/${props.collectionId}`;
    case "post":
      return `/post/${props.postId}`;
    case "source":
      return props.url;
    case "comment":
      return `/post/${props.postId}?highlightReply=${props.replyId}`;
  }
}

function getLabel(props: PillProps): string {
  switch (props.variant) {
    case "topic":
      return props.title;
    case "profile":
      return props.displayName;
    case "collection":
      return props.name;
    case "post":
      return props.title;
    case "source":
      return props.title || props.hostname || "Source";
    case "comment":
      return props.body.slice(0, 80) + (props.body.length > 80 ? "..." : "");
  }
}

/**
 * Unified pill component system for Citewalk.
 * Used for topics, profiles, collections, posts, sources, and comments.
 * Ensures consistent styling and behavior across the entire app.
 */
export function Pill(props: PillProps) {
  const { variant, count, navigable = true, className = "", size = "md" } = props;
  const href = getHref(props);
  const label = getLabel(props);
  const icon = VARIANT_ICONS[variant];

  const sizeClasses = size === "sm"
    ? "px-2.5 py-1 text-xs gap-1.5"
    : "px-3.5 py-2 text-sm gap-2";

  const pillContent = (
    <>
      {variant === "profile" && "avatarKey" in props ? (
        <Avatar
          avatarKey={props.avatarKey}
          avatarUrl={props.avatarUrl}
          displayName={props.displayName}
          handle={props.handle}
          size="sm"
          className="!w-5 !h-5 !text-[10px]"
        />
      ) : (
        <span className="text-primary">{icon}</span>
      )}
      <span className="truncate max-w-[180px] font-medium text-paper">{label}</span>
      {count != null && count > 0 && (
        <>
          <span className="text-tertiary">·</span>
          <span className="text-xs text-secondary whitespace-nowrap">
            {count}
          </span>
        </>
      )}
      {navigable && (
        <svg className="w-3.5 h-3.5 text-tertiary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </>
  );

  const pillClasses = `inline-flex items-center ${sizeClasses} rounded-full bg-hover border border-divider transition-colors ${navigable ? "hover:bg-white/10 cursor-pointer" : ""
    } ${className}`;

  if (!navigable || !href) {
    return <span className={pillClasses}>{pillContent}</span>;
  }

  if (variant === "source") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={pillClasses}
      >
        {pillContent}
      </a>
    );
  }

  return (
    <Link href={href} className={pillClasses}>
      {pillContent}
    </Link>
  );
}
