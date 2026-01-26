'use client';

import Link from 'next/link';
import { translations, Language } from './landing-translations';

export function LandingPage() {
  const lang: Language = 'en';
  const t = translations[lang];

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F2F2F2] font-sans selection:bg-[#6E7A8A]/30">

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 flex justify-between items-center px-6 py-6 md:px-12 bg-[#0B0B0C]/90 backdrop-blur-md border-b border-[#1A1A1D]">
        <div className="flex items-center gap-2">
          <span className="text-xl font-serif font-normal tracking-tight text-[#F2F2F2]">cite</span>
        </div>

        <div className="flex items-center gap-6 md:gap-8 text-sm font-medium">
          <Link href="/manifesto" className="hidden lg:block text-[#A8A8AA] hover:text-[#F2F2F2] transition-colors">{t.nav.manifesto}</Link>
          <Link href="/sign-in" className="hidden sm:block text-[#A8A8AA] hover:text-[#F2F2F2] transition-colors">{t.nav.login}</Link>
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

        {/* The Problem: The Loudness Loop */}
        <section className="px-6 md:px-12 max-w-[1000px] mx-auto mb-32 border-t border-[#1A1A1D] pt-24">
          <div className="grid md:grid-cols-12 gap-12">
            <div className="md:col-span-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#6E6E73] mb-4">{t.problem.label}</h2>
              <h3 className="text-3xl font-serif font-normal text-[#F2F2F2]">{t.problem.title}</h3>
            </div>
            <div className="md:col-span-8 space-y-6 text-lg text-[#A8A8AA] font-light leading-relaxed">
              <p>{t.problem.text_1}</p>
              <p>{t.problem.text_2}</p>
            </div>
          </div>
        </section>

        {/* How It Works & Key Features Unified Grid */}
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto mb-32">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#6E6E73] mb-12 border-b border-[#1A1A1D] pb-4">{t.mechanics.label}</h2>

          <div className="grid md:grid-cols-3 gap-8">

            {/* 1. Inline Citations */}
            <div className="group flex flex-col h-full bg-[#0F0F10] border border-[#1A1A1D] rounded-lg overflow-hidden hover:border-[#333] transition-colors">
              <div className="h-48 bg-[#0B0B0C] border-b border-[#1A1A1D] relative overflow-hidden p-6 flex flex-col justify-center">
                <div className="text-[#A8A8AA] font-serif text-lg leading-relaxed">
                  The history of <span className="text-[#F2F2F2] bg-[#6E7A8A]/20 px-1 rounded cursor-pointer border-b border-[#6E7A8A]/50">[[Internet Sovereignty]]</span> suggests...
                </div>
                <div className="absolute bottom-4 right-4 bg-[#1A1A1D] px-2 py-1 rounded text-[10px] font-mono text-[#6E6E73] border border-[#333]">LINKED</div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-serif font-normal text-[#F2F2F2] mb-3">{t.mechanics.card_1_title}</h3>
                <p className="text-[#A8A8AA] text-sm leading-relaxed">{t.mechanics.card_1_text}</p>
              </div>
            </div>

            {/* 2. Reputation Graph */}
            <div className="group flex flex-col h-full bg-[#0F0F10] border border-[#1A1A1D] rounded-lg overflow-hidden hover:border-[#333] transition-colors">
              <div className="h-48 bg-[#0B0B0C] border-b border-[#1A1A1D] relative overflow-hidden flex flex-col items-center justify-center gap-3">
                <div className="flex gap-2 items-center opacity-40"><div className="w-1.5 h-1.5 rounded-full bg-[#333]"></div><div className="h-1.5 w-24 bg-[#1A1A1D] rounded"></div></div>
                <div className="p-2 border border-[#333] bg-[#0F0F10] rounded shadow-lg flex items-center gap-3 w-48">
                  <div className="w-2 h-2 bg-[#F2F2F2] rounded-full"></div>
                  <div className="flex-1 text-[10px] text-[#A8A8AA] font-mono">CITED BY 12 SOURCES</div>
                </div>
                <div className="flex gap-2 items-center opacity-40"><div className="w-1.5 h-1.5 rounded-full bg-[#333]"></div><div className="h-1.5 w-32 bg-[#1A1A1D] rounded"></div></div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-serif font-normal text-[#F2F2F2] mb-3">{t.mechanics.card_2_title}</h3>
                <p className="text-[#A8A8AA] text-sm leading-relaxed">{t.mechanics.card_2_text}</p>
              </div>
            </div>

            {/* 3. Private Signals */}
            <div className="group flex flex-col h-full bg-[#0F0F10] border border-[#1A1A1D] rounded-lg overflow-hidden hover:border-[#333] transition-colors">
              <div className="h-48 bg-[#0B0B0C] border-b border-[#1A1A1D] relative overflow-hidden flex flex-col items-center justify-center">
                <div className="text-3xl font-serif text-[#333] mb-1">245</div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73] mb-3">Private Likes</div>
                <div className="flex items-center gap-2 px-3 py-1 bg-[#1A1A1D] rounded-full border border-[#333]">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] text-[#A8A8AA]">Visible only to you</span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-serif font-normal text-[#F2F2F2] mb-3">{t.mechanics.card_3_title}</h3>
                <p className="text-[#A8A8AA] text-sm leading-relaxed">{t.mechanics.card_3_text}</p>
              </div>
            </div>

            {/* 4. Permanent Citations (Archiving) - Visualized */}
            <div className="group flex flex-col h-full bg-[#0F0F10] border border-[#1A1A1D] rounded-lg overflow-hidden hover:border-[#333] transition-colors md:col-span-1.5 lg:col-span-1.5">
              <div className="h-48 bg-[#0B0B0C] border-b border-[#1A1A1D] relative overflow-hidden flex items-center justify-center p-8">
                <div className="w-full max-w-[200px] space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#6E6E73] border-b border-[#333] pb-2 mb-2">
                    <span>SOURCE URL</span>
                    <span>STATUS</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#A8A8AA] text-xs truncate w-24">nytimes.com/...</span>
                    <span className="text-emerald-500 text-[10px] flex items-center gap-1">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full"></span> SAVED
                    </span>
                  </div>
                  <div className="flex items-center justify-between opacity-50">
                    <span className="text-[#A8A8AA] text-xs truncate w-24">substack.com/...</span>
                    <span className="text-emerald-500 text-[10px] flex items-center gap-1">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full"></span> SAVED
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-serif font-normal text-[#F2F2F2] mb-3">{t.archiving.title}</h3>
                <p className="text-[#A8A8AA] text-sm leading-relaxed">{t.archiving.text}</p>
              </div>
            </div>

            {/* 5. Visual Quiet - Visualized */}
            <div className="group flex flex-col h-full bg-[#0F0F10] border border-[#1A1A1D] rounded-lg overflow-hidden hover:border-[#333] transition-colors md:col-span-1.5 lg:col-span-1.5">
              <div className="h-48 bg-[#0B0B0C] border-b border-[#1A1A1D] relative overflow-hidden flex items-center justify-center">
                <div className="space-y-4 w-32 opacity-60">
                  <div className="h-2 w-full bg-[#333] rounded-sm"></div>
                  <div className="h-2 w-3/4 bg-[#333] rounded-sm"></div>
                  <div className="h-2 w-5/6 bg-[#333] rounded-sm"></div>
                  <div className="h-2 w-full bg-[#333] rounded-sm"></div>
                </div>
                {/* "No Image" Symbol overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-2 border-[#1A1A1D] rounded flex items-center justify-center relative bg-[#0B0B0C]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-0.5 bg-[#333] rotate-45"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-serif font-normal text-[#F2F2F2] mb-3">{t.visuals.title}</h3>
                <p className="text-[#A8A8AA] text-sm leading-relaxed">{t.visuals.text}</p>
              </div>
            </div>

          </div>
        </section>

        {/* Product Visualization - Deep Dive */}
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto mb-32">
          <div className="bg-[#0F0F10] border border-[#1A1A1D] rounded-xl p-8 md:p-16 relative overflow-hidden group hover:border-[#333] transition-colors">
            <div className="max-w-3xl mx-auto relative z-10">
              <div className="text-center mb-12">
                <h3 className="text-3xl md:text-4xl font-serif font-normal text-[#F2F2F2] mb-4">{t.deep_dive.title}</h3>
                <p className="text-[#A8A8AA]">{t.deep_dive.subtitle}</p>
              </div>

              {/* Abstract UI representation of a thread/chain */}
              <div className="space-y-8 relative">
                <div className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-[#333] via-[#333] to-transparent"></div>

                {/* Post 1 */}
                <div className="relative pl-12">
                  <div className="absolute left-2.5 top-2 w-3 h-3 bg-[#333] rounded-full border-2 border-[#0F0F10]"></div>
                  <div className="text-sm text-[#6E6E73] mb-1">Original Thesis • @alex</div>
                  <p className="text-[#A8A8AA] font-serif text-lg">"Digital minimalist design often fails because it removes <span className="text-[#F2F2F2] underline decoration-[#333] underline-offset-4 cursor-pointer hover:bg-[#6E7A8A]/10 transition-colors">[[affordances]]</span> that users actually rely on."</p>
                </div>

                {/* Post 2 */}
                <div className="relative pl-12">
                  <div className="absolute left-2.5 top-2 w-3 h-3 bg-[#6E7A8A] rounded-full border-2 border-[#0F0F10]"></div>
                  <div className="text-sm text-[#6E6E73] mb-1">Rebuttal • @sarah</div>
                  <p className="text-[#F2F2F2] font-serif text-xl">"I disagree. As <span className="text-[#6E7A8A] cursor-pointer hover:underline">@alex</span> mentions, affordances matter, but we must distinguish between utility and clutter..."</p>
                  <div className="mt-4 flex gap-4 text-xs font-mono text-[#6E6E73]">
                    <span>2 Sources</span>
                    <span>Cited by 5</span>
                  </div>
                </div>

                {/* Post 3 */}
                <div className="relative pl-12 opacity-50">
                  <div className="absolute left-2.5 top-2 w-3 h-3 bg-[#333] rounded-full border-2 border-[#0F0F10]"></div>
                  <div className="text-sm text-[#6E6E73] mb-1">Synthesis • @david</div>
                  <p className="text-[#A8A8AA] font-serif text-lg">"Perhaps the middle ground is..."</p>
                </div>
              </div>
            </div>

            {/* Background Mesh */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          </div>
        </section>

        {/* Founder Quote */}
        <section className="px-6 md:px-12 max-w-[900px] mx-auto mb-32 text-center">
          <blockquote className="font-serif text-2xl md:text-4xl font-light text-[#F2F2F2] leading-relaxed mb-8">
            "{t.quote.text}"
          </blockquote>
          <div className="flex flex-col items-center">
            <cite className="not-italic text-[#F2F2F2] font-medium text-lg">{t.quote.author}</cite>
            <span className="text-[#6E6E73] uppercase tracking-widest text-xs mt-1">{t.quote.role}</span>
          </div>
        </section>

        {/* Distinction */}
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto mb-32 border-t border-[#1A1A1D] pt-24">
          <div className="grid md:grid-cols-2 gap-20">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#6E6E73] mb-4">{t.distinction.label}</h2>
              <h3 className="text-3xl font-serif font-normal text-[#F2F2F2] mb-6">{t.distinction.title}</h3>
              <p className="text-[#A8A8AA] text-lg leading-relaxed mb-6">{t.distinction.text_1}</p>
              <p className="text-[#A8A8AA] text-lg leading-relaxed">{t.distinction.text_2}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <h4 className="text-[#F2F2F2] font-medium">{t.distinction.sovereign}</h4>
                <p className="text-sm text-[#6E6E73] leading-relaxed">{t.distinction.sovereign_text}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-[#F2F2F2] font-medium">{t.distinction.no_ads}</h4>
                <p className="text-sm text-[#6E6E73] leading-relaxed">{t.distinction.no_ads_text}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-[#F2F2F2] font-medium">{t.distinction.transparent}</h4>
                <p className="text-sm text-[#6E6E73] leading-relaxed">{t.distinction.transparent_text}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-[#F2F2F2] font-medium">{t.distinction.verified}</h4>
                <p className="text-sm text-[#6E6E73] leading-relaxed">{t.distinction.verified_text}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Initiative (Business + Solo) */}
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto mb-32">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="p-8 border border-[#1A1A1D] rounded-xl bg-[#0F0F10]">
              <h3 className="text-xl font-serif text-[#F2F2F2] mb-4">{t.business.title}</h3>
              <p className="text-[#A8A8AA] leading-relaxed">{t.business.text}</p>
            </div>
            <div className="p-8 border border-[#1A1A1D] rounded-xl bg-[#0F0F10]">
              <h3 className="text-xl font-serif text-[#F2F2F2] mb-4">{t.solo.title}</h3>
              <p className="text-[#A8A8AA] leading-relaxed">{t.solo.text}</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 md:px-12 max-w-[800px] mx-auto text-center mb-32 pt-12">
          <h2 className="text-4xl md:text-6xl font-serif font-normal text-[#F2F2F2] mb-8 leading-[1.1]">
            {t.cta_final.title.split('\n')[0]}<br />
            <span className="text-[#6E7A8A] block mt-2">{t.cta_final.title.split('\n')[1]}</span>
          </h2>
          <div className="text-[#6E6E73] text-lg mb-8">{t.cta_final.subtitle}</div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/sign-in"
              className="inline-block px-10 py-4 bg-[#F2F2F2] text-[#0B0B0C] font-semibold rounded-full hover:bg-white transition-all shadow-lg hover:shadow-white/10"
            >
              {t.cta_final.button}
            </Link>
            <span className="text-[#6E6E73] text-sm">{t.cta_final.note}</span>
          </div>
        </section>

      </main>

      <footer className="border-t border-[#1A1A1D] bg-[#0B0B0C] py-8 md:py-12 px-6 md:px-12">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center md:items-center gap-6 md:gap-0">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
            <span className="text-base md:text-lg font-serif font-normal text-[#F2F2F2]">cite</span>
            <span className="text-[#6E6E73] text-xs sm:text-sm font-mono border-t sm:border-t-0 sm:border-l border-[#333] pt-3 sm:pt-0 sm:pl-4">
              {t.footer.rights}
            </span>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm text-[#A8A8AA]">
            <Link href="/roadmap" className="hover:text-[#F2F2F2] transition-colors whitespace-nowrap">{t.footer.roadmap}</Link>
            <Link href="/imprint" className="hover:text-[#F2F2F2] transition-colors whitespace-nowrap">{t.footer.imprint}</Link>
            <Link href="/privacy" className="hover:text-[#F2F2F2] transition-colors whitespace-nowrap">{t.footer.privacy}</Link>
            <Link href="/ai-transparency" className="hover:text-[#F2F2F2] transition-colors whitespace-nowrap">{t.footer.ai_transparency}</Link>
            <Link href="/terms" className="hover:text-[#F2F2F2] transition-colors whitespace-nowrap">{t.footer.terms}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}