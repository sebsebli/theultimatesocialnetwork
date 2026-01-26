import Link from 'next/link';

export default function ManifestoPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F2F2F2]">
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center px-6 py-6 md:px-12 bg-[#0B0B0C]/80 backdrop-blur-md border-b border-[#1A1A1D]">
        <Link href="/" className="text-sm font-medium text-[#A8A8AA] hover:text-[#F2F2F2] transition-colors">
          &larr; Back to Home
        </Link>
      </nav>

      <main className="max-w-[700px] mx-auto pt-40 pb-32 px-6">
        <header className="mb-20">
          <span className="text-xs font-mono uppercase tracking-widest text-[#6E6E73] mb-4 block">The Manifesto</span>
          <h1 className="text-4xl md:text-6xl font-serif font-normal text-[#F2F2F2] leading-[1.1]">
            The Digital Commonwealth.
          </h1>
        </header>

        <article className="prose prose-invert prose-lg text-[#A8A8AA] max-w-none font-serif leading-relaxed">
          <p className="text-xl md:text-2xl text-[#F2F2F2] font-light mb-12">
            The internet was born as a library—a place of connected knowledge. It has become a casino—a place of addictive noise.
          </p>

          <h3 className="text-[#F2F2F2] font-normal text-2xl mt-16 mb-6">I. Context over Content</h3>
          <p>
            We are drowning in "content"—ephemeral, disconnected, designed to be consumed and forgotten. We are starving for "context"—information that is connected, sourced, and part of a larger whole. 
            On Cite, nothing stands alone. Every thought is a node in a graph.
          </p>

          <h3 className="text-[#F2F2F2] font-normal text-2xl mt-16 mb-6">II. Verification over Virality</h3>
          <p>
            The current algorithm rewards the loudest voice. We reward the referenced voice. 
            If you want to be heard, say something worth citing. If you want to be trusted, cite your sources. 
            We automatically archive every external link you post to the Wayback Machine, ensuring your citations never rot. Truth requires permanence.
          </p>

          <h3 className="text-[#F2F2F2] font-normal text-2xl mt-16 mb-6">III. The User as Sovereign</h3>
          <p>
            You are not a pair of eyeballs to be sold. You are a citizen of this network. 
            Your data is yours (exportable JSON/CSV). Your timeline is yours (chronological). Your mind is yours (no ads).
            We charge for tools, not for access to your psychology.
          </p>

          <div className="my-16 p-8 border border-[#333] rounded-lg bg-[#0F0F10] text-center">
            <p className="italic text-lg text-[#F2F2F2] mb-6">
              "History is written by those who write. Join us in writing a better one."
            </p>
            <div className="flex flex-col items-center gap-2">
               <span className="text-[#F2F2F2] font-medium">Sebastian Lindner</span>
               <span className="text-xs text-[#6E6E73] uppercase tracking-widest">Founder</span>
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
