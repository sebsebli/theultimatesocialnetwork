import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roadmap | Citewalk",
  description: "The future of Citewalk. See what we are building.",
  alternates: {
    canonical: "https://citewalk.com/roadmap",
  },
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F2F2F2]">
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center px-6 py-6 md:px-12 bg-[#0B0B0C]/90 backdrop-blur-md border-b border-[#1A1A1D]">
        <Link
          href="/"
          className="text-sm font-medium text-[#A8A8AA] hover:text-[#F2F2F2] transition-colors"
        >
          &larr; Back to Home
        </Link>
      </nav>

      <main className="max-w-[800px] mx-auto pt-40 pb-20 px-6">
        <header className="mb-20">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#6E7A8A] mb-4 block opacity-80">
            Building in Public
          </span>
          <h1 className="text-5xl md:text-6xl font-serif font-normal text-[#F2F2F2] mb-8">
            The Master Plan
          </h1>
          <p className="text-xl text-[#A8A8AA] font-light leading-relaxed max-w-2xl">
            We are building a 100-year platform. This is our current trajectory
            for the next 12 months.
          </p>
        </header>

        <div className="space-y-20">
          {/* Shipping Now */}
          <article>
            <div className="flex items-baseline gap-4 mb-10 border-b border-[#1A1A1D] pb-4">
              <h2 className="text-2xl font-serif text-[#F2F2F2]">
                Phase I: Foundation
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-900/30 text-emerald-400 font-mono uppercase tracking-widest border border-emerald-900/50">
                Live Now
              </span>
            </div>
            <ul className="grid gap-8">
              <li className="group">
                <h3 className="text-xl font-medium text-[#F2F2F2] mb-3 group-hover:text-[#6E7A8A] transition-colors">
                  The Citation Graph
                </h3>
                <p className="text-[#A8A8AA] leading-relaxed">
                  The core protocol is active. Posts can reference other posts,
                  creating a bidirectional graph of knowledge. Citations count
                  as the primary metric of authority.
                </p>
              </li>
              <li className="group">
                <h3 className="text-xl font-medium text-[#F2F2F2] mb-3 group-hover:text-[#6E7A8A] transition-colors">
                  Sovereign Infrastructure
                </h3>
                <p className="text-[#A8A8AA] leading-relaxed">
                  Fully operational European hosting environment. Primary data
                  centers in Falkenstein (DE) and Helsinki (FI). Full GDPR
                  compliance and data export capabilities.
                </p>
              </li>
              <li className="group">
                <h3 className="text-xl font-medium text-[#F2F2F2] mb-3 group-hover:text-[#6E7A8A] transition-colors">
                  Private Metrics
                </h3>
                <p className="text-[#A8A8AA] leading-relaxed">
                  The &quot;Anti-Dopamine&quot; engine is live. Like counts are
                  strictly private to the author. No public popularity contests
                  to distort the discourse.
                </p>
              </li>
              <li className="group">
                <h3 className="text-xl font-medium text-[#F2F2F2] mb-3 group-hover:text-[#6E7A8A] transition-colors">
                  Native Mobile Apps
                </h3>
                <p className="text-[#A8A8AA] leading-relaxed">
                  iOS and Android apps available for beta testers. Focused on
                  speed, reading clarity, and offline-first drafting.
                </p>
              </li>
            </ul>
          </article>

          {/* Up Next */}
          <article>
            <div className="flex items-baseline gap-4 mb-10 border-b border-[#1A1A1D] pb-4">
              <h2 className="text-2xl font-serif text-[#F2F2F2]">
                Phase II: Connection
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] bg-[#1A1A1D] text-[#A8A8AA] font-mono uppercase tracking-widest border border-[#333]">
                Q1-Q2 2026
              </span>
            </div>
            <ul className="grid gap-8">
              <li className="group">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-medium text-[#F2F2F2]">
                    Link Rot Prevention
                  </h3>
                </div>
                <p className="text-[#A8A8AA] leading-relaxed">
                  Deep integration with the Internet Archive. When you cite an
                  external source, Citewalk will automatically trigger a
                  snapshot, ensuring your context never 404s.
                </p>
              </li>
              <li className="group">
                <h3 className="text-xl font-medium text-[#F2F2F2] mb-3">
                  Collaborative Collections
                </h3>
                <p className="text-[#A8A8AA] leading-relaxed">
                  Curate the web together. Build shared reading lists, research
                  libraries, and topic guides. Public or private.
                </p>
              </li>
              <li className="group">
                <h3 className="text-xl font-medium text-[#F2F2F2] mb-3">
                  Open Federation
                </h3>
                <p className="text-[#A8A8AA] leading-relaxed">
                  Initial steps towards ActivityPub compatibility. We believe
                  Citewalk should be a node in the wider Fediverse, not a walled
                  garden.
                </p>
              </li>
            </ul>
          </article>

          {/* Future */}
          <article>
            <div className="flex items-baseline gap-4 mb-10 border-b border-[#1A1A1D] pb-4">
              <h2 className="text-2xl font-serif text-[#6E6E73]">
                Phase III: The Library
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] bg-transparent text-[#6E6E73] font-mono uppercase tracking-widest border border-[#1A1A1D]">
                Research
              </span>
            </div>
            <ul className="grid gap-8 opacity-70 hover:opacity-100 transition-opacity">
              <li>
                <h3 className="text-xl font-medium text-[#A8A8AA] mb-3">
                  Semantic Search
                </h3>
                <p className="text-[#6E6E73] leading-relaxed">
                  Moving beyond keywords. Finding connections between ideas
                  using local-first LLMs that respect your privacy.
                </p>
              </li>
              <li>
                <h3 className="text-xl font-medium text-[#A8A8AA] mb-3">
                  Protocol API
                </h3>
                <p className="text-[#6E6E73] leading-relaxed">
                  Allowing third-party clients to build entirely new interfaces
                  on top of the Citewalk graph.
                </p>
              </li>
            </ul>
          </article>
        </div>

        <div className="mt-24 pt-12 border-t border-[#1A1A1D] text-center bg-[#0F0F10] rounded-2xl p-10 border border-[#1A1A1D]">
          <h3 className="text-2xl font-serif text-[#F2F2F2] mb-4">
            Join the Closed Beta
          </h3>
          <p className="text-[#A8A8AA] mb-8 font-light max-w-lg mx-auto">
            We are a small, independent team. We don&apos;t have a marketing
            budget. We rely on people like you to spread the word.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="mailto:hello@citewalk.com"
              className="px-8 py-3 bg-[#F2F2F2] text-[#0B0B0C] font-semibold rounded-full hover:bg-white transition-colors"
            >
              Contact Dr. Lindner
            </a>
            <Link
              href="/sign-in"
              className="px-8 py-3 border border-[#333] text-[#A8A8AA] font-medium rounded-full hover:border-[#666] hover:text-[#F2F2F2] transition-colors"
            >
              Become a Beta Tester
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
