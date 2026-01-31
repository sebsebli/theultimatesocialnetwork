import type { Metadata } from "next";

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
    <div className="max-w-3xl mx-auto px-6 py-20 text-paper">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 tracking-tight">
          AI Transparency Statement
        </h1>
        <p className="text-lg text-secondary">
          Information pursuant to Regulation (EU) 2024/1689 (EU Artificial
          Intelligence Act)
        </p>
        <p className="text-sm text-tertiary mt-2">
          Operator: Dr. Sebastian Lindner (Private Initiative)
        </p>
      </header>

      <div className="prose prose-invert prose-p:text-secondary prose-headings:text-paper max-w-none">
        {/* 1 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            1. Regulatory Classification
          </h2>
          <p>
            Citewalk deploys algorithmic and machine-learning–based systems that
            fall within the categories of <strong>minimal risk</strong> or{" "}
            <strong>limited risk</strong> under the EU Artificial Intelligence
            Act.
          </p>
          <p className="text-primary font-semibold mt-4">
            Citewalk does not deploy AI systems classified as “high-risk” under
            Articles 6–7 of the EU AI Act.
          </p>
          <p className="mt-4">
            In particular, Citewalk does not use AI systems for:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Biometric identification or biometric categorization of natural
              persons
            </li>
            <li>Emotion recognition</li>
            <li>Creditworthiness, insurance, or financial risk assessment</li>
            <li>Employment, worker management, or educational assessment</li>
            <li>Operation of critical infrastructure</li>
          </ul>
        </section>

        {/* 2 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            2. Recommender Systems & Transparency (Art. 52)
          </h2>

          <h3 className="text-xl font-bold mb-2">System: Explore Feed</h3>
          <p>
            <strong>Purpose:</strong> To order and display publicly available
            content according to estimated relevance.
          </p>
          <p>
            <strong>Logic (High-Level):</strong> Content is ranked using
            weighted, non-sensitive signals such as:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>User-selected topic preferences</li>
            <li>Language compatibility</li>
            <li>Interaction patterns (e.g. views, citations, replies)</li>
            <li>Temporal relevance</li>
          </ul>
          <p className="mt-3">
            The system does <strong>not</strong> use special categories of
            personal data within the meaning of Art. 9 GDPR for profiling or
            ranking.
          </p>
        </section>

        {/* 3 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            3. Content Safety & Human Oversight
          </h2>

          <h3 className="text-xl font-bold mb-2">3.1 Automated Assistance</h3>
          <p>
            Citewalk uses automated classification systems to assist in
            detecting potential violations of platform rules, including spam,
            explicit content, and unlawful speech.
          </p>

          <h3 className="text-xl font-bold mb-2">3.2 Human-in-the-Loop</h3>
          <p>
            Automated systems do not make final or legally significant decisions
            concerning users.
          </p>
          <p>
            Enforcement actions such as content removal, account suspension, or
            termination are subject to human review, ensuring effective human
            oversight in accordance with Art. 14 and Recital 70 of the EU AI
            Act.
          </p>
        </section>

        {/* 4 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
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
          <h2 className="text-2xl font-bold mb-4">5. Evolution of Systems</h2>
          <p>
            Citewalk continuously evaluates its systems to ensure ongoing
            compliance with applicable AI regulation. This statement reflects
            the current state of deployed systems and may be updated as features
            evolve.
          </p>
        </section>

        <p className="text-sm text-tertiary mt-8">
          In case of discrepancies, the English version shall prevail.
        </p>
      </div>
    </div>
  );
}
