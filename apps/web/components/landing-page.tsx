"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import {
  MdFavoriteBorder,
  MdChatBubbleOutline,
  MdFormatQuote,
  MdBookmarkBorder,
  MdAddCircleOutline,
  MdIosShare,
} from "react-icons/md";
import {
  hasCookieConsent,
  COOKIE_CONSENT_CLOSED_EVENT,
} from "@/components/cookie-consent-banner";
import { isBetaActive } from "@/lib/feature-flags";

function getConsentClosedInitial(): boolean {
  if (typeof window === "undefined") return false;
  return hasCookieConsent();
}

export function LandingPage() {
  const [consentClosed, setConsentClosed] = useState(getConsentClosedInitial);

  useEffect(() => {
    const onConsentClosed = () => setConsentClosed(true);
    window.addEventListener(COOKIE_CONSENT_CLOSED_EVENT, onConsentClosed);
    return () =>
      window.removeEventListener(COOKIE_CONSENT_CLOSED_EVENT, onConsentClosed);
  }, []);

  return (
    <div className="min-h-screen bg-ink text-paper font-sans selection:bg-paper selection:text-ink overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 flex justify-between items-center px-6 py-4 md:px-12 bg-ink/95 backdrop-blur-sm border-b border-divider" aria-label="Main">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/icon-192.png"
            alt="Citewalk"
            width={28}
            height={28}
            className="rounded-md opacity-90 group-hover:opacity-100 transition-opacity grayscale"
          />
          <span className="text-base font-medium tracking-tight text-paper">
            Citewalk
          </span>
        </Link>

        <div className="flex items-center gap-6 md:gap-8 text-sm font-medium text-secondary">
          <Link
            href="/manifesto"
            className="hidden md:block hover:text-paper transition-colors"
          >
            Manifesto
          </Link>
          <Link
            href="/roadmap"
            className="hidden md:block hover:text-paper transition-colors"
          >
            Roadmap
          </Link>
          <Link
            href="/sign-in"
            className="text-paper hover:text-white transition-colors"
          >
            Login
          </Link>
        </div>
      </nav>

      <main id="main-content" className="pt-32 md:pt-40 lg:pt-48 pb-20 md:pb-24" role="main">
        {/* Hero Section */}
        <section className="px-6 md:px-12 lg:px-16 max-w-[1000px] lg:max-w-[1100px] mx-auto mb-24 md:mb-32 lg:mb-48">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 md:mb-8 border border-divider rounded-full bg-transparent">
              <span className="w-1.5 h-1.5 rounded-full bg-paper"></span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-paper font-bold">
                {isBetaActive
                  ? "Closed Beta — Open Beta Soon"
                  : "Open Beta"}
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium leading-[1.0] tracking-tight text-paper mb-8 md:mb-10 font-sans">
              The internet was designed <br className="hidden md:block" />
              <span className="text-tertiary">to be a library.</span>
            </h1>

            <div className="max-w-2xl lg:max-w-3xl space-y-6 md:space-y-8">
              <p className="text-xl md:text-2xl lg:text-[1.4rem] text-secondary leading-relaxed font-light">
                We are rebuilding the social web. Quiet. Verified. Yours. <br />
                A place to read, think, and connect without the noise.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                {consentClosed && (
                  <Link
                    href={isBetaActive ? "/waiting-list" : "/sign-in"}
                    className="inline-flex justify-center items-center px-8 py-3.5 bg-paper text-ink font-semibold text-base rounded-lg hover:bg-white transition-colors"
                  >
                    {isBetaActive
                      ? "Join the Waiting List"
                      : "Join the Network"}
                  </Link>
                )}
                <Link
                  href="/manifesto"
                  className="inline-flex justify-center items-center px-8 py-3.5 border border-divider text-secondary font-medium text-base rounded-lg hover:border-primary hover:text-paper transition-colors"
                >
                  Read the Plan
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 1. The Problem */}
        <section className="px-6 md:px-12 lg:px-16 max-w-[1200px] mx-auto mb-32 md:mb-40 border-t border-divider pt-20 md:pt-24">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 lg:gap-32 items-start">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-widest text-tertiary mb-6 md:mb-8">
                The Problem
              </h2>
              <h3 className="text-3xl md:text-4xl lg:text-[2.75rem] font-serif font-medium text-secondary mb-6 leading-tight">
                We are drowning in <span className="text-paper">Noise</span>.
              </h3>
            </div>
            <div className="prose prose-invert text-lg text-secondary leading-relaxed space-y-6">
              <p>
                Modern social platforms are optimized for addiction, not
                understanding. Algorithms prioritize outrage over accuracy and
                volume over value.
              </p>
              <p>
                We have lost the ability to think together. Conversations are
                fragmented across ephemeral feeds, and context is washed away by
                the next scroll.
              </p>
            </div>
          </div>
        </section>

        {/* 2. The Solution (Graph Mechanism Explained) */}
        <section className="px-6 md:px-12 lg:px-16 max-w-[1200px] mx-auto mb-32 md:mb-40">
          <div className="bg-white/[0.02] border border-divider rounded-3xl p-8 md:p-12 lg:p-20 relative overflow-hidden">
            <div className="relative z-10 max-w-3xl">
              <h2 className="text-xs font-mono uppercase tracking-widest text-tertiary mb-6 md:mb-8">
                The Solution
              </h2>
              <h3 className="text-4xl md:text-5xl lg:text-[3rem] font-serif font-medium text-paper mb-6 md:mb-8 leading-tight">
                The Knowledge Graph.
              </h3>
              <p className="text-xl text-secondary font-light leading-relaxed mb-12">
                Citewalk replaces the ephemeral feed with a persistent network
                of ideas. We call this structure the <strong>Graph</strong>.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="h-px w-full bg-divider mb-4"></div>
                <h4 className="text-paper font-medium text-lg">
                  1. Bidirectional Links
                </h4>
                <p className="text-secondary text-sm leading-relaxed">
                  When you mention a topic like{" "}
                  <span className="text-paper">[[Urbanism]]</span>, your post
                  doesn&apos;t just disappear. It attaches itself to that
                  topic&apos;s permanent page. Conversations become bridges.
                </p>
              </div>
              <div className="space-y-4">
                <div className="h-px w-full bg-divider mb-4"></div>
                <h4 className="text-paper font-medium text-lg">
                  2. Citations as Trust
                </h4>
                <p className="text-secondary text-sm leading-relaxed">
                  Influence isn&apos;t measured by likes. It&apos;s measured by
                  citations. When verified users reference your work, you gain
                  authority in that subject.
                </p>
              </div>
              <div className="space-y-4">
                <div className="h-px w-full bg-divider mb-4"></div>
                <h4 className="text-paper font-medium text-lg">
                  3. Context Preservation
                </h4>
                <p className="text-secondary text-sm leading-relaxed">
                  We automatically snapshot external links to the Internet
                  Archive. Ten years from now, your sources will still be valid.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. The Visual Experience (Corrected Mockup) */}
        <section className="px-6 md:px-12 max-w-[1000px] mx-auto mb-40">
          <div className="text-center mb-12">
            <h2 className="text-xs font-mono uppercase tracking-widest text-tertiary mb-4">
              The Interface
            </h2>
            <h3 className="text-3xl font-medium text-paper">
              Designed for Focus.
            </h3>
            <p className="text-secondary mt-4 max-w-lg mx-auto text-sm">
              We enforce a &quot;One Header Image&quot; policy. No galleries, no
              carousels. Visuals support the text, they don&apos;t replace it.
            </p>
          </div>

          {/* Post mockup: matches mobile PostContent + PostItem (theme.ts, PostContent.tsx, PostItem.tsx) */}
          <div className="bg-ink border border-divider rounded-xl overflow-hidden shadow-2xl max-w-[400px] mx-auto">
            <div className="px-4 pt-4 pb-4 flex flex-col gap-3">
              {/* Author row — same as PostContent: 40px avatar, name, dot, time */}
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-[var(--divider)]">
                  <Image
                    src="/woman.jpg"
                    alt="Anna Weber"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center min-w-0 flex-1">
                  <span className="text-paper font-semibold text-sm truncate">
                    Anna Weber
                  </span>
                  <span
                    className="text-tertiary w-1 h-1 rounded-full bg-tertiary mx-1.5 flex-shrink-0"
                    aria-hidden
                  />
                  <span className="text-tertiary text-xs flex-shrink-0">
                    2h
                  </span>
                </div>
              </div>

              {/* Content block: header image (4:3) then body — same as PostContent */}
              <div className="flex flex-col gap-2">
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[var(--divider)] mt-0">
                  <Image
                    src="/copenhagen.jpg"
                    alt=""
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute left-0 right-0 bottom-0 py-3 px-0 bg-black/50">
                    <h4 className="text-[20px] font-bold leading-[26px] text-paper px-4">
                      The 15-Minute City Myth
                    </h4>
                  </div>
                </div>

                <div className="text-secondary text-[15px] leading-[22px] space-y-2 font-sans">
                  <p>
                    Critics often misunderstand the concept. It is not about
                    restriction, but about abundance. As{" "}
                    <span className="text-paper bg-[var(--divider)] px-1 rounded border border-divider">
                      @Carlos Moreno
                    </span>{" "}
                    argues, it is about regaining time.
                  </p>
                  <p>
                    I collected some examples from my recent trip to{" "}
                    <span className="text-paper bg-[var(--divider)] px-1 rounded border border-divider">
                      [[Copenhagen]]
                    </span>
                    .
                  </p>
                </div>
              </div>

              {/* Action row — same icons & styles as PostItem (MaterialIcons, 24px, tertiary) */}
              <div className="flex items-center justify-between pt-2 pr-4">
                <div className="flex items-center gap-0">
                  <span className="p-1 text-tertiary" aria-hidden>
                    <MdFavoriteBorder size={24} />
                  </span>
                  <span className="p-1 text-tertiary" aria-hidden>
                    <MdChatBubbleOutline size={24} />
                  </span>
                  <span className="p-1 text-tertiary" aria-hidden>
                    <MdFormatQuote size={24} />
                  </span>
                  <span className="p-1 text-tertiary" aria-hidden>
                    <MdBookmarkBorder size={24} />
                  </span>
                  <span className="p-1 text-tertiary" aria-hidden>
                    <MdAddCircleOutline size={24} />
                  </span>
                  <span className="p-1 text-tertiary" aria-hidden>
                    <MdIosShare size={24} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Role-Based Benefits */}
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto mb-40">
          <h2 className="text-xs font-mono uppercase tracking-widest text-tertiary mb-16 text-center border-b border-divider pb-4">
            Who is Citewalk for?
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="group">
              <h3 className="text-2xl font-serif text-paper mb-4 flex items-center gap-3">
                <span className="text-tertiary font-mono text-sm">01</span> For
                the Curious
              </h3>
              <p className="text-secondary leading-relaxed mb-6">
                You want a personal library. Collect recipes, read essays, and
                discover new hobbies without being targeted by ads.
              </p>
            </div>
            <div className="group">
              <h3 className="text-2xl font-serif text-paper mb-4 flex items-center gap-3">
                <span className="text-tertiary font-mono text-sm">02</span> For
                Creators & Artists
              </h3>
              <p className="text-secondary leading-relaxed mb-6">
                Build a catalog of work that lasts longer than 24 hours. Your
                old posts remain discoverable via Topic pages, not buried in a
                feed.
              </p>
            </div>
            <div className="group">
              <h3 className="text-2xl font-serif text-paper mb-4 flex items-center gap-3">
                <span className="text-tertiary font-mono text-sm">03</span> For
                Journalists
              </h3>
              <p className="text-secondary leading-relaxed mb-6">
                Verification is your currency. Citewalk automates your sourcing
                and provides a tamper-proof chain of custody for your reporting.
              </p>
            </div>
            <div className="group">
              <h3 className="text-2xl font-serif text-paper mb-4 flex items-center gap-3">
                <span className="text-tertiary font-mono text-sm">04</span> For
                Teams & Thinkers
              </h3>
              <p className="text-secondary leading-relaxed mb-6">
                Debate ideas with context. Use threaded conversations to build
                knowledge, not just generate noise.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Ethics & Business Model (Transparency) */}
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto mb-40 border-t border-divider pt-24">
          <div className="grid md:grid-cols-3 gap-12 text-left">
            <div className="space-y-4">
              <h4 className="text-paper font-medium text-lg">
                European Sovereignty
              </h4>
              <p className="text-secondary text-sm leading-relaxed">
                Hosted in the EU. Strict GDPR compliance. No data selling. Your
                thoughts belong to you, not an AI training set.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-paper font-medium text-lg">
                Radical Openness
              </h4>
              <p className="text-secondary text-sm leading-relaxed">
                You are not locked in. Download your entire history in open JSON
                format at any time. We believe in protocols, not walled gardens.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-paper font-medium text-lg">
                No Ads. Maybe Premium. Hoping for Supporters.
              </h4>
              <p className="text-secondary text-sm leading-relaxed">
                We do not show ads and are committed to keeping Citewalk
                ad-free. As the network grows, we may introduce optional premium
                plans to cover costs—but we are hoping supporters will help keep
                the core system free for everyone.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Founder & Community Call */}
        <section className="px-6 md:px-12 max-w-[800px] mx-auto mb-40 text-center">
          <div className="flex flex-col items-center gap-8">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border border-divider">
              <Image
                src="/sebastianlindner.jpeg"
                alt="Dr. Sebastian Lindner"
                fill
                className="object-cover"
              />
            </div>

            <blockquote className="text-xl md:text-2xl font-serif text-secondary leading-relaxed italic max-w-lg">
              &quot;We aren&apos;t trying to fix the whole internet. We are just
              trying to build a quiet corner of it where context still
              matters.&quot;
            </blockquote>

            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-bold text-paper">
                Dr. Sebastian Lindner
              </span>
              <span className="text-xs text-tertiary uppercase tracking-widest">
                Founder
              </span>
            </div>

            <div className="mt-8 p-8 border border-divider bg-white/[0.02] rounded-xl text-left w-full max-w-lg shadow-lg">
              <h4 className="text-paper font-medium mb-4">
                Built with You, for the People
              </h4>
              <p className="text-secondary text-sm leading-relaxed mb-4">
                We want to build a network for the people, with the people. I am
                very open to feedback—your ideas, critique, and feature wishes
                directly shape the roadmap.
              </p>
              <p className="text-secondary text-sm leading-relaxed mb-4">
                Citewalk is an independent side project, developed and operated
                privately.
              </p>
              <p className="text-secondary text-sm leading-relaxed mb-4">
                We do not show ads and are committed to keeping Citewalk
                ad-free. As the network grows, we may introduce optional premium
                plans to cover costs.
              </p>
              <p className="text-secondary text-sm leading-relaxed mb-6">
                Voluntary support helps cover infrastructure and development
                costs, and allows us to hire help or obtain external services
                where needed — so the core system can remain free and
                sustainably maintained.
              </p>
              <div className="space-y-4">
                <p className="text-secondary text-sm">
                  I am also seeking <strong>Collaborators</strong> and{" "}
                  <strong>Investors</strong> to help grow this vision with
                  impact.
                </p>
                <a
                  href="mailto:hello@citewalk.com"
                  className="inline-flex items-center gap-2 text-paper text-sm font-medium hover:text-white transition-colors border-b border-divider pb-0.5 hover:border-paper"
                >
                  <span>hello@citewalk.com</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto text-center border-t border-divider pt-32">
          <h2 className="text-5xl md:text-7xl font-serif font-medium text-paper mb-12 tracking-tight">
            Start your collection.
          </h2>
          {consentClosed && (
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link
                href={isBetaActive ? "/waiting-list" : "/sign-in"}
                className="inline-flex justify-center items-center px-12 py-5 bg-paper text-ink font-semibold text-lg rounded-full hover:bg-white transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105"
              >
                {isBetaActive
                  ? "Join the Waiting List"
                  : "Join the Network"}
              </Link>
            </div>
          )}
          <p className="mt-8 text-tertiary text-sm">
            {isBetaActive
              ? "We'll contact you with project updates and your invitation when we open the open beta. No algorithm. No ads."
              : "Sign in to start your knowledge graph. No algorithm. No ads."}
          </p>
        </section>
      </main>

      <footer className="px-6 md:px-12 py-12 border-t border-divider text-center md:text-left bg-ink mt-32">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-paper font-medium tracking-tight">
              Citewalk
            </span>
            <span className="text-xs text-tertiary">
              © 2026 Dr. Sebastian Lindner
            </span>
          </div>
          <div className="flex gap-8 text-sm text-tertiary">
            <Link
              href="/imprint"
              className="hover:text-secondary transition-colors"
            >
              Imprint
            </Link>
            <Link
              href="/privacy"
              className="hover:text-secondary transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-secondary transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/ai-transparency"
              className="hover:text-secondary transition-colors"
            >
              AI Transparency
            </Link>
          </div>
        </div>
      </footer>

      {consentClosed && (
        <Script
          src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"
          strategy="afterInteractive"
          onLoad={() => {
            const w = window as unknown as {
              kofiWidgetOverlay?: { draw: (id: string, opts: object) => void };
            };
            if (typeof w.kofiWidgetOverlay !== "undefined") {
              w.kofiWidgetOverlay.draw("sebastianlindner", {
                type: "floating-chat",
                "floating-chat.donateButton.text": "Support me",
                "floating-chat.donateButton.background-color": "#323842",
                "floating-chat.donateButton.text-color": "#fff",
              });
            }
          }}
        />
      )}
    </div>
  );
}
