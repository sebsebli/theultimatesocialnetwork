import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { TermsContentDE } from "./de";
import { PublicFooter } from "@/components/landing/public-footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of service for Citewalk, the European social network. Operated by Dr. Sebastian Lindner. Fair terms, no surprises.",
  alternates: {
    canonical: "https://citewalk.com/terms",
  },
  openGraph: {
    title: "Terms of Service — Citewalk",
    description:
      "Terms of service for Citewalk, the European social network. Fair terms, no surprises.",
    url: "https://citewalk.com/terms",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service — Citewalk",
    description: "Terms of service for Citewalk, the European social network.",
  },
};

export default async function TermsPage() {
  const locale = await getLocale();
  const isGerman = locale === "de";

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F2F2F2] font-sans selection:bg-[#F2F2F2] selection:text-[#0B0B0C]">
      {/* Technical Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#0B0B0C]/90 backdrop-blur border-b border-[#1A1A1D] h-14 flex items-center justify-between px-6 font-mono text-[10px] text-[#6E6E73] uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 hover:text-[#F2F2F2] transition-colors"
          >
            <Image
              src="/logo_transparent.png"
              alt="Citewalk"
              width={20}
              height={20}
              className="w-5 h-5 rounded opacity-80"
            />
            <span>&larr; INDEX</span>
          </Link>
          <span className="hidden sm:inline text-[#333]">|</span>
          <span className="hidden sm:inline">DOC: TERMS_OF_SERVICE.md</span>
        </div>
        <div>REV: 2026-01-31</div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-12 border-b border-[#1A1A1D] pb-8">
          <h1 className="text-4xl md:text-5xl font-medium mb-4 tracking-tight text-[#F2F2F2]">
            {isGerman ? "Nutzungsbedingungen" : "Terms of Service"}
          </h1>
          <div className="flex flex-col md:flex-row gap-4 md:items-center text-xs font-mono text-[#6E6E73] uppercase tracking-widest">
            <span>Effective: Jan 31, 2026</span>
            <span className="hidden md:inline text-[#333]">{"//"}</span>
            <span>Jurisdiction: Berlin, DE</span>
          </div>
        </div>

        <div className="prose prose-invert prose-p:text-[#A8A8AA] prose-headings:text-[#F2F2F2] prose-headings:font-medium prose-a:text-[#F2F2F2] prose-strong:text-[#F2F2F2] max-w-none font-serif leading-relaxed">
          {isGerman ? (
            <TermsContentDE />
          ) : (
            <>
              {/* 1 */}
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  1. Scope, Agreement & Eligibility
                </h2>
                <p>
                  These Terms of Service (“Terms”) govern the use of the
                  platform and services operated by{" "}
                  <strong>Dr. Sebastian Lindner</strong> (“Operator”, “we”,
                  “us”), accessible via the domain <strong>citewalk.com</strong>{" "}
                  and the associated mobile applications (“Service”).
                </p>
                <p>
                  By accessing or using the Service, you enter into a legally
                  binding agreement pursuant to §§ 145 ff. BGB. You confirm that
                  you are at least 16 years of age.
                </p>
                <p>
                  The Service is operated as a personal initiative by the
                  Operator and is not affiliated with any corporation or
                  external company at this time.
                </p>
              </section>

              {/* 2 */}
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  2. Modification of Terms
                </h2>
                <p>
                  We may amend these Terms at any time for valid reasons,
                  including legal, technical, economic, or operational
                  necessity.
                </p>
                <p>
                  Updated Terms become effective upon publication. Continued use
                  of the Service after the effective date constitutes
                  acceptance.
                </p>
              </section>

              {/* 3 */}
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  3. User Content & Legal Responsibility
                </h2>

                <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
                  3.1 Sole Responsibility for Content
                </h3>
                <p>
                  Users are exclusively responsible for all content they upload,
                  post, or transmit. The Operator acts solely as a hosting
                  provider within the meaning of Art. 6 Digital Services Act
                  (DSA).
                </p>
                <p>
                  We do not monitor content proactively and do not adopt user
                  content as our own.
                </p>

                <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
                  3.2 Prohibited Content &amp; Community Guidelines
                </h3>
                <p>
                  Users may not post unlawful content, including but not limited
                  to: criminal offenses under German law (e.g. Volksverhetzung,
                  §130 StGB), defamation, copyright violations, or terrorist
                  content. Detailed content rules are set out in our{" "}
                  <Link
                    href="/community-guidelines"
                    className="text-[#F2F2F2] underline decoration-[#6E7A8A]"
                  >
                    Community Guidelines
                  </Link>
                  .
                </p>
                <p>
                  We reserve the right to remove content and report users to
                  competent authorities where legally required.
                </p>

                <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
                  3.3 Prohibited Conduct & Permanent Ban
                </h3>
                <p>
                  The following conduct is strictly forbidden: harassment,
                  threats, doxxing, stalking, intimidation, coordinated abuse,
                  excessive advertising, spamming, and mistreating other users
                  or third parties.
                </p>
                <p>
                  Violations may result in content removal, temporary
                  suspension, or a <strong>permanent ban</strong> of your
                  account. Enforcement is at our sole discretion.
                </p>

                <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
                  3.4 Content Moderation, Notifications &amp; Appeals
                </h3>
                <p>
                  When content is removed for a guideline violation, the author
                  will be notified with a statement of reasons, the specific
                  guideline violated, and instructions to appeal (DSA Art. 17).
                  Appeals must be submitted within 30 days and will be reviewed
                  by a human moderator (DSA Art. 20). See our{" "}
                  <Link
                    href="/community-guidelines"
                    className="text-[#F2F2F2] underline decoration-[#6E7A8A]"
                  >
                    Community Guidelines (Section 9)
                  </Link>{" "}
                  for full details.
                </p>

                <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
                  3.5 Indemnification
                </h3>
                <p>
                  Users shall indemnify and hold harmless the Operator from all
                  third-party claims, damages, fines, costs, and legal fees
                  arising from their content or breach of these Terms.
                </p>
              </section>

              {/* 4 */}
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  4. Messaging, Sessions & Data Security
                </h2>
                <p>
                  The Service does not provide end-to-end encryption. Messages
                  may be stored and processed in unencrypted or
                  transport-encrypted form.
                </p>
                <p>
                  Users are solely responsible for deciding what information
                  they share. We assume no liability for damages resulting from
                  the nature of message storage.
                </p>
                <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
                  4.1 Sessions &amp; device information
                </h3>
                <p>
                  To show you where your account is signed in and to let you
                  revoke sessions, we store per sign-in: a short device or
                  browser description (e.g. device name on mobile, browser and
                  OS on web) and your IP address. This is described in our
                  Privacy Policy. By using the Service you agree to this
                  processing.
                </p>
              </section>

              {/* 5 */}
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  5. Service Availability, Termination & Shutdown
                </h2>

                <p>
                  The Service is operated subject to technical, economic, and
                  organizational feasibility. There is no entitlement to
                  uninterrupted or permanent availability.
                </p>

                <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
                  5.1 Termination for Cause
                </h3>
                <p>
                  We may suspend or terminate individual user accounts with
                  immediate effect for good cause (<em>wichtiger Grund</em>).
                </p>

                <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
                  5.2 Termination for Operational or Economic Reasons
                </h3>
                <p>
                  We reserve the right to suspend or permanently discontinue the
                  Service, in whole or in part, if continued operation is no
                  longer reasonable due to financial, technical, or legal
                  reasons.
                </p>

                <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
                  5.3 No Liability for Shutdown
                </h3>
                <p>
                  To the maximum extent permitted by law, the Operator shall not
                  be liable for any damages, losses, or disadvantages resulting
                  from suspension, termination, or discontinuation of the
                  Service.
                </p>

                <p>
                  Users are responsible for exporting or backing up their data
                  regularly using the provided Data Export tools.
                </p>
              </section>

              {/* 7 */}
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
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
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  8. Severability
                </h2>
                <p>
                  Invalid provisions shall be replaced with legally permissible
                  provisions closest to the intended economic purpose.
                </p>
              </section>
            </>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
