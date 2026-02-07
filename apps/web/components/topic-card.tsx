"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { WhyLabel } from "./why-label";
import { getImageUrl } from "@/lib/security";

export interface TopicCardProps {
  topic: {
    id: string;
    slug: string;
    title: string;
    reasons?: string[];
    description?: string;
    postCount?: number;
    followerCount?: number;
    isFollowing?: boolean;
    recentPostImageKey?: string | null;
    headerImageKey?: string | null;
    imageKey?: string | null;
    imageUrl?: string | null;
    recentPost?: {
      id: string;
      title: string | null;
      bodyExcerpt: string;
      headerImageKey: string | null;
      author: { handle: string; displayName: string } | null;
      createdAt: string | null;
    } | null;
  };
  onFollow?: () => void;
}

function TopicCardInner({ topic, onFollow }: TopicCardProps) {
  const t = useTranslations("explore");
  const tProfile = useTranslations("profile");
  const recent = topic.recentPost;
  const imageUrl =
    (recent?.headerImageKey ? getImageUrl(recent.headerImageKey) : null) ||
    (topic.recentPostImageKey ? getImageUrl(topic.recentPostImageKey) : null) ||
    (topic.headerImageKey ? getImageUrl(topic.headerImageKey) : null) ||
    (topic.imageKey ? getImageUrl(topic.imageKey) : null) ||
    (topic.imageUrl ?? null) ||
    null;

  const latestTitle = recent?.title?.trim() || null;
  const latestExcerpt = recent?.bodyExcerpt?.trim() || null;
  const latestAuthor = recent?.author ? `@${recent.author.handle}` : null;

  const meta = [
    topic.postCount != null && `${topic.postCount} posts`,
    topic.followerCount != null &&
    topic.followerCount > 0 &&
    `${topic.followerCount} followers`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={`/topic/${encodeURIComponent(topic.slug)}`}>
      <div className="relative flex flex-col rounded-lg overflow-hidden border border-divider hover:border-white/15 bg-hover hover:bg-white/[0.04] transition-all duration-200 group">
        {/* Hero: header image from latest post with overlay */}
        {imageUrl ? (
          <div className="relative w-full aspect-[16/9] shrink-0 bg-white/5">
            <Image
              src={imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 420px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
              <h4 className="text-paper text-lg md:text-xl font-bold tracking-tight group-hover:text-primary transition-colors drop-shadow-sm">
                {topic.title}
              </h4>
              {latestTitle && (
                <p className="text-secondary/95 text-sm mt-0.5 line-clamp-1 drop-shadow-sm">
                  {latestTitle}
                </p>
              )}
              {topic.reasons && (
                <div className="mt-1.5">
                  <WhyLabel reasons={topic.reasons} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="px-3 pt-3 md:px-4 md:pt-4">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-paper text-lg md:text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
                {topic.title}
              </h4>
              {topic.reasons && <WhyLabel reasons={topic.reasons} />}
            </div>
            {latestTitle && (
              <p className="text-secondary text-sm mt-0.5 line-clamp-1">
                {latestTitle}
              </p>
            )}
            {!latestTitle && latestExcerpt && (
              <p className="text-secondary text-sm mt-0.5 line-clamp-1">
                {latestExcerpt}
              </p>
            )}
          </div>
        )}

        {/* Footer: meta + follow */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 md:px-4 md:py-2.5 border-t border-white/[0.04]">
          <div className="flex items-center gap-2 min-w-0">
            {meta && (
              <span className="text-tertiary text-xs truncate">{meta}</span>
            )}
            {latestAuthor && !imageUrl && (
              <span className="text-tertiary text-xs truncate">
                {latestAuthor}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-primary/80 text-xs font-medium hidden sm:inline">
              {t("viewTopic")}
            </span>
            {onFollow && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFollow();
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${topic.isFollowing
                    ? "bg-primary border-primary text-ink"
                    : "border-primary/50 text-primary hover:bg-primary/10"
                  }`}
              >
                {topic.isFollowing ? tProfile("following") : tProfile("follow")}
              </button>
            )}
          </div>
        </div>

        {/* Optional: link to latest post when we have image (subtle) */}
        {recent && imageUrl && (latestTitle || latestExcerpt) && (
          <Link
            href={`/post/${recent.id}`}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 px-2 py-1 rounded bg-ink/70 text-paper text-xs font-medium hover:bg-ink/90 transition-colors"
          >
            {t("readPost")}
          </Link>
        )}
      </div>
    </Link>
  );
}

export const TopicCard = memo(TopicCardInner);
