"use client";

import Link from "next/link";
import Image from "next/image";
import { MdArrowForward } from "react-icons/md";
import { useBetaMode } from "@/context/beta-mode-provider";
import { GraphBackground } from "./landing/graph-background";
import { EditorDemo } from "./landing/editor-demo";
import { HowItWorks } from "./landing/how-it-works";
import { ComparisonTable } from "./landing/comparison-table";
import { UserBenefits } from "./landing/user-benefits";
import { PublicNav } from "./landing/public-nav";
import { PublicFooter } from "./landing/public-footer";

interface LandingPageProps {
  isAuthenticated?: boolean;
}

export function LandingPage({ isAuthenticated }: LandingPageProps) {
  const { betaMode } = useBetaMode();

  const ctaHref = isAuthenticated
    ? "/home"
    : betaMode
      ? "/waiting-list"
      : "/sign-in";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans selection:bg-[var(--foreground)] selection:text-[var(--background)] overflow-x-hidden relative">
      <GraphBackground />

      {/* Subtle grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, var(--primary) 1px, transparent 1px),
          linear-gradient(to bottom, var(--primary) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <PublicNav isAuthenticated={isAuthenticated} />

      <main id="main-content" className="relative z-10 pt-32 pb-20">
        {/* Hero Section */}
        <section className="px-6 md:px-12 max-w-[1400px] mx-auto min-h-[80vh] flex flex-col md:flex-row items-center gap-16 md:gap-8">
          <div className="flex-1 space-y-8 md:pr-12">
            {betaMode && (
              <div className="inline-flex items-center gap-3 px-3 py-1 border border-[var(--primary)]/30 rounded-full bg-[#0F0F10]/50 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs text-[var(--secondary)]">
                  Early Access
                </span>
              </div>
            )}

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium leading-[0.95] tracking-tight text-[var(--foreground)] font-sans">
              Social media, <br />
              <span className="font-serif italic text-[var(--primary)]">
                without the noise.
              </span>
            </h1>

            <p className="text-base font-medium text-[var(--foreground)]/80 max-w-lg">
              The European alternative to algorithm-driven platforms. No rage
              feeds. No engagement tricks. Just your ideas, seen by people who
              care.
            </p>

            <p className="text-lg md:text-xl text-[var(--secondary)] font-light max-w-lg leading-relaxed border-l border-[#333] /* divider-subtle */ pl-6">
              On other platforms, the loudest voices win. Here, the best writing
              does. Independent, EU-hosted, and built to last.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Link
                href={ctaHref}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[var(--foreground)] text-[var(--background)] font-semibold text-sm tracking-wide hover:bg-white transition-all rounded"
              >
                {isAuthenticated ? "Open Citewalk" : "Get Started"}
                <MdArrowForward className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/manifesto"
                className="inline-flex items-center justify-center px-8 py-4 border border-[#333] /* divider-subtle */ text-[var(--secondary)] font-medium text-sm tracking-wide hover:border-[var(--primary)] hover:text-[var(--foreground)] transition-colors rounded"
              >
                Why we built this
              </Link>
            </div>
          </div>

          <div className="flex-1 w-full max-w-xl md:max-w-none relative">
            <div className="absolute -inset-10 bg-gradient-to-tr from-[var(--primary)]/10 to-transparent blur-3xl rounded-full pointer-events-none" />
            <EditorDemo />
          </div>
        </section>

        <HowItWorks />

        {/* Features / Architecture */}
        <section className="px-6 md:px-12 max-w-[1400px] mx-auto py-32 md:py-48">
          <div className="grid md:grid-cols-3 gap-12 md:gap-px md:bg-[var(--divider)] border border-[var(--divider)]">
            {/* Card 1 */}
            <div className="bg-[var(--background)] p-10 md:p-12 group hover:bg-[#0F0F10] transition-colors relative">
              <span className="text-[10px] font-mono text-[var(--primary)] absolute top-6 right-6">
                01
              </span>
              <h3 className="text-2xl font-serif text-[var(--foreground)] mb-4 group-hover:text-[var(--primary)] transition-colors">
                No Algorithm, No Gatekeepers
              </h3>
              <p className="text-[var(--secondary)] leading-relaxed text-sm">
                Your content isn&apos;t buried by an algorithm or boosted by
                outrage. Everything is chronological, connected by topic, and
                discoverable on its own merit.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[var(--background)] p-10 md:p-12 group hover:bg-[#0F0F10] transition-colors relative">
              <span className="text-[10px] font-mono text-[var(--primary)] absolute top-6 right-6">
                02
              </span>
              <h3 className="text-2xl font-serif text-[var(--foreground)] mb-4 group-hover:text-[var(--primary)] transition-colors">
                Quality Over Volume
              </h3>
              <p className="text-[var(--secondary)] leading-relaxed text-sm">
                Your visibility grows when people reference your work — not when
                you post the most or provoke the hardest. Real credibility,
                earned by substance.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[var(--background)] p-10 md:p-12 group hover:bg-[#0F0F10] transition-colors relative">
              <span className="text-[10px] font-mono text-[var(--primary)] absolute top-6 right-6">
                03
              </span>
              <h3 className="text-2xl font-serif text-[var(--foreground)] mb-4 group-hover:text-[var(--primary)] transition-colors">
                European &amp; Independent
              </h3>
              <p className="text-[var(--secondary)] leading-relaxed text-sm">
                100% EU-hosted. No ads, no tracking, no selling your data. Built
                in Europe as a genuine alternative — not another Silicon Valley
                product with a European flag on it.
              </p>
            </div>
          </div>
        </section>

        <UserBenefits />

        <ComparisonTable />

        {/* The Founder / Vision */}
        <section className="px-6 md:px-12 max-w-[1000px] mx-auto py-20 md:py-32 text-center">
          <div className="w-px h-24 bg-gradient-to-b from-transparent via-[var(--primary)] to-transparent mx-auto mb-12 opacity-50"></div>

          <blockquote className="text-2xl md:text-4xl font-serif font-light text-[var(--foreground)] leading-tight mb-12">
            &quot;The internet doesn&apos;t need another feed.
            <br />
            It needs a better one.&quot;
          </blockquote>

          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-[#333] /* divider-subtle */ grayscale opacity-80">
              <Image
                src="/sebastianlindner.jpeg"
                alt="Sebastian"
                width={64}
                height={64}
              />
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-[var(--foreground)]">
                Sebastian
              </div>
              <div className="text-xs text-[var(--tertiary)] mt-1">Founder</div>
            </div>
          </div>

          <div className="mt-16 max-w-lg mx-auto text-sm text-[var(--tertiary)] leading-relaxed space-y-4 border-t border-[var(--divider)] pt-8">
            <p>
              I built Citewalk because I was tired of platforms that reward
              outrage over substance. This is an independent European project —
              no VC money, no growth hacks, just a better place to share ideas.
            </p>
            <p>
              The core experience is free and always will be. I&apos;m looking
              for early supporters who want to help shape what comes next.
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
