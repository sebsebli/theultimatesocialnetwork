import { cookies } from "next/headers";
import type { Metadata } from "next";
import { PublicNav } from "@/components/landing/public-nav";
import { PublicFooter } from "@/components/landing/public-footer";

export const metadata: Metadata = {
  title: "Roadmap | Citewalk",
  description:
    "The future of Citewalk. Active development status and master plan.",
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
            Master Plan
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-medium text-[var(--foreground)] mb-6 tracking-tight">
              Evolution
            </h1>
            <p className="text-lg text-[var(--secondary)] font-light leading-relaxed max-w-2xl">
              We are building a 100-year platform. This document outlines the
              trajectory of the protocol. We think in eras, not versions.
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
                Era I
              </span>
              <div className="absolute right-[-5px] top-[10px] w-2.5 h-2.5 rounded-full bg-[var(--background)] border-2 border-emerald-500 z-10" />
            </div>

            <div className="pl-6 md:pl-0">
              <div className="flex items-center gap-3 mb-6 md:hidden">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest">
                  Era I: The Archive
                </span>
              </div>

              <h2 className="text-2xl font-serif text-[var(--foreground)] mb-2">
                The Archive
              </h2>
              <p className="text-[var(--tertiary)] mb-8 text-sm">
                Establishing Truth (Current)
              </p>

              <div className="grid gap-4">
                <div className="p-5 border border-[var(--divider)] bg-[#0F0F10] rounded hover:border-[var(--primary)] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[var(--foreground)]">
                      Citation Protocol
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-500 border border-emerald-900/30 bg-emerald-900/10 px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      Live
                    </span>
                  </div>
                  <p className="text-sm text-[var(--secondary)] leading-relaxed">
                    The core graph engine.{" "}
                    <span className="text-[var(--foreground)] font-mono text-xs">
                      [[citelinks]]
                    </span>{" "}
                    allow bidirectional connection between all nodes.
                  </p>
                </div>
                <div className="p-5 border border-[var(--divider)] bg-[#0F0F10] rounded hover:border-[var(--primary)] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[var(--foreground)]">
                      Sovereign Infrastructure
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-500 border border-emerald-900/30 bg-emerald-900/10 px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      Live
                    </span>
                  </div>
                  <p className="text-sm text-[var(--secondary)] leading-relaxed">
                    EU-only hosting (Hetzner). Full GDPR compliance. Data is
                    owned by the author, not the platform.
                  </p>
                </div>
                <div className="p-5 border border-[var(--divider)] bg-[#0F0F10] rounded hover:border-[var(--primary)] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[var(--foreground)]">
                      Anti-Dopamine Metrics
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-500 border border-emerald-900/30 bg-emerald-900/10 px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      Live
                    </span>
                  </div>
                  <p className="text-sm text-[var(--secondary)] leading-relaxed">
                    Like counts are private. We optimize for comprehension, not
                    addiction.
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Phase II */}
          <article className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 relative">
            <div className="hidden md:flex justify-end pr-8 pt-2 relative">
              <span className="text-xs font-mono text-[var(--primary)] uppercase tracking-widest">
                Era II
              </span>
              <div className="absolute right-[-5px] top-[10px] w-2.5 h-2.5 rounded-full bg-[var(--background)] border-2 border-[var(--primary)] z-10" />
            </div>

            <div className="pl-6 md:pl-0">
              <div className="flex items-center gap-3 mb-6 md:hidden">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
                <span className="text-xs font-mono text-[var(--primary)] uppercase tracking-widest">
                  Era II: The Society
                </span>
              </div>

              <h2 className="text-2xl font-serif text-[var(--foreground)] mb-2">
                The Society
              </h2>
              <p className="text-[var(--tertiary)] mb-8 text-sm">
                Expansion (2026)
              </p>

              <div className="grid gap-4">
                <div className="p-5 border border-[var(--divider)] bg-[var(--background)] rounded opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[var(--foreground)]">
                      Context Preservation
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-amber-500 border border-amber-900/30 bg-amber-900/10 px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-amber-500" />
                      In progress
                    </span>
                  </div>
                  <p className="text-sm text-[var(--secondary)] leading-relaxed">
                    Integration with Internet Archive. We automatically snapshot
                    external links to prevent history from rotting.
                  </p>
                </div>
                <div className="p-5 border border-[var(--divider)] bg-[var(--background)] rounded opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[var(--foreground)]">
                      Open Federation
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[var(--tertiary)] border border-[#333] /* divider-subtle */ bg-[var(--divider)] px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-[var(--tertiary)]" />
                      Planned
                    </span>
                  </div>
                  <p className="text-sm text-[var(--secondary)] leading-relaxed">
                    ActivityPub compatibility. Citewalk will become a node in the
                    open Fediverse, allowing you to follow anyone, anywhere.
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Phase III */}
          <article className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 relative">
            <div className="hidden md:flex justify-end pr-8 pt-2 relative">
              <span className="text-xs font-mono text-[#333] /* divider-subtle */ uppercase tracking-widest">
                Era III
              </span>
              <div className="absolute right-[-5px] top-[10px] w-2.5 h-2.5 rounded-full bg-[var(--background)] border-2 border-[#333] /* divider-subtle */ z-10" />
            </div>

            <div className="pl-6 md:pl-0 opacity-50">
              <div className="flex items-center gap-3 mb-6 md:hidden">
                <div className="w-2.5 h-2.5 rounded-full bg-[#333] /* divider-subtle */" />
                <span className="text-xs font-mono text-[#333] /* divider-subtle */ uppercase tracking-widest">
                  Era III: The Intelligence
                </span>
              </div>

              <h2 className="text-2xl font-serif text-[var(--foreground)] mb-2">
                The Intelligence
              </h2>
              <p className="text-[var(--tertiary)] mb-8 text-sm">Synthesis (Future)</p>

              <div className="grid gap-4">
                <div className="p-5 border border-[var(--divider)] bg-[var(--background)] rounded">
                  <h3 className="font-medium text-[var(--foreground)] mb-2">
                    Semantic Synthesis
                  </h3>
                  <p className="text-sm text-[var(--secondary)]">
                    Local-first AI that helps you find connections between
                    disparate ideas in your graph.
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
                We are open to contributors. Help us build the protocol.
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
