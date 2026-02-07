import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/manifesto",
          "/roadmap",
          "/privacy",
          "/terms",
          "/imprint",
          "/community-guidelines",
          "/ai-transparency",
          "/sign-in",
          "/waiting-list",
        ],
        disallow: [
          "/settings",
          "/settings/*",
          "/api/",
          "/home",
          "/home/*",
          "/notifications",
          "/notifications/*",
          "/drafts",
          "/drafts/*",
          "/bookmarks",
          "/bookmarks/*",
          "/search",
        ],
      },
      // Google-specific: allow large previews
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/settings", "/settings/*", "/api/"],
      },
      // AI search crawlers — allowed for public content
      {
        userAgent: "GPTBot",
        allow: [
          "/",
          "/manifesto",
          "/roadmap",
          "/privacy",
          "/terms",
          "/imprint",
          "/community-guidelines",
          "/ai-transparency",
          "/llm.txt",
        ],
        disallow: ["/settings", "/api/", "/home"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/", "/manifesto", "/roadmap", "/llm.txt"],
        disallow: ["/settings", "/api/", "/home"],
      },
      {
        userAgent: "Claude-Web",
        allow: ["/", "/manifesto", "/roadmap", "/llm.txt"],
        disallow: ["/settings", "/api/", "/home"],
      },
      {
        userAgent: "Anthropic-AI",
        allow: ["/", "/manifesto", "/roadmap", "/llm.txt"],
        disallow: ["/settings", "/api/", "/home"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/manifesto", "/roadmap", "/llm.txt"],
        disallow: ["/settings", "/api/", "/home"],
      },
      {
        userAgent: "Bytespider",
        disallow: "/",
      },
    ],
    sitemap: "https://citewalk.com/sitemap.xml",
    host: "https://citewalk.com",
  };
}
