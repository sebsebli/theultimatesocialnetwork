"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const sections = [
  { id: "preamble", label: "Why we built this" },
  { id: "attention", label: "01. The problem" },
  { id: "intention", label: "02. A different network" },
  { id: "sovereignty", label: "03. European & independent" },
];

function useActiveSection() {
  const [activeId, setActiveId] = useState("preamble");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return activeId;
}

/** Desktop sidebar with scroll-aware active state (hidden on mobile). */
export function ManifestoSidebar() {
  const activeId = useActiveSection();

  return (
    <aside className="hidden md:block w-64 shrink-0 sticky top-32 h-[calc(100vh-8rem)]">
      <nav className="space-y-6 border-l border-[var(--divider)] pl-6">
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-[var(--primary)] uppercase tracking-widest">
            Contents
          </div>
          <ul className="space-y-3 text-sm font-sans">
            {sections.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={`block transition-colors duration-200 ${
                    activeId === id
                      ? "text-[var(--foreground)] font-medium"
                      : "text-[var(--secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-8 border-t border-[var(--divider)]">
          <div className="text-[10px] font-mono text-[var(--primary)] uppercase tracking-widest mb-4">
            Author
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--divider)]">
              <Image
                src="/sebastianlindner.jpeg"
                alt=""
                width={32}
                height={32}
              />
            </div>
            <div className="text-xs font-sans">
              <div className="text-[var(--foreground)]">Sebastian</div>
              <div className="text-[var(--tertiary)]">Founder</div>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}

/** Horizontal scrollable TOC for mobile (hidden on desktop). */
export function ManifestoMobileToc() {
  const activeId = useActiveSection();

  return (
    <div className="md:hidden flex gap-4 overflow-x-auto pb-4 mb-10 border-b border-[var(--divider)] scrollbar-none -mx-2 px-2">
      {sections.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className={`whitespace-nowrap text-sm transition-colors ${
            activeId === id
              ? "text-[var(--foreground)] font-medium"
              : "text-[var(--secondary)] hover:text-[var(--foreground)]"
          }`}
        >
          {label}
        </a>
      ))}
    </div>
  );
}
