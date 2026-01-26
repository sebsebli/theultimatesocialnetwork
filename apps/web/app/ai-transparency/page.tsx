export default function AiTransparencyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-paper">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 tracking-tight">AI Transparency Statement</h1>
        <p className="text-lg text-secondary">Compliance with the EU Artificial Intelligence Act</p>
      </header>

      <div className="prose prose-invert prose-p:text-secondary prose-headings:text-paper max-w-none">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">1. Regulatory Classification</h2>
          <p className="mb-4">
            Under the EU AI Act, CITE uses systems classified as <strong>Limited Risk</strong> or <strong>Minimal Risk</strong>.
          </p>
          <p className="mb-4 text-primary">
            <strong>WE DO NOT USE HIGH-RISK AI SYSTEMS.</strong>
          </p>
          <p>
            Specifically, we do <strong>not</strong> use AI for:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Biometric identification or categorization.</li>
            <li>Management of critical infrastructure.</li>
            <li>Employment or educational scoring.</li>
            <li>Credit scoring or risk assessment for insurance.</li>
            <li>Emotion recognition.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">2. Recommender Systems (Art. 52 Transparency)</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-2">System: "Explore Feed"</h3>
              <p>
                <strong>Function:</strong> Ranks posts based on relevance to user interests.
              </p>
              <p>
                <strong>Logic:</strong> The system computes a "Relevance Score" using non-sensitive inputs: Topic subscriptions, Language match, and Citation velocity.
              </p>
              <p>
                <strong>Data Used:</strong> User interaction history (clicks, quotes) and content metadata. No sensitive personal data (health, political, religious) is used for profiling.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">3. Content Safety (Human Oversight)</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Automated Detection</h3>
              <p>
                We use standard machine learning classifiers to flag potential Spam, Nudity, or Hate Speech.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Human-in-the-Loop</h3>
              <p>
                Automated systems do <strong>not</strong> have the final authority to ban legitimate users. Flagged content is queued for human review. Decisions to terminate accounts for content violations are made by human moderators, ensuring "Effective Human Oversight" as per the AI Act.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">4. Generative AI Disclaimer</h2>
          <p>
            CITE is a human-first platform. We do not use Generative AI (LLMs) to synthesize posts, comments, or fake user profiles. If we introduce generative features (e.g., "Summarize this thread"), they will be clearly labeled as AI-generated.
          </p>
        </section>
      </div>
    </div>
  );
}