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
  title: "About | Citewalk",
  description:
    "Why we built Citewalk. The European alternative to algorithm-driven social media — where good writing wins, not outrage.",
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
              Why we <br />
              <span className="text-[#6E7A8A] italic">built this.</span>
            </h1>

            <p className="text-xl md:text-2xl leading-relaxed text-[#A8A8AA] border-l-2 border-[#6E7A8A] pl-8 py-2">
              Social media is broken. The platforms we use every day are
              designed to amplify outrage, not understanding. We&apos;re
              building the alternative — from Europe, on our own terms.
            </p>
          </section>

          <section id="attention" className="mb-20 scroll-mt-24">
            <div className="flex items-baseline gap-4 mb-8 border-b border-[#1A1A1D] pb-4">
              <span className="font-mono text-[#6E7A8A] text-xs">01</span>
              <h2 className="text-2xl font-sans font-bold text-[#F2F2F2]">
                The problem with today&apos;s platforms
              </h2>
            </div>
            <div className="prose prose-invert prose-lg text-[#A8A8AA] font-serif">
              <p>
                A handful of US companies control how billions of people see the
                world. Their algorithms decide what you read, who gets heard,
                and what disappears. The loudest, most provocative content wins
                — by design.
              </p>
              <p>
                This isn&apos;t a side effect. It&apos;s the business model.
                Rage drives engagement, engagement drives ads, and your
                attention is the product. We think there&apos;s a better way.
              </p>
            </div>
          </section>

          <section id="intention" className="mb-20 scroll-mt-24">
            <div className="flex items-baseline gap-4 mb-8 border-b border-[#1A1A1D] pb-4">
              <span className="font-mono text-[#6E7A8A] text-xs">02</span>
              <h2 className="text-2xl font-sans font-bold text-[#F2F2F2]">
                A different kind of social network
              </h2>
            </div>
            <div className="prose prose-invert prose-lg text-[#A8A8AA] font-serif space-y-8">
              <p>
                Citewalk doesn&apos;t have an engagement algorithm. There&apos;s
                no invisible hand deciding who gets seen. Your feed is
                chronological, your content is discoverable by topic, and good
                writing rises because people actually share and reference it.
              </p>

              <div className="grid gap-6">
                <div className="bg-[#121215] p-6 rounded border border-[#1A1A1D]">
                  <h3 className="font-sans font-bold text-[#F2F2F2] flex items-center gap-2 mb-2">
                    <MdVerified className="text-[#6E7A8A]" />
                    Substance wins
                  </h3>
                  <p className="text-base">
                    On other platforms, the angriest voice goes viral. Here, the
                    most referenced voice earns credibility. You grow by writing
                    things worth sharing — not by provoking reactions.
                  </p>
                </div>

                <div className="bg-[#121215] p-6 rounded border border-[#1A1A1D]">
                  <h3 className="font-sans font-bold text-[#F2F2F2] flex items-center gap-2 mb-2">
                    <MdLink className="text-[#6E7A8A]" />
                    Nothing disappears
                  </h3>
                  <p className="text-base">
                    Posts stay connected and discoverable. External sources are
                    archived automatically. Your ideas don&apos;t get buried in
                    a feed after 24 hours — they last.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="sovereignty" className="mb-20 scroll-mt-24">
            <div className="flex items-baseline gap-4 mb-8 border-b border-[#1A1A1D] pb-4">
              <span className="font-mono text-[#6E7A8A] text-xs">03</span>
              <h2 className="text-2xl font-sans font-bold text-[#F2F2F2]">
                Built in Europe, owned by no one
              </h2>
            </div>
            <div className="prose prose-invert prose-lg text-[#A8A8AA] font-serif">
              <p>
                Citewalk is an independent European project. No venture capital,
                no ad revenue model, no data harvesting. We host everything in
                the EU under GDPR — because your data and your attention are not
                products to sell.
              </p>
              <p>
                Everything you publish is portable: RSS feeds for every profile,
                full data export, and zero advertising. You can leave anytime
                and take everything with you. No lock-in, ever.
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
