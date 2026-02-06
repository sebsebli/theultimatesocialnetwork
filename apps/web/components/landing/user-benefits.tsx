"use client";

import { MdMenuBook, MdCreate, MdForum } from "react-icons/md";

export function UserBenefits() {
  return (
    <section className="px-6 md:px-12 max-w-[1200px] mx-auto py-24 border-b border-[#1A1A1D]">
      <div className="text-center mb-16">
        <h2 className="text-xs font-mono text-[#6E7A8A] uppercase tracking-widest mb-4">
          Who it&apos;s for
        </h2>
        <h3 className="text-3xl font-serif text-[#F2F2F2]">
          For everyone tired of the algorithm.
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
            Discover ideas by topic, not by what an algorithm decided you should
            see. Follow writers for what they say — not how loud they say it.
          </p>
        </div>

        {/* The Writer */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <MdCreate className="text-[#6E7A8A] w-6 h-6" />
            <h4 className="text-xl font-medium text-[#F2F2F2]">The Writer</h4>
          </div>
          <p className="text-[#A8A8AA] leading-relaxed">
            Your posts stay discoverable long after you publish — not buried
            after a day. Export everything via RSS. Your work is yours, never
            locked into a platform.
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
            Discussions built on substance, not dunks. No rage bait, no
            pile-ons. A place where disagreement can be civil and ideas can
            actually be exchanged.
          </p>
        </div>
      </div>
    </section>
  );
}
