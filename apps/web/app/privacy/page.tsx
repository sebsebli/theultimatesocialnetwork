import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Citewalk",
  description: "Privacy Policy for Citewalk. Hosted in the EU, GDPR compliant.",
  alternates: {
    canonical: "https://citewalk.com/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-paper">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-lg text-secondary">
          Effective Date: January 31, 2026
        </p>
        <p className="text-sm text-tertiary mt-2">
          Regulation (EU) 2016/679 (GDPR)
        </p>
      </header>

      <div className="prose prose-invert prose-p:text-secondary prose-headings:text-paper max-w-none">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">1. Controller</h2>
          <p>Controller within the meaning of Art. 4(7) GDPR:</p>
          <p>
            <strong>Dr. Sebastian Lindner</strong>
            <br />
            c/o [Address Placeholder - Please update in production]
            <br />
            10115 Berlin, Germany
            <br />
            Email: hello@citewalk.com
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            2. Principles of Processing
          </h2>
          <p>
            We process personal data in accordance with Art. 5 GDPR, in
            particular lawfulness, purpose limitation, data minimization, and
            storage limitation.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            3. Categories of Data & Legal Bases
          </h2>

          <h3 className="text-xl font-bold mb-2">3.1 Account Data</h3>
          <p>
            <strong>Data:</strong> Email address, username, display name,
            password hash (if applicable), account settings.
          </p>
          <p>
            <strong>Legal Basis:</strong> Art. 6(1)(b) GDPR (contract
            performance).
          </p>

          <h3 className="text-xl font-bold mb-2">3.2 User Content</h3>
          <p>
            <strong>Data:</strong> Posts, replies, messages, profile
            information, collections.
          </p>
          <p>
            <strong>Legal Basis:</strong> Art. 6(1)(b) GDPR and Art. 6(1)(f)
            GDPR (legitimate interest in operating a communication platform).
          </p>

          <h3 className="text-xl font-bold mb-2">
            3.3 Technical & Security Data
          </h3>
          <p>
            <strong>Data:</strong> IP address, device information, access logs.
          </p>
          <p>
            <strong>Legal Basis:</strong> Art. 6(1)(f) GDPR (IT security, abuse
            prevention).
          </p>
          <p>
            <strong>Retention:</strong> Up to 14 days, unless required longer
            for security investigations or legal obligations.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">4. Processors & Hosting</h2>
          <p>We use processors bound by Art. 28 GDPR:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Hetzner Online GmbH</strong> (Hosting, Germany/Finland)
            </li>
            <li>
              <strong>Supabase</strong> (Database, EU region)
            </li>
            <li>Email providers (SMTP) for transactional emails only.</li>
          </ul>
          <p>We do not use US-based cloud providers for core data storage.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">6. Retention & Deletion</h2>
          <p>
            Personal data is deleted when no longer required for the purposes
            stated or upon account deletion, unless statutory retention
            obligations apply.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">8. Data Subject Rights</h2>
          <p>
            Users have rights under Arts. 15–21 GDPR (Access, Rectification,
            Erasure, Portability). Requests may be submitted via
            hello@citewalk.com.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            10. Automated Decisions & AI
          </h2>
          <p>
            No automated decision-making producing legal effects within the
            meaning of Art. 22 GDPR takes place.
          </p>
          <p>
            We do not use generative AI to create content on your behalf
            (&quot;No AI Dictation&quot;). AI is used solely for safety
            (spam/abuse detection) and optional recommendations, which are
            transparently labeled.
          </p>
        </section>
      </div>
    </div>
  );
}
