import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-paper">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 tracking-tight">Terms of Service</h1>
        <p className="text-lg text-secondary">Effective Date: January 26, 2026</p>
      </header>

      <div className="prose prose-invert prose-p:text-secondary prose-headings:text-paper max-w-none">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">1. Agreement & Eligibility</h2>
          <p>
            By creating an account or using CITE ("Service"), you agree to these Terms. You represent that you are at least 16 years old. If you represent an entity, you certify you have authority to bind it.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">2. Usage & Content Liability</h2>
          <h3 className="text-xl font-bold mb-2">2.1 Strict User Responsibility</h3>
          <p>
            You are <strong>solely responsible</strong> for all content you post. CITE is a passive conduit for user content. We do not pre-screen or endorse any opinions.
          </p>
          <p>
            You agree NOT to post illegal content, including but not limited to: Hate Speech (Volksverhetzung), Defamation, Copyright Infringement, or Terrorist Propaganda. We will report criminal content to law enforcement (BKA/Europol) as required by the Digital Services Act (DSA).
          </p>

          <h3 className="text-xl font-bold mb-2">2.2 Indemnification</h3>
          <p>
            You agree to <strong>indemnify, defend, and hold harmless</strong> CITE, its officers, directors, and employees from any claims, liabilities, damages, losses, and expenses (including legal fees) arising out of or in any way connected with your violation of these Terms or your posting of any content.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">3. Service Rights & Termination</h2>
          <p>
            We reserve the absolute right to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Refuse service to anyone for any reason at any time.</li>
            <li>Remove content without notice.</li>
            <li>Terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</li>
            <li>Modify or discontinue the Service (or any part thereof) without notice.</li>
          </ul>
          <p className="mt-4">
            We shall not be liable to you or to any third party for any modification, price change, suspension, or discontinuance of the Service.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">4. Disclaimers & Limitation of Liability</h2>
          <h3 className="text-xl font-bold mb-2">4.1 "AS IS" Basis</h3>
          <p>
            The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.
          </p>

          <h3 className="text-xl font-bold mb-2">4.2 External Links</h3>
          <p>
            We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. You acknowledge and agree that CITE shall not be responsible or liable, directly or indirectly, for any damage or loss caused by your use of any such content.
          </p>

          <h3 className="text-xl font-bold mb-2">4.3 Liability Cap</h3>
          <p>
            To the maximum extent permitted by applicable law, in no event shall CITE be liable for any indirect, punitive, incidental, special, consequential, or exemplary damages.
          </p>
          <p>
            In jurisdictions where liability cannot be excluded, our total liability to you shall not exceed the amount you paid us in the past 12 months, or 50 EUR, whichever is greater.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">5. Dispute Resolution</h2>
          <h3 className="text-xl font-bold mb-2">5.1 Governing Law</h3>
          <p>
            These Terms shall be governed by the laws of the Federal Republic of Germany, without regard to its conflict of law provisions. The UN Convention on Contracts for the International Sale of Goods (CISG) is excluded.
          </p>

          <h3 className="text-xl font-bold mb-2">5.2 Venue</h3>
          <p>
            The exclusive place of jurisdiction for all disputes is Berlin, Germany, provided the user is a merchant, a legal entity under public law, or has no general place of jurisdiction in Germany.
          </p>

          <h3 className="text-xl font-bold mb-2">5.3 Class Action Waiver</h3>
          <p>
            Where permitted by law, you agree that you may bring claims against us only in your individual capacity and not as a plaintiff or class member in any purported class or representative action.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">6. Severability</h2>
          <p>
            If any provision of these Terms is held to be invalid or unenforceable, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law, and the remaining provisions will continue in full force and effect.
          </p>
        </section>
      </div>
    </div>
  );
}