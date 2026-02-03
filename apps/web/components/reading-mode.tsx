"use client";

import { memo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Blurhash } from "react-blurhash";
import { getImageUrl } from "@/lib/security";
import { Avatar } from "./avatar";
import { OfflineToggle } from "./offline-toggle";
import { useToast } from "./ui/toast";
import { SourcesSection } from "./sources-section";
import { ReferencedBySection } from "./referenced-by-section";
import { renderMarkdown, stripLeadingH1IfMatch } from "@/utils/markdown";

function renderMarkdownForReading(
  text: string,
  title?: string | null,
  referenceMetadata?: Record<string, { title?: string; deletedAt?: string }>,
): string {
  const processed = stripLeadingH1IfMatch(text, title ?? undefined);
  let html = renderMarkdown(processed, { referenceMetadata });
  html = html.replace(
    /class="prose-heading prose-h3 text-base font-semibold/g,
    'class="prose-heading prose-h3 text-xl font-semibold font-sans tracking-tight',
  );
  html = html.replace(
    /class="prose-heading prose-h2 text-lg font-semibold/g,
    'class="prose-heading prose-h2 text-3xl font-semibold font-sans tracking-tighter',
  );
  html = html.replace(
    /class="prose-heading prose-h1 text-xl font-bold/g,
    'class="prose-heading prose-h1 text-4xl font-bold font-sans tracking-tighter',
  );
  html = html.replace(
    /class="(prose-tag[^"]*)"/g,
    (_, cls) =>
      `class="${cls} border-b border-current border-opacity-40 pb-0.5 font-serif font-semibold"`,
  );
  html = html.replace(
    /<blockquote>/g,
    '<blockquote class="border-l-4 border-primary/50 bg-white/5 pl-6 pr-4 py-4 my-8 rounded-r-lg text-xl italic text-secondary font-serif">',
  );
  html = html.replace(
    /<ul>/g,
    '<ul class="list-disc pl-6 space-y-3 my-6 marker:text-tertiary font-serif">',
  );
  html = html.replace(
    /<ol>/g,
    '<ol class="list-decimal pl-6 space-y-3 my-6 marker:text-tertiary font-serif">',
  );
  html = html.replace(/<li>/g, '<li class="pl-2">');
  html = html
    .split("<br /><br />")
    .map((para) => {
      if (para.trim() && !para.match(/^<[h|b|u|o]/)) {
        return `<p class="mb-6">${para}</p>`;
      }
      return para;
    })
    .join("");
  return html;
}

export interface ReadingModeProps {
  post: {
    id: string;
    body: string;
    title?: string | null;
    createdAt: string;
    author: {
      handle: string;
      displayName: string;
      avatarKey?: string | null;
      avatarUrl?: string | null;
    };
    headerImageKey?: string | null;
    headerImageBlurhash?: string | null;
    referenceMetadata?: Record<string, { title?: string; deletedAt?: string }>;
    quoteCount: number;
    isKept?: boolean;
    /** When false, content is redacted; show private message */
    viewerCanSeeContent?: boolean;
    /** When set, post was soft-deleted; show "deleted on ..." placeholder */
    deletedAt?: string;
  };
  /** Called when user unkeeps the post (e.g. to refresh Keeps list). */
  onKeep?: () => void;
}

function ReadingModeInner({ post, onKeep }: ReadingModeProps) {
  const { error: toastError } = useToast();
  const [kept, setKept] = useState(post.isKept ?? false);

  useEffect(() => {
    setKept(post.isKept ?? false);
  }, [post.id, post.isKept]);

  if (post.deletedAt) {
    const deletedDate = new Date(post.deletedAt);
    const formattedDate = deletedDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return (
      <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center max-w-md">
          <div className="mb-4 text-tertiary">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <p className="text-paper font-medium mb-2">
            This post has been deleted
          </p>
          <p className="text-secondary text-sm mb-6">
            It was deleted on {formattedDate}.
          </p>
          <Link
            href="/home"
            className="text-primary hover:underline font-medium"
          >
            Go back
          </Link>
        </div>
      </div>
    );
  }

  const handleKeep = async () => {
    const previous = kept;
    setKept(!previous);
    try {
      const res = await fetch(`/api/posts/${post.id}/keep`, {
        method: previous ? "DELETE" : "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to toggle keep");
      if (previous) onKeep?.();
    } catch {
      setKept(previous);
      toastError("Failed to update save");
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-10 bg-ink/95 backdrop-blur-md border-b border-divider">
        <div className="max-w-[680px] mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <Link
            href={`/post/${post.id}`}
            className="text-secondary hover:text-paper flex items-center gap-2"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          {post.title && (
            <h1 className="text-lg font-semibold text-paper truncate max-w-[60%]">
              {post.title}
            </h1>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleKeep}
              aria-label={kept ? "Saved" : "Save"}
              className={`flex items-center justify-center min-h-[40px] min-w-[40px] rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${kept ? "text-primary" : "text-tertiary hover:text-paper"}`}
            >
              <svg
                className="w-5 h-5"
                fill={kept ? "currentColor" : "none"}
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
            </button>
            <OfflineToggle post={post} />
          </div>
        </div>
      </header>

      {/* Article Content */}
      <article className="max-w-[680px] mx-auto px-6 py-12">
        {post.viewerCanSeeContent === false ? (
          <div className="min-h-[300px] rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3 text-tertiary text-center px-4">
              <svg
                className="w-14 h-14"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <p className="text-paper font-medium">
                This post is only visible to followers
              </p>
              <p className="text-sm text-secondary">
                Follow the author to see the full content.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header Image – fades out on scroll */}
            {post.headerImageKey && (
              <div className="relative w-full aspect-video mb-8 rounded-xl overflow-hidden bg-divider shadow-sm">
                {post.headerImageBlurhash && (
                  <Blurhash
                    hash={post.headerImageBlurhash}
                    width={32}
                    height={32}
                    punch={1}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                    }}
                  />
                )}
                <Image
                  src={getImageUrl(post.headerImageKey)}
                  alt={post.title || "Post header"}
                  fill
                  className="object-cover z-10"
                  sizes="(max-width: 768px) 100vw, 680px"
                  priority
                />
              </div>
            )}

            {/* Title */}
            {post.title && (
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-paper">
                {post.title}
              </h1>
            )}

            {/* Author & Date */}
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-divider">
              <Link href={`/user/${post.author.handle}`}>
                <Avatar
                  avatarKey={post.author.avatarKey}
                  avatarUrl={post.author.avatarUrl}
                  displayName={post.author.displayName}
                  handle={post.author.handle}
                  size="md"
                />
              </Link>
              <div>
                <Link href={`/user/${post.author.handle}`}>
                  <div className="font-semibold text-paper hover:text-primary transition-colors">
                    {post.author.displayName}
                  </div>
                </Link>
                <div className="text-tertiary text-sm">
                  {formatDate(post.createdAt)}
                </div>
              </div>
            </div>

            {/* Body - Optimized Typography */}
            <div
              className="prose prose-invert max-w-none text-[20px] md:text-[22px] leading-[1.7] text-secondary/90 tracking-normal font-serif"
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
              }}
              dangerouslySetInnerHTML={{
                __html: renderMarkdownForReading(
                  post.body,
                  post.title,
                  post.referenceMetadata,
                ),
              }}
            />

            {/* Bottom Sections — real data when post.id is not preview (parity with mobile) */}
            <div className="mt-16 space-y-0 pt-12 border-t border-divider">
              {post.id && post.id !== "preview" && (
                <>
                  <SourcesSection postId={post.id} postBody={post.body} />
                  <ReferencedBySection
                    postId={post.id}
                    quoteCount={post.quoteCount ?? 0}
                  />
                </>
              )}
            </div>
          </>
        )}
      </article>
    </div>
  );
}

export const ReadingMode = memo(ReadingModeInner);
