import Link from "next/link";

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

      <main className="max-w-[700px] mx-auto pt-40 pb-32 px-6">
        <header className="mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4 block opacity-80">
            The Manifesto
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-normal text-paper leading-[1.05] tracking-tight">
            The Digital
            <br />
            Commonwealth.
          </h1>
        </header>

        <article className="prose prose-invert prose-lg text-secondary max-w-none font-serif leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <p className="text-2xl md:text-3xl text-paper font-light mb-16 leading-tight tracking-tight">
            The internet was born as a library—a place of connected knowledge.
            It has become a casino—a place of addictive noise.
          </p>

          <section className="mb-16">
            <h3 className="text-paper font-normal text-3xl mb-6 tracking-tight">
              I. Context over Content
            </h3>
            <p className="text-lg opacity-90">
              We are drowning in &quot;content&quot;—ephemeral, disconnected,
              designed to be consumed and forgotten. We are starving for
              &quot;context&quot;—information that is connected, sourced, and
              part of a larger whole. On Citewalk, nothing stands alone. Every
              thought is a node in a graph.
            </p>
          </section>

          <section className="mb-16">
            <h3 className="text-paper font-normal text-3xl mb-6 tracking-tight">
              II. Verification over Virality
            </h3>
            <p className="text-lg opacity-90">
              The current algorithm rewards the loudest voice. We reward the
              referenced voice. If you want to be heard, say something worth
              citing. If you want to be trusted, Citewalk your sources. We
              automatically archive every external link you post to the Wayback
              Machine, ensuring your citations never rot. Truth requires
              permanence.
            </p>
          </section>

          <section className="mb-16">
            <h3 className="text-paper font-normal text-3xl mb-6 tracking-tight">
              III. The User as Sovereign
            </h3>
            <p className="text-lg opacity-90">
              You are not a pair of eyeballs to be sold. You are a citizen of
              this network. Your data is yours (exportable JSON/CSV). Your
              timeline is yours (chronological). Your mind is yours (no ads). We
              charge for tools, not for access to your psychology.
            </p>
          </section>

          <div className="my-20 p-10 border border-white/10 rounded-2xl bg-white/[0.02] text-center shadow-2xl backdrop-blur-sm">
            <p className="italic text-xl text-paper mb-8 font-light leading-relaxed">
              &quot;History is written by those who write. Join us in writing a
              better one.&quot;
            </p>
            <div className="flex flex-col items-center gap-3">
              <span className="text-paper font-bold tracking-tight text-lg">
                Sebastian Lindner
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
            className="inline-block px-10 py-4 bg-[#F2F2F2] text-[#0B0B0C] font-semibold rounded-full hover:bg-white transition-all shadow-lg hover:shadow-white/10"
          >
            Sign the Manifesto (Join Beta)
          </Link>
        </div>
      </main>
    </div>
  );
}
