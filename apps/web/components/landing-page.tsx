"use client";

import Link from "next/link";
import { translations, Language } from "./landing-translations";

export function LandingPage() {
  const lang: Language = "en";
  const t = translations[lang];

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F2F2F2] font-sans selection:bg-[#6E7A8A]/30">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 flex justify-between items-center px-6 py-6 md:px-12 bg-[#0B0B0C]/90 backdrop-blur-md border-b border-[#1A1A1D]">
        <div className="flex items-center gap-2">
          <span className="text-xl font-serif font-normal tracking-tight text-[#F2F2F2]">
            Citewalk
          </span>
        </div>

        <div className="flex items-center gap-6 md:gap-8 text-sm font-medium">
          <Link
            href="/manifesto"
            className="hidden lg:block text-[#A8A8AA] hover:text-[#F2F2F2] transition-colors"
          >
            {t.nav.manifesto}
          </Link>
          <Link
            href="/waiting-list"
            className="hidden md:block text-[#A8A8AA] hover:text-[#F2F2F2] transition-colors"
          >
            {(t.nav as { waitingList?: string }).waitingList ??
              "Join waiting list"}
          </Link>
          <Link
            href="/sign-in"
            className="hidden sm:block text-[#A8A8AA] hover:text-[#F2F2F2] transition-colors"
          >
            {t.nav.login}
          </Link>
          <Link
            href="/sign-in"
            className="text-[#F2F2F2] hover:text-white transition-colors decoration-1 underline underline-offset-4 decoration-[#6E7A8A]"
          >
            {t.nav.requestAccess}
          </Link>
        </div>
      </nav>

      <main className="pt-32 md:pt-40 pb-20">
        {/* Hero Section */}
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto mb-32 md:mb-48">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-normal leading-[1.05] tracking-tight text-[#F2F2F2] mb-12 max-w-5xl whitespace-pre-line">
              {t.hero.title}
            </h1>

            <div className="flex flex-col md:flex-row gap-12 md:items-start justify-between">
              <div className="max-w-xl space-y-6">
                <p className="text-lg md:text-xl text-[#A8A8AA] leading-relaxed font-light">
                  {t.hero.subtitle}
                </p>
                <p className="text-lg md:text-xl text-[#A8A8AA] leading-relaxed font-light">
                  {t.hero.description}
                </p>
              </div>

              <div className="flex flex-col gap-5 w-full md:w-auto pt-2">
                <Link
                  href="/sign-in"
                  className="inline-flex justify-center items-center px-8 py-4 bg-[#F2F2F2] text-[#0B0B0C] font-semibold text-lg rounded-full hover:bg-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {t.hero.cta_primary}
                </Link>
                <Link
                  href="/manifesto"
                  className="inline-flex justify-center items-center px-8 py-4 border border-[#333] text-[#A8A8AA] font-medium text-lg rounded-full hover:border-[#666] hover:text-[#F2F2F2] transition-colors"
                >
                  {t.hero.cta_secondary}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile App Highlight */}
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto mb-32">
          <div className="bg-[#0F0F10] border border-[#1A1A1D] rounded-xl p-8 md:p-16 relative overflow-hidden group hover:border-[#333] transition-colors">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-xs font-mono uppercase tracking-widest text-[#6E6E73] mb-4">
                  Mobile First
                </h2>
                <h3 className="text-3xl md:text-4xl font-serif font-normal text-[#F2F2F2] mb-6">
                  A Pocket Archive for
                  <br />
                  Real-World Context.
                </h3>
                <p className="text-[#A8A8AA] text-lg leading-relaxed mb-8">
                  Citewalk isn&apos;t just a website. It&apos;s a powerful
                  native mobile app designed for onsite reporting and verified
                  observation. Draft offline, cite eyewitnesses, and publish
                  when you reconnect.
                </p>
                <ul className="space-y-4 text-[#A8A8AA]">
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span>Native iOS & Android Experience</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span>Offline-First Drafting & Reading</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span>Biometric Security (FaceID/TouchID)</span>
                  </li>
                </ul>
              </div>
              <div className="relative h-[400px] md:h-[500px] bg-[#0B0B0C] border border-[#1A1A1D] rounded-2xl flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-16 h-1 bg-[#333] rounded-full mx-auto mb-8"></div>
                  <p className="text-sm text-[#6E6E73] font-mono mb-2">
                    READING MODE
                  </p>
                  <h4 className="text-2xl font-serif text-[#F2F2F2] mb-4">
                    Urban Resilience
                  </h4>
                  <p className="text-[#A8A8AA] text-sm max-w-[250px] mx-auto leading-relaxed">
                    Cities are defined not by their buildings, but by the spaces
                    between them. [[Public Spaces]] act as the lungs of
                    democracy...
                  </p>
                  <div className="mt-8 flex justify-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#1A1A1D] border border-[#333]"></div>
                    <div className="w-8 h-8 rounded-full bg-[#1A1A1D] border border-[#333]"></div>
                    <div className="w-8 h-8 rounded-full bg-[#1A1A1D] border border-[#333]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Pillars / Features */}
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto mb-32">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#6E6E73] mb-12 border-b border-[#1A1A1D] pb-4">
            System Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 border border-[#1A1A1D] rounded-lg bg-[#0F0F10]">
              <div className="text-2xl mb-4">🇪🇺</div>
              <h3 className="text-lg font-serif text-[#F2F2F2] mb-2">
                European Hosting
              </h3>
              <p className="text-[#A8A8AA] text-sm leading-relaxed">
                Data sovereignty is non-negotiable. We host strictly in the EU
                (Hetzner Germany/Finland). GDPR compliance is built-in, not an
                afterthought.
              </p>
            </div>
            <div className="p-6 border border-[#1A1A1D] rounded-lg bg-[#0F0F10]">
              <div className="text-2xl mb-4">💾</div>
              <h3 className="text-lg font-serif text-[#F2F2F2] mb-2">
                Data Export
              </h3>
              <p className="text-[#A8A8AA] text-sm leading-relaxed">
                You are not locked in. Download your entire archive (posts,
                connections, profile) in open JSON/CSV formats at any time with
                one click.
              </p>
            </div>
            <div className="p-6 border border-[#1A1A1D] rounded-lg bg-[#0F0F10]">
              <div className="text-2xl mb-4">📡</div>
              <h3 className="text-lg font-serif text-[#F2F2F2] mb-2">
                RSS Feeds
              </h3>
              <p className="text-[#A8A8AA] text-sm leading-relaxed">
                Every public profile is a content source. Subscribe via RSS. We
                believe in the open web, not walled gardens.
              </p>
            </div>
            <div className="p-6 border border-[#1A1A1D] rounded-lg bg-[#0F0F10]">
              <div className="text-2xl mb-4">🧠</div>
              <h3 className="text-lg font-serif text-[#F2F2F2] mb-2">
                No AI Dictation
              </h3>
              <p className="text-[#A8A8AA] text-sm leading-relaxed">
                Your feed is chronological. Recommendations are transparent. We
                do not use black-box AI to manipulate your attention or mood.
              </p>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto mb-32">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#6E6E73] mb-12 border-b border-[#1A1A1D] pb-4">
            Use Cases
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Journalism */}
            <div className="group flex flex-col h-full bg-[#0F0F10] border border-[#1A1A1D] rounded-lg overflow-hidden hover:border-[#333] transition-colors">
              <div className="p-8 pb-4">
                <h3 className="text-xl font-serif text-[#F2F2F2] mb-2">
                  Onsite Reporting
                </h3>
                <p className="text-[#A8A8AA] text-sm">
                  For journalists and observers
                </p>
              </div>
              <div className="px-8 pb-8 text-[#A8A8AA] text-sm leading-relaxed">
                &quot;I&apos;m at the protest. Witnesses say...&quot; <br />
                Cite eyewitnesses directly using their handle. Link to previous
                reports. Publish a verified chain of events that others can
                reference.
              </div>
            </div>

            {/* Knowledge */}
            <div className="group flex flex-col h-full bg-[#0F0F10] border border-[#1A1A1D] rounded-lg overflow-hidden hover:border-[#333] transition-colors">
              <div className="p-8 pb-4">
                <h3 className="text-xl font-serif text-[#F2F2F2] mb-2">
                  Topic Expertise
                </h3>
                <p className="text-[#A8A8AA] text-sm">
                  For researchers and thinkers
                </p>
              </div>
              <div className="px-8 pb-8 text-[#A8A8AA] text-sm leading-relaxed">
                Curate a definitive collection on [[Urban Farming]]. Post deep
                dives citing academic papers (auto-archived). Become the cited
                authority in your field.
              </div>
            </div>

            {/* Lifestyle */}
            <div className="group flex flex-col h-full bg-[#0F0F10] border border-[#1A1A1D] rounded-lg overflow-hidden hover:border-[#333] transition-colors">
              <div className="p-8 pb-4">
                <h3 className="text-xl font-serif text-[#F2F2F2] mb-2">
                  Personal Curation
                </h3>
                <p className="text-[#A8A8AA] text-sm">For everyone</p>
              </div>
              <div className="px-8 pb-8 text-[#A8A8AA] text-sm leading-relaxed">
                Save your favorite recipes to a private collection. Share the
                collection with friends. No ads, no clutter, just the links that
                matter.
              </div>
            </div>
          </div>
        </section>

        {/* How It Works (Original Mechanics) */}
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto mb-32">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#6E6E73] mb-12 border-b border-[#1A1A1D] pb-4">
            {t.mechanics.label}
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border border-[#1A1A1D] rounded-lg bg-[#0F0F10]">
              <h3 className="text-xl font-serif text-[#F2F2F2] mb-3">
                {t.mechanics.card_1_title}
              </h3>
              <p className="text-[#A8A8AA] text-sm leading-relaxed">
                {t.mechanics.card_1_text}
              </p>
            </div>
            <div className="p-6 border border-[#1A1A1D] rounded-lg bg-[#0F0F10]">
              <h3 className="text-xl font-serif text-[#F2F2F2] mb-3">
                {t.mechanics.card_2_title}
              </h3>
              <p className="text-[#A8A8AA] text-sm leading-relaxed">
                {t.mechanics.card_2_text}
              </p>
            </div>
            <div className="p-6 border border-[#1A1A1D] rounded-lg bg-[#0F0F10]">
              <h3 className="text-xl font-serif text-[#F2F2F2] mb-3">
                {t.mechanics.card_3_title}
              </h3>
              <p className="text-[#A8A8AA] text-sm leading-relaxed">
                {t.mechanics.card_3_text}
              </p>
            </div>
          </div>
        </section>

        {/* Founder Quote */}
        <section className="px-6 md:px-12 max-w-[900px] mx-auto mb-32 text-center">
          <blockquote className="font-serif text-2xl md:text-4xl font-light text-[#F2F2F2] leading-relaxed mb-8">
            {t.quote.text}
          </blockquote>
          <div className="flex flex-col items-center gap-3">
            <span className="text-[#F2F2F2] font-bold tracking-tight text-lg">
              {t.quote.author}
            </span>
            <span className="text-[10px] text-[#6E6E73] uppercase tracking-[0.3em] font-bold">
              {t.quote.role} • 2026
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
