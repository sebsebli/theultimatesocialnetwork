"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/lib/security";
import { Avatar } from "./avatar";
import { Pill } from "./ui/pill";

// Helper function to strip markdown from text
function stripMarkdown(text: string): string {
  if (!text) return "";
  // Remove markdown headers
  let cleaned = text.replace(/#{1,6}\s*/g, "");
  // Remove bold/italic
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1");
  cleaned = cleaned.replace(/_([^_]+)_/g, "$1");
  // Remove wikilinks - extract text part
  cleaned = cleaned.replace(/\[\[([^\]]+)\]\]/g, (_, content) => {
    const parts = content.split("|");
    return parts[1]?.trim() || parts[0]?.trim() || "";
  });
  // Remove markdown links
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Remove inline code
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");
  // Remove code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

// Helper function to get domain from URL
function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

// Helper function to get favicon URL
function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

// Types matching the enriched connections endpoint
type BuildsOnItem =
  | {
    type: "post";
    id: string;
    label: string;
    authorHandle?: string;
    authorDisplayName?: string;
    authorAvatarKey?: string;
    quoteCount?: number;
    replyCount?: number;
    bodyExcerpt?: string;
  }
  | {
    type: "topic";
    id: string;
    label: string;
    slug?: string;
    postCount?: number;
  }
  | {
    type: "external";
    id: string;
    label: string;
    url?: string;
    domain?: string;
    description?: string;
    imageUrl?: string;
  }
  | {
    type: "user";
    id: string;
    label: string;
    handle?: string;
    avatarKey?: string;
  };

type BuiltUponByItem = {
  id: string;
  title: string | null;
  bodyExcerpt: string;
  authorHandle: string;
  authorDisplayName: string;
  authorAvatarKey: string | null;
  quoteCount: number;
  replyCount: number;
};

type TopicItem = {
  id: string;
  slug: string;
  title: string;
  postCount: number;
};

interface ConnectionsResponse {
  buildsOn: BuildsOnItem[];
  builtUponBy: BuiltUponByItem[];
  topics: TopicItem[];
}

// Legacy types for fallback
type LegacySource =
  | {
    type: "external";
    id: string;
    url: string;
    title?: string;
    description?: string;
    imageUrl?: string;
  }
  | {
    type: "post";
    id: string;
    title?: string;
    headerImageKey?: string | null;
    authorAvatarKey?: string | null;
  }
  | {
    type: "user";
    id: string;
    handle?: string;
    title?: string;
    avatarKey?: string | null;
  }
  | {
    type: "topic";
    id: string;
    slug?: string;
    title?: string;
    imageKey?: string | null;
  };

interface LegacyReferencedPost {
  id: string;
  title?: string;
  body: string;
  author: {
    handle: string;
    displayName: string;
    avatarKey?: string | null;
    avatarUrl?: string | null;
  };
  quoteCount: number;
  createdAt: string;
  viewerCanSeeContent?: boolean;
}

interface PostConnectionsProps {
  postId: string;
  postBody?: string | null;
  quoteCount?: number;
}

function PostConnectionsInner({
  postId,
  postBody: _postBody,
  quoteCount = 0,
}: PostConnectionsProps) {
  const [connections, setConnections] = useState<ConnectionsResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [_useLegacy, setUseLegacy] = useState(false);

  useEffect(() => {
    if (postId === "preview") {
      setConnections({
        buildsOn: [],
        builtUponBy: [],
        topics: [],
      });
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      try {
        // Try the enriched connections endpoint first
        const connectionsRes = await fetch(`/api/posts/${postId}/connections`);

        if (cancelled) return;

        if (connectionsRes.ok) {
          const data = await connectionsRes.json();
          setConnections({
            buildsOn: Array.isArray(data.buildsOn) ? data.buildsOn : [],
            builtUponBy: Array.isArray(data.builtUponBy)
              ? data.builtUponBy
              : [],
            topics: Array.isArray(data.topics) ? data.topics : [],
          });
          setUseLegacy(false);
        } else {
          // Fallback to legacy endpoints
          throw new Error("Connections endpoint failed");
        }
      } catch {
        // Fallback to legacy endpoints
        try {
          const [sourcesRes, referencedRes] = await Promise.all([
            fetch(`/api/posts/${postId}/sources`),
            fetch(`/api/posts/${postId}/referenced-by?page=1&limit=10`),
          ]);

          if (cancelled) return;

          const sources: LegacySource[] = sourcesRes.ok
            ? await sourcesRes.json()
            : [];
          const referencedData = referencedRes.ok
            ? await referencedRes.json()
            : { items: [] };
          const referencedPosts: LegacyReferencedPost[] = Array.isArray(
            referencedData,
          )
            ? referencedData
            : referencedData.items || [];

          // Convert legacy format to new format
          const buildsOn: BuildsOnItem[] = sources.map((source) => {
            if (source.type === "post") {
              return {
                type: "post",
                id: source.id,
                label: source.title || "Post",
                authorAvatarKey: source.authorAvatarKey ?? undefined,
              };
            } else if (source.type === "topic") {
              return {
                type: "topic",
                id: source.id,
                label: source.title || source.slug || "Topic",
                slug: source.slug,
              };
            } else if (source.type === "external") {
              return {
                type: "external",
                id: source.id,
                label: source.title || getDomainFromUrl(source.url),
                url: source.url,
                domain: getDomainFromUrl(source.url),
                description: source.description,
                imageUrl: source.imageUrl,
              };
            } else {
              return {
                type: "user",
                id: source.id,
                label: source.title || source.handle || "User",
                handle: source.handle,
                avatarKey: source.avatarKey ?? undefined,
              };
            }
          });

          const builtUponBy: BuiltUponByItem[] = referencedPosts.map(
            (post) => ({
              id: post.id,
              title: post.title || null,
              bodyExcerpt: stripMarkdown(post.body || "").slice(0, 80),
              authorHandle: post.author.handle,
              authorDisplayName: post.author.displayName,
              authorAvatarKey: post.author.avatarKey ?? null,
              quoteCount: post.quoteCount || 0,
              replyCount: 0,
            }),
          );

          const topics: TopicItem[] = sources
            .filter((s) => s.type === "topic")
            .map((source) => ({
              id: source.id,
              slug: source.slug || source.id,
              title: source.title || "Topic",
              postCount: 0,
            }));

          setConnections({ buildsOn, builtUponBy, topics });
          setUseLegacy(true);
        } catch {
          // If all fails, set empty state
          setConnections({
            buildsOn: [],
            builtUponBy: [],
            topics: [],
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [postId, quoteCount]);

  // Don't render anything if no data
  if (
    !loading &&
    connections &&
    connections.buildsOn.length === 0 &&
    connections.builtUponBy.length === 0 &&
    connections.topics.length === 0
  ) {
    return null;
  }

  const getBuildsOnHref = (item: BuildsOnItem): string => {
    switch (item.type) {
      case "external":
        return item.url || "#";
      case "post":
        return `/post/${item.id}`;
      case "user":
        return `/user/${item.handle || item.id}`;
      case "topic":
        return `/topic/${encodeURIComponent(item.slug || item.label || item.id)}`;
      default:
        return "#";
    }
  };

  // Separate buildsOn by type
  const buildsOnPosts = connections?.buildsOn.filter(
    (item) => item.type === "post",
  ) as Extract<BuildsOnItem, { type: "post" }>[];
  const buildsOnTopics = connections?.buildsOn.filter(
    (item) => item.type === "topic",
  ) as Extract<BuildsOnItem, { type: "topic" }>[];
  const buildsOnExternal = connections?.buildsOn.filter(
    (item) => item.type === "external",
  ) as Extract<BuildsOnItem, { type: "external" }>[];
  const buildsOnUsers = connections?.buildsOn.filter(
    (item) => item.type === "user",
  ) as Extract<BuildsOnItem, { type: "user" }>[];
  const allBuildsOn = [
    ...buildsOnPosts,
    ...buildsOnTopics,
    ...buildsOnExternal,
    ...buildsOnUsers,
  ];

  if (loading) {
    return (
      <div className="px-5 py-6 space-y-8 border-t border-divider">
        {/* Loading skeleton for "This builds on" */}
        <div>
          <div className="h-4 w-32 bg-white/5 rounded mb-3 animate-pulse" />
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 no-scrollbar">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="shrink-0 w-[220px] h-[120px] bg-hover border border-divider rounded-[14px] animate-pulse"
              />
            ))}
          </div>
        </div>
        {/* Loading skeleton for "Built upon by" */}
        <div>
          <div className="h-4 w-40 bg-white/5 rounded mb-3 animate-pulse" />
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 no-scrollbar">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="shrink-0 w-[220px] h-[120px] bg-hover border border-divider rounded-[14px] animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!connections) return null;

  return (
    <div className="px-5 py-6 space-y-8 border-t border-divider">
      {/* This builds on */}
      {allBuildsOn.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-tertiary mb-3">
            This builds on
          </h3>
          <div className="relative">
            {/* Left fade gradient */}
            <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-ink to-transparent pointer-events-none z-10" />
            {/* Right fade gradient */}
            <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-ink to-transparent pointer-events-none z-10" />
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 no-scrollbar scroll-smooth">
              {allBuildsOn.map((item) => {
                const href = getBuildsOnHref(item);
                const isExternal = item.type === "external";

                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="shrink-0 w-[220px] bg-hover border border-divider rounded-[14px] hover:bg-white/10 transition-all p-3 flex flex-col gap-2"
                  >
                    {/* Top row: Avatar/Icon + Author/Topic info */}
                    <div className="flex items-center gap-2">
                      {item.type === "post" && (
                        <>
                          {item.authorAvatarKey ? (
                            <Avatar
                              avatarKey={item.authorAvatarKey}
                              displayName={item.authorDisplayName || ""}
                              handle={item.authorHandle}
                              size="sm"
                              className="!h-6 !w-6"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                              <svg
                                className="w-3 h-3 text-tertiary"
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
                            <div className="text-xs text-paper font-medium truncate">
                              {item.authorDisplayName || "Author"}
                            </div>
                            {item.authorHandle && (
                              <div className="text-[10px] text-tertiary truncate">
                                @{item.authorHandle}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {item.type === "topic" && (
                        <>
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                            <span className="text-primary text-[8px] font-mono font-bold">
                              [[]]
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-paper font-medium truncate">
                              {item.label}
                            </div>
                            {item.postCount !== undefined && (
                              <div className="text-[10px] text-tertiary">
                                {item.postCount} posts
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {item.type === "external" && (
                        <>
                          {item.imageUrl ? (
                            item.imageUrl.startsWith("http") ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.imageUrl}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <Image
                                src={getImageUrl(item.imageUrl)}
                                alt=""
                                width={24}
                                height={24}
                                className="w-6 h-6 rounded-full object-cover shrink-0"
                              />
                            )
                          ) : item.domain ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getFaviconUrl(item.domain)}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                              <svg
                                className="w-3 h-3 text-tertiary"
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
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-paper font-medium truncate">
                              {item.label}
                            </div>
                            {item.domain && (
                              <div className="text-[10px] text-tertiary truncate">
                                {item.domain}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {item.type === "user" && (
                        <>
                          {item.avatarKey ? (
                            <Avatar
                              avatarKey={item.avatarKey}
                              displayName={item.label}
                              handle={item.handle}
                              size="sm"
                              className="!h-6 !w-6"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                              <svg
                                className="w-3 h-3 text-tertiary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-paper font-medium truncate">
                              {item.label}
                            </div>
                            {item.handle && (
                              <div className="text-[10px] text-tertiary truncate">
                                @{item.handle}
                              </div>
                            )}
                            <div className="text-[10px] text-tertiary">
                              Profile
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Main content: Title */}
                    <div className="text-sm font-semibold text-paper line-clamp-2 leading-tight flex-1">
                      {item.type === "post" && item.label}
                      {item.type === "topic" && item.label}
                      {item.type === "external" && item.label}
                      {item.type === "user" && item.label}
                    </div>

                    {/* Secondary text: Body excerpt or description */}
                    {(item.type === "post" || item.type === "external") && (
                      <div className="text-xs text-tertiary line-clamp-1">
                        {item.type === "external" && item.description
                          ? item.description.slice(0, 60)
                          : item.type === "post" && item.bodyExcerpt
                            ? stripMarkdown(item.bodyExcerpt).slice(0, 60)
                            : ""}
                      </div>
                    )}

                    {/* Connection count badge */}
                    {item.type === "post" &&
                      item.quoteCount !== undefined &&
                      item.quoteCount > 0 && (
                        <div className="mt-auto pt-1">
                          <span className="inline-flex items-center text-[10px] text-tertiary">
                            {item.quoteCount} cite
                            {item.quoteCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Built upon by */}
      {connections.builtUponBy.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-tertiary mb-3">
            Built upon by
            {quoteCount > 0 && (
              <>
                {" "}
                <span className="text-secondary">{quoteCount}</span>
              </>
            )}
          </h3>
          <div className="relative">
            {/* Left fade gradient */}
            <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-ink to-transparent pointer-events-none z-10" />
            {/* Right fade gradient */}
            <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-ink to-transparent pointer-events-none z-10" />
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 no-scrollbar scroll-smooth">
              {connections.builtUponBy.map((post) => {
                const title = post.title || "Post";
                const bodyExcerpt = post.bodyExcerpt
                  ? `${post.bodyExcerpt}${post.bodyExcerpt.length >= 80 ? "…" : ""}`
                  : "";

                return (
                  <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="shrink-0 w-[220px] bg-hover border border-divider rounded-[14px] hover:bg-white/10 transition-all p-3 flex flex-col gap-2"
                  >
                    {/* Author info */}
                    <div className="flex items-center gap-2">
                      <Avatar
                        avatarKey={post.authorAvatarKey ?? undefined}
                        displayName={post.authorDisplayName}
                        handle={post.authorHandle}
                        size="md"
                        className="!h-8 !w-8"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-paper font-medium truncate">
                          {post.authorDisplayName}
                        </div>
                        <div className="text-[10px] text-tertiary truncate">
                          @{post.authorHandle}
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="text-sm font-bold text-paper line-clamp-2 leading-tight">
                      {title}
                    </div>

                    {/* Body excerpt */}
                    {bodyExcerpt && (
                      <div className="text-xs text-tertiary line-clamp-2 flex-1">
                        {bodyExcerpt}
                      </div>
                    )}

                    {/* Connection count badge */}
                    {post.quoteCount > 0 && (
                      <div className="mt-auto pt-1">
                        <span className="inline-flex items-center bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {post.quoteCount} cite
                          {post.quoteCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* In topics */}
      {connections.topics.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-tertiary mb-3">
            In topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {connections.topics.map((topic) => (
              <Pill
                key={`topic-${topic.id}`}
                variant="topic"
                title={topic.title}
                slug={topic.slug}
                count={topic.postCount > 0 ? topic.postCount : undefined}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export const PostConnections = memo(PostConnectionsInner);
