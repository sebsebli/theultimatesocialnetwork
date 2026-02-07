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
import { WebPageJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Why We Built This — Manifesto",
  description:
    "Why we built Citewalk. A social network where ideas connect and grow — where posts build on each other, topics organize content democratically, and discovery works through connections.",
  alternates: {
    canonical: "https://citewalk.com/manifesto",
  },
  openGraph: {
    title: "Why We Built Citewalk — Manifesto",
    description:
      "A social network where ideas connect and grow — where posts build on each other, topics organize content democratically, and discovery works through connections.",
    url: "https://citewalk.com/manifesto",
    type: "article",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Why We Built Citewalk — Manifesto",
    description:
      "A social network where ideas connect and grow — where posts build on each other, topics organize content democratically, and discovery works through connections.",
    images: ["/og-image.png"],
  },
};

export default async function ManifestoPage() {
  const token = (await cookies()).get("token")?.value;
  const isAuthenticated = !!token && token.length > 0;

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F2F2F2] font-serif selection:bg-[#F2F2F2] selection:text-[#0B0B0C]">
      <WebPageJsonLd
        title="Why We Built Citewalk — Manifesto"
        description="The European alternative to algorithm-driven social media — where good writing wins, not outrage."
        url="https://citewalk.com/manifesto"
        dateModified="2026-02-01"
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://citewalk.com" },
          { name: "Manifesto", url: "https://citewalk.com/manifesto" },
        ]}
      />
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
              Social media broke its promise. It was supposed to connect us to
              ideas, but algorithms turned it into an engagement machine.
              We&apos;re building something different — where ideas connect and
              grow.
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
                Social media was supposed to connect us to ideas. Instead,
                algorithms decide what you see based on engagement metrics —
                what gets clicked, what gets shared, what keeps you scrolling.
                Your ideas get buried unless they fit the algorithm&apos;s
                formula.
              </p>
              <p>
                What if posts weren&apos;t moments that disappear, but building
                blocks that others can build upon? What if your ideas reached
                people who care about the same topics, not just people who
                follow you? What if you could trace any piece of information
                back to its source, through visible connections?
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
                That&apos;s Citewalk — a social network where ideas connect and
                grow. Post about what you know, tag it to topics, and everyone
                following that topic sees it. Others can build on your posts,
                creating visible citation chains. Discovery works through how
                ideas connect, not through a profile built about you.
              </p>

              <div className="grid gap-6">
                <div className="bg-[#121215] p-6 rounded border border-[#1A1A1D]">
                  <h3 className="font-sans font-bold text-[#F2F2F2] flex items-center gap-2 mb-2">
                    <MdVerified className="text-[#6E7A8A]" />
                    Ideas build on ideas
                  </h3>
                  <p className="text-base">
                    Every post can reference other posts, creating a web of
                    connected knowledge. See what builds on what, follow
                    citation chains, and explore how ideas grow. Your posts
                    aren&apos;t isolated moments — they&apos;re building blocks
                    in a knowledge network.
                  </p>
                </div>

                <div className="bg-[#121215] p-6 rounded border border-[#1A1A1D]">
                  <h3 className="font-sans font-bold text-[#F2F2F2] flex items-center gap-2 mb-2">
                    <MdLink className="text-[#6E7A8A]" />
                    Topics organize content democratically
                  </h3>
                  <p className="text-base">
                    Tag your post with{" "}
                    <span className="text-[#E8B86D]">[[topics]]</span> and
                    everyone following that topic sees it — no follower count
                    required. Topics organize content by what it&apos;s about,
                    not by who posted it. Your ideas reach their audience.
                  </p>
                </div>

                <div className="bg-[#121215] p-6 rounded border border-[#1A1A1D]">
                  <h3 className="font-sans font-bold text-[#F2F2F2] flex items-center gap-2 mb-2">
                    <MdLink className="text-[#6E7A8A]" />
                    Discovery through connections, not profiling
                  </h3>
                  <p className="text-base">
                    Find new ideas by following citation chains, exploring topic
                    connections, and seeing how ideas relate to each other. No
                    algorithm building a profile about you. Discovery is
                    transparent and based on content structure, not user
                    behavior tracking.
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
                Built in Europe, independently, as a genuine alternative.
                Citewalk is 100% EU-hosted on renewable energy. No ads, no
                tracking, no selling your data. Independent and founder-operated
                — because your ideas and your attention are not products to
                sell.
              </p>
              <p>
                Everything you publish is portable: RSS feeds for every profile,
                full data export, and zero advertising. You can leave anytime
                and take everything with you. No lock-in, ever.
              </p>
            </div>
          </section>

          <section id="sustainability" className="mb-20 scroll-mt-24">
            <div className="flex items-baseline gap-4 mb-8 border-b border-[#1A1A1D] pb-4">
              <span className="font-mono text-[#6E7A8A] text-xs">04</span>
              <h2 className="text-2xl font-sans font-bold text-[#F2F2F2]">
                Sustained by its community, not advertisers
              </h2>
            </div>
            <div className="prose prose-invert prose-lg text-[#A8A8AA] font-serif space-y-8">
              <p>
                Most social networks are free because <em>you</em> are the
                product. They sell your attention to advertisers, which means
                they need algorithms to maximize engagement, which means your
                experience is optimized for their revenue — not for your ideas.
              </p>
              <p>
                We refuse that trade. Citewalk is free to use — posting,
                reading, following topics, and exploring connections costs
                nothing. We sustain the platform through optional{" "}
                <strong className="text-[#F2F2F2]">Citewalk Pro</strong>{" "}
                subscriptions that give power users advanced tools: citation
                analytics, extended formatting, priority features, and API
                access. If Citewalk adds value to your work, Pro is how you
                invest in keeping it independent.
              </p>

              <div className="grid gap-6">
                <div className="bg-[#121215] p-6 rounded border border-[#1A1A1D]">
                  <h3 className="font-sans font-bold text-[#F2F2F2] mb-2">
                    Why not ads?
                  </h3>
                  <p className="text-base">
                    Advertising requires engagement optimization, behavioral
                    tracking, and algorithmic feeds. The moment we take ad
                    money, we&apos;d need to build the exact machine we set out
                    to replace. No ads, ever.
                  </p>
                </div>

                <div className="bg-[#121215] p-6 rounded border border-[#1A1A1D]">
                  <h3 className="font-sans font-bold text-[#F2F2F2] mb-2">
                    Built to last
                  </h3>
                  <p className="text-base">
                    We&apos;re building a sustainable company — profitable
                    through honest value exchange, not through exploiting
                    attention. Whatever shape Citewalk takes as it grows, the
                    commitment stays the same: no ads, no behavioral tracking,
                    no algorithmic manipulation. Our users&apos; trust is the
                    foundation everything else is built on.
                  </p>
                </div>
              </div>
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
