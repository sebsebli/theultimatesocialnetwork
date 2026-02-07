"use client";

import Link from "next/link";
import Image from "next/image";
import { MdArrowForward } from "react-icons/md";
import { useBetaMode } from "@/context/beta-mode-provider";
import { GraphBackground } from "./landing/graph-background";
import { HeroAnimation } from "./landing/hero-animation";
import { PostPreview } from "./landing/post-preview";
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

      <main id="main-content" className="relative z-10 pt-24 pb-20">
        {/* Hero Section */}
        <section className="px-6 md:px-12 max-w-[1400px] mx-auto min-h-[80vh] flex flex-col md:flex-row items-center gap-16 md:gap-8">
          <div className="flex-1 space-y-8 md:pr-12">
            {betaMode && (
              <div className="inline-flex items-center gap-3 px-3 py-1 border border-[var(--primary)]/30 rounded-full bg-[var(--background)]/50 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs text-[var(--secondary)]">
                  Early Access
                </span>
              </div>
            )}

            <span className="text-xs font-mono text-[var(--secondary)] uppercase tracking-widest">
              A new kind of social network
            </span>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-tight text-[var(--foreground)] !mt-4">
              Write something<br />
              <span className="text-[var(--primary)]">
                worth citing.
              </span>
            </h1>

            <p className="text-base text-[var(--foreground)]/80 max-w-lg leading-relaxed">
              On most platforms, the loudest voice wins. Citewalk works
              differently. Every post can cite other posts, creating a
              visible web of ideas that readers can trace and explore.
              Your writing reaches people through topics, not algorithms —
              and the work that endures is the work others build on.
            </p>

            <p className="text-lg md:text-xl text-[var(--secondary)] font-light max-w-lg leading-relaxed border-l border-[var(--divider)] pl-6">
              No ads. No algorithmic feed. No data sales. Independent,
              EU-hosted, and community-funded.
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
                className="inline-flex items-center justify-center px-8 py-4 border border-[var(--divider)] text-[var(--secondary)] font-medium text-sm tracking-wide hover:border-[var(--primary)] hover:text-[var(--foreground)] transition-colors rounded"
              >
                Read our manifesto
              </Link>
            </div>
          </div>

          <div className="flex-1 w-full max-w-2xl md:max-w-none relative">
            <div className="absolute -inset-10 bg-gradient-to-tr from-[var(--primary)]/10 to-transparent blur-3xl rounded-full pointer-events-none" />
            <HeroAnimation />
          </div>
        </section>

        {/* Non-negotiable principles */}
        <section className="px-6 md:px-12 max-w-[1400px] mx-auto py-16 border-b border-[var(--divider)]">
          <div className="text-center mb-8">
            <span className="text-xs font-mono text-[var(--primary)] uppercase tracking-widest">
              Non-negotiable
            </span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 text-center">
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-serif font-medium text-[var(--foreground)]">
                Zero
              </span>
              <span className="text-xs text-[var(--tertiary)] uppercase tracking-widest">
                Ads Forever
              </span>
            </div>
            <div className="hidden md:block w-px h-12 bg-[var(--divider)]" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-serif font-medium text-[var(--foreground)]">
                100%
              </span>
              <span className="text-xs text-[var(--tertiary)] uppercase tracking-widest">
                EU-Hosted
              </span>
            </div>
            <div className="hidden md:block w-px h-12 bg-[var(--divider)]" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-serif font-medium text-[var(--foreground)]">
                Full
              </span>
              <span className="text-xs text-[var(--tertiary)] uppercase tracking-widest">
                Data Portability
              </span>
            </div>
            <div className="hidden md:block w-px h-12 bg-[var(--divider)]" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-serif font-medium text-[var(--foreground)]">
                No
              </span>
              <span className="text-xs text-[var(--tertiary)] uppercase tracking-widest">
                Behavioral Tracking
              </span>
            </div>
          </div>
        </section>

        {/* What is Citewalk — concrete product description */}
        <section className="px-6 md:px-12 max-w-[800px] mx-auto py-24 md:py-32">
          <div className="text-center mb-12">
            <h2 className="text-xs font-mono text-[var(--primary)] uppercase tracking-widest mb-4">
              What is Citewalk
            </h2>
            <h3 className="text-3xl font-serif text-[var(--foreground)]">
              A social network for connected thinking
            </h3>
          </div>
          <div className="text-[var(--secondary)] text-sm leading-relaxed space-y-4 max-w-[680px] mx-auto">
            <p>
              Most social platforms treat your posts as disposable — content
              to scroll past, react to, and forget. Citewalk treats them as
              contributions to a growing body of knowledge. When you write
              something, it stays discoverable. When someone references your
              work, both posts become part of a visible chain that any reader
              can follow.
            </p>
            <p>
              You write in a clean editor that supports markdown, images, and
              embedded media. Tag your posts with{" "}
              <span className="text-[var(--topic)]">[[topics]]</span> to
              reach the people who care about that subject. Reference other
              posts with{" "}
              <span className="text-[var(--topic)]">[[citelinks]]</span> to
              show what you&apos;re building on. Over time, the network
              becomes a web of interconnected ideas — navigable, transparent,
              and entirely under your control.
            </p>
            <p>
              Your feed is chronological, built from the topics and people
              you follow. No behavioral profiling. No engagement optimization.
              No advertising. When you open Citewalk, you see what you asked
              to see.
            </p>
          </div>
        </section>

        <HowItWorks />

        {/* Post Example — shows what a real post looks like */}
        <section className="px-6 md:px-12 max-w-[680px] mx-auto py-20 md:py-28">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-[var(--foreground)] mb-3">
              This is what a post looks like
            </h2>
            <p className="text-[var(--secondary)] text-sm max-w-md mx-auto">
              Every post shows its sources and where the conversation goes next.
            </p>
          </div>
          <PostPreview />
        </section>

        {/* Features / Architecture */}
        <section className="px-6 md:px-12 max-w-[1400px] mx-auto py-32 md:py-48">
          <div className="grid md:grid-cols-3 gap-12 md:gap-px md:bg-[var(--divider)] border border-[var(--divider)]">
            {/* Card 1 — Citation */}
            <div className="bg-[var(--background)] p-10 md:p-12 group hover:bg-white/5 transition-colors relative">
              <span className="text-[10px] font-mono text-[var(--primary)] absolute top-6 right-6">
                01
              </span>
              <h3 className="text-2xl font-serif text-[var(--foreground)] mb-4 group-hover:text-[var(--primary)] transition-colors">
                Show your sources
              </h3>
              <p className="text-[var(--secondary)] leading-relaxed text-sm">
                Every post can reference other posts with visible{" "}
                <span className="text-[var(--topic)]">[[citelinks]]</span>.
                Readers trace claims back to their origins. Authors see who
                builds on their work. The ideas that get referenced most
                gain credibility — not the ones that provoke the strongest
                reaction.
              </p>
            </div>

            {/* Card 2 — Topics */}
            <div className="bg-[var(--background)] p-10 md:p-12 group hover:bg-white/5 transition-colors relative">
              <span className="text-[10px] font-mono text-[var(--primary)] absolute top-6 right-6">
                02
              </span>
              <h3 className="text-2xl font-serif text-[var(--foreground)] mb-4 group-hover:text-[var(--primary)] transition-colors">
                Reach people by subject, not status
              </h3>
              <p className="text-[var(--secondary)] leading-relaxed text-sm">
                Tag your post with{" "}
                <span className="text-[var(--topic)]">[[topics]]</span> and
                everyone following that subject sees it — ten followers or
                ten thousand. Your reach depends on what you write about,
                not how well you market yourself.
              </p>
            </div>

            {/* Card 3 — Knowledge graph */}
            <div className="bg-[var(--background)] p-10 md:p-12 group hover:bg-white/5 transition-colors relative">
              <span className="text-[10px] font-mono text-[var(--primary)] absolute top-6 right-6">
                03
              </span>
              <h3 className="text-2xl font-serif text-[var(--foreground)] mb-4 group-hover:text-[var(--primary)] transition-colors">
                Every connection is visible
              </h3>
              <p className="text-[var(--secondary)] leading-relaxed text-sm">
                Posts, topics, and citations form a graph you can explore.
                Trace any idea to its sources. See what others built on it.
                Nothing is hidden behind an algorithm — every path is open.
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
            &quot;What would a social network look like if it was designed
            to make you smarter — not more addicted?&quot;
          </blockquote>

          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-[var(--divider)] grayscale opacity-80">
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
              The problem was never the people. It was the structure.
              Platforms that reward reactions will always amplify outrage.
              So I designed a network around a different incentive: on
              Citewalk, your posts reach people through topics and
              chronological feeds — everyone gets seen. But the posts that
              endure are the ones others reference and build on. Over time,
              that changes what the whole network rewards.
            </p>
            <p>
              Citewalk is an independent European project — no venture
              capital, no growth hacks. Free to use, sustained by optional
              Pro subscriptions. If that resonates, come write with us.
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
