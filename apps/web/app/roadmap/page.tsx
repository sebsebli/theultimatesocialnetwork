import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Engineering Roadmap | Citewalk",
  description:
    "The future of Citewalk. Active development status and master plan.",
  alternates: {
    canonical: "https://citewalk.com/roadmap",
  },
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F2F2F2] font-sans">
      {/* Header */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 bg-[#0B0B0C]/90 backdrop-blur border-b border-[#1A1A1D]">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#A8A8AA] hover:text-[#F2F2F2] transition-colors"
        >
          <Image
            src="/icon.png"
            alt="Citewalk"
            width={20}
            height={20}
            className="w-5 h-5 rounded opacity-80"
          />
          <span>&larr; Return to Index</span>
        </Link>
        <div className="text-[10px] font-mono text-[#6E6E73] uppercase tracking-widest">
          STATUS: ACTIVE DEPLOYMENT
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-32 pb-20 px-6">
        <header className="mb-20 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
          <div className="text-xs font-mono text-[#6E7A8A] uppercase tracking-widest pt-2">
            Master Plan
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-medium text-[#F2F2F2] mb-6 tracking-tight">
              Evolution
            </h1>
            <p className="text-lg text-[#A8A8AA] font-light leading-relaxed max-w-2xl">
              We are building a 100-year platform. This document outlines the
              trajectory of the protocol. We think in eras, not versions.
            </p>
          </div>
        </header>

        <div className="space-y-16 relative">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-4 bottom-0 w-px bg-[#1A1A1D] md:left-[207px]" />

          {/* Phase I */}
          <article className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 relative group">
            {/* Status Dot */}
            <div className="hidden md:flex justify-end pr-8 pt-2 relative">
              <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest">
                Era I
              </span>
              <div className="absolute right-[-5px] top-[10px] w-2.5 h-2.5 rounded-full bg-[#0B0B0C] border-2 border-emerald-500 z-10" />
            </div>

            <div className="pl-6 md:pl-0">
              <div className="flex items-center gap-3 mb-6 md:hidden">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest">
                  Era I: The Archive
                </span>
              </div>

              <h2 className="text-2xl font-serif text-[#F2F2F2] mb-2">
                The Archive
              </h2>
              <p className="text-[#6E6E73] mb-8 text-sm">
                Establishing Truth (Current)
              </p>

              <div className="grid gap-4">
                {/* Ticket */}
                <div className="p-5 border border-[#1A1A1D] bg-[#0F0F10] rounded hover:border-[#6E7A8A] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[#F2F2F2]">
                      Citation Protocol
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-500 border border-emerald-900/30 bg-emerald-900/10 px-1.5 py-0.5 rounded">
                      DEPLOYED
                    </span>
                  </div>
                  <p className="text-sm text-[#A8A8AA] leading-relaxed">
                    The core graph engine.{" "}
                    <span className="text-[#F2F2F2] font-mono text-xs">
                      [[citelinks]]
                    </span>{" "}
                    allow bidirectional connection between all nodes.
                  </p>
                </div>
                {/* Ticket */}
                <div className="p-5 border border-[#1A1A1D] bg-[#0F0F10] rounded hover:border-[#6E7A8A] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[#F2F2F2]">
                      Sovereign Infrastructure
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-500 border border-emerald-900/30 bg-emerald-900/10 px-1.5 py-0.5 rounded">
                      DEPLOYED
                    </span>
                  </div>
                  <p className="text-sm text-[#A8A8AA] leading-relaxed">
                    EU-only hosting (Hetzner). Full GDPR compliance. Data is
                    owned by the author, not the platform.
                  </p>
                </div>
                {/* Ticket */}
                <div className="p-5 border border-[#1A1A1D] bg-[#0F0F10] rounded hover:border-[#6E7A8A] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[#F2F2F2]">
                      Anti-Dopamine Metrics
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-500 border border-emerald-900/30 bg-emerald-900/10 px-1.5 py-0.5 rounded">
                      DEPLOYED
                    </span>
                  </div>
                  <p className="text-sm text-[#A8A8AA] leading-relaxed">
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
              <span className="text-xs font-mono text-[#6E7A8A] uppercase tracking-widest">
                Era II
              </span>
              <div className="absolute right-[-5px] top-[10px] w-2.5 h-2.5 rounded-full bg-[#0B0B0C] border-2 border-[#6E7A8A] z-10" />
            </div>

            <div className="pl-6 md:pl-0">
              <div className="flex items-center gap-3 mb-6 md:hidden">
                <div className="w-2.5 h-2.5 rounded-full bg-[#6E7A8A]" />
                <span className="text-xs font-mono text-[#6E7A8A] uppercase tracking-widest">
                  Era II: The Society
                </span>
              </div>

              <h2 className="text-2xl font-serif text-[#F2F2F2] mb-2">
                The Society
              </h2>
              <p className="text-[#6E6E73] mb-8 text-sm">
                Expansion (Q1-Q2 2026)
              </p>

              <div className="grid gap-4">
                {/* Ticket */}
                <div className="p-5 border border-[#1A1A1D] bg-[#0B0B0C] rounded opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[#F2F2F2]">
                      Context Preservation
                    </h3>
                    <span className="text-[10px] font-mono text-amber-500 border border-amber-900/30 bg-amber-900/10 px-1.5 py-0.5 rounded">
                      IN DEV
                    </span>
                  </div>
                  <p className="text-sm text-[#A8A8AA] leading-relaxed">
                    Integration with Internet Archive. We automatically snapshot
                    external links to prevent history from rotting.
                  </p>
                </div>
                {/* Ticket */}
                <div className="p-5 border border-[#1A1A1D] bg-[#0B0B0C] rounded opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[#F2F2F2]">
                      Open Federation
                    </h3>
                    <span className="text-[10px] font-mono text-[#6E6E73] border border-[#333] bg-[#1A1A1D] px-1.5 py-0.5 rounded">
                      PLANNED
                    </span>
                  </div>
                  <p className="text-sm text-[#A8A8AA] leading-relaxed">
                    ActivityPub compatibility. Citewalk will become a node in
                    the open Fediverse, allowing you to follow anyone, anywhere.
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Phase III */}
          <article className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 relative">
            <div className="hidden md:flex justify-end pr-8 pt-2 relative">
              <span className="text-xs font-mono text-[#333] uppercase tracking-widest">
                Era III
              </span>
              <div className="absolute right-[-5px] top-[10px] w-2.5 h-2.5 rounded-full bg-[#0B0B0C] border-2 border-[#333] z-10" />
            </div>

            <div className="pl-6 md:pl-0 opacity-50">
              <div className="flex items-center gap-3 mb-6 md:hidden">
                <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
                <span className="text-xs font-mono text-[#333] uppercase tracking-widest">
                  Era III: The Intelligence
                </span>
              </div>

              <h2 className="text-2xl font-serif text-[#F2F2F2] mb-2">
                The Intelligence
              </h2>
              <p className="text-[#6E6E73] mb-8 text-sm">Synthesis (Future)</p>

              <div className="grid gap-4">
                <div className="p-5 border border-[#1A1A1D] bg-[#0B0B0C] rounded">
                  <h3 className="font-medium text-[#F2F2F2] mb-2">
                    Semantic Synthesis
                  </h3>
                  <p className="text-sm text-[#A8A8AA]">
                    Local-first AI that helps you find connections between
                    disparate ideas in your graph.
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-24 pt-12 border-t border-[#1A1A1D] bg-[#0F0F10] p-10 rounded border border-[#1A1A1D]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-lg font-medium text-[#F2F2F2] mb-1">
                Contribute to the Codebase
              </h3>
              <p className="text-sm text-[#A8A8AA]">
                We are open to contributors. Help us build the protocol.
              </p>
            </div>
            <a
              href="mailto:hello@citewalk.com"
              className="px-6 py-3 border border-[#333] text-[#F2F2F2] text-sm font-mono uppercase tracking-wide hover:bg-[#1A1A1D] transition-colors"
            >
              Request Access
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
