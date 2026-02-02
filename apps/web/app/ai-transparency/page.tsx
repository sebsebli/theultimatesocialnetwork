import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MdShield, MdVisibility } from "react-icons/md";

export const metadata: Metadata = {
  title: "AI Transparency | Citewalk",
  description:
    "AI Transparency Statement for Citewalk. Information pursuant to the EU Artificial Intelligence Act.",
  alternates: {
    canonical: "https://citewalk.com/ai-transparency",
  },
};

export default function AiTransparencyPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F2F2F2] font-sans selection:bg-[#F2F2F2] selection:text-[#0B0B0C]">
      {/* Technical Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#0B0B0C]/90 backdrop-blur border-b border-[#1A1A1D] h-14 flex items-center justify-between px-6 font-mono text-[10px] text-[#6E6E73] uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 hover:text-[#F2F2F2] transition-colors"
          >
            <Image
              src="/icon.png"
              alt="Citewalk"
              width={20}
              height={20}
              className="w-5 h-5 rounded opacity-80"
            />
            <span>&larr; INDEX</span>
          </Link>
          <span className="hidden sm:inline text-[#333]">|</span>
          <span className="hidden sm:inline">DOC: AI_ACT_DISCLOSURE.md</span>
        </div>
        <div>REG: EU-2024/1689</div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-12 border-b border-[#1A1A1D] pb-8">
          <h1 className="text-4xl md:text-5xl font-medium mb-4 tracking-tight text-[#F2F2F2]">
            AI Transparency Statement
          </h1>
          <div className="flex flex-col md:flex-row gap-4 md:items-center text-xs font-mono text-[#6E6E73] uppercase tracking-widest">
            <span>Compliance: Active</span>
            <span className="hidden md:inline text-[#333]">{"//"}</span>
            <span>Risk Level: Minimal/Limited</span>
          </div>
        </div>

        <div className="prose prose-invert prose-p:text-[#A8A8AA] prose-headings:text-[#F2F2F2] prose-headings:font-medium prose-a:text-[#F2F2F2] prose-strong:text-[#F2F2F2] max-w-none font-serif leading-relaxed">
          {/* 1 */}
          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              1. Regulatory Classification
            </h2>
            <div className="bg-[#121215] p-6 border border-[#1A1A1D] rounded mb-6">
              <div className="flex items-center gap-2 mb-2 text-emerald-500 font-mono text-sm font-bold uppercase">
                <MdShield />
                Status: Minimal Risk
              </div>
              <p className="text-sm">
                Citewalk deploys algorithmic and machine-learning–based systems
                that fall within the categories of <strong>minimal risk</strong>{" "}
                or <strong>limited risk</strong> under the EU Artificial
                Intelligence Act.
              </p>
            </div>

            <p className="text-[#F2F2F2] font-semibold mt-4 bg-[#1A1A1D]/50 p-2 inline-block">
              Citewalk does not deploy AI systems classified as “high-risk”
              under Articles 6–7 of the EU AI Act.
            </p>
            <p className="mt-4">
              In particular, Citewalk does not use AI systems for:
            </p>
            <ul className="list-disc pl-5 space-y-1 font-mono text-sm text-[#A8A8AA]">
              <li>Biometric identification or biometric categorization</li>
              <li>Emotion recognition</li>
              <li>Creditworthiness or financial risk assessment</li>
              <li>Employment or worker management</li>
              <li>Critical infrastructure control</li>
            </ul>
          </section>

          {/* 2 */}
          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              2. Recommender Systems & Transparency (Art. 52)
            </h2>

            <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8 flex items-center gap-2">
              <MdVisibility className="text-[#6E7A8A]" />
              System: Explore Feed
            </h3>
            <p>
              <strong>Purpose:</strong> To order and display publicly available
              content according to estimated relevance.
            </p>
            <p>
              <strong>Logic (High-Level):</strong> Content is ranked using
              weighted, non-sensitive signals such as:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 font-mono text-xs">
              <div className="border border-[#1A1A1D] p-3 rounded bg-[#0F0F10]">
                {"// Signal 1"}
                <div className="text-[#F2F2F2]">User-selected topics</div>
              </div>
              <div className="border border-[#1A1A1D] p-3 rounded bg-[#0F0F10]">
                {"// Signal 2"}
                <div className="text-[#F2F2F2]">Language compatibility</div>
              </div>
              <div className="border border-[#1A1A1D] p-3 rounded bg-[#0F0F10]">
                {"// Signal 3"}
                <div className="text-[#F2F2F2]">
                  Graph centrality (Citations)
                </div>
              </div>
              <div className="border border-[#1A1A1D] p-3 rounded bg-[#0F0F10]">
                {"// Signal 4"}
                <div className="text-[#F2F2F2]">Recency (Decay function)</div>
              </div>
            </div>
            <p className="mt-4">
              The system does <strong>not</strong> use special categories of
              personal data within the meaning of Art. 9 GDPR for profiling or
              ranking.
            </p>
          </section>

          {/* 3 */}
          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              3. Content Safety & Human Oversight
            </h2>

            <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
              3.1 Automated Assistance
            </h3>
            <p>
              Citewalk uses local-first automated classification systems
              (running on our own infrastructure, not sent to third parties) to
              assist in detecting potential violations of platform rules,
              including spam, explicit content, and unlawful speech.
            </p>

            <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
              3.2 Human-in-the-Loop
            </h3>
            <p>
              Automated systems do not make final or legally significant
              decisions concerning users.
            </p>
            <p>
              Enforcement actions such as content removal, account suspension,
              or termination are subject to human review, ensuring effective
              human oversight in accordance with Art. 14 and Recital 70 of the
              EU AI Act.
            </p>
          </section>

          {/* 4 */}
          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              4. Generative AI & Synthetic Content
            </h2>
            <p>
              At present, Citewalk does not use generative AI systems to
              autonomously create user posts, comments, or synthetic user
              identities.
            </p>
            <p className="mt-3">
              Should generative AI features be introduced in the future (e.g.
              summarization or drafting assistance), AI-generated output will be
              clearly labeled in accordance with Art. 52 EU AI Act.
            </p>
          </section>

          {/* 5 */}
          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              5. Evolution of Systems
            </h2>
            <p>
              Citewalk continuously evaluates its systems to ensure ongoing
              compliance with applicable AI regulation. This statement reflects
              the current state of deployed systems and may be updated as
              features evolve.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              6. Sustainability & Infrastructure
            </h2>
            <p>
              We are committed to minimizing the environmental impact of our
              digital infrastructure.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-4 font-mono text-sm text-[#A8A8AA]">
              <li>
                <strong>Local-First AI:</strong> We use small, efficient local
                models for content safety instead of energy-intensive large
                foundation models via API.
              </li>
              <li>
                <strong>Clean Hosting:</strong> Our infrastructure is hosted in
                EU data centers (Hetzner Finland/Germany) that prioritize
                renewable energy sources.
              </li>
              <li>
                <strong>Minimal Compute:</strong> The protocol design minimizes
                background processing and unnecessary engagement loops, reducing
                overall compute demand.
              </li>
            </ul>
          </section>

          <p className="text-xs font-mono text-[#6E6E73] mt-12 pt-4 border-t border-[#1A1A1D]">
            [SYSTEM NOTE]: In case of discrepancies, the English version shall
            prevail.
          </p>
        </div>
      </main>
    </div>
  );
}
