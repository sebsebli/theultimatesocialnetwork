import type { MetadataRoute } from "next";
import { getApiUrl } from "@/lib/security";

function getApiBase() {
  const apiBase = getApiUrl().replace(/\/$/, "");
  // Nest uses setGlobalPrefix('api'), so path must include /api
  return apiBase.endsWith("/api") ? apiBase : `${apiBase}/api`;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://citewalk.com";

async function getRecentPublicPosts(): Promise<
  Array<{ id: string; createdAt: string }>
> {
  try {
    // Fetch recent public posts (no auth needed - OptionalJwtAuthGuard)
    // Limit to 1000 most recent posts for sitemap
    const res = await fetch(
      `${getApiBase()}/explore/newest?limit=1000&page=1`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    return items
      .filter(
        (post: Record<string, string | undefined>) =>
          post?.id && !post?.deletedAt,
      )
      .map((post: Record<string, string | undefined>) => ({
        id: post.id,
        createdAt: post.createdAt,
      }));
  } catch (error) {
    console.error("Failed to fetch posts for sitemap:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static public pages with their priorities and change frequencies
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/manifesto`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/roadmap`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/waiting-list`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/imprint`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/community-guidelines`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/ai-transparency`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  // Fetch recent public posts
  const posts = await getRecentPublicPosts();
  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/p/${post.id}`,
    lastModified: new Date(post.createdAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...postPages];
}
