"use client";

import Link from "next/link";
import Image from "next/image";
import { Blurhash } from "react-blurhash";

interface ReadingModeProps {
  post: {
    id: string;
    body: string;
    title?: string | null;
    createdAt: string;
    author: {
      id: string;
      handle: string;
      displayName: string;
    };
    replyCount: number;
    quoteCount: number;
    headerImageKey?: string;
    headerImageBlurhash?: string;
  };
}

export function ReadingMode({ post }: ReadingModeProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const STORAGE_URL =
    process.env.NEXT_PUBLIC_STORAGE_URL ||
    "http://localhost:9000/citewalk-images";

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
        {/* Header Image */}
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
              src={`${STORAGE_URL}/${post.headerImageKey}`}
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
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              {post.author.displayName.charAt(0).toUpperCase()}
            </div>
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
            __html: renderMarkdownForReading(post.body),
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
                  return <p>No external sources found.</p>;
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
                <p>Not referenced yet.</p>
              ) : (
                <p>Referenced by {post.quoteCount} posts</p>
              )}
            </div>
          </section>

          {/* Quoted By */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-paper">
              Quoted by
            </h2>
            <div className="text-secondary text-sm">
              {post.quoteCount === 0 ? (
                <p>Not quoted yet.</p>
              ) : (
                <p>Quoted by {post.quoteCount} posts</p>
              )}
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}

import { renderMarkdown } from "@/utils/markdown";

function renderMarkdownForReading(text: string): string {
  // Remove title if present (already shown separately)
  const processed = text.replace(/^#\s+.+$/m, "");

  // Use shared renderer but with reading mode classes
  let html = renderMarkdown(processed);

  // Override classes for reading mode
  html = html.replace(
    /class="text-lg font-semibold/g,
    'class="text-2xl font-semibold',
  );
  html = html.replace(
    /class="text-xl font-semibold/g,
    'class="text-3xl font-semibold',
  );
  html = html.replace(
    /class="text-2xl font-bold/g,
    'class="text-4xl font-bold',
  );

  // Add reading mode link styling
  html = html.replace(
    /class="text-primary hover:underline font-medium"/g,
    'class="text-primary hover:underline font-medium border-b border-primary/30 pb-0.5"',
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
