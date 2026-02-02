"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { MdArrowForward } from "react-icons/md";
import {
  hasCookieConsent,
  COOKIE_CONSENT_CLOSED_EVENT,
} from "@/components/cookie-consent-banner";
import { useBetaMode } from "@/context/beta-mode-provider";
import { GraphBackground } from "./landing/graph-background";
import { EditorDemo } from "./landing/editor-demo";
import { HowItWorks } from "./landing/how-it-works";
import { ComparisonTable } from "./landing/comparison-table";
import { UserBenefits } from "./landing/user-benefits";

function getConsentClosedInitial(): boolean {
  if (typeof window === "undefined") return false;
  return hasCookieConsent();
}

interface LandingPageProps {
  isAuthenticated?: boolean;
}

export function LandingPage({ isAuthenticated }: LandingPageProps) {
  const { betaMode } = useBetaMode();
  const [consentClosed, setConsentClosed] = useState(getConsentClosedInitial);

  useEffect(() => {
    const onConsentClosed = () => setConsentClosed(true);
    window.addEventListener(COOKIE_CONSENT_CLOSED_EVENT, onConsentClosed);
    return () =>
      window.removeEventListener(COOKIE_CONSENT_CLOSED_EVENT, onConsentClosed);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F2F2F2] font-sans selection:bg-[#F2F2F2] selection:text-[#0B0B0C] overflow-x-hidden relative">
      <GraphBackground />

      {/* Grid Lines (Technical Overlay) */}
      <div
        className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #6E7A8A 1px, transparent 1px),
          linear-gradient(to bottom, #6E7A8A 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 flex justify-between items-center px-6 py-4 md:px-12 bg-[#0B0B0C]/80 backdrop-blur-md border-b border-[#1A1A1D]">
        <Link href="/" className="flex items-center gap-3 group relative z-50">
          <Image
            src="/icon.png"
            alt="Citewalk"
            width={32}
            height={32}
            className="w-8 h-8 rounded-md opacity-90 group-hover:opacity-100 transition-opacity"
          />
          <span className="text-sm font-medium tracking-tight text-[#F2F2F2] font-serif">
            Citewalk
          </span>
        </Link>

        <div className="flex items-center gap-8 text-xs font-mono tracking-widest uppercase text-[#A8A8AA]">
          <Link
            href="/manifesto"
            className="hidden md:block hover:text-[#F2F2F2] transition-colors"
          >
            Manifesto
          </Link>
          <Link
            href="/roadmap"
            className="hidden md:block hover:text-[#F2F2F2] transition-colors"
          >
            Roadmap
          </Link>
          {isAuthenticated ? (
            <Link
              href="/home"
              className="text-[#F2F2F2] border border-[#333] px-3 py-1.5 rounded hover:bg-[#1A1A1D] transition-colors"
            >
              System Access
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="text-[#F2F2F2] hover:text-white transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20">
        {/* Hero Section */}
        <section className="px-6 md:px-12 max-w-[1400px] mx-auto min-h-[80vh] flex flex-col md:flex-row items-center gap-16 md:gap-8">
          <div className="flex-1 space-y-8 md:pr-12">
            <div className="inline-flex items-center gap-3 px-3 py-1 border border-[#6E7A8A]/30 rounded-full bg-[#0F0F10]/50 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#A8A8AA] font-mono">
                System Online • {betaMode ? "Closed Beta" : "Public Access"}
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium leading-[0.95] tracking-tight text-[#F2F2F2] font-sans">
              From Feed <br />
              <span className="font-serif italic text-[#6E7A8A]">to City.</span>
            </h1>

            <p className="text-lg md:text-xl text-[#A8A8AA] font-light max-w-lg leading-relaxed border-l border-[#333] pl-6">
              The modern internet is a highway—fast, loud, and linear. Citewalk
              is a place to stop. A quiet archive for people who write history,
              not just consume it.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              {consentClosed && (
                <Link
                  href={
                    isAuthenticated
                      ? "/home"
                      : betaMode
                        ? "/waiting-list"
                        : "/sign-in"
                  }
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#F2F2F2] text-[#0B0B0C] font-semibold text-sm tracking-wide uppercase hover:bg-white transition-all"
                >
                  {isAuthenticated ? "Enter System" : "Join the City"}
                  <MdArrowForward className="group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              <Link
                href="/manifesto"
                className="inline-flex items-center justify-center px-8 py-4 border border-[#333] text-[#A8A8AA] font-medium text-sm tracking-wide uppercase hover:border-[#6E7A8A] hover:text-[#F2F2F2] transition-colors"
              >
                The Algorithm of Truth
              </Link>
            </div>
          </div>

          <div className="flex-1 w-full max-w-xl md:max-w-none relative">
            <div className="absolute -inset-10 bg-gradient-to-tr from-[#6E7A8A]/10 to-transparent blur-3xl rounded-full pointer-events-none" />
            <EditorDemo />
            <div className="mt-4 flex justify-between text-[10px] font-mono text-[#6E6E73] uppercase tracking-widest">
              <span>Live Terminal</span>
              <span>v1.0.0</span>
            </div>
          </div>
        </section>

        <HowItWorks />

        {/* Features / Architecture */}

        <section className="px-6 md:px-12 max-w-[1400px] mx-auto py-32 md:py-48">
          <div className="grid md:grid-cols-3 gap-12 md:gap-px md:bg-[#1A1A1D] border border-[#1A1A1D]">
            {/* Card 1 */}

            <div className="bg-[#0B0B0C] p-10 md:p-12 group hover:bg-[#0F0F10] transition-colors relative">
              <span className="text-[10px] font-mono text-[#6E7A8A] absolute top-6 right-6">
                01
              </span>

              <h3 className="text-2xl font-serif text-[#F2F2F2] mb-4 group-hover:text-[#6E7A8A] transition-colors">
                The Map
              </h3>

              <p className="text-[#A8A8AA] leading-relaxed text-sm">
                We don&apos;t use timelines. We use{" "}
                <span className="text-[#F2F2F2] font-mono text-xs bg-[#1A1A1D] px-1 rounded">
                  [[citelinks]]
                </span>{" "}
                to build bridges between ideas. Every post is a landmark, not a
                disposable status update.
              </p>
            </div>

            {/* Card 2 */}

            <div className="bg-[#0B0B0C] p-10 md:p-12 group hover:bg-[#0F0F10] transition-colors relative">
              <span className="text-[10px] font-mono text-[#6E7A8A] absolute top-6 right-6">
                02
              </span>

              <h3 className="text-2xl font-serif text-[#F2F2F2] mb-4 group-hover:text-[#6E7A8A] transition-colors">
                The Currency
              </h3>

              <p className="text-[#A8A8AA] leading-relaxed text-sm">
                Likes are inflation. Citations are gold. Your reputation grows
                when other thinkers quote you, creating a web of verifiable
                trust.
              </p>
            </div>

            {/* Card 3 */}

            <div className="bg-[#0B0B0C] p-10 md:p-12 group hover:bg-[#0F0F10] transition-colors relative">
              <span className="text-[10px] font-mono text-[#6E7A8A] absolute top-6 right-6">
                03
              </span>

              <h3 className="text-2xl font-serif text-[#F2F2F2] mb-4 group-hover:text-[#6E7A8A] transition-colors">
                The Vault
              </h3>

              <p className="text-[#A8A8AA] leading-relaxed text-sm">
                The internet forgets. We remember. Every external source you
                cite is automatically preserved. We are building a library that
                cannot be burned.
              </p>
            </div>
          </div>
        </section>

        <UserBenefits />

        <ComparisonTable />

        {/* The Founder / Vision */}
        <section className="px-6 md:px-12 max-w-[1000px] mx-auto py-20 md:py-32 text-center">
          <div className="w-px h-24 bg-gradient-to-b from-transparent via-[#6E7A8A] to-transparent mx-auto mb-12 opacity-50"></div>

          <blockquote className="text-2xl md:text-4xl font-serif font-light text-[#F2F2F2] leading-tight mb-12">
            &quot;The feed is for consumption. <br />
            The graph is for comprehension.&quot;
          </blockquote>

          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-[#333] grayscale opacity-80">
              <Image
                src="/sebastianlindner.jpeg"
                alt="Dr. Sebastian Lindner"
                width={64}
                height={64}
              />
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-[#F2F2F2]">
                Dr. Sebastian Lindner
              </div>
              <div className="text-[10px] font-mono text-[#6E6E73] uppercase tracking-widest mt-1">
                Founder • Operator
              </div>
            </div>
          </div>

          <div className="mt-16 max-w-lg mx-auto text-xs font-mono text-[#6E6E73] leading-relaxed space-y-4 border-t border-[#1A1A1D] pt-8">
            <p>
              [STATUS]: Citewalk is currently an independent solo project. I am
              actively seeking supporters and feedback to help shape the
              protocol.
            </p>
            <p>
              [SUSTAINABILITY]: While the core network is free, premium features
              may be introduced in the future to cover maintenance and operating
              costs.
            </p>
          </div>
        </section>
      </main>

      <footer className="px-6 md:px-12 py-12 border-t border-[#1A1A1D] bg-[#0B0B0C] relative z-10">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-end md:items-center gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-mono text-[#6E6E73] uppercase tracking-widest">
              Citewalk System v1.0
            </span>
            <div className="flex gap-2 text-[10px] font-mono text-[#6E7A8A] uppercase tracking-widest">
              <span>[EU-HOSTED]</span>
              <span>[CLEAN INFRA]</span>
              <span>[LOCAL AI]</span>
            </div>
            <span className="text-[10px] text-[#333]">
              © 2026 Dr. Sebastian Lindner
            </span>
          </div>

          <div className="flex flex-wrap gap-8 text-[11px] font-mono uppercase tracking-wider text-[#6E6E73]">
            <Link
              href="/manifesto"
              className="hover:text-[#F2F2F2] transition-colors"
            >
              Manifesto
            </Link>
            <Link
              href="/imprint"
              className="hover:text-[#F2F2F2] transition-colors"
            >
              Imprint
            </Link>
            <Link
              href="/privacy"
              className="hover:text-[#F2F2F2] transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-[#F2F2F2] transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/ai-transparency"
              className="hover:text-[#F2F2F2] transition-colors"
            >
              AI Safety
            </Link>
          </div>
        </div>
      </footer>

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
              "floating-chat.donateButton.background-color": "#1A1A1D",
              "floating-chat.donateButton.text-color": "#fff",
            });
          }
        }}
      />
    </div>
  );
}
