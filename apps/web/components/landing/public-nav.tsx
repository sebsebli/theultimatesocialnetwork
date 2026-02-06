"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MdMenu, MdClose } from "react-icons/md";
import { useBetaMode } from "@/context/beta-mode-provider";

interface PublicNavProps {
  isAuthenticated?: boolean;
}

export function PublicNav({ isAuthenticated }: PublicNavProps) {
  const { betaMode } = useBetaMode();
  const [menuOpen, setMenuOpen] = useState(false);

  const ctaHref = isAuthenticated
    ? "/home"
    : betaMode
      ? "/waiting-list"
      : "/sign-in";
  const ctaLabel = isAuthenticated ? "Dashboard" : "Sign In";

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--divider)]">
      <div className="flex justify-between items-center px-6 py-4 md:px-12">
        <Link href="/" className="flex items-center gap-3 group relative z-50">
          <Image
            src="/icon.png"
            alt="Citewalk"
            width={32}
            height={32}
            className="w-8 h-8 rounded-md opacity-90 group-hover:opacity-100 transition-opacity"
          />
          <span className="text-sm font-medium tracking-tight text-[var(--foreground)] font-serif">
            Citewalk
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm text-[var(--secondary)]">
          <Link
            href="/manifesto"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            About
          </Link>
          <Link
            href="/roadmap"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Roadmap
          </Link>
          <Link
            href={ctaHref}
            className="text-[var(--foreground)] border border-[var(--divider)] px-4 py-1.5 rounded hover:bg-[var(--divider)] transition-colors"
          >
            {ctaLabel}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors p-1 relative z-50"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--divider)] bg-[var(--background)]/95 backdrop-blur-md px-6 py-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <Link
            href="/manifesto"
            className="block text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors py-2"
            onClick={() => setMenuOpen(false)}
          >
            About
          </Link>
          <Link
            href="/roadmap"
            className="block text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors py-2"
            onClick={() => setMenuOpen(false)}
          >
            Roadmap
          </Link>
          <Link
            href={ctaHref}
            className="block text-center text-[var(--foreground)] border border-[var(--divider)] px-4 py-2.5 rounded hover:bg-[var(--divider)] transition-colors mt-4"
            onClick={() => setMenuOpen(false)}
          >
            {ctaLabel}
          </Link>
        </div>
      )}
    </nav>
  );
}
