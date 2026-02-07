"use client";

import { MdMenuBook, MdCreate, MdForum } from "react-icons/md";

export function UserBenefits() {
  return (
    <section className="px-6 md:px-12 max-w-[1200px] mx-auto py-24 border-b border-[var(--divider)]">
      <div className="text-center mb-16">
        <h2 className="text-xs font-mono text-[var(--primary)] uppercase tracking-widest mb-4">
          Who it&apos;s for
        </h2>
        <h3 className="text-3xl font-serif text-[var(--foreground)]">
          Built for people who have something to say.
        </h3>
      </div>

      <div className="grid md:grid-cols-3 gap-12">
        {/* Writers & Essayists */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <MdMenuBook className="text-[var(--primary)] w-6 h-6" />
            <h4 className="text-xl font-medium text-[var(--foreground)]">
              Writers &amp; essayists
            </h4>
          </div>
          <p className="text-[var(--secondary)] leading-relaxed">
            Essays, analyses, opinion pieces, tutorials — in a clean
            markdown editor built for long-form thinking. Tag with{" "}
            <span className="text-[var(--topic)]">[[topics]]</span> and
            your writing reaches everyone who cares about that subject.
            No follower count required. Your posts stay discoverable
            permanently — they don&apos;t vanish after 24 hours.
          </p>
        </div>

        {/* Researchers & Analysts */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <MdCreate className="text-[var(--primary)] w-6 h-6" />
            <h4 className="text-xl font-medium text-[var(--foreground)]">
              Researchers &amp; analysts
            </h4>
          </div>
          <p className="text-[var(--secondary)] leading-relaxed">
            Cite sources with visible{" "}
            <span className="text-[var(--topic)]">[[citelinks]]</span> that
            readers can follow and verify. Build on existing work, and see
            who builds on yours. Think of it as academic references for the
            open web — every claim is traceable.
          </p>
        </div>

        {/* Curious readers */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <MdForum className="text-[var(--primary)] w-6 h-6" />
            <h4 className="text-xl font-medium text-[var(--foreground)]">
              Curious readers
            </h4>
          </div>
          <p className="text-[var(--secondary)] leading-relaxed">
            Follow topics you care about. Explore through citation chains
            where each post leads to related thinking. No algorithmic feed
            deciding what matters to you. You control your own discovery —
            and you can always see why something appeared.
          </p>
        </div>
      </div>
    </section>
  );
}
