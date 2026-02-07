"use client";

import { useState, useEffect, memo, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/lib/security";
import { Avatar } from "./avatar";

type Source =
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

interface SourcesSectionProps {
  postId: string;
  /** When provided, merge external links [text](url) from body into sources (parity with mobile). */
  postBody?: string | null;
  /** When true, render without section border and heading (used inside post tabs). */
  asTabContent?: boolean;
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
      return `/topic/${encodeURIComponent(source.slug ?? source.title ?? source.id ?? "")}`;
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
  if (source.type === "topic") return source.slug ?? source.title ?? "Topic";
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

function sourceDescription(source: Source): string | null {
  if (source.type === "external" && source.description?.trim()) {
    return source.description.trim();
  }
  return null;
}

/** Extract external links from markdown body: [text](url) or [url](text) (Cite format). */
function extractExternalLinksFromBody(
  body: string,
): Array<{ url: string; title: string | null }> {
  const out: Array<{ url: string; title: string | null }> = [];
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = linkRegex.exec(body)) !== null) {
    const a = (m[1] ?? "").trim();
    const b = (m[2] ?? "").trim();
    const isUrl = (s: string) => /^https?:\/\//i.test(s);
    const url = isUrl(b) ? b : isUrl(a) ? a : null;
    const title = isUrl(b) ? a || null : isUrl(a) ? b || null : null;
    if (url && !seen.has(url)) {
      seen.add(url);
      out.push({ url, title });
    }
  }
  return out;
}

function SourcesSectionInner({
  postId,
  postBody,
  asTabContent = false,
}: SourcesSectionProps) {
  const [apiSources, setApiSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (postId === "preview") {
      setApiSources([]);
      setLoading(false);
      return;
    }
    loadSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadSources depends only on postId
  }, [postId]);

  const loadSources = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/sources`);
      if (res.ok) {
        const data = await res.json();
        setApiSources(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const sources = (() => {
    const fromApi = apiSources;
    if (!postBody || typeof postBody !== "string") return fromApi;
    const fromBody = extractExternalLinksFromBody(postBody);
    const urlSeen = new Set(
      fromApi
        .filter(
          (s): s is Extract<Source, { type: "external" }> =>
            s.type === "external",
        )
        .map((s) => s.url),
    );
    const externalFromBody: Source[] = fromBody
      .filter(({ url }) => !urlSeen.has(url))
      .map(({ url, title }) => ({
        type: "external",
        id: url,
        url,
        ...(title != null ? { title } : {}),
      }));
    return [...fromApi, ...externalFromBody];
  })();

  const wrap = (content: ReactNode) =>
    asTabContent ? (
      <div className="pt-1">{content}</div>
    ) : (
      <section className="border-t border-divider pt-6">
        <h2 className="text-lg font-semibold mb-4 text-paper">Sources</h2>
        {content}
      </section>
    );

  if (loading) {
    return wrap(<p className="text-secondary text-sm">Loading...</p>);
  }

  if (sources.length === 0) {
    return wrap(
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
      </div>,
    );
  }

  return wrap(
    <div className={asTabContent ? "" : "border-b border-divider pb-2 mb-6"}>
      {!asTabContent && (
        <h2 className="text-xl font-bold mb-6 text-paper border-b border-divider pb-2 tracking-tight">
          Sources
        </h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sources.map((source) => {
          const href = sourceHref(source);
          const label = sourceLabel(source);
          const subtitle = sourceSubtitle(source);
          const description = sourceDescription(source);
          const isExternal = source.type === "external";

          return (
            <Link
              key={
                source.type === "external"
                  ? `ext-${source.url}`
                  : `${source.type}-${source.id}`
              }
              href={href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/10 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-divider flex items-center justify-center shrink-0 overflow-hidden text-secondary group-hover:text-primary transition-colors">
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
                ) : source.type === "external" &&
                  (source.imageUrl ?? null) != null ? (
                  // External link with OG image (may be external URL)
                  source.imageUrl!.startsWith("http") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={source.imageUrl!}
                      alt=""
                      className="w-8 h-8 object-cover rounded-full"
                    />
                  ) : (
                    <Image
                      src={getImageUrl(source.imageUrl!)}
                      alt=""
                      width={32}
                      height={32}
                      className="w-8 h-8 object-cover rounded-full"
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
                ) : source.type === "topic" ? (
                  <span className="w-4 h-4 inline-flex items-center justify-center font-mono font-bold text-[8px] leading-none" aria-hidden>[[]]</span>
                ) : (
                  <svg
                    className="w-4 h-4"
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
                <div className="flex items-center justify-between">
                  <span className="text-xs text-tertiary font-medium">
                    {subtitle ||
                      (source.type === "external"
                        ? "External Link"
                        : "Internal")}
                  </span>
                </div>
                <div className="text-sm font-semibold text-paper truncate group-hover:text-primary transition-colors">
                  {label}
                </div>
                {description ? (
                  <div className="text-xs text-tertiary/80 line-clamp-2 mt-0.5">
                    {description}
                  </div>
                ) : (
                  isExternal && (
                    <div className="text-xs text-tertiary/70 truncate mt-0.5">
                      {source.url}
                    </div>
                  )
                )}
              </div>
              <svg
                className="w-5 h-5 shrink-0 text-tertiary group-hover:text-primary transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export const SourcesSection = memo(SourcesSectionInner);
