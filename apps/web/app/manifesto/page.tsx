import Link from "next/link";
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
    <div className="min-h-screen bg-[#0B0B0C] text-[#F2F2F2]">
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center px-6 py-6 md:px-12 bg-[#0B0B0C]/80 backdrop-blur-md border-b border-[#1A1A1D]">
        <Link
          href="/"
          className="text-sm font-medium text-[#A8A8AA] hover:text-[#F2F2F2] transition-colors"
        >
          &larr; Back to Home
        </Link>
      </nav>

      <main className="max-w-[720px] mx-auto pt-40 pb-32 px-6">
        <header className="mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4 block opacity-80">
            The Manifesto
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-normal text-paper leading-[1.05] tracking-tight">
            The Algorithm
            <br />
            of Truth.
          </h1>
        </header>

        <article className="prose prose-invert prose-lg text-secondary max-w-none font-serif leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <p className="text-2xl md:text-3xl text-paper font-light mb-16 leading-tight tracking-tight">
            The internet was designed to be a library—a cathedral of connected
            mind. It has been strip-mined into a casino—a machine for addiction.
          </p>

          <section className="mb-20">
            <h3 className="text-paper font-normal text-3xl mb-6 tracking-tight border-l-2 border-primary pl-6">
              I. Verification over Virality
            </h3>
            <p className="text-lg opacity-90 mb-6">
              The dominant algorithm rewards the &quot;loudest&quot; voice. It
              measures engagement, which is a proxy for outrage. We built
              Citewalk to reward the &quot;referenced&quot; voice.
            </p>
            <p className="text-lg opacity-90">
              In science, truth is established by citation. In journalism, by
              sourcing. Why should social media be different? On Citewalk, you
              gain authority not by shouting, but by being cited.
            </p>
          </section>

          <section className="mb-20">
            <h3 className="text-paper font-normal text-3xl mb-6 tracking-tight border-l-2 border-primary pl-6">
              II. Context is Sovereign
            </h3>
            <p className="text-lg opacity-90 mb-6">
              Information without context is noise. A screenshot without a link
              is hearsay.
            </p>
            <p className="text-lg opacity-90">
              We automate the preservation of context. Every external link you
              post is snapshotted to the Internet Archive. Every claim can be
              traced back to its origin. We are building a web of trust that
              cannot be broken by 404 errors or deleted tweets.
            </p>
          </section>

          <section className="mb-20">
            <h3 className="text-paper font-normal text-3xl mb-6 tracking-tight border-l-2 border-primary pl-6">
              III. The User, Not The Product
            </h3>
            <p className="text-lg opacity-90 mb-6">
              If it&apos;s free, you are the product. If it&apos;s ad-supported,
              your attention is being sold to the highest bidder.
            </p>
            <p className="text-lg opacity-90">
              Citewalk is an independent European initiative. We host in
              Germany. We follow GDPR not because we have to, but because we
              believe in data sovereignty. Your data is yours—portable (RSS),
              exportable (JSON), and private. We will never sell it.
            </p>
          </section>

          <div className="my-20 p-12 border border-white/10 rounded-2xl bg-white/[0.02] text-center shadow-2xl backdrop-blur-sm">
            <p className="italic text-2xl text-paper mb-8 font-light leading-relaxed">
              &quot;We are building the internet we were promised. Quiet. True.
              Yours.&quot;
            </p>
            <div className="flex flex-col items-center gap-3">
              <span className="text-paper font-bold tracking-tight text-lg">
                Dr. Sebastian Lindner
              </span>
              <span className="text-[10px] text-tertiary uppercase tracking-[0.3em] font-bold">
                Founder • 2026
              </span>
            </div>
          </div>
        </article>

        <div className="mt-20 flex justify-center">
          <Link
            href="/sign-in"
            className="inline-block px-12 py-5 bg-[#F2F2F2] text-[#0B0B0C] font-semibold rounded-full hover:bg-white transition-all shadow-lg hover:shadow-white/10 text-lg"
          >
            Join the Network
          </Link>
        </div>
      </main>
    </div>
  );
}
