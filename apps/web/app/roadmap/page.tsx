import { cookies } from "next/headers";
import type { Metadata } from "next";
import { PublicNav } from "@/components/landing/public-nav";
import { PublicFooter } from "@/components/landing/public-footer";
import { WebPageJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "What we're building at Citewalk. See what's live, what's coming next, and where the European social network is headed.",
  alternates: {
    canonical: "https://citewalk.com/roadmap",
  },
  openGraph: {
    title: "Roadmap — Citewalk",
    description:
      "What we're building at Citewalk. See what's live, what's coming next, and where we're headed.",
    url: "https://citewalk.com/roadmap",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Roadmap — Citewalk",
    description:
      "What we're building at Citewalk. See what's live, what's coming next, and where we're headed.",
    images: ["/og-image.png"],
  },
};

export default async function RoadmapPage() {
  const token = (await cookies()).get("token")?.value;
  const isAuthenticated = !!token && token.length > 0;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">
      <WebPageJsonLd
        title="Roadmap — Citewalk"
        description="What we're building at Citewalk. See what's live, what's coming next, and where we're headed."
        url="https://citewalk.com/roadmap"
        dateModified="2026-02-01"
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://citewalk.com" },
          { name: "Roadmap", url: "https://citewalk.com/roadmap" },
        ]}
      />
      <PublicNav isAuthenticated={isAuthenticated} />

      <main id="main-content" className="max-w-4xl mx-auto pt-32 pb-20 px-6">
        <header className="mb-20 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
          <div className="text-xs font-mono text-[var(--primary)] uppercase tracking-widest pt-2">
            Roadmap
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-medium text-[var(--foreground)] mb-6 tracking-tight">
              What we&apos;re building
            </h1>
            <p className="text-lg text-[var(--secondary)] font-light leading-relaxed max-w-2xl">
              Here&apos;s what&apos;s live today, what we&apos;re working on,
              and where we&apos;re headed. We build in the open and ship when
              it&apos;s ready.
            </p>
          </div>
        </header>

        <div className="space-y-16 relative">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-4 bottom-0 w-px bg-[var(--divider)] md:left-[207px]" />

          {/* Phase I */}
          <article className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 relative group">
            {/* Status Dot */}
            <div className="hidden md:flex justify-end pr-8 pt-2 relative">
              <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest">
                Phase I
              </span>
              <div className="absolute right-[-5px] top-[10px] w-2.5 h-2.5 rounded-full bg-[var(--background)] border-2 border-emerald-500 z-10" />
            </div>

            <div className="pl-6 md:pl-0">
              <div className="flex items-center gap-3 mb-6 md:hidden">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest">
                  Phase I: Live Now
                </span>
              </div>

              <h2 className="text-2xl font-serif text-[var(--foreground)] mb-2">
                Topic-Based Content & Citation Transparency
              </h2>
              <p className="text-[var(--tertiary)] mb-8 text-sm">Live now</p>

              <div className="grid gap-4">
                <div className="p-5 border border-[var(--divider)] bg-white/5 rounded hover:border-[var(--primary)] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[var(--foreground)]">
                      Cite any idea with [[links]]
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-500 border border-emerald-900/30 bg-emerald-900/10 px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      Live
                    </span>
                  </div>
                  <p className="text-sm text-[var(--secondary)] leading-relaxed">
                    Use{" "}
                    <span className="text-[var(--foreground)] font-mono text-xs">
                      [[citelinks]]
                    </span>{" "}
                    to connect any post to topics, sources, or other posts.
                    Every link creates a visible connection. Posts build on each
                    other, creating citation chains.
                  </p>
                </div>
                <div className="p-5 border border-[var(--divider)] bg-white/5 rounded hover:border-[var(--primary)] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[var(--foreground)]">
                      EU-hosted, privacy-first
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-500 border border-emerald-900/30 bg-emerald-900/10 px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      Live
                    </span>
                  </div>
                  <p className="text-sm text-[var(--secondary)] leading-relaxed">
                    Topic-based content delivery — tag posts with{" "}
                    <span className="text-[var(--foreground)] font-mono text-xs">
                      [[topics]]
                    </span>{" "}
                    and everyone following that topic sees it. Chronological
                    feeds you control. EU-hosted, GDPR-compliant by design.
                  </p>
                </div>
                <div className="p-5 border border-[var(--divider)] bg-white/5 rounded hover:border-[var(--primary)] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[var(--foreground)]">
                      No vanity metrics
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-500 border border-emerald-900/30 bg-emerald-900/10 px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      Live
                    </span>
                  </div>
                  <p className="text-sm text-[var(--secondary)] leading-relaxed">
                    Like counts are private. We care about whether people read
                    your work, not how many times they tapped a heart.
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Phase II */}
          <article className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 relative">
            <div className="hidden md:flex justify-end pr-8 pt-2 relative">
              <span className="text-xs font-mono text-[var(--primary)] uppercase tracking-widest">
                Phase II
              </span>
              <div className="absolute right-[-5px] top-[10px] w-2.5 h-2.5 rounded-full bg-[var(--background)] border-2 border-[var(--primary)] z-10" />
            </div>

            <div className="pl-6 md:pl-0">
              <div className="flex items-center gap-3 mb-6 md:hidden">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
                <span className="text-xs font-mono text-[var(--primary)] uppercase tracking-widest">
                  Phase II: Coming Soon
                </span>
              </div>

              <h2 className="text-2xl font-serif text-[var(--foreground)] mb-2">
                Exploration & Public Discovery
              </h2>
              <p className="text-[var(--tertiary)] mb-8 text-sm">
                Coming Q1–Q2 2026
              </p>

              <div className="grid gap-4">
                <div className="p-5 border border-[var(--divider)] bg-[var(--background)] rounded opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[var(--foreground)]">
                      Exploration &amp; Public Discovery
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-amber-500 border border-amber-900/30 bg-amber-900/10 px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-amber-500" />
                      In progress
                    </span>
                  </div>
                  <p className="text-sm text-[var(--secondary)] leading-relaxed">
                    Exploration trail showing how you discovered content through
                    connections. Topic maps visualizing how ideas relate. Public
                    post pages with SEO so ideas are discoverable beyond the
                    platform. Link archiving to preserve external sources.
                  </p>
                </div>
                <div className="p-5 border border-[var(--divider)] bg-[var(--background)] rounded opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[var(--foreground)]">
                      Citewalk Pro
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-amber-500 border border-amber-900/30 bg-amber-900/10 px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-amber-500" />
                      In progress
                    </span>
                  </div>
                  <p className="text-sm text-[var(--secondary)] leading-relaxed">
                    Optional subscription for power users. Citation analytics
                    dashboard (track how your ideas spread), advanced search
                    across citation chains, extended formatting, API access for
                    researchers and journalists, and priority features. The
                    sustainable way to fund an ad-free platform.
                  </p>
                </div>
                <div className="p-5 border border-[var(--divider)] bg-[var(--background)] rounded opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[var(--foreground)]">
                      Fediverse Integration
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[var(--tertiary)] border border-[var(--divider)] bg-[var(--divider)] px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-[var(--tertiary)]" />
                      Planned
                    </span>
                  </div>
                  <p className="text-sm text-[var(--secondary)] leading-relaxed">
                    Fediverse integration (ActivityPub) so you can follow and be
                    followed by people on Mastodon, Bluesky bridges, and other
                    open platforms. Citation transparency across the network.
                  </p>
                </div>
                <div className="p-5 border border-[var(--divider)] bg-[var(--background)] rounded opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[var(--foreground)]">
                      Institutional &amp; Team Plans
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[var(--tertiary)] border border-[var(--divider)] bg-[var(--divider)] px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-[var(--tertiary)]" />
                      Planned
                    </span>
                  </div>
                  <p className="text-sm text-[var(--secondary)] leading-relaxed">
                    Team subscriptions for newsrooms, universities, and research
                    groups. Shared collections, team analytics, white-label
                    embeds, and academic export formats (BibTeX).
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Phase III */}
          <article className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 relative">
            <div className="hidden md:flex justify-end pr-8 pt-2 relative">
              <span className="text-xs font-mono text-[var(--divider)] uppercase tracking-widest">
                Phase III
              </span>
              <div className="absolute right-[-5px] top-[10px] w-2.5 h-2.5 rounded-full bg-[var(--background)] border-2 border-[var(--divider)] z-10" />
            </div>

            <div className="pl-6 md:pl-0 opacity-50">
              <div className="flex items-center gap-3 mb-6 md:hidden">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--divider)]" />
                <span className="text-xs font-mono text-[var(--divider)] uppercase tracking-widest">
                  Phase III: On the Horizon
                </span>
              </div>

              <h2 className="text-2xl font-serif text-[var(--foreground)] mb-2">
                AI Discovery &amp; Integrations
              </h2>
              <p className="text-[var(--tertiary)] mb-8 text-sm">Future</p>

              <div className="grid gap-4">
                <div className="p-5 border border-[var(--divider)] bg-[var(--background)] rounded">
                  <h3 className="font-medium text-[var(--foreground)] mb-2">
                    AI-powered discovery
                  </h3>
                  <p className="text-sm text-[var(--secondary)]">
                    AI-powered topic discovery using graph-based analysis of how
                    ideas connect — not user profiling. Embeddable citations for
                    external sites. Academic and news integrations for
                    cross-platform citation chains.
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-24 pt-12 border-t border-[var(--divider)] bg-white/5 p-10 rounded border border-[var(--divider)]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">
                Shape the Future of Citewalk
              </h3>
              <p className="text-sm text-[var(--secondary)]">
                Have ideas, feedback, or want to collaborate? We&apos;d love to
                hear from you.
              </p>
            </div>
            <a
              href="mailto:hello@citewalk.com"
              className="px-6 py-3 border border-[var(--divider)] text-[var(--foreground)] text-sm hover:bg-[var(--divider)] transition-colors rounded"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
