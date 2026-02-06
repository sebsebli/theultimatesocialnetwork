import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="px-6 md:px-12 py-12 border-t border-[var(--divider)] bg-[var(--background)] relative z-10">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[var(--secondary)]">
            Citewalk
          </span>
          <div className="flex gap-4 text-xs text-[var(--tertiary)]">
            <span>Independent &amp; European</span>
            <span className="text-[var(--divider)]">&middot;</span>
            <span>No ads, no tracking</span>
            <span className="text-[var(--divider)]">&middot;</span>
            <span>EU-hosted</span>
          </div>
          <span className="text-xs text-[var(--divider)] mt-1">
            &copy; 2026 Sebastian
          </span>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--tertiary)]">
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
            href="/imprint"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Imprint
          </Link>
          <Link
            href="/privacy"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/community-guidelines"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Guidelines
          </Link>
          <Link
            href="/ai-transparency"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            AI Safety
          </Link>
          <a
            href="https://ko-fi.com/sebastianlindner"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
