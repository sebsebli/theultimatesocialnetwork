"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Blurhash } from "react-blurhash";
import { getImageUrl } from "@/lib/security";
import { Avatar } from "./avatar";

export interface ReadingModeProps {
  post: {
    id: string;
    body: string;
    title?: string | null;
    createdAt: string;
    author: {
      id: string;
      handle: string;
      displayName: string;
      avatarKey?: string | null;
      avatarUrl?: string | null;
    };
    replyCount: number;
    quoteCount: number;
    headerImageKey?: string;
    headerImageBlurhash?: string;
    referenceMetadata?: Record<string, { title?: string }>;
  };
}

function ReadingModeInner({ post }: ReadingModeProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-ink">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-ink/95 backdrop-blur-md border-b border-divider px-4 py-3">
        <div className="max-w-[680px] mx-auto flex items-center justify-between">
          <Link
            href={`/post/${post.id}`}
            className="text-secondary hover:text-paper"
          >
            <svg
              className="w-6 h-6"
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
          <div className="w-6"></div>
        </div>
      </header>

      {/* Article Content */}
      <article className="max-w-[680px] mx-auto px-6 py-12">
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

        {/* Bottom Sections */}
        <div className="mt-16 space-y-12 pt-12 border-t border-divider">
          {/* Sources */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-paper">Sources</h2>
            <div className="text-secondary text-sm">
              {/* Sources are extracted from external links in the body during parsing or passed via props */}
              {/* For now, we'll extract them using a simple regex since they aren't passed in the post prop yet */}
              {(() => {
                const urlRegex = /(https?:\/\/[^\s<]+)/g;
                const matches = post.body.match(urlRegex) || [];
                const uniqueUrls = Array.from(new Set(matches));

                if (uniqueUrls.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-10 px-4 bg-white/5 rounded-lg border border-dashed border-divider text-center">
                      <svg
                        className="w-12 h-12 text-tertiary mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                      <p className="text-secondary text-sm">
                        This post doesn&apos;t have any sources.
                      </p>
                    </div>
                  );
                }

                return (
                  <ol className="list-decimal pl-5 space-y-2">
                    {uniqueUrls.map((url, i) => (
                      <li key={i}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors underline decoration-primary/50 underline-offset-2"
                        >
                          {new URL(url).hostname}
                        </a>
                        <span className="text-tertiary ml-2 text-xs truncate inline-block max-w-[300px] align-bottom">
                          {url}
                        </span>
                      </li>
                    ))}
                  </ol>
                );
              })()}
            </div>
          </section>

          {/* Referenced By */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-paper">
              Referenced by
            </h2>
            <div className="text-secondary text-sm">
              {post.quoteCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 bg-white/5 rounded-lg border border-dashed border-divider text-center">
                  <svg
                    className="w-12 h-12 text-tertiary mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                  <p className="text-secondary text-sm">
                    No posts quote this yet.
                  </p>
                </div>
              ) : (
                <p>Referenced by {post.quoteCount} posts</p>
              )}
            </div>
          </section>

          {/* Quoted by — only when post has been quoted */}
          {post.quoteCount > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-6 text-paper">
                Quoted by
              </h2>
              <div className="text-secondary text-sm">
                <p>Quoted by {post.quoteCount} posts</p>
              </div>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}

export const ReadingMode = memo(ReadingModeInner);

import { renderMarkdown, stripLeadingH1IfMatch } from "@/utils/markdown";

function renderMarkdownForReading(
  text: string,
  title?: string | null,
  referenceMetadata?: Record<string, { title?: string }>,
): string {
  // Remove only the first H1 when it matches the post title (already shown separately)
  const processed = stripLeadingH1IfMatch(text, title ?? undefined);

  // Use shared renderer but with reading mode classes
  let html = renderMarkdown(processed, { referenceMetadata });

  // Override classes for reading mode (prose-heading: H1 > H2 > H3, larger sizes for reading)
  html = html.replace(
    /class="prose-heading prose-h3 text-base font-semibold/g,
    'class="prose-heading prose-h3 text-xl font-semibold',
  );
  html = html.replace(
    /class="prose-heading prose-h2 text-lg font-semibold/g,
    'class="prose-heading prose-h2 text-3xl font-semibold',
  );
  html = html.replace(
    /class="prose-heading prose-h1 text-xl font-bold/g,
    'class="prose-heading prose-h1 text-4xl font-bold',
  );

  // Add reading mode link styling for prose-tag (subtle underline, same as body text)
  html = html.replace(
    /class="(prose-tag[^"]*)"/g,
    (_, cls) =>
      `class="${cls} border-b border-current border-opacity-40 pb-0.5"`,
  );

  // Convert to paragraphs for better reading
  html = html
    .split("<br /><br />")
    .map((para) => {
      if (para.trim() && !para.match(/^<[h|]/)) {
        return `<p class="mb-6">${para}</p>`;
      }
      return para;
    })
    .join("");

  return html;
}
