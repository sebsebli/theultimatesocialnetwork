
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-paper">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 tracking-tight">Privacy Policy</h1>
        <p className="text-lg text-secondary">Last updated: January 26, 2026</p>
      </header>

      <div className="prose prose-invert prose-p:text-secondary prose-headings:text-paper max-w-none">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">1. Overview & Commitment</h2>
          <p className="mb-4">
            CITE ("we", "us") is built on a principle of data minimalism. We are a social network designed for reading and thinking, not for surveillance advertising. 
            We do not sell your data. We do not track you across the web. Our business model is based on optional paid subscriptions, not exploiting user behavior.
          </p>
          <p>
            This policy complies with the General Data Protection Regulation (GDPR) and explains strictly what we collect to provide the service.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">2. Data We Collect</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-2">2.1 Account Data</h3>
              <p>To create an account, we require an email address, a display name, and a unique handle. We use this strictly for authentication and profile display.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">2.2 User Content</h3>
              <p>Everything you post (Texts, Links, "Keeps", "Collections", Profile Bio) is stored to display it to you and other users. Public content is visible to the world. Protected accounts limit visibility to approved followers.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">2.3 Usage & Relevance Data</h3>
              <p>We collect internal usage signals to power the "Explore" and "Relevance" features. This includes:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Posts you read (view duration)</li>
                <li>Topics you follow</li>
                <li>Posts you quote or reply to</li>
              </ul>
              <p className="mt-2">This data is processed locally within our infrastructure to rank content. You can view and control these signals in your Settings under "Explore Relevance".</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">2.4 Technical Telemetry</h3>
              <p>We collect standard server logs (IP address, User Agent, Request Timestamp) strictly for security, rate limiting, and debugging. These logs are rotated and deleted regularly (typically 14-30 days).</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">3. Data Processors & Infrastructure</h2>
          <p className="mb-4">
            We host our infrastructure exclusively in the European Union to ensure strict data sovereignty.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Hetzner Online GmbH (Germany/Finland):</strong> Primary cloud infrastructure, database hosting, and object storage.</li>
            <li><strong>Supabase (Self-hosted/Managed):</strong> Authentication and database services.</li>
            <li><strong>Transactional Email Provider (EU-based):</strong> Strictly for sending login "magic links" and essential service notifications.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">4. AI & Automated Processing</h2>
          <p className="mb-4">
            We use Artificial Intelligence (Machine Learning) strictly for product utility, not for profiling.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Content Classification:</strong> We use local models to detect language (e.g., English vs. German) and potential spam/NSFW content.</li>
            <li><strong>Semantic Search:</strong> We may use vector embeddings to help you find relevant topics. This processing is automated and does not involve human review of your private data.</li>
          </ul>
          <p className="mt-4">
            See our <Link href="/ai-transparency" className="text-primary hover:underline">AI Transparency Statement</Link> for details on algorithms.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">5. Your Rights (GDPR)</h2>
          <p className="mb-4">You have full control over your data:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Right to Access:</strong> You can export your data archive in Settings.</li>
            <li><strong>Right to Erasure:</strong> You can delete your account at any time. This permanently removes your personal data from our active systems.</li>
            <li><strong>Right to Rectification:</strong> You can edit your profile and posts.</li>
            <li><strong>Right to Object:</strong> You can opt-out of optional processing (like open activity metrics) in Settings.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">6. Cookies & Local Storage</h2>
          <p>
            We use a single essential cookie (`token`) for authentication. We do not use third-party advertising cookies or cross-site trackers.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">7. Contact</h2>
          <p>
            For privacy concerns, Data Protection Officer contact, or legal inquiries, please check our <Link href="/imprint" className="text-primary hover:underline">Imprint</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
