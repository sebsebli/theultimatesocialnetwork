"use client";

import { MdMenuBook, MdCreate, MdForum } from "react-icons/md";

export function UserBenefits() {
  return (
    <section className="px-6 md:px-12 max-w-[1200px] mx-auto py-24 border-b border-[#1A1A1D]">
      <div className="text-center mb-16">
        <h2 className="text-xs font-mono text-[#6E7A8A] uppercase tracking-widest mb-4">
          Ecosystem
        </h2>
        <h3 className="text-3xl font-serif text-[#F2F2F2]">
          For everyone who reads.
        </h3>
      </div>

      <div className="grid md:grid-cols-3 gap-12">
        {/* The Reader */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <MdMenuBook className="text-[#6E7A8A] w-6 h-6" />
            <h4 className="text-xl font-medium text-[#F2F2F2]">The Reader</h4>
          </div>
          <p className="text-[#A8A8AA] leading-relaxed">
            Escape the doomscroll. Build a personal library of ideas, not just a
            feed of fleeting moments. Follow topics, not just influencers.
          </p>
        </div>

        {/* The Writer */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <MdCreate className="text-[#6E7A8A] w-6 h-6" />
            <h4 className="text-xl font-medium text-[#F2F2F2]">The Writer</h4>
          </div>
          <p className="text-[#A8A8AA] leading-relaxed">
            Write posts that last. Your work is indexed by topic and context,
            ensuring it remains discoverable long after the initial publish
            date. Plus, native RSS feeds for every profile.
          </p>
        </div>

        {/* The Community */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <MdForum className="text-[#6E7A8A] w-6 h-6" />
            <h4 className="text-xl font-medium text-[#F2F2F2]">
              The Community
            </h4>
          </div>
          <p className="text-[#A8A8AA] leading-relaxed">
            Debate without the noise. Threaded conversations and citations
            encourage nuanced discussion rather than shout-matches.
          </p>
        </div>
      </div>
    </section>
  );
}
