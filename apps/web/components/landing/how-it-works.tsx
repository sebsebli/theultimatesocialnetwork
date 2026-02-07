"use client";

import { MdEdit, MdLink, MdHub } from "react-icons/md";

export function HowItWorks() {
  return (
    <section className="px-6 md:px-12 max-w-[1400px] mx-auto py-24 border-b border-[var(--divider)]">
      <div className="flex flex-col md:flex-row items-start justify-between gap-12 md:gap-8">
        <div className="md:w-1/4">
          <h2 className="text-xs font-mono text-[var(--primary)] uppercase tracking-widest mb-4">
            How it works
          </h2>
          <h3 className="text-3xl font-serif text-[var(--foreground)] mb-4">
            Simple by design
          </h3>
          <p className="text-[var(--secondary)] text-sm leading-relaxed">
            Write. Cite. Explore. The rest takes care of itself.
          </p>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection Lines (Desktop only) */}
          <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-gradient-to-r from-[var(--divider)] via-[var(--primary)] to-[var(--divider)] opacity-30" />

          {/* Step 1 */}
          <div className="relative group">
            <div className="w-16 h-16 rounded-full bg-[var(--background)] border border-[var(--divider)] flex items-center justify-center mb-6 relative z-10 group-hover:border-[var(--foreground)] transition-colors">
              <MdEdit className="text-[var(--foreground)] w-6 h-6" />
            </div>
            <h4 className="text-[var(--foreground)] font-medium mb-2">
              1. Write about what you know
            </h4>
            <p className="text-[var(--tertiary)] text-xs leading-relaxed">
              Tag your post with{" "}
              <span className="text-[var(--topic)]">[[topics]]</span>. Everyone
              following that topic sees it — regardless of who you are or how
              many followers you have.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative group">
            <div className="w-16 h-16 rounded-full bg-[var(--background)] border border-[var(--divider)] flex items-center justify-center mb-6 relative z-10 group-hover:border-[var(--foreground)] transition-colors">
              <MdLink className="text-[var(--foreground)] w-6 h-6" />
            </div>
            <h4 className="text-[var(--foreground)] font-medium mb-2">
              2. Cite what you&apos;re building on
            </h4>
            <p className="text-[var(--tertiary)] text-xs leading-relaxed">
              Reference other posts to show your sources. Every citation
              creates a visible connection — your readers see where
              you&apos;re coming from, and the original author sees who&apos;s
              building on their work.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative group">
            <div className="w-16 h-16 rounded-full bg-[var(--background)] border border-[var(--divider)] flex items-center justify-center mb-6 relative z-10 group-hover:border-[var(--foreground)] transition-colors">
              <MdHub className="text-[var(--foreground)] w-6 h-6" />
            </div>
            <h4 className="text-[var(--foreground)] font-medium mb-2">
              3. Follow where ideas lead
            </h4>
            <p className="text-[var(--tertiary)] text-xs leading-relaxed">
              Browse by topic. Trace citation chains. Discover related
              thinking through transparent connections — not through an
              algorithm deciding what you should see.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
