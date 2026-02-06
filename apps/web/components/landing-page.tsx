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
                <span className="text-xs text-[var(--secondary)]">Early Access</span>
              </div>
            )}

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium leading-[0.95] tracking-tight text-[var(--foreground)] font-sans">
              Write ideas <br />
              <span className="font-serif italic text-[var(--primary)]">
                that last.
              </span>
            </h1>

            <p className="text-base font-medium text-[var(--foreground)]/80 max-w-lg">
              A social network where your reputation grows through citations, not clicks.
            </p>

            <p className="text-lg md:text-xl text-[var(--secondary)] font-light max-w-lg leading-relaxed border-l border-[#333] /* divider-subtle */ pl-6">
              Every post you write becomes a permanent node in a knowledge graph.
              Others can cite your ideas, building a web of verifiable trust
              that grows over time.
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
                Read the Manifesto
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
                Knowledge Graph
              </h3>
              <p className="text-[var(--secondary)] leading-relaxed text-sm">
                Every post connects to topics and other posts through{" "}
                <span className="text-[var(--foreground)] font-mono text-xs bg-[var(--divider)] px-1 rounded">
                  [[citelinks]]
                </span>
                . Your ideas don&apos;t disappear into a feed — they become permanent landmarks in a shared knowledge graph.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[var(--background)] p-10 md:p-12 group hover:bg-[#0F0F10] transition-colors relative">
              <span className="text-[10px] font-mono text-[var(--primary)] absolute top-6 right-6">
                02
              </span>
              <h3 className="text-2xl font-serif text-[var(--foreground)] mb-4 group-hover:text-[var(--primary)] transition-colors">
                Citation Authority
              </h3>
              <p className="text-[var(--secondary)] leading-relaxed text-sm">
                Your reputation grows when other writers cite your work. Not through likes or follower counts, but through genuine intellectual credit.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[var(--background)] p-10 md:p-12 group hover:bg-[#0F0F10] transition-colors relative">
              <span className="text-[10px] font-mono text-[var(--primary)] absolute top-6 right-6">
                03
              </span>
              <h3 className="text-2xl font-serif text-[var(--foreground)] mb-4 group-hover:text-[var(--primary)] transition-colors">
                Preserved Sources
              </h3>
              <p className="text-[var(--secondary)] leading-relaxed text-sm">
                Every external link you cite is automatically archived. Sources are preserved so the web of knowledge can&apos;t be broken by link rot.
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
            &quot;We don&apos;t have followers.<br />
            We have readers.&quot;
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
              <div className="text-sm font-bold text-[var(--foreground)]">Sebastian</div>
              <div className="text-xs text-[var(--tertiary)] mt-1">Founder</div>
            </div>
          </div>

          <div className="mt-16 max-w-lg mx-auto text-sm text-[var(--tertiary)] leading-relaxed space-y-4 border-t border-[var(--divider)] pt-8">
            <p>
              Citewalk is an independent project built in Europe. I&apos;m always
              looking for feedback and early supporters to shape what comes next.
            </p>
            <p>
              The core experience is free and always will be. Some premium features
              may be added in the future to sustain the project.
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
