"use client";

export function ComparisonTable() {
  const rows = [
    {
      feature: "What rises",
      feed: "Outrage, conflict, spectacle",
      citewalk: "The most-cited, most-referenced work",
    },
    {
      feature: "Who decides your feed",
      feed: "An algorithm optimizing for attention",
      citewalk: "You — via topics, people & relevance controls",
    },
    {
      feature: "How content connects",
      feed: "Isolated posts in an endless scroll",
      citewalk: "Visible citelinks & reference chains",
    },
    {
      feature: "How reach works",
      feed: "Follower count & algorithmic favor",
      citewalk: "Write about a topic, reach its audience",
    },
    {
      feature: "Revenue model",
      feed: "Sell your attention to advertisers",
      citewalk: "Optional Pro subscriptions",
    },
    {
      feature: "Data hosting",
      feed: "US-hosted, US-regulated",
      citewalk: "100% EU-hosted, GDPR by design",
    },
    {
      feature: "Data portability",
      feed: "Bare-minimum GDPR export",
      citewalk: "RSS feeds, full export, zero lock-in",
    },
    {
      feature: "Metrics",
      feed: "Public likes & follower counts",
      citewalk: "Citations are public; likes are private",
    },
    {
      feature: "What the network rewards",
      feed: "Be louder, more extreme, more viral",
      citewalk: "Be more thoughtful, more referenced",
    },
  ];

  return (
    <section className="px-6 md:px-12 max-w-[1000px] mx-auto py-24">
      <div className="text-center mb-16">
        <h2 className="text-xs font-mono text-[var(--primary)] uppercase tracking-widest mb-4">
          Comparison
        </h2>
        <h3 className="text-3xl font-serif text-[var(--foreground)]">
          The difference is structural
        </h3>
      </div>

      <div className="border border-[var(--divider)] rounded-lg overflow-hidden bg-white/5 backdrop-blur-sm">
        {/* Header */}
        <div className="grid grid-cols-3 border-b border-[var(--divider)] bg-[var(--divider)]/50 text-xs font-mono text-[var(--tertiary)] uppercase tracking-widest">
          <div className="p-4 pl-6">Feature</div>
          <div className="p-4 border-l border-[var(--divider)]">Big Tech</div>
          <div className="p-4 border-l border-[var(--divider)] text-[var(--foreground)]">
            Citewalk
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[var(--divider)]">
          {rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-3 group hover:bg-white/5 transition-colors text-sm"
            >
              <div className="p-4 pl-6 font-medium text-[var(--secondary)] flex items-center">
                {row.feature}
              </div>
              <div className="p-4 border-l border-[var(--divider)] text-[var(--tertiary)] flex items-center">
                {row.feed}
              </div>
              <div className="p-4 border-l border-[var(--divider)] text-[var(--foreground)] flex items-center font-medium bg-white/5">
                {row.citewalk}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
