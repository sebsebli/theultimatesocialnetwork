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
            Post, connect your sources, and let your ideas reach people who
            actually care.
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
            <h4 className="text-[#F2F2F2] font-medium mb-2">1. Post</h4>
            <p className="text-[#6E6E73] text-xs leading-relaxed">
              Share your thoughts in a clean, distraction-free editor. Short
              takes or long reads — no character limits holding you back.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative group">
            <div className="w-16 h-16 rounded-full bg-[#0B0B0C] border border-[#333] flex items-center justify-center mb-6 relative z-10 group-hover:border-[#F2F2F2] transition-colors">
              <MdLink className="text-[#F2F2F2] w-6 h-6" />
            </div>
            <h4 className="text-[#F2F2F2] font-medium mb-2">2. Connect</h4>
            <p className="text-[#6E6E73] text-xs leading-relaxed">
              Link to topics, other posts, or external sources with{" "}
              <span className="text-[#E8B86D]">[[citelinks]]</span> and
              @mentions. Everything stays connected.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative group">
            <div className="w-16 h-16 rounded-full bg-[#0B0B0C] border border-[#333] flex items-center justify-center mb-6 relative z-10 group-hover:border-[#F2F2F2] transition-colors">
              <MdHub className="text-[#F2F2F2] w-6 h-6" />
            </div>
            <h4 className="text-[#F2F2F2] font-medium mb-2">3. Grow</h4>
            <p className="text-[#6E6E73] text-xs leading-relaxed">
              When others reference your work, your reach grows naturally. No
              gaming, no tricks — just credibility earned by writing things
              worth sharing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
