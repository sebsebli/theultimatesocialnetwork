
export default function AiTransparencyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-paper">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 tracking-tight">AI Transparency</h1>
        <p className="text-lg text-secondary">Disclosure regarding algorithmic decision-making and AI usage.</p>
      </header>

      <div className="prose prose-invert prose-p:text-secondary prose-headings:text-paper max-w-none">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">1. Our Philosophy</h2>
          <p className="mb-4">
            CITE believes in "explainable social media." You should know why you see what you see. We do not use "black box" algorithms to manipulate your emotions or maximize time-on-site.
          </p>
          <p>
            In compliance with the EU AI Act, we disclose the following automated systems used on our platform.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">2. Recommender Systems (Explore)</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Purpose</h3>
              <p>To surface relevant topics, deep dives, and people in the "Explore" tab.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Logic & Inputs</h3>
              <p>Our recommendation engine uses a "Transparent Relevance" score based on:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Topic Overlap:</strong> Do you follow topics that this post links to?</li>
                <li><strong>Network Proximity:</strong> Is this post quoted by people you follow?</li>
                <li><strong>Velocity:</strong> Is this post being cited frequently right now?</li>
                <li><strong>Language:</strong> Does the post match your selected languages?</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Control</h3>
              <p>You can adjust the weights of these signals in your Settings > Explore Relevance.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">3. Content Safety & Moderation</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Purpose</h3>
              <p>To detect spam, illegal content, and enforce our safety guidelines.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Technology</h3>
              <p>
                We use text classification models (e.g., CLD3, fastText, or LLM-based classifiers) to flag high-probability violations.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Human Review</h3>
              <p>
                Automated flags on content are typically reviewed by human moderators before permanent account bans, except in clear-cut cases of automated spam.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">4. Generative AI</h2>
          <p>
            CITE is a platform for human thought. We do not use Generative AI to write posts or create fake users.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">5. Risk Classification</h2>
          <p>
            Under the EU AI Act, our systems are considered "limited risk." We do not use biometric identification, social scoring, or emotion recognition systems.
          </p>
        </section>
      </div>
    </div>
  );
}
