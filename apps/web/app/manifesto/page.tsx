import { cookies } from "next/headers";
import type { Metadata } from "next";
import { MdVerified, MdLink } from "react-icons/md";
import { PublicNav } from "@/components/landing/public-nav";
import { PublicFooter } from "@/components/landing/public-footer";
import {
  ManifestoSidebar,
  ManifestoMobileToc,
} from "@/components/landing/manifesto-sidebar";
import { ManifestoCta } from "@/components/landing/manifesto-cta";

export const metadata: Metadata = {
  title: "Manifesto | Citewalk",
  description:
    "The principles behind Citewalk. Why we're building a social network around citations.",
  alternates: {
    canonical: "https://citewalk.com/manifesto",
  },
};

export default async function ManifestoPage() {
  const token = (await cookies()).get("token")?.value;
  const isAuthenticated = !!token && token.length > 0;

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F2F2F2] font-serif selection:bg-[#F2F2F2] selection:text-[#0B0B0C]">
      <PublicNav isAuthenticated={isAuthenticated} />

      <div className="pt-32 pb-32 px-6 md:px-12 max-w-[1400px] mx-auto flex flex-col md:flex-row gap-20">
        <ManifestoSidebar />

        {/* Main Document */}
        <main id="main-content" className="max-w-2xl">
          <ManifestoMobileToc />

          <section id="preamble" className="mb-24 scroll-mt-24">
            <h1 className="text-5xl md:text-7xl leading-[0.95] font-medium mb-12 text-[#F2F2F2]">
              The Algorithm <br />
              <span className="text-[#6E7A8A] italic">of Truth.</span>
            </h1>

            <p className="text-xl md:text-2xl leading-relaxed text-[#A8A8AA] border-l-2 border-[#6E7A8A] pl-8 py-2">
              The internet was built to connect knowledge. Somewhere along the
              way, it became a machine for forgetting. We&apos;re building a place
              that remembers.
            </p>
          </section>

          <section id="attention" className="mb-20 scroll-mt-24">
            <div className="flex items-baseline gap-4 mb-8 border-b border-[#1A1A1D] pb-4">
              <span className="font-mono text-[#6E7A8A] text-xs">01</span>
              <h2 className="text-2xl font-sans font-bold text-[#F2F2F2]">
                The Crisis of Context
              </h2>
            </div>
            <div className="prose prose-invert prose-lg text-[#A8A8AA] font-serif">
              <p>
                Today&apos;s social platforms strip information from its source. A
                screenshot travels faster than a citation. Outrage spreads
                faster than correction.
              </p>
              <p>
                This isn&apos;t a bug — it&apos;s a business model. When context disappears,
                engagement goes up. But a society without context can&apos;t tell
                truth from noise.
              </p>
            </div>
          </section>

          <section id="intention" className="mb-20 scroll-mt-24">
            <div className="flex items-baseline gap-4 mb-8 border-b border-[#1A1A1D] pb-4">
              <span className="font-mono text-[#6E7A8A] text-xs">02</span>
              <h2 className="text-2xl font-sans font-bold text-[#F2F2F2]">
                The Architecture of Trust
              </h2>
            </div>
            <div className="prose prose-invert prose-lg text-[#A8A8AA] font-serif space-y-8">
              <p>
                Citewalk works more like a journal than a feed. Claims are
                connected to their sources. Reputation is earned through
                citations, not bought or gamed.
              </p>

              <div className="grid gap-6">
                <div className="bg-[#121215] p-6 rounded border border-[#1A1A1D]">
                  <h3 className="font-sans font-bold text-[#F2F2F2] flex items-center gap-2 mb-2">
                    <MdVerified className="text-[#6E7A8A]" />
                    Citations as credibility
                  </h3>
                  <p className="text-base">
                    In a feed, the loudest voice wins. In a knowledge graph,
                    the most cited voice wins. Your authority grows when other
                    writers reference your work.
                  </p>
                </div>

                <div className="bg-[#121215] p-6 rounded border border-[#1A1A1D]">
                  <h3 className="font-sans font-bold text-[#F2F2F2] flex items-center gap-2 mb-2">
                    <MdLink className="text-[#6E7A8A]" />
                    Preserving the web
                  </h3>
                  <p className="text-base">
                    Hyperlinks were the internet&apos;s superpower. Citewalk
                    preserves every external source you cite, ensuring that
                    knowledge doesn&apos;t disappear when a page goes down.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="sovereignty" className="mb-20 scroll-mt-24">
            <div className="flex items-baseline gap-4 mb-8 border-b border-[#1A1A1D] pb-4">
              <span className="font-mono text-[#6E7A8A] text-xs">03</span>
              <h2 className="text-2xl font-sans font-bold text-[#F2F2F2]">
                Digital Sovereignty
              </h2>
            </div>
            <div className="prose prose-invert prose-lg text-[#A8A8AA] font-serif">
              <p>You&apos;re not a user here. You&apos;re an author.</p>
              <p>
                Citewalk is an independent European project. We host in the EU
                and follow GDPR — not because we have to, but because we
                believe your data should belong to you.
              </p>
              <p>
                Everything you write is portable: RSS feeds for every profile,
                full JSON export, and zero advertising. Your ideas, your data.
              </p>
            </div>
          </section>

          <div className="pt-12 border-t border-[#1A1A1D] flex justify-between items-center">
            <div className="text-sm font-sans text-[#6E6E73]">
              Last updated: Feb 2026
            </div>
            <ManifestoCta isAuthenticated={isAuthenticated} />
          </div>
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}
