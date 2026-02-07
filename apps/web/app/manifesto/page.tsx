import { cookies } from "next/headers";
import type { Metadata } from "next";
import { MdVerified, MdHub } from "react-icons/md";
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
    "The platforms that promised to connect us have made us louder, angrier, and lonelier. They work exactly as designed. This is what we're building against.",
  alternates: {
    canonical: "https://citewalk.com/manifesto",
  },
  openGraph: {
    title: "Why We Built Citewalk — Manifesto",
    description:
      "The platforms that promised to connect us have made us louder, angrier, and lonelier. They work exactly as designed. This is what we're building against.",
    url: "https://citewalk.com/manifesto",
    type: "article",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Why We Built Citewalk — Manifesto",
    description:
      "The platforms that promised to connect us have made us louder, angrier, and lonelier. They work exactly as designed. This is what we're building against.",
    images: ["/og-image.png"],
  },
};

export default async function ManifestoPage() {
  const token = (await cookies()).get("token")?.value;
  const isAuthenticated = !!token && token.length > 0;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-serif selection:bg-[var(--foreground)] selection:text-[var(--background)]">
      <WebPageJsonLd
        title="Why We Built Citewalk — Manifesto"
        description="The platforms that promised to connect us have made us louder, angrier, and lonelier. They work exactly as designed. This is what we're building against."
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
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-sans font-semibold leading-[1.1] tracking-tight mb-12 text-[var(--foreground)]">
              Why we <br />
              <span className="text-[var(--primary)] italic">built this.</span>
            </h1>

            <p className="text-xl md:text-2xl leading-relaxed text-[var(--secondary)] border-l-2 border-[var(--primary)] pl-8 py-2">
              The platforms that promised to connect us have made us louder,
              angrier, and lonelier instead. They didn&apos;t break by
              accident — they work exactly as designed. This is what we are
              building against.
            </p>
          </section>

          <section id="attention" className="mb-20 scroll-mt-24">
            <div className="flex items-baseline gap-4 mb-8 border-b border-[var(--divider)] pb-4">
              <span className="font-mono text-[var(--primary)] text-xs">01</span>
              <h2 className="text-2xl font-sans font-semibold text-[var(--foreground)]">
                The machine that rewards the loudest voice
              </h2>
            </div>
            <div className="prose prose-invert prose-lg text-[var(--secondary)] font-serif space-y-6">
              <p>
                Social media was supposed to democratize discourse. Instead, it
                industrialized it. The platforms we use every day are not designed
                to surface the best ideas — they are designed to maximize the time
                you spend scrolling. And what keeps you scrolling is not nuance,
                depth, or truth. It is outrage, conflict, and spectacle.
              </p>
              <p>
                The loudest voice in the room goes viral. The most provocative
                take gets amplified. The person who simplifies a complex issue
                into a slogan reaches millions, while the person who actually
                understands it reaches dozens. This is not a bug — this is the
                core mechanic. Engagement optimization <em>is</em> outrage
                optimization. The algorithm does not care whether what you see
                is true, useful, or good for you. It cares whether you react.
              </p>
              <p>
                The result is a system that actively <em>rewards</em> pushing
                society apart. Every divisive post that generates angry replies
                is a success in the eyes of the algorithm. Every nuanced post
                that people quietly read and think about is a failure. The
                incentive structure is pathological: be more extreme, be more
                simplistic, be more inflammatory — and you will be heard. Be
                thoughtful, and you will be invisible.
              </p>
              <p>
                Meanwhile, these platforms have turned human connection into
                performance. We don&apos;t share what we think — we curate what
                we want others to see. Social media has produced a generation
                that measures its worth in likes, that confuses followers with
                friends, that performs authenticity rather than practising it.
                The mental health data is no longer debatable: these platforms
                are making people — especially young people — measurably
                more anxious, more depressed, more lonely.
              </p>
              <p>
                And now, the final stage: your feed is no longer shaped by
                what other humans share. It is shaped by what an AI model
                predicts will keep <em>you specifically</em> engaged the longest.
                Not what you need to know. Not what would make you smarter or
                more informed. What will keep you tapping. We are not
                discovering ideas anymore — we are being fed content, optimized
                for our weaknesses, by systems whose only goal is to prevent us
                from putting the phone down.
              </p>
              <p>
                The collective cost is staggering. Public discourse is coarser.
                Societies are more polarized. We are swimming in more
                information than any generation in history, and yet we feel
                less informed, less capable of distinguishing signal from noise.
                We are, by almost every measure, getting worse at thinking
                together — precisely because the tools we use to think together
                were designed to do something else entirely.
              </p>
            </div>
          </section>

          <section id="intention" className="mb-20 scroll-mt-24">
            <div className="flex items-baseline gap-4 mb-8 border-b border-[var(--divider)] pb-4">
              <span className="font-mono text-[var(--primary)] text-xs">02</span>
              <h2 className="text-2xl font-sans font-semibold text-[var(--foreground)]">
                Why citation changes everything
              </h2>
            </div>
            <div className="prose prose-invert prose-lg text-[var(--secondary)] font-serif space-y-6">
              <p>
                These are not moral failures. They are structural ones. The
                platforms work as their incentives dictate. To build something
                better, you cannot simply add moderation or tweak an algorithm.
                You have to change how content relates to other content — and
                how people find it.
              </p>
              <p>
                That is what Citewalk does.{" "}
                <strong className="text-[var(--foreground)]">If every post can
                  explicitly cite the posts it builds upon, the entire incentive
                  structure changes.</strong> When you write on Citewalk, you
                reference other posts using{" "}
                <span className="text-[var(--topic)]">[[citelinks]]</span>.
                These are not hidden hyperlinks — they are visible, structural
                connections that both author and reader can see and follow.
              </p>
              <p>
                This changes what gets rewarded. On a platform optimized for
                reactions, the most inflammatory content wins. On a platform
                where credibility is measured by <em>how often others build on
                  your work</em>, thoughtful content wins. Being cited is harder
                to game than being liked. It requires someone to invest the
                effort of writing something new that references you — which
                means your original post had to be worth building on. Substance
                accumulates. Spectacle does not.
              </p>
              <p>
                Citation also creates transparency. Every post carries its
                sources visibly. You can trace any claim back through its
                reference chain. You can see who built on a post, and what they
                added. This is the opposite of the black-box feed: on Citewalk,
                the entire path from idea to idea is navigable. Nothing is
                hidden by an algorithm. Everything connects visibly.
              </p>
            </div>

            <div className="mt-10 space-y-8">
              <h3 className="font-sans font-semibold text-lg text-[var(--foreground)]">
                How this works in practice
              </h3>
              <div className="grid gap-6">
                <div className="bg-white/5 p-6 rounded border border-[var(--divider)]">
                  <h4 className="font-sans font-semibold text-[var(--foreground)] flex items-center gap-2 mb-2">
                    <MdVerified className="text-[var(--primary)]" />
                    Posts that build on each other
                  </h4>
                  <p className="text-base text-[var(--secondary)]">
                    Write essays, short thoughts, analyses, tutorials, or
                    opinions — then reference other posts with{" "}
                    <span className="text-[var(--topic)]">[[citelinks]]</span>{" "}
                    to show what you&apos;re building on. Your readers see your
                    sources. The original author sees who built on their work.
                    Over time, a growing web of connected knowledge takes shape.
                  </p>
                </div>

                <div className="bg-white/5 p-6 rounded border border-[var(--divider)]">
                  <h4 className="font-sans font-semibold text-[var(--foreground)] flex items-center gap-2 mb-2">
                    <MdVerified className="text-[var(--primary)]" />
                    Topics level the playing field
                  </h4>
                  <p className="text-base text-[var(--secondary)]">
                    Tag your post with{" "}
                    <span className="text-[var(--topic)]">[[topics]]</span> and
                    everyone following that topic sees it — regardless of your
                    follower count. A first-time writer and a veteran with
                    thousands of followers reach the same audience when they
                    write about the same subject. Content is organized by{" "}
                    <em>what it says</em>, not by who said it.
                  </p>
                </div>

                <div className="bg-white/5 p-6 rounded border border-[var(--divider)]">
                  <h4 className="font-sans font-semibold text-[var(--foreground)] flex items-center gap-2 mb-2">
                    <MdHub className="text-[var(--primary)]" />
                    Discovery you control
                  </h4>
                  <p className="text-base text-[var(--secondary)]">
                    Your feed is chronological, built from the topics and
                    people you choose to follow. Explore through citation
                    chains — follow where ideas lead. An optional relevance
                    system can surface interesting content, but it is fully
                    transparent and fully adjustable. You always see why
                    something appeared — and you can turn it off entirely.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="sovereignty" className="mb-20 scroll-mt-24">
            <div className="flex items-baseline gap-4 mb-8 border-b border-[var(--divider)] pb-4">
              <span className="font-mono text-[var(--primary)] text-xs">03</span>
              <h2 className="text-2xl font-sans font-semibold text-[var(--foreground)]">
                Built in Europe, independent by design
              </h2>
            </div>
            <div className="prose prose-invert prose-lg text-[var(--secondary)] font-serif space-y-6">
              <p>
                The dominant platforms are products of a specific environment:
                Silicon Valley venture capital demanding exponential growth, US
                data practices treating privacy as an afterthought, and a market
                logic that treats users as inventory to monetize. Citewalk is
                built from a different foundation entirely.
              </p>
              <p>
                We are 100% EU-hosted, independently operated, with no venture
                capital demanding growth at any cost. This is not a marketing
                claim — it is a structural decision. VC-funded platforms must
                eventually satisfy investors who expect returns measured in
                billions, which inevitably means advertising, which inevitably
                means engagement optimization, which inevitably means
                manipulation. We chose independence to avoid that trap entirely.
              </p>
              <p>
                Europe has built the most comprehensive digital rights framework
                in the world: the GDPR, the Digital Services Act, the AI Act.
                We do not treat these as compliance burdens — we treat them as
                design principles. Privacy by default. Transparent content
                moderation. AI systems that are disclosed and controllable.
                These are not constraints on our product. They are the product.
              </p>
              <p>
                Everything you publish on Citewalk is portable. Every profile
                has an RSS feed. Full data export is always available. You can
                leave anytime and take everything with you. No lock-in, ever.
                If we fail to serve you well, leaving should be easy — that is
                the accountability we owe our users, and the pressure that keeps
                us honest.
              </p>
            </div>
          </section>

          <section id="sustainability" className="mb-20 scroll-mt-24">
            <div className="flex items-baseline gap-4 mb-8 border-b border-[var(--divider)] pb-4">
              <span className="font-mono text-[var(--primary)] text-xs">04</span>
              <h2 className="text-2xl font-sans font-semibold text-[var(--foreground)]">
                Sustained by its community, not advertisers
              </h2>
            </div>
            <div className="prose prose-invert prose-lg text-[var(--secondary)] font-serif space-y-8">
              <p>
                The business model <em>is</em> the product design. When a
                platform sells advertising, it must maximize attention. To
                maximize attention, it must optimize for engagement. To optimize
                for engagement, it must show you what provokes you — not what
                informs you. Every design decision follows from the revenue
                model. This is why free, ad-supported social networks converge
                on the same toxic patterns regardless of their founders&apos;
                intentions.
              </p>
              <p>
                Citewalk is free to use — posting, reading, following topics,
                and exploring connections costs nothing. We sustain the platform
                through optional{" "}
                <strong className="text-[var(--foreground)]">Citewalk Pro</strong>{" "}
                subscriptions that give power users advanced tools: citation
                analytics, extended formatting, priority features, and API
                access. If Citewalk adds value to your intellectual life, Pro
                is how you invest in keeping it independent.
              </p>

              <div className="grid gap-6">
                <div className="bg-white/5 p-6 rounded border border-[var(--divider)]">
                  <h3 className="font-sans font-semibold text-[var(--foreground)] mb-2">
                    Why not ads?
                  </h3>
                  <p className="text-base">
                    Advertising requires engagement optimization, behavioral
                    tracking, and algorithmic feeds. The moment we take ad money,
                    we would need to build the exact machine we set out to
                    replace. The incentives are incompatible. No ads, ever.
                  </p>
                </div>

                <div className="bg-white/5 p-6 rounded border border-[var(--divider)]">
                  <h3 className="font-sans font-semibold text-[var(--foreground)] mb-2">
                    Built to last
                  </h3>
                  <p className="text-base">
                    We are building a company that proves social platforms can be
                    profitable without exploiting their users. Whatever shape
                    Citewalk takes as it grows, the commitment remains: no ads,
                    no behavioral tracking, no algorithmic manipulation of your
                    attention. The trust of our users is not leverage — it is the
                    foundation.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="vision" className="mb-20 scroll-mt-24">
            <div className="flex items-baseline gap-4 mb-8 border-b border-[var(--divider)] pb-4">
              <span className="font-mono text-[var(--primary)] text-xs">05</span>
              <h2 className="text-2xl font-sans font-semibold text-[var(--foreground)]">
                What we&apos;re building toward
              </h2>
            </div>
            <div className="prose prose-invert prose-lg text-[var(--secondary)] font-serif space-y-6">
              <p>
                Imagine a version of the internet where the most-cited essay on
                climate policy gets more visibility than the most inflammatory
                tweet about it. Where a first-time writer with a genuinely
                original idea reaches the same audience as an established voice.
                Where you can trace any claim through a visible chain of
                sources, and where no algorithm is secretly deciding what you
                should be angry about today.
              </p>
              <p>
                That is what we are building. Not a utopia — a tool with
                better structural incentives. The current platforms did not
                make us worse because their founders were villains. They made
                us worse because the structure rewards the wrong things.
                Change the structure, and you change what rises.
              </p>
              <p>
                Citewalk is early. We are small, independent, and building in
                the open. We will make mistakes. Some assumptions will turn out
                to be wrong, and we will adapt. But the core commitment will
                not change: a social network that makes its users more
                informed, not less. Substance over noise. Transparency over
                manipulation. Your attention is yours — not ours to sell.
              </p>
              <p className="text-xl leading-relaxed text-[var(--foreground)] border-l-2 border-[var(--primary)] pl-8 py-2 not-prose">
                The internet does not need another feed. It needs one that
                makes you smarter.
              </p>
            </div>
          </section>

          <div className="pt-12 border-t border-[var(--divider)] flex justify-between items-center">
            <div className="text-sm font-sans text-[var(--tertiary)]">
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
