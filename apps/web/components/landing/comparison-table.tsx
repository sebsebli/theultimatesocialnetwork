"use client";

export function ComparisonTable() {
  const rows = [
    {
      feature: "Algorithm",
      feed: "Aggressive / Dopamine-looped",
      citewalk: "None / Chronological",
    },
    {
      feature: "Links",
      feed: "Buried / Link rot",
      citewalk: "Permanent / Snapshotted",
    },
    {
      feature: "Metrics",
      feed: "Public Likes (Vanity)",
      citewalk: "Citations (Authority)",
    },
    {
      feature: "Data Model",
      feed: "Ephemeral Feed",
      citewalk: "Persistent Graph",
    },
    {
      feature: "Ownership",
      feed: "Locked Garden",
      citewalk: "Exportable JSON / RSS",
    },
  ];

  return (
    <section className="px-6 md:px-12 max-w-[1000px] mx-auto py-24">
      <div className="text-center mb-16">
        <h2 className="text-xs font-mono text-[#6E7A8A] uppercase tracking-widest mb-4">
          Benchmark
        </h2>
        <h3 className="text-3xl font-serif text-[#F2F2F2]">
          System Comparison
        </h3>
      </div>

      <div className="border border-[#1A1A1D] rounded-lg overflow-hidden bg-[#0F0F10]/50 backdrop-blur-sm">
        {/* Header */}
        <div className="grid grid-cols-3 border-b border-[#1A1A1D] bg-[#1A1A1D]/50 text-xs font-mono text-[#6E6E73] uppercase tracking-widest">
          <div className="p-4 pl-6">Feature</div>
          <div className="p-4 border-l border-[#1A1A1D]">The Feed</div>
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
