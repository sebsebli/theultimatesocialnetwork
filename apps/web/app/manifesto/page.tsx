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
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center px-6 py-6 md:px-12 bg-[#0B0B0C]/90 backdrop-blur-md border-b border-[#1A1A1D]">
        <Link
          href="/"
          className="text-sm font-medium text-[#A8A8AA] hover:text-[#F2F2F2] transition-colors"
        >
          &larr; Back to Home
        </Link>
      </nav>

      <main className="max-w-[800px] mx-auto pt-40 pb-32 px-6">
        <header className="mb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#6E7A8A] mb-4 block opacity-80">
            The Manifesto
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-normal text-[#F2F2F2] leading-[1.05] tracking-tight">
            The Algorithm
            <br />
            of Truth.
          </h1>
        </header>

        <article className="prose prose-invert prose-lg text-[#A8A8AA] max-w-none font-serif leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <p className="text-2xl md:text-3xl text-[#F2F2F2] font-light mb-20 leading-tight tracking-tight border-l-4 border-[#F2F2F2] pl-8">
            The internet was designed to be a library—a cathedral of connected
            mind. It has been strip-mined into a casino—a machine for addiction.
          </p>

          <section className="mb-24">
            <h2 className="text-[#F2F2F2] font-sans font-bold text-sm uppercase tracking-widest mb-8 border-b border-[#1A1A1D] pb-4">
              I. The Attention Economy is Broken
            </h2>
            <p className="text-xl mb-6 text-[#F2F2F2]">
              We are living through a crisis of context.
            </p>
            <p className="mb-6">
              The dominant social platforms are built on the{" "}
              <strong>Attention Economy</strong>. Their business model relies on
              keeping you scrolling. To achieve this, they deploy algorithms
              optimized for engagement.
            </p>
            <p>
              But engagement is not truth. Engagement is often outrage, fear, or
              tribal signal-boosting. The result is a public square that rewards
              the loudest voice, not the most accurate one.
            </p>
          </section>

          <section className="mb-24">
            <h2 className="text-[#F2F2F2] font-sans font-bold text-sm uppercase tracking-widest mb-8 border-b border-[#1A1A1D] pb-4">
              II. The Intention Economy
            </h2>
            <p className="text-xl mb-6 text-[#F2F2F2]">
              We are building the alternative: The{" "}
              <strong>Intention Economy</strong>.
            </p>
            <p className="mb-6">
              Citewalk is designed to respect your intelligence, not hack your
              dopamine receptors.
            </p>
            <ul className="list-none pl-0 space-y-6">
              <li className="flex gap-4">
                <span className="text-[#6E7A8A] font-bold">01.</span>
                <span>
                  <strong>Verification over Virality.</strong> In science, truth
                  is established by citation. On Citewalk, you gain authority
                  not by shouting, but by being cited.
                </span>
              </li>
              <li className="flex gap-4">
                <span className="text-[#6E7A8A] font-bold">02.</span>
                <span>
                  <strong>Context is Sovereign.</strong> Information without
                  context is noise. We automate the preservation of context.
                  Every external link you post is snapshotted. We are building a
                  web of trust that cannot be broken by 404 errors.
                </span>
              </li>
              <li className="flex gap-4">
                <span className="text-[#6E7A8A] font-bold">03.</span>
                <span>
                  <strong>Quiet by Design.</strong> No public like counts. No
                  gamified metrics. We removed the scorecard so you can focus on
                  the game.
                </span>
              </li>
            </ul>
          </section>

          <section className="mb-24">
            <h2 className="text-[#F2F2F2] font-sans font-bold text-sm uppercase tracking-widest mb-8 border-b border-[#1A1A1D] pb-4">
              III. Digital Sovereignty
            </h2>
            <p className="text-xl mb-6 text-[#F2F2F2]">
              The user is not the product. The user is the architect.
            </p>
            <p className="mb-6">
              Citewalk is an independent European initiative. We host in Germany
              and Finland. We follow GDPR not because we have to, but because we
              believe in data sovereignty as a fundamental human right.
            </p>
            <p>
              Your data is yours. It is portable (RSS), exportable (JSON), and
              private. We will never sell it to advertisers or train black-box
              AI models on your private thoughts without consent.
            </p>
          </section>

          <div className="my-24 p-12 border border-[#1A1A1D] rounded-2xl bg-[#0F0F10] text-center shadow-2xl">
            <p className="italic text-2xl text-[#F2F2F2] mb-10 font-light leading-relaxed">
              &quot;We are building the internet we were promised. Quiet. True.
              Yours.&quot;
            </p>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-[#1A1A1D] rounded-full mb-4 overflow-hidden relative">
                {/* Placeholder for signature/avatar if needed, for now just abstract */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#6E7A8A] to-transparent opacity-20"></div>
              </div>
              <span className="text-[#F2F2F2] font-bold tracking-tight text-lg">
                Dr. Sebastian Lindner
              </span>
              <span className="text-[10px] text-[#6E6E73] uppercase tracking-[0.3em] font-bold">
                Founder • Berlin, 2026
              </span>
            </div>
          </div>
        </article>

        <div className="flex justify-center pb-20">
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
