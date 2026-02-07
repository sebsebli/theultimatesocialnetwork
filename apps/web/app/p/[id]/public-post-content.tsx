"use client";

import Link from "next/link";
import Image from "next/image";
import { renderMarkdown, stripLeadingH1IfMatch } from "@/utils/markdown";
import { sanitizeHTML } from "@/lib/sanitize-html";
import { getPostDisplayTitle } from "@/utils/compose-helpers";
import { Avatar } from "@/components/avatar";
import { PublicNav } from "@/components/landing/public-nav";
import { PublicFooter } from "@/components/landing/public-footer";
import { getImageUrl } from "@/lib/security";

interface ConnectionSource {
  type?: string;
  id?: string;
  slug?: string;
  label?: string;
  title?: string;
  url?: string;
  domain?: string;
  description?: string;
  authorHandle?: string;
  authorDisplayName?: string;
  authorAvatarKey?: string;
  postCount?: number;
  quoteCount?: number;
  bodyExcerpt?: string;
}

interface ConnectionRef {
  id: string;
  title?: string;
  authorHandle?: string;
  authorDisplayName?: string;
  authorAvatarKey?: string;
  quoteCount?: number;
  bodyExcerpt?: string;
}

interface ConnectionTopic {
  id: string;
  slug?: string;
  title: string;
  postCount?: number;
}

interface ConnectionsData {
  buildsOn?: ConnectionSource[];
  builtUponBy?: ConnectionRef[];
  topics?: ConnectionTopic[];
}

interface PostData {
  id: string;
  body: string;
  createdAt: string;
  headerImageKey?: string;
  readingTimeMinutes?: number;
  quoteCount?: number;
  replyCount?: number;
  referenceMetadata?: Record<string, unknown>;
  author?: {
    handle?: string;
    displayName?: string;
    avatarKey?: string;
    avatarUrl?: string;
  };
}

interface PublicPostContentProps {
  post: PostData;
  connections: ConnectionsData | null;
}

export function PublicPostContent({
  post,
  connections,
}: PublicPostContentProps) {
  const title = getPostDisplayTitle(post) || null;
  const readingTime = post.readingTimeMinutes;
  const createdAt = new Date(post.createdAt);

  const formattedDate = createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hasStats =
    (post.quoteCount && post.quoteCount > 0) ||
    (post.replyCount && post.replyCount > 0) ||
    readingTime;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PublicNav />
      <main className="max-w-[720px] mx-auto px-6 pt-24 pb-16">
        {/* Hero image */}
        {post.headerImageKey && (
          <div className="relative w-full aspect-[21/9] max-h-[400px] overflow-hidden rounded-2xl mb-10">
            <Image
              src={getImageUrl(post.headerImageKey)}
              alt={title || "Post image"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 720px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent" />
          </div>
        )}

        {/* Author card */}
        <Link
          href={`/user/${post.author?.handle}`}
          className="flex items-center gap-4 mb-10 group"
        >
          <Avatar
            avatarKey={post.author?.avatarKey}
            avatarUrl={post.author?.avatarUrl}
            displayName={post.author?.displayName}
            handle={post.author?.handle}
            size="lg"
            className="!w-14 !h-14"
          />
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
              {post.author?.displayName || post.author?.handle}
            </div>
            <div className="text-sm text-[var(--tertiary)]">
              @{post.author?.handle} &middot; {formattedDate}
              {readingTime ? ` \u00B7 ${readingTime} min read` : ""}
            </div>
          </div>
          <span className="text-xs text-[var(--primary)] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            View profile &rarr;
          </span>
        </Link>

        {/* Title */}
        {title && (
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-[var(--foreground)] mb-8 leading-tight tracking-tight">
            {title}
          </h1>
        )}

        {/* Stats bar */}
        {hasStats && (
          <div className="flex items-center gap-6 py-4 border-t border-b border-[var(--divider)] mb-10 text-sm text-[var(--tertiary)]">
            {post.quoteCount > 0 && (
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                {post.quoteCount} {post.quoteCount === 1 ? "cite" : "cites"}
              </span>
            )}
            {post.replyCount > 0 && (
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4"
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
                {post.replyCount} {post.replyCount === 1 ? "reply" : "replies"}
              </span>
            )}
            {readingTime && (
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {readingTime} min read
              </span>
            )}
          </div>
        )}

        {/* Body */}
        <article
          className="text-lg leading-relaxed text-[var(--secondary)] prose prose-invert max-w-none mb-12"
          dangerouslySetInnerHTML={{
            __html: sanitizeHTML(
              renderMarkdown(
                stripLeadingH1IfMatch(post.body, title || undefined),
                { referenceMetadata: post.referenceMetadata },
              ),
            ),
          }}
        />

        {/* Source Chain */}
        {connections && (
          <div className="border-t border-[var(--divider)] pt-10 mb-12 space-y-8">
            {/* This builds on */}
            {connections.buildsOn?.length > 0 && (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--tertiary)] mb-4 flex items-center gap-2">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                  This builds on
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {connections.buildsOn
                    .slice(0, 6)
                    .map((source: ConnectionSource) => {
                      const isPost = source.type === "post";
                      const isTopic = source.type === "topic";
                      const isExternal = source.type === "external";
                      const href = isPost
                        ? `/p/${source.id}`
                        : isTopic
                          ? `/topic/${encodeURIComponent(source.slug || source.label || "")}`
                          : isExternal
                            ? source.url || "#"
                            : "#";

                      return (
                        <Link
                          key={`${source.type}-${source.id}`}
                          href={href}
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noopener noreferrer" : undefined}
                          className={`flex items-start gap-3 p-4 rounded-xl border transition-all hover:scale-[1.01] ${
                            isTopic
                              ? "bg-[var(--primary)]/5 border-[var(--primary)]/20 hover:border-[var(--primary)]/40"
                              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                          }`}
                        >
                          {/* Icon / Avatar */}
                          {isPost && source.authorAvatarKey ? (
                            <Avatar
                              avatarKey={source.authorAvatarKey}
                              displayName={source.authorDisplayName || ""}
                              size="sm"
                              className="!w-8 !h-8 shrink-0 mt-0.5"
                            />
                          ) : isTopic ? (
                            <div className="w-8 h-8 rounded-full bg-[var(--primary)]/15 flex items-center justify-center shrink-0 border border-[var(--primary)]/25">
                              <span className="text-[var(--primary)] text-sm font-bold">
                                #
                              </span>
                            </div>
                          ) : isExternal ? (
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                              <svg
                                className="w-4 h-4 text-[var(--tertiary)]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                              <svg
                                className="w-4 h-4 text-[var(--tertiary)]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-[var(--tertiary)] mb-0.5">
                              {isTopic
                                ? "Topic"
                                : isExternal
                                  ? source.domain || "Link"
                                  : isPost && source.authorHandle
                                    ? `@${source.authorHandle}`
                                    : "Post"}
                            </div>
                            <div className="text-sm font-semibold text-[var(--foreground)] line-clamp-1">
                              {source.label || source.title || "Untitled"}
                            </div>
                            {source.description && (
                              <div className="text-xs text-[var(--tertiary)] line-clamp-1 mt-0.5">
                                {source.description}
                              </div>
                            )}
                            {isTopic && source.postCount > 0 && (
                              <div className="text-xs text-[var(--tertiary)] mt-1">
                                {source.postCount} posts
                              </div>
                            )}
                            {isPost && source.quoteCount > 0 && (
                              <span className="inline-flex items-center bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5">
                                {source.quoteCount}{" "}
                                {source.quoteCount === 1 ? "cite" : "cites"}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                </div>
              </section>
            )}

            {/* Built upon by */}
            {connections.builtUponBy?.length > 0 && (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--tertiary)] mb-4 flex items-center gap-2">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8V4m0 0l-4 4m4-4l4 4M7 16v4m0 0l-4-4m4 4l4-4"
                    />
                  </svg>
                  Built upon by
                  <span className="text-[var(--secondary)]">
                    {connections.builtUponBy.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {connections.builtUponBy
                    .slice(0, 6)
                    .map((ref: ConnectionRef) => (
                      <Link
                        key={ref.id}
                        href={`/p/${ref.id}`}
                        className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                      >
                        <Avatar
                          avatarKey={ref.authorAvatarKey}
                          displayName={
                            ref.authorDisplayName || ref.authorHandle || ""
                          }
                          handle={ref.authorHandle}
                          size="md"
                          className="!w-10 !h-10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[var(--foreground)] truncate">
                            {ref.title || "Post"}
                          </div>
                          <div className="text-xs text-[var(--tertiary)]">
                            @{ref.authorHandle}
                            {ref.quoteCount > 0 && (
                              <>
                                {" "}
                                &middot;{" "}
                                <span className="text-[var(--primary)]">
                                  {ref.quoteCount}{" "}
                                  {ref.quoteCount === 1 ? "cite" : "cites"}
                                </span>
                              </>
                            )}
                          </div>
                          {ref.bodyExcerpt && (
                            <div className="text-xs text-[var(--secondary)] mt-1 line-clamp-2">
                              {ref.bodyExcerpt}
                            </div>
                          )}
                        </div>
                        <svg
                          className="w-4 h-4 text-[var(--tertiary)] group-hover:text-[var(--foreground)] transition-colors shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    ))}
                </div>
              </section>
            )}

            {/* Topics */}
            {connections.topics?.length > 0 && (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--tertiary)] mb-4 flex items-center gap-2">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                    />
                  </svg>
                  In topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {connections.topics.map((topic: ConnectionTopic) => (
                    <Link
                      key={topic.id}
                      href={`/topic/${encodeURIComponent(topic.slug || topic.title || "")}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)]/5 border border-[var(--primary)]/20 hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/40 transition-all text-sm group"
                    >
                      <span className="text-[var(--primary)] font-bold">#</span>
                      <span className="text-[var(--foreground)] font-medium group-hover:text-[var(--primary)] transition-colors">
                        {topic.title}
                      </span>
                      {topic.postCount > 0 && (
                        <>
                          <span className="text-[var(--tertiary)]">
                            &middot;
                          </span>
                          <span className="text-[var(--tertiary)] text-xs">
                            {topic.postCount}{" "}
                            {topic.postCount === 1 ? "post" : "posts"}
                          </span>
                        </>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary)]/5 to-transparent p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary)]/10 to-transparent blur-3xl" />
          <div className="relative">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-3">
              Where ideas connect and grow
            </h2>
            <p className="text-[var(--secondary)] mb-8 max-w-lg mx-auto leading-relaxed">
              Join a social network where your posts reach people who care about
              the same topics. Build on each other&apos;s ideas. Explore through
              connections, not algorithms.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-[var(--foreground)] text-[var(--background)] font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity"
              >
                Get Started Free
              </Link>
              <Link
                href="/manifesto"
                className="inline-flex items-center justify-center px-8 py-3.5 border border-white/20 text-[var(--secondary)] font-medium text-sm rounded-lg hover:border-[var(--primary)] hover:text-[var(--foreground)] transition-colors"
              >
                Read our manifesto
              </Link>
            </div>
          </div>
        </div>

        {/* Embed snippet */}
        <details className="mt-8 text-xs text-[var(--tertiary)]">
          <summary className="cursor-pointer hover:text-[var(--secondary)] transition-colors">
            Embed this post
          </summary>
          <pre className="mt-2 bg-white/5 border border-white/10 rounded-lg p-3 overflow-x-auto">
            <code>{`<iframe src="https://citewalk.com/api/embed/${post.id}" width="100%" height="250" style="border:none;border-radius:12px;max-width:550px" loading="lazy"></iframe>`}</code>
          </pre>
        </details>
      </main>
      <PublicFooter />
    </div>
  );
}
