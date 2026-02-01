"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/lib/security";
import { Avatar } from "./avatar";

type Source =
  | { type: "external"; id: string; url: string; title?: string }
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

interface SourcesSectionProps {
  postId: string;
}

function sourceHref(source: Source): string {
  switch (source.type) {
    case "external":
      return source.url;
    case "post":
      return `/post/${source.id}`;
    case "user":
      return `/user/${source.handle ?? source.id}`;
    case "topic":
      return `/topic/${encodeURIComponent(source.slug ?? source.id)}`;
    default:
      return "#";
  }
}

function sourceLabel(source: Source): string {
  if (source.title) return source.title;
  if (source.type === "external") {
    try {
      return new URL(source.url).hostname;
    } catch {
      return source.url;
    }
  }
  if (source.type === "user") return source.handle ?? "User";
  if (source.type === "topic") return source.slug ?? "Topic";
  return "Post";
}

function sourceSubtitle(source: Source): string | null {
  if (source.type === "external") {
    try {
      return new URL(source.url).hostname.replace("www.", "");
    } catch {
      return null;
    }
  }
  if (source.type === "topic") return "Topic";
  if (source.type === "user") return "Profile";
  return null;
}

function SourcesSectionInner({ postId }: SourcesSectionProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSources();
  }, [postId]);

  const loadSources = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/sources`);
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="border-t border-divider pt-6">
        <h2 className="text-lg font-semibold mb-4 text-paper">Sources</h2>
        <p className="text-secondary text-sm">Loading...</p>
      </section>
    );
  }

  if (sources.length === 0) {
    return (
      <section className="border-t border-divider pt-6">
        <h2 className="text-lg font-semibold mb-4 text-paper">Sources</h2>
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
      </section>
    );
  }

  return (
    <section className="border-t border-divider pt-8 mt-4">
      <h2 className="text-xl font-bold mb-6 text-paper border-b border-divider pb-2 tracking-tight">
        Sources
      </h2>
      <ol className="space-y-4">
        {sources.map((source, index) => {
          const href = sourceHref(source);
          const label = sourceLabel(source);
          const subtitle = sourceSubtitle(source);
          const isExternal = source.type === "external";

          return (
            <li
              key={`${source.type}-${source.id}`}
              className="flex items-center gap-4 group"
            >
              <span className="text-tertiary text-sm font-mono w-4 shrink-0">
                {(index + 1).toString().padStart(2, "0")}
              </span>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                {source.type === "user" &&
                (source.avatarKey ?? null) != null ? (
                  <Avatar
                    avatarKey={source.avatarKey ?? undefined}
                    displayName={label}
                    handle={source.handle}
                    size="sm"
                    className="!h-8 !w-8"
                  />
                ) : source.type === "post" &&
                  (source.headerImageKey ?? source.authorAvatarKey) != null ? (
                  source.headerImageKey ? (
                    <Image
                      src={getImageUrl(source.headerImageKey)}
                      alt=""
                      width={32}
                      height={32}
                      className="w-8 h-8 object-cover"
                    />
                  ) : (
                    <Avatar
                      avatarKey={source.authorAvatarKey ?? undefined}
                      displayName={label}
                      size="sm"
                      className="!h-8 !w-8"
                    />
                  )
                ) : source.type === "topic" &&
                  (source.imageKey ?? null) != null ? (
                  <Image
                    src={getImageUrl(source.imageKey!)}
                    alt=""
                    width={32}
                    height={32}
                    className="w-8 h-8 object-cover"
                  />
                ) : (
                  <svg
                    className="w-4 h-4 text-secondary group-hover:text-primary transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    {source.type === "external" && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    )}
                    {source.type === "post" && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    )}
                    {source.type === "topic" && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                      />
                    )}
                    {source.type === "user" && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    )}
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  className="text-primary hover:text-primaryDark transition-colors font-bold text-base block truncate"
                >
                  {label}
                  <svg
                    className="inline-block w-3 h-3 ml-2 opacity-0 group-hover:opacity-50 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </Link>
                {subtitle && (
                  <div className="text-tertiary text-xs mt-0.5 font-medium opacity-60 truncate">
                    {subtitle}
                    {source.type === "external" && ` • ${source.url}`}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export const SourcesSection = memo(SourcesSectionInner);
