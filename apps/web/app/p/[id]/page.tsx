import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getApiUrl } from "@/lib/security";

function getApiBase() {
  const apiBase = getApiUrl().replace(/\/$/, "");
  // Nest uses setGlobalPrefix('api'), so path must include /api
  return apiBase.endsWith("/api") ? apiBase : `${apiBase}/api`;
}

async function getPost(id: string) {
  try {
    const res = await fetch(`${getApiBase()}/posts/${id}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getConnections(id: string) {
  try {
    const res = await fetch(`${getApiBase()}/posts/${id}/connections`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post || post.deletedAt) {
    return { title: "Post not found" };
  }

  // If post is from a protected user, don't generate metadata
  if (post.author?.isProtected) {
    return { title: "Post not found" };
  }

  const title =
    post.title ||
    post.body
      ?.split("\n")[0]
      ?.replace(/^#+\s*/, "")
      .slice(0, 60) ||
    "Post on Citewalk";
  const description =
    stripMarkdown(post.body || "").slice(0, 160) ||
    "Read this post on Citewalk";
  const authorName =
    post.author?.displayName || post.author?.handle || "Someone";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://citewalk.com";

  return {
    title: `${title} — ${authorName} on Citewalk`,
    description,
    openGraph: {
      title: `${title} — ${authorName} on Citewalk`,
      description,
      type: "article",
      url: `${siteUrl}/p/${id}`,
      siteName: "Citewalk",
      authors: [authorName],
      publishedTime: post.createdAt,
      ...(post.headerImageKey
        ? {
            images: [
              {
                url: `${getApiBase()}/images/${encodeURIComponent(post.headerImageKey)}`,
                width: 1200,
                height: 630,
                alt: title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: post.headerImageKey ? "summary_large_image" : "summary",
      title: `${title} — ${authorName}`,
      description,
      ...(post.headerImageKey
        ? {
            images: [
              `${getApiBase()}/images/${encodeURIComponent(post.headerImageKey)}`,
            ],
          }
        : {}),
    },
    alternates: {
      canonical: `${siteUrl}/p/${id}`,
    },
  };
}

export default async function PublicPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, connections] = await Promise.all([
    getPost(id),
    getConnections(id),
  ]);

  if (!post || post.deletedAt) return notFound();

  // If post is from a protected user, don't show publicly
  if (post.author?.isProtected) return notFound();

  // Dynamic import for client component
  const { PublicPostContent } = await import("./public-post-content");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://citewalk.com";
  const title =
    post.title ||
    post.body
      ?.split("\n")[0]
      ?.replace(/^#+\s*/, "")
      .slice(0, 110) ||
    "Post";

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: title,
            author: {
              "@type": "Person",
              name: post.author?.displayName || post.author?.handle,
              url: `${siteUrl}/user/${post.author?.handle}`,
            },
            datePublished: post.createdAt,
            publisher: {
              "@type": "Organization",
              name: "Citewalk",
              url: siteUrl,
            },
            mainEntityOfPage: `${siteUrl}/p/${id}`,
            ...(post.readingTimeMinutes
              ? { timeRequired: `PT${post.readingTimeMinutes}M` }
              : {}),
            ...(post.headerImageKey
              ? {
                  image: `${getApiBase()}/images/${encodeURIComponent(post.headerImageKey)}`,
                }
              : {}),
          }),
        }}
      />
      <PublicPostContent post={post} connections={connections} />
    </>
  );
}
