import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Manifesto | Citewalk",
  description:
    "Why we built Citewalk. A declaration for a sovereign, verified, and quiet internet.",
  alternates: {
    canonical: "https://citewalk.com/manifesto",
  },
};

export default function ManifestoPage() {
  return (
    <div className="min-h-screen bg-ink text-paper font-sans selection:bg-paper selection:text-ink overflow-x-hidden">
      <nav className="fixed top-0 inset-x-0 z-50 flex justify-between items-center px-6 py-4 md:px-12 bg-ink/95 backdrop-blur-sm border-b border-divider">
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
        <Link
          href="/"
          className="text-sm font-medium text-secondary hover:text-paper transition-colors"
        >
          &larr; Back to Home
        </Link>
      </nav>

      <main className="pt-32 md:pt-48 pb-32 px-6 md:px-12">
        <div className="max-w-[800px] mx-auto">
          <header className="mb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="text-xs font-mono uppercase tracking-widest text-tertiary mb-4 block">
              The Manifesto
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-medium leading-[1.05] tracking-tight text-paper">
              The Algorithm
              <br />
              of Truth.
            </h1>
          </header>

          <article className="prose prose-invert prose-lg text-secondary max-w-none font-serif leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            <p className="text-2xl md:text-3xl text-paper font-light mb-20 leading-tight tracking-tight border-l-4 border-paper pl-8">
              The internet was designed to be a library—a cathedral of connected
              mind. It has been strip-mined into a casino—a machine for
              addiction.
            </p>

            <section className="mb-24">
              <h2 className="text-paper font-sans font-bold text-sm uppercase tracking-widest mb-8 border-b border-divider pb-4">
                I. The Attention Economy is Broken
              </h2>
              <p className="text-xl mb-6 text-paper">
                We are living through a crisis of context.
              </p>
              <p className="mb-6">
                The dominant social platforms are built on the{" "}
                <strong className="text-paper">Attention Economy</strong>. Their
                business model relies on keeping you scrolling. To achieve this,
                they deploy algorithms optimized for engagement.
              </p>
              <p>
                But engagement is not truth. Engagement is often outrage, fear,
                or tribal signal-boosting. The result is a public square that
                rewards the loudest voice, not the most accurate one.
              </p>
            </section>

            <section className="mb-24">
              <h2 className="text-paper font-sans font-bold text-sm uppercase tracking-widest mb-8 border-b border-divider pb-4">
                II. The Intention Economy
              </h2>
              <p className="text-xl mb-6 text-paper">
                We are building the alternative: The{" "}
                <strong className="text-paper">Intention Economy</strong>.
              </p>
              <p className="mb-6">
                Citewalk is designed to respect your intelligence, not hack your
                dopamine receptors.
              </p>
              <ul className="list-none pl-0 space-y-6">
                <li className="flex gap-4">
                  <span className="text-tertiary font-mono text-sm font-bold">
                    01.
                  </span>
                  <span>
                    <strong className="text-paper">
                      Verification over Virality.
                    </strong>{" "}
                    In science, truth is established by citation. On Citewalk,
                    you gain authority not by shouting, but by being cited.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="text-tertiary font-mono text-sm font-bold">
                    02.
                  </span>
                  <span>
                    <strong className="text-paper">
                      Context is Sovereign.
                    </strong>{" "}
                    Information without context is noise. We automate the
                    preservation of context. Every external link you post is
                    snapshotted. We are building a web of trust that cannot be
                    broken by 404 errors.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="text-tertiary font-mono text-sm font-bold">
                    03.
                  </span>
                  <span>
                    <strong className="text-paper">Quiet by Design.</strong> No
                    public like counts. No gamified metrics. We removed the
                    scorecard so you can focus on the game.
                  </span>
                </li>
              </ul>
            </section>

            <section className="mb-24">
              <h2 className="text-paper font-sans font-bold text-sm uppercase tracking-widest mb-8 border-b border-divider pb-4">
                III. Digital Sovereignty
              </h2>
              <p className="text-xl mb-6 text-paper">
                The user is not the product. The user is the architect.
              </p>
              <p className="mb-6">
                Citewalk is an independent European initiative. We host in the
                EU. We follow GDPR not because we have to, but because we
                believe in data sovereignty as a fundamental human right.
              </p>
              <p>
                Your data is yours. It is portable (we revived RSS), exportable
                (JSON), and private. We will never sell it to advertisers or
                train black-box AI models on your private thoughts without
                consent.
              </p>
            </section>

            <div className="my-24 p-8 md:p-12 border border-divider rounded-xl bg-white/[0.02] text-center">
              <p className="italic text-xl md:text-2xl text-paper mb-10 font-serif font-light leading-relaxed">
                &quot;We&apos;re building the space that was meant to
                exist.&quot;
              </p>
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border border-divider">
                  <Image
                    src="/sebastianlindner.jpeg"
                    alt="Dr. Sebastian Lindner"
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-paper font-bold tracking-tight text-lg">
                  Dr. Sebastian Lindner
                </span>
                <span className="text-xs text-tertiary uppercase tracking-widest font-medium">
                  Founder • Germany, 2026
                </span>
              </div>
            </div>
          </article>

          <div className="flex justify-center pb-20">
            <Link
              href="/sign-in"
              className="inline-flex justify-center items-center px-12 py-5 bg-paper text-ink font-semibold text-lg rounded-full hover:bg-white transition-colors"
            >
              Join the Network
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
