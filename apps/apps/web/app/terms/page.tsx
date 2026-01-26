
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-paper">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 tracking-tight">Terms of Service</h1>
        <p className="text-lg text-secondary">Last updated: January 26, 2026</p>
      </header>

      <div className="prose prose-invert prose-p:text-secondary prose-headings:text-paper max-w-none">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using CITE ("the Service"), you agree to be bound by these Terms. If you do not agree, you must stop using the Service immediately.
          </p>
          <p>
            You must be at least 16 years old to use this Service.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">2. User Content & Conduct</h2>
          <h3 className="text-xl font-bold mb-2">2.1 Your Responsibility</h3>
          <p className="mb-4">
            You are solely responsible for the content (text, links, images) you post. You affirm that you own the rights to your content or have permission to post it.
          </p>
          <p className="mb-4">
            You agree NOT to post content that is illegal, defamatory, promotes violence, violates privacy, or infringes on intellectual property rights. We strictly enforce EU regulations regarding illegal hate speech and terrorist content (DSA).
          </p>

          <h3 className="text-xl font-bold mb-2">2.2 License Grant</h3>
          <p className="mb-4">
            You retain ownership of your content. By posting, you grant CITE a worldwide, non-exclusive, royalty-free license to host, copy, display, and distribute your content strictly for the purpose of operating the Service.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">3. Service Availability & Modifications</h2>
          <p className="mb-4">
            The Service is provided "AS IS" and "AS AVAILABLE".
          </p>
          <p className="mb-4">
            We reserve the right to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Modify or discontinue features at any time without notice.</li>
            <li>Change pricing for future premium features (with reasonable notice).</li>
            <li>Restrict or terminate your access if you violate these Terms or for any other reason at our sole discretion, to protect the integrity of the platform.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">4. Liability & Disclaimers</h2>
          <h3 className="text-xl font-bold mb-2">4.1 External Links</h3>
          <p className="mb-4">
            CITE is a network of links. We are not responsible for the content of external websites linked by users. The inclusion of any link does not imply endorsement.
          </p>

          <h3 className="text-xl font-bold mb-2">4.2 Limitation of Liability</h3>
          <p className="mb-4">
            To the maximum extent permitted by law, CITE and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill.
          </p>
          <p className="mb-4">
            In jurisdictions where liability cannot be fully disclaimed, our liability is limited to the amount you have paid us in the last 12 months, or 50 EUR, whichever is greater.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">5. Governing Law</h2>
          <p>
            These Terms are governed by the laws of Germany. The exclusive jurisdiction for any disputes is Berlin, Germany, unless mandatory consumer protection laws in your country of residence require otherwise.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">6. Changes to Terms</h2>
          <p>
            We may update these Terms. We will notify you of material changes via the Service or email. Continued use after changes constitutes acceptance.
          </p>
        </section>

         <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">7. Contact</h2>
          <p>
             Legal inquiries: See <Link href="/imprint" className="text-primary hover:underline">Imprint</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
