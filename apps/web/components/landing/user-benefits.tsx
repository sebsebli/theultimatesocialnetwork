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
          Where your ideas find their audience.
        </h3>
      </div>

      <div className="grid md:grid-cols-3 gap-12">
        {/* The Reader */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <MdMenuBook className="text-[#6E7A8A] w-6 h-6" />
            <h4 className="text-xl font-medium text-[#F2F2F2]">
              Your voice reaches its audience
            </h4>
          </div>
          <p className="text-[#A8A8AA] leading-relaxed">
            Your voice reaches its audience — post about{" "}
            <span className="text-[#E8B86D]">[[Cars]]</span> and everyone
            following Cars sees it, regardless of follower count.
          </p>
        </div>

        {/* The Writer */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <MdCreate className="text-[#6E7A8A] w-6 h-6" />
            <h4 className="text-xl font-medium text-[#F2F2F2]">
              Ideas grow together
            </h4>
          </div>
          <p className="text-[#A8A8AA] leading-relaxed">
            Ideas grow together — when someone builds on your post, both posts
            gain visibility through the citation chain.
          </p>
        </div>

        {/* The Community */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <MdForum className="text-[#6E7A8A] w-6 h-6" />
            <h4 className="text-xl font-medium text-[#F2F2F2]">
              Explore without surveillance
            </h4>
          </div>
          <p className="text-[#A8A8AA] leading-relaxed">
            Explore without surveillance — discover through topic connections
            and content structure, never through personality profiling.
            Everything is traceable — every reference, citation, and topic link
            creates a visible, navigable thread.
          </p>
        </div>
      </div>
    </section>
  );
}
