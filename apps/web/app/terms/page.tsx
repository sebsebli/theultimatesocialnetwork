export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-paper">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 tracking-tight">
          Terms of Service
        </h1>
        <p className="text-lg text-secondary">
          Effective Date: January 26, 2026
        </p>
      </header>

      <div className="prose prose-invert prose-p:text-secondary prose-headings:text-paper max-w-none">
        {/* 1 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            1. Scope, Agreement & Eligibility
          </h2>
          <p>
            These Terms of Service (“Terms”) govern the use of the platform and
            services operated by CITE (“CITE”, “we”, “us”, “Service”).
          </p>
          <p>
            By accessing or using the Service, you enter into a legally binding
            agreement pursuant to §§ 145 ff. BGB. You confirm that you are at
            least 16 years of age.
          </p>
          <p>
            If you act on behalf of a legal entity, you warrant that you are
            authorized to bind such entity.
          </p>
        </section>

        {/* 2 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">2. Modification of Terms</h2>
          <p>
            We may amend these Terms at any time for valid reasons, including
            legal, technical, economic, or operational necessity.
          </p>
          <p>
            Updated Terms become effective upon publication. Continued use of
            the Service after the effective date constitutes acceptance.
          </p>
          <p>
            Where required by mandatory law, users will be notified of material
            changes. Otherwise, no individual notice is owed.
          </p>
        </section>

        {/* 3 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            3. User Content & Legal Responsibility
          </h2>

          <h3 className="text-xl font-bold mb-2">
            3.1 Sole Responsibility for Content
          </h3>
          <p>
            Users are exclusively responsible for all content they upload, post,
            or transmit. CITE acts solely as a hosting provider within the
            meaning of Art. 6 Digital Services Act (DSA).
          </p>
          <p>
            CITE does not monitor content proactively and does not adopt user
            content as its own.
          </p>

          <h3 className="text-xl font-bold mb-2">3.2 Prohibited Content</h3>
          <p>
            Users may not post unlawful content, including but not limited to:
            criminal offenses under German law (e.g. Volksverhetzung, §130
            StGB), defamation, copyright violations, or terrorist content.
          </p>
          <p>
            CITE reserves the right to remove content and report users to
            competent authorities where legally required.
          </p>

          <h3 className="text-xl font-bold mb-2">3.3 No Harassment</h3>
          <p>
            Harassment, threats, doxxing, stalking, intimidation, or coordinated
            abuse are strictly prohibited. Enforcement is at CITE’s sole
            discretion.
          </p>

          <h3 className="text-xl font-bold mb-2">3.4 Indemnification</h3>
          <p>
            Users shall indemnify and hold harmless CITE from all third-party
            claims, damages, fines, costs, and legal fees arising from their
            content or breach of these Terms.
          </p>
        </section>

        {/* 4 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            4. Messaging & Data Security
          </h2>
          <p>
            The Service does not provide end-to-end encryption. Messages may be
            stored and processed in unencrypted or transport-encrypted form.
          </p>
          <p>
            Users are solely responsible for deciding what information they
            share. CITE assumes no liability for damages resulting from the
            nature of message storage.
          </p>
        </section>

        {/* 5 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            5. Service Availability, Termination & Shutdown
          </h2>

          <p>
            CITE operates the Service subject to technical, economic, and
            organizational feasibility. There is no entitlement to uninterrupted
            or permanent availability.
          </p>

          <h3 className="text-xl font-bold mb-2">5.1 Termination for Cause</h3>
          <p>
            We may suspend or terminate individual user accounts with immediate
            effect for good cause (<em>wichtiger Grund</em>), including but not
            limited to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Violation of these Terms or applicable law</li>
            <li>Abusive, harmful, or unlawful behavior</li>
            <li>Legal or regulatory requirements</li>
            <li>Security risks or misuse of the Service</li>
          </ul>

          <h3 className="text-xl font-bold mb-2">
            5.2 Termination for Operational or Economic Reasons
          </h3>
          <p>
            We reserve the right to suspend or permanently discontinue the
            Service, in whole or in part, if continued operation is no longer
            reasonable for us due to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Insufficient financial resources or unsustainable operating costs
              (e.g. server, infrastructure, or compliance costs)
            </li>
            <li>Technical infeasibility or security risks</li>
            <li>
              Business restructuring, strategic changes, or insolvency risk
            </li>
            <li>Legal, regulatory, or court orders</li>
          </ul>

          <p className="mt-4">
            In such cases, we may terminate user contracts with reasonable
            notice where required by mandatory law. Where notice is not legally
            required, termination may be immediate.
          </p>

          <h3 className="text-xl font-bold mb-2">
            5.3 No Liability for Shutdown
          </h3>
          <p>
            To the maximum extent permitted by law, CITE shall not be liable for
            any damages, losses, or disadvantages resulting from suspension,
            termination, or discontinuation of the Service, including loss of
            content or access.
          </p>

          <p>
            Users are responsible for exporting or backing up their data
            regularly.
          </p>
        </section>

        {/* 7 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            7. Governing Law & Jurisdiction
          </h2>
          <p>German law applies. CISG is excluded.</p>
          <p>
            Exclusive jurisdiction is Berlin, Germany, where legally
            permissible.
          </p>
        </section>

        {/* 8 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">8. Severability</h2>
          <p>
            Invalid provisions shall be replaced with legally permissible
            provisions closest to the intended economic purpose.
          </p>
        </section>

        <p className="text-sm text-tertiary mt-8">
          In case of discrepancies, the English version shall prevail.
        </p>
      </div>
    </div>
  );
}
