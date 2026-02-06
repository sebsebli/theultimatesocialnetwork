"use client";

export function ComparisonTable() {
  const rows = [
    {
      feature: "What you see",
      feed: "Algorithm decides for you",
      citewalk: "Chronological, you decide",
    },
    {
      feature: "What gets rewarded",
      feed: "Outrage & volume",
      citewalk: "Substance & references",
    },
    {
      feature: "Content lifespan",
      feed: "Gone in 24 hours",
      citewalk: "Permanent & discoverable",
    },
    {
      feature: "Hosting",
      feed: "US / opaque",
      citewalk: "EU-hosted, GDPR by design",
    },
    {
      feature: "Your data",
      feed: "Platform-locked",
      citewalk: "Full export + RSS",
    },
    {
      feature: "Business model",
      feed: "Ads & your attention",
      citewalk: "Free core, no ads ever",
    },
  ];

  return (
    <section className="px-6 md:px-12 max-w-[1000px] mx-auto py-24">
      <div className="text-center mb-16">
        <h2 className="text-xs font-mono text-[#6E7A8A] uppercase tracking-widest mb-4">
          Comparison
        </h2>
        <h3 className="text-3xl font-serif text-[#F2F2F2]">
          How Citewalk is different
        </h3>
      </div>

      <div className="border border-[#1A1A1D] rounded-lg overflow-hidden bg-[#0F0F10]/50 backdrop-blur-sm">
        {/* Header */}
        <div className="grid grid-cols-3 border-b border-[#1A1A1D] bg-[#1A1A1D]/50 text-xs font-mono text-[#6E6E73] uppercase tracking-widest">
          <div className="p-4 pl-6">Feature</div>
          <div className="p-4 border-l border-[#1A1A1D]">Big Tech</div>
          <div className="p-4 border-l border-[#1A1A1D] text-[#F2F2F2]">
            Citewalk
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#1A1A1D]">
          {rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-3 group hover:bg-[#1A1A1D]/30 transition-colors text-sm"
            >
              <div className="p-4 pl-6 font-medium text-[#A8A8AA] flex items-center">
                {row.feature}
              </div>
              <div className="p-4 border-l border-[#1A1A1D] text-[#6E6E73] flex items-center">
                {row.feed}
              </div>
              <div className="p-4 border-l border-[#1A1A1D] text-[#F2F2F2] flex items-center font-medium bg-[#1A1A1D]/10">
                {row.citewalk}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
