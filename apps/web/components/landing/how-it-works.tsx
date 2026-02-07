"use client";

import { MdEdit, MdLink, MdHub } from "react-icons/md";

export function HowItWorks() {
  return (
    <section className="px-6 md:px-12 max-w-[1400px] mx-auto py-24 border-b border-[#1A1A1D]">
      <div className="flex flex-col md:flex-row items-start justify-between gap-12 md:gap-8">
        <div className="md:w-1/4">
          <h2 className="text-xs font-mono text-[#6E7A8A] uppercase tracking-widest mb-4">
            How it works
          </h2>
          <h3 className="text-3xl font-serif text-[#F2F2F2] mb-4">
            Three steps
          </h3>
          <p className="text-[#A8A8AA] text-sm leading-relaxed">
            Write about what you know, build on what others share, and explore
            how ideas connect.
          </p>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection Lines (Desktop only) */}
          <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-gradient-to-r from-[#1A1A1D] via-[#6E7A8A] to-[#1A1A1D] opacity-30" />

          {/* Step 1 */}
          <div className="relative group">
            <div className="w-16 h-16 rounded-full bg-[#0B0B0C] border border-[#333] flex items-center justify-center mb-6 relative z-10 group-hover:border-[#F2F2F2] transition-colors">
              <MdEdit className="text-[#F2F2F2] w-6 h-6" />
            </div>
            <h4 className="text-[#F2F2F2] font-medium mb-2">
              1. Write about what you know
            </h4>
            <p className="text-[#6E6E73] text-xs leading-relaxed">
              Tag your post with{" "}
              <span className="text-[#E8B86D]">[[topics]]</span>. Everyone
              following that topic sees it — no follower count required.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative group">
            <div className="w-16 h-16 rounded-full bg-[#0B0B0C] border border-[#333] flex items-center justify-center mb-6 relative z-10 group-hover:border-[#F2F2F2] transition-colors">
              <MdLink className="text-[#F2F2F2] w-6 h-6" />
            </div>
            <h4 className="text-[#F2F2F2] font-medium mb-2">
              2. Build on what others share
            </h4>
            <p className="text-[#6E6E73] text-xs leading-relaxed">
              Reference other posts, cite sources, connect ideas. Every link
              creates a visible thread in the knowledge web.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative group">
            <div className="w-16 h-16 rounded-full bg-[#0B0B0C] border border-[#333] flex items-center justify-center mb-6 relative z-10 group-hover:border-[#F2F2F2] transition-colors">
              <MdHub className="text-[#F2F2F2] w-6 h-6" />
            </div>
            <h4 className="text-[#F2F2F2] font-medium mb-2">
              3. Explore how ideas connect
            </h4>
            <p className="text-[#6E6E73] text-xs leading-relaxed">
              Follow topics, not algorithms. Discover through connections
              between ideas, not through a profile built about you.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
