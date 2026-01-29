export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-paper">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-lg text-secondary">
          Effective Date: January 26, 2026
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
            Operator: [Your Full Legal Name], private individual
            <br />
            Sample Street 123
            <br />
            10115 Berlin, Germany
            <br />
            Email: legal@cite.social
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
            password hash, account settings.
          </p>
          <p>
            <strong>Legal Basis:</strong> Art. 6(1)(b) GDPR (contract
            performance).
          </p>

          <h3 className="text-xl font-bold mb-2">3.2 User Content</h3>
          <p>
            <strong>Data:</strong> Posts, replies, messages, profile
            information.
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

          <h3 className="text-xl font-bold mb-2">
            3.4 Internal Relevance Signals
          </h3>
          <p>
            <strong>Data:</strong> Interaction data, read signals, engagement
            metrics.
          </p>
          <p>
            <strong>Legal Basis:</strong> Art. 6(1)(f) GDPR or Art. 6(1)(a) GDPR
            (consent, where applicable).
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">4. Processors</h2>
          <p>We use processors bound by Art. 28 GDPR:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Hetzner Online GmbH (EU hosting)</li>
            <li>Supabase (EU region)</li>
            <li>Email and notification providers</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            5. International Transfers
          </h2>
          <p>
            Where data is transferred outside the EEA, appropriate safeguards
            such as EU Standard Contractual Clauses are applied (Art. 46 GDPR).
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">6. Retention & Deletion</h2>
          <p>
            Personal data is deleted when no longer required for the purposes
            stated or upon account deletion, unless statutory retention
            obligations apply.
          </p>
          <p>Backups may persist for a limited time for technical reasons.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            7. Service Termination or Shutdown
          </h2>
          <p>
            In the event of suspension or permanent shutdown of the Service
            (e.g. for economic or legal reasons), we will delete or anonymize
            personal data within a reasonable timeframe, unless retention is
            required by law.
          </p>
          <p>
            Users are responsible for exporting their data prior to shutdown.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">8. Data Subject Rights</h2>
          <p>
            Users have rights under Arts. 15–21 GDPR. Requests may be submitted
            via legal@cite.social.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">9. Supervisory Authority</h2>
          <p>Berliner Beauftragte für Datenschutz und Informationsfreiheit.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">10. Automated Decisions</h2>
          <p>
            No automated decision-making producing legal effects within the
            meaning of Art. 22 GDPR takes place.
          </p>
        </section>

        <p className="text-sm text-tertiary mt-8">
          In case of discrepancies, the English version shall prevail.
        </p>
      </div>
    </div>
  );
}
