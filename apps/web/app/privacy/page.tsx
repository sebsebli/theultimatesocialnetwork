import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-paper">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 tracking-tight">Privacy Policy</h1>
        <p className="text-lg text-secondary">Effective Date: January 26, 2026</p>
        <p className="text-sm text-tertiary mt-2"> compliant with Regulation (EU) 2016/679 (GDPR)</p>
      </header>

      <div className="prose prose-invert prose-p:text-secondary prose-headings:text-paper max-w-none">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">1. Data Controller</h2>
          <p className="mb-4">
            The responsible party (Controller) within the meaning of the GDPR is:
          </p>
          <p className="mb-2">
            <strong>Cite Systems GmbH</strong> (in formation)<br/>
            Sample Street 123<br/>
            10115 Berlin, Germany<br/>
            Email: legal@cite.social
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">2. Data Processing & Legal Basis</h2>
          <p className="mb-4">We process personal data only when we have a legal basis (Art. 6 GDPR).</p>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-2">2.1 Account & Identity</h3>
              <p><strong>Data:</strong> Email, Display Name, Handle, Password Hash (if applicable).</p>
              <p><strong>Purpose:</strong> To provide the Service and authentication.</p>
              <p><strong>Legal Basis:</strong> Art. 6(1)(b) GDPR (Contract Performance).</p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">2.2 User-Generated Content</h3>
              <p><strong>Data:</strong> Posts, Replies, Quotes, Collections, Bio.</p>
              <p><strong>Purpose:</strong> Publication and distribution as requested by the user.</p>
              <p><strong>Legal Basis:</strong> Art. 6(1)(b) GDPR (Contract Performance) and Art. 6(1)(f) GDPR (Legitimate Interest in freedom of expression).</p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">2.3 Technical Telemetry & Security</h3>
              <p><strong>Data:</strong> IP Address, User Agent, Request Timestamp, Error Logs.</p>
              <p><strong>Purpose:</strong> DDoS protection, fraud prevention, and debugging.</p>
              <p><strong>Legal Basis:</strong> Art. 6(1)(f) GDPR (Legitimate Interest in network security).</p>
              <p><strong>Retention:</strong> Logs are strictly rotated and deleted after 14 days unless required for evidence in a security incident.</p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">2.4 Relevance Signals (Internal)</h3>
              <p><strong>Data:</strong> Read time, scrolling behavior, interaction graph.</p>
              <p><strong>Purpose:</strong> To rank content in the "Explore" feed.</p>
              <p><strong>Legal Basis:</strong> Art. 6(1)(f) GDPR (Legitimate Interest in product improvement) or Art. 6(1)(a) GDPR (Consent, where applicable via Settings).</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">3. Data Processors (Third Parties)</h2>
          <p className="mb-4">
            We strictly limit data sharing. We use the following processors under Data Processing Agreements (DPAs) ensuring GDPR compliance:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Hetzner Online GmbH (Germany/Finland):</strong> Hosting, Database, Object Storage. (No data transfer outside EU).</li>
            <li><strong>Supabase (USA/EU):</strong> Authentication services. Data stored in EU-West (Frankfurt) region.</li>
            <li><strong>Transactional Email Provider (EU):</strong> Sending system emails (magic links).</li>
            <li><strong>Apple (APNs) & Google (FCM):</strong> Strictly for delivering push notifications to your device.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">4. International Transfers</h2>
          <p>
            We prioritize storage within the European Economic Area (EEA). If data is transferred to a third country (e.g., via a CDN or specific sub-processor), we ensure appropriate safeguards such as Standard Contractual Clauses (SCCs) adopted by the European Commission.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">5. Your Rights</h2>
          <p className="mb-4">Under the GDPR, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Access (Art. 15):</strong> Request a copy of your data.</li>
            <li><strong>Rectification (Art. 16):</strong> Correct inaccurate data.</li>
            <li><strong>Erasure / "Right to be Forgotten" (Art. 17):</strong> Delete your account and data.</li>
            <li><strong>Restriction (Art. 18):</strong> Pause processing in specific cases.</li>
            <li><strong>Data Portability (Art. 20):</strong> Receive your data in a structured, machine-readable format (JSON/CSV).</li>
            <li><strong>Objection (Art. 21):</strong> Object to processing based on legitimate interest.</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, email: legal@cite.social or use the "Data" section in Settings.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">6. Right to Lodge a Complaint</h2>
          <p>
            You have the right to lodge a complaint with a supervisory authority, in particular in the Member State of your habitual residence, place of work, or place of the alleged infringement.
          </p>
          <p className="mt-2">
            Our lead supervisory authority is: <strong>Berliner Beauftragte für Datenschutz und Informationsfreiheit</strong>.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">7. Automated Decision Making</h2>
          <p>
            We do not use automated decision-making or profiling that produces legal effects concerning you (Art. 22 GDPR). Our "Relevance" algorithms affect content ordering but do not restrict access to the service.
          </p>
        </section>
      </div>
    </div>
  );
}