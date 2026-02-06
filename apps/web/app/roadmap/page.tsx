import { cookies } from "next/headers";
import type { Metadata } from "next";
import { PublicNav } from "@/components/landing/public-nav";
import { PublicFooter } from "@/components/landing/public-footer";

export const metadata: Metadata = {
  title: "Roadmap | Citewalk",
  description:
    "What we're building at Citewalk. See what's live, what's coming, and where we're headed.",
  alternates: {
    canonical: "https://citewalk.com/roadmap",
  },
};

export default async function RoadmapPage() {
  const token = (await cookies()).get("token")?.value;
  const isAuthenticated = !!token && token.length > 0;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">
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
                The Foundations
              </h2>
              <p className="text-[var(--tertiary)] mb-8 text-sm">Live now</p>

              <div className="grid gap-4">
                <div className="p-5 border border-[var(--divider)] bg-[#0F0F10] rounded hover:border-[var(--primary)] transition-colors">
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
                    to connect any post to topics, sources, or other writers.
                    Every link goes both ways.
                  </p>
                </div>
                <div className="p-5 border border-[var(--divider)] bg-[#0F0F10] rounded hover:border-[var(--primary)] transition-colors">
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
                    All data hosted in Europe. GDPR-compliant by design. Your
                    writing belongs to you, not the platform.
                  </p>
                </div>
                <div className="p-5 border border-[var(--divider)] bg-[#0F0F10] rounded hover:border-[var(--primary)] transition-colors">
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
                Growing the Network
              </h2>
              <p className="text-[var(--tertiary)] mb-8 text-sm">
                Coming in 2026
              </p>

              <div className="grid gap-4">
                <div className="p-5 border border-[var(--divider)] bg-[var(--background)] rounded opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[var(--foreground)]">
                      Link Archiving
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-amber-500 border border-amber-900/30 bg-amber-900/10 px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-amber-500" />
                      In progress
                    </span>
                  </div>
                  <p className="text-sm text-[var(--secondary)] leading-relaxed">
                    Automatic snapshots of external links via Internet Archive,
                    so your sources stay alive even if the original page
                    disappears.
                  </p>
                </div>
                <div className="p-5 border border-[var(--divider)] bg-[var(--background)] rounded opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[var(--foreground)]">
                      Fediverse Integration
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[var(--tertiary)] border border-[#333] /* divider-subtle */ bg-[var(--divider)] px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-[var(--tertiary)]" />
                      Planned
                    </span>
                  </div>
                  <p className="text-sm text-[var(--secondary)] leading-relaxed">
                    ActivityPub support so you can follow and be followed by
                    people on Mastodon, Bluesky bridges, and other open
                    platforms.
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Phase III */}
          <article className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 relative">
            <div className="hidden md:flex justify-end pr-8 pt-2 relative">
              <span className="text-xs font-mono text-[#333] /* divider-subtle */ uppercase tracking-widest">
                Phase III
              </span>
              <div className="absolute right-[-5px] top-[10px] w-2.5 h-2.5 rounded-full bg-[var(--background)] border-2 border-[#333] /* divider-subtle */ z-10" />
            </div>

            <div className="pl-6 md:pl-0 opacity-50">
              <div className="flex items-center gap-3 mb-6 md:hidden">
                <div className="w-2.5 h-2.5 rounded-full bg-[#333] /* divider-subtle */" />
                <span className="text-xs font-mono text-[#333] /* divider-subtle */ uppercase tracking-widest">
                  Phase III: On the Horizon
                </span>
              </div>

              <h2 className="text-2xl font-serif text-[var(--foreground)] mb-2">
                Smarter Connections
              </h2>
              <p className="text-[var(--tertiary)] mb-8 text-sm">Future</p>

              <div className="grid gap-4">
                <div className="p-5 border border-[var(--divider)] bg-[var(--background)] rounded">
                  <h3 className="font-medium text-[var(--foreground)] mb-2">
                    AI-powered discovery
                  </h3>
                  <p className="text-sm text-[var(--secondary)]">
                    Private, on-device AI that helps you find surprising
                    connections between ideas you&apos;ve written about.
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-24 pt-12 border-t border-[var(--divider)] bg-[#0F0F10] p-10 rounded border border-[var(--divider)]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">
                Contribute to the Codebase
              </h3>
              <p className="text-sm text-[var(--secondary)]">
                We&apos;re open to contributors. If you care about this,
                we&apos;d love your help.
              </p>
            </div>
            <a
              href="mailto:hello@citewalk.com"
              className="px-6 py-3 border border-[#333] /* divider-subtle */ text-[var(--foreground)] text-sm hover:bg-[var(--divider)] transition-colors rounded"
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
