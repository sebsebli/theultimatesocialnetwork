import Link from 'next/link';

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F2F2F2]">
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center px-6 py-6 md:px-12 bg-[#0B0B0C]/80 backdrop-blur-md border-b border-[#1A1A1D]">
        <Link href="/" className="text-sm font-medium text-[#A8A8AA] hover:text-[#F2F2F2] transition-colors">
          &larr; Back to Home
        </Link>
      </nav>

      <main className="max-w-[800px] mx-auto pt-32 pb-20 px-6">
        <header className="mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-normal text-[#F2F2F2] mb-6">Open Roadmap</h1>
          <p className="text-xl text-[#A8A8AA] font-light leading-relaxed">
            We build in public. This is what we are working on, what is coming next, and where we need your help.
          </p>
        </header>

        <div className="space-y-16">
          
          {/* Shipping Now */}
          <article>
            <div className="flex items-baseline gap-4 mb-8 border-b border-[#1A1A1D] pb-2">
              <h2 className="text-xl font-serif text-[#F2F2F2]">Shipping Now</h2>
              <span className="text-xs font-mono text-[#6E6E73] uppercase tracking-widest">Active Beta</span>
            </div>
            <ul className="space-y-6">
              <li className="group">
                <h3 className="text-lg font-medium text-[#F2F2F2] mb-2 group-hover:text-[#6E7A8A] transition-colors">Core Protocol</h3>
                <p className="text-[#A8A8AA]">Basic posting, replying, and the native citation graph structure. Inline wikilinks are fully functional.</p>
              </li>
              <li className="group">
                <h3 className="text-lg font-medium text-[#F2F2F2] mb-2 group-hover:text-[#6E7A8A] transition-colors">Private Metrics</h3>
                <p className="text-[#A8A8AA]">Like counts are visible only to the author. No public popularity contests.</p>
              </li>
              <li className="group">
                <h3 className="text-lg font-medium text-[#F2F2F2] mb-2 group-hover:text-[#6E7A8A] transition-colors">Chronological Feeds</h3>
                <p className="text-[#A8A8AA]">No algorithmic manipulation in the home feed. You see what you follow, in order.</p>
              </li>
            </ul>
          </article>

          {/* Up Next */}
          <article>
            <div className="flex items-baseline gap-4 mb-8 border-b border-[#1A1A1D] pb-2">
              <h2 className="text-xl font-serif text-[#F2F2F2]">Up Next</h2>
              <span className="text-xs font-mono text-[#6E6E73] uppercase tracking-widest">Q1 2026</span>
            </div>
            <ul className="space-y-6">
              <li className="group">
                <div className="flex items-center gap-3 mb-2">
                   <h3 className="text-lg font-medium text-[#F2F2F2]">RSS Feeds</h3>
                   <span className="px-2 py-0.5 rounded-full bg-[#1A1A1D] border border-[#333] text-[10px] text-[#A8A8AA] font-mono uppercase">In Progress</span>
                </div>
                <p className="text-[#A8A8AA]">Every public profile will have an RSS feed. We believe in the open web.</p>
              </li>
              <li className="group">
                <div className="flex items-center gap-3 mb-2">
                   <h3 className="text-lg font-medium text-[#F2F2F2]">Link Rot Prevention</h3>
                   <span className="px-2 py-0.5 rounded-full bg-[#1A1A1D] border border-[#333] text-[10px] text-[#A8A8AA] font-mono uppercase">Backend</span>
                </div>
                <p className="text-[#A8A8AA]">Automatic snapshotting of all cited external links via the Internet Archive. Context should never 404.</p>
              </li>
              <li className="group">
                <h3 className="text-lg font-medium text-[#F2F2F2] mb-2">Print Styles</h3>
                <p className="text-[#A8A8AA]">Optimized CSS for printing threads and articles. Digital to physical archival.</p>
              </li>
            </ul>
          </article>

          {/* Future Concepts */}
          <article>
            <div className="flex items-baseline gap-4 mb-8 border-b border-[#1A1A1D] pb-2">
              <h2 className="text-xl font-serif text-[#A8A8AA]">Future Concepts</h2>
              <span className="text-xs font-mono text-[#6E6E73] uppercase tracking-widest">Research</span>
            </div>
            <ul className="space-y-6 opacity-80">
              <li>
                <h3 className="text-lg font-medium text-[#A8A8AA] mb-2">Paid Pro Tier</h3>
                <p className="text-[#6E6E73]">Advanced search, analytics, and custom domain support. To sustain the network without ads.</p>
              </li>
              <li>
                <h3 className="text-lg font-medium text-[#A8A8AA] mb-2">Federation</h3>
                <p className="text-[#6E6E73]">Exploring ActivityPub compatibility to connect with Mastodon and the Fediverse.</p>
              </li>
            </ul>
          </article>

        </div>

        <div className="mt-20 pt-10 border-t border-[#1A1A1D] text-center">
           <p className="text-[#6E6E73] mb-6">Want to help build this?</p>
           <a href="mailto:build@cite.app" className="inline-block px-6 py-3 border border-[#333] rounded-full text-[#A8A8AA] hover:text-[#F2F2F2] hover:border-[#666] transition-colors">
              Contact the Founder
           </a>
        </div>
      </main>
    </div>
  );
}
