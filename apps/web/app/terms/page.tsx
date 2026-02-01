import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Citewalk",
  description:
    "Terms of service for Citewalk, operated by Dr. Sebastian Lindner.",
  alternates: {
    canonical: "https://citewalk.com/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-paper">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 tracking-tight">
          Terms of Service
        </h1>
        <p className="text-lg text-secondary">
          Effective Date: January 31, 2026
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
            services operated by <strong>Dr. Sebastian Lindner</strong>{" "}
            (“Operator”, “we”, “us”), accessible via the domain{" "}
            <strong>citewalk.com</strong> and the associated mobile applications
            (“Service”).
          </p>
          <p>
            By accessing or using the Service, you enter into a legally binding
            agreement pursuant to §§ 145 ff. BGB. You confirm that you are at
            least 16 years of age.
          </p>
          <p>
            The Service is operated as a personal initiative by the Operator and
            is not affiliated with any corporation or external company at this
            time.
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
            or transmit. The Operator acts solely as a hosting provider within
            the meaning of Art. 6 Digital Services Act (DSA).
          </p>
          <p>
            We do not monitor content proactively and do not adopt user content
            as our own.
          </p>

          <h3 className="text-xl font-bold mb-2">3.2 Prohibited Content</h3>
          <p>
            Users may not post unlawful content, including but not limited to:
            criminal offenses under German law (e.g. Volksverhetzung, §130
            StGB), defamation, copyright violations, or terrorist content.
          </p>
          <p>
            We reserve the right to remove content and report users to competent
            authorities where legally required.
          </p>

          <h3 className="text-xl font-bold mb-2">
            3.3 Prohibited Conduct & Permanent Ban
          </h3>
          <p>
            The following conduct is strictly forbidden: harassment, threats,
            doxxing, stalking, intimidation, coordinated abuse, excessive
            advertising, spamming, and mistreating other users or third
            parties.
          </p>
          <p>
            Violations may result in content removal, temporary suspension, or
            a <strong>permanent ban</strong> of your account. Enforcement is at
            our sole discretion.
          </p>

          <h3 className="text-xl font-bold mb-2">3.4 Indemnification</h3>
          <p>
            Users shall indemnify and hold harmless the Operator from all
            third-party claims, damages, fines, costs, and legal fees arising
            from their content or breach of these Terms.
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
            share. We assume no liability for damages resulting from the nature
            of message storage.
          </p>
        </section>

        {/* 5 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            5. Service Availability, Termination & Shutdown
          </h2>

          <p>
            The Service is operated subject to technical, economic, and
            organizational feasibility. There is no entitlement to uninterrupted
            or permanent availability.
          </p>

          <h3 className="text-xl font-bold mb-2">5.1 Termination for Cause</h3>
          <p>
            We may suspend or terminate individual user accounts with immediate
            effect for good cause (<em>wichtiger Grund</em>).
          </p>

          <h3 className="text-xl font-bold mb-2">
            5.2 Termination for Operational or Economic Reasons
          </h3>
          <p>
            We reserve the right to suspend or permanently discontinue the
            Service, in whole or in part, if continued operation is no longer
            reasonable due to financial, technical, or legal reasons.
          </p>

          <h3 className="text-xl font-bold mb-2">
            5.3 No Liability for Shutdown
          </h3>
          <p>
            To the maximum extent permitted by law, the Operator shall not be
            liable for any damages, losses, or disadvantages resulting from
            suspension, termination, or discontinuation of the Service.
          </p>

          <p>
            Users are responsible for exporting or backing up their data
            regularly using the provided Data Export tools.
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
      </div>
    </div>
  );
}
