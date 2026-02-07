import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { PrivacyContentDE } from "./de";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Citewalk. 100% EU-hosted, GDPR compliant. No tracking, no ads, no data sales. Your data belongs to you.",
  alternates: {
    canonical: "https://citewalk.com/privacy",
  },
  openGraph: {
    title: "Privacy Policy — Citewalk",
    description:
      "100% EU-hosted, GDPR compliant. No tracking, no ads, no data sales.",
    url: "https://citewalk.com/privacy",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy — Citewalk",
    description:
      "100% EU-hosted, GDPR compliant. No tracking, no ads, no data sales.",
  },
};

export default async function PrivacyPage() {
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
              src="/icon.png"
              alt="Citewalk"
              width={20}
              height={20}
              className="w-5 h-5 rounded opacity-80"
            />
            <span>&larr; INDEX</span>
          </Link>
          <span className="hidden sm:inline text-[#333]">|</span>
          <span className="hidden sm:inline">DOC: PRIVACY_POLICY.md</span>
        </div>
        <div>REG: EU-2016/679</div>
      </header>

      {/* Language notice for German users */}
      {isGerman && (
        <div className="fixed top-14 inset-x-0 z-40 bg-[#1A1A1D] text-xs text-center py-2 text-[#A8A8AA]">
          Diese Datenschutzerklärung ist auch auf{" "}
          <span className="text-[#F2F2F2]">Deutsch</span> verfügbar. Die
          rechtlich verbindliche Fassung ist die englische Version.
        </div>
      )}

      <main
        className={`max-w-3xl mx-auto px-6 pb-20 ${isGerman ? "pt-40" : "pt-32"}`}
      >
        <div className="mb-12 border-b border-[#1A1A1D] pb-8">
          <h1 className="text-4xl md:text-5xl font-medium mb-4 tracking-tight text-[#F2F2F2]">
            {isGerman ? "Datenschutzerklärung" : "Privacy Policy"}
          </h1>
          <div className="flex flex-col md:flex-row gap-4 md:items-center text-xs font-mono text-[#6E6E73] uppercase tracking-widest">
            <span>Effective: Feb 6, 2026</span>
            <span className="hidden md:inline text-[#333]">{"//"}</span>
            <span>Controller: Dr. Lindner</span>
          </div>
        </div>

        <div className="prose prose-invert prose-p:text-[#A8A8AA] prose-headings:text-[#F2F2F2] prose-headings:font-medium prose-a:text-[#F2F2F2] prose-strong:text-[#F2F2F2] max-w-none font-serif leading-relaxed">
          {isGerman ? (
            <PrivacyContentDE />
          ) : (
            <>
              {/* 1. Controller */}
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  1. Controller
                </h2>
                <p>Controller within the meaning of Art. 4(7) GDPR:</p>
                <div className="bg-[#121215] p-4 border border-[#1A1A1D] font-mono text-sm">
                  Dr. Sebastian Lindner
                  <br />
                  c/o Grosch Postflex #2836
                  <br />
                  Emsdettener Str. 10
                  <br />
                  48268 Greven, Germany
                  <br />
                  Email: hello@citewalk.com
                </div>
              </section>

              {/* 2. Principles of Processing */}
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  2. Principles of Processing
                </h2>
                <p>
                  We process personal data in accordance with Art. 5 GDPR, in
                  particular lawfulness, purpose limitation, data minimization,
                  and storage limitation.
                </p>
              </section>

              {/* 3. Categories of Data & Legal Bases */}
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  3. Categories of Data & Legal Bases
                </h2>

                <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
                  3.1 Account Data
                </h3>
                <p>
                  <strong>Data:</strong> Email address (encrypted at rest),
                  username, display name, account settings.
                </p>
                <p>
                  <strong>Legal Basis:</strong> Art. 6(1)(b) GDPR (contract
                  performance).
                </p>

                <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
                  3.2 User Content
                </h3>
                <p>
                  <strong>Data:</strong> Posts, replies, direct messages,
                  profile information (bio, avatar image, profile header image),
                  collections.
                </p>
                <p>
                  <strong>Legal Basis:</strong> Art. 6(1)(b) GDPR and Art.
                  6(1)(f) GDPR (legitimate interest in operating a communication
                  platform).
                </p>

                <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
                  3.3 Waiting List
                </h3>
                <p>
                  <strong>Data:</strong> Email address, and (for abuse
                  prevention) a hashed IP. You give explicit consent when you
                  join the waiting list.
                </p>
                <p>
                  <strong>Purpose & Legal Basis:</strong> To contact you about
                  Citewalk project updates and your invitation to the open beta
                  program, based on your consent (Art. 6(1)(a) GDPR). Consent is
                  given by ticking the consent box before submitting.
                </p>
                <p>
                  <strong>Withdrawal:</strong> You may withdraw consent at any
                  time by emailing hello@citewalk.com; we will remove your data
                  from the waiting list and stop contacting you.
                </p>

                <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
                  3.4 Technical & Security Data
                </h3>
                <p>
                  <strong>Data:</strong> IP address, device information, access
                  logs.
                </p>
                <p>
                  <strong>Legal Basis:</strong> Art. 6(1)(f) GDPR (IT security,
                  abuse prevention).
                </p>
                <p>
                  <strong>Retention:</strong> Access logs are retained for up to
                  14 days, unless required longer for active security
                  investigations or legal obligations.
                </p>

                <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
                  3.5 Session / Device Information
                </h3>
                <p>
                  <strong>Data:</strong> For each sign-in we store a short
                  device or browser description (e.g. device name on the mobile
                  app, or browser and operating system on the web app) and the
                  IP address associated with that session.
                </p>
                <p>
                  <strong>Purpose & Legal Basis:</strong> So you can see on
                  which devices and browsers your account is signed in and
                  revoke sessions you do not recognise. Art. 6(1)(f) GDPR
                  (legitimate interest in account security and transparency).
                </p>
                <p>
                  <strong>Retention:</strong> Stored for the lifetime of the
                  session (e.g. until you sign out or the session expires after
                  7 days). You can revoke any session at any time in Security
                  settings.
                </p>

                <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
                  3.6 Push Notification Data
                </h3>
                <p>
                  <strong>Data:</strong> Push notification token (encrypted at
                  rest; device token issued by Apple or Google), device platform
                  (iOS/Android), app version, device identifier, and locale.
                </p>
                <p>
                  <strong>Purpose & Legal Basis:</strong> To deliver push
                  notifications you have opted in to receive. Art. 6(1)(b) GDPR
                  (contract performance) and Art. 6(1)(a) GDPR (consent, as you
                  explicitly grant notification permission on your device).
                </p>
                <p>
                  <strong>Third-Party Transfer:</strong> Push tokens and
                  notification content (title, body) are transmitted to Apple
                  (Apple Push Notification Service, US) and/or Google (Firebase
                  Cloud Messaging, US) to deliver notifications to your device.
                  These transfers are governed by EU Standard Contractual
                  Clauses. See Section 5 for details.
                </p>

                <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
                  3.7 Content Moderation Data
                </h3>
                <p>
                  <strong>Data:</strong> When you submit content (posts,
                  replies), it is automatically analysed by our content safety
                  system. This includes duplicate detection, similarity
                  analysis, and AI-based classification for categories such as
                  spam, harassment, and hate speech. A moderation record
                  (reason, confidence score, content snapshot) may be stored.
                </p>
                <p>
                  <strong>Legal Basis:</strong> Art. 6(1)(f) GDPR (legitimate
                  interest in platform safety and compliance with the EU Digital
                  Services Act).
                </p>
                <p>
                  <strong>Note:</strong> The AI moderation system assists human
                  moderators but does not make final decisions autonomously. No
                  automated decision-making producing legal effects within the
                  meaning of Art. 22 GDPR takes place.
                </p>
                <p>
                  When content is moderated, you will receive a notification
                  with a statement of reasons (DSA Art. 17). You may appeal any
                  moderation decision within 30 days (DSA Art. 20). See our{" "}
                  <Link
                    href="/community-guidelines"
                    className="text-[#F2F2F2] underline decoration-[#6E7A8A]"
                  >
                    Community Guidelines
                  </Link>{" "}
                  for full details.
                </p>
              </section>

              {/* 4. Processors & Hosting */}
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  4. Processors & Hosting
                </h2>
                <p>
                  We use processors bound by Data Processing Agreements pursuant
                  to Art. 28 GDPR:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Hetzner Online GmbH</strong> (Server hosting,
                    Germany/Finland) — infrastructure and compute.
                  </li>
                  <li>
                    <strong>Supabase Inc.</strong> (Database hosting, EU region)
                    — managed PostgreSQL database.
                  </li>
                  <li>
                    <strong>Apple Inc.</strong> (US) — Apple Push Notification
                    Service (APNs) for delivering push notifications to iOS
                    devices.
                  </li>
                  <li>
                    <strong>Google LLC</strong> (US) — Firebase Cloud Messaging
                    (FCM) for delivering push notifications to Android devices.
                  </li>
                  <li>
                    SMTP email provider for transactional emails only (sign-in
                    codes, account deletion confirmations, data exports).
                  </li>
                </ul>
                <p className="mt-4">
                  We do not use US-based cloud providers for core data storage.
                  All user content and account data is stored on servers located
                  in the European Union.
                </p>
              </section>

              {/* 5. International Data Transfers */}
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  5. International Data Transfers
                </h2>
                <p>
                  Push notification delivery requires transmitting push tokens
                  and notification metadata to Apple (US) and Google (US). These
                  transfers are based on EU Standard Contractual Clauses (Art.
                  46(2)(c) GDPR) and, where applicable, the EU-US Data Privacy
                  Framework adequacy decision.
                </p>
                <p>
                  No user content (posts, messages, profile data) is transferred
                  outside the EU/EEA for storage or processing.
                </p>
              </section>

              {/* 6. Cookies & Local Storage */}
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  6. Cookies & Local Storage (Web App)
                </h2>
                <p>
                  The Citewalk web application uses only{" "}
                  <strong>strictly necessary</strong> cookies and local storage.
                  We do not use any tracking, analytics, or advertising cookies.
                </p>

                <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
                  6.1 Cookies
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>token</strong> — httpOnly session cookie containing
                    your access token. Expires after 15 minutes. Purpose:
                    authentication.
                  </li>
                  <li>
                    <strong>refreshToken</strong> — httpOnly session cookie
                    containing your refresh token. Expires after 7 days.
                    Purpose: session continuity.
                  </li>
                </ul>
                <p className="mt-2">
                  Both cookies are set with <code>Secure</code> and{" "}
                  <code>SameSite=Lax</code> attributes in production.
                </p>

                <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
                  6.2 Local Storage
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>cookie_consent</strong> — stores your cookie consent
                    preference (&quot;all&quot; or &quot;essential&quot;).
                  </li>
                  <li>
                    <strong>recent_searches</strong> — your recent search
                    queries (stored locally, never sent to our servers).
                  </li>
                </ul>

                <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
                  6.3 Legal Basis
                </h3>
                <p>
                  All cookies and local storage items listed above are strictly
                  necessary for the operation of the service and do not require
                  consent under Art. 5(3) of the ePrivacy Directive
                  (2002/58/EC). We present a cookie banner for transparency
                  purposes.
                </p>
              </section>

              {/* 7. Retention & Deletion */}
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  7. Retention & Deletion
                </h2>
                <p>
                  We retain personal data only for as long as necessary for the
                  purposes stated. Specific retention periods:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Account data & user content:</strong> retained while
                    your account is active. Upon account deletion, your account
                    is soft-deleted immediately; after 30 days your user record
                    is permanently deleted and your posts are anonymised (author
                    link removed, content cleared, media deleted).
                  </li>
                  <li>
                    <strong>Access logs:</strong> up to 14 days.
                  </li>
                  <li>
                    <strong>Session data:</strong> until you sign out or the
                    session expires (maximum 7 days).
                  </li>
                  <li>
                    <strong>Notifications:</strong> automatically deleted after
                    60 days.
                  </li>
                  <li>
                    <strong>Push notification outbox:</strong> automatically
                    purged after 30 days.
                  </li>
                  <li>
                    <strong>Data export files:</strong> download link expires
                    after 7 days; the file is then deleted.
                  </li>
                  <li>
                    <strong>Waiting list data:</strong> retained until you
                    withdraw consent or until the beta period ends, whichever is
                    earlier.
                  </li>
                </ul>
                <p className="mt-2">
                  Statutory retention obligations (e.g. tax or commercial law)
                  may require longer retention of specific data.
                </p>
              </section>

              {/* 8. Data Subject Rights */}
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  8. Data Subject Rights
                </h2>
                <p>
                  Under the GDPR you have the following rights regarding your
                  personal data:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Right of Access</strong> (Art. 15) — You can request
                    a copy of your personal data at any time via Settings &rarr;
                    &quot;Request my data&quot; or by contacting us.
                  </li>
                  <li>
                    <strong>Right to Rectification</strong> (Art. 16) — You can
                    update your profile information directly in the app at any
                    time.
                  </li>
                  <li>
                    <strong>Right to Erasure</strong> (Art. 17) — You can delete
                    your account via Settings &rarr; Danger Zone. We will erase
                    your data as described in Section 7.
                  </li>
                  <li>
                    <strong>Right to Restriction of Processing</strong> (Art.
                    18) — You may request that we restrict processing of your
                    data in certain circumstances. Contact us at
                    hello@citewalk.com.
                  </li>
                  <li>
                    <strong>Right to Data Portability</strong> (Art. 20) — You
                    can export your data in a structured, machine-readable
                    format (ZIP archive) via Settings &rarr; &quot;Request my
                    data&quot;.
                  </li>
                  <li>
                    <strong>Right to Object</strong> (Art. 21) — You may object
                    to processing based on legitimate interest at any time via
                    Settings &rarr; Privacy &amp; Data Processing, or by
                    contacting us at hello@citewalk.com.
                  </li>
                  <li>
                    <strong>Right to Withdraw Consent</strong> (Art. 7(3)) —
                    Where processing is based on consent (e.g. waiting list,
                    push notifications), you may withdraw consent at any time
                    without affecting the lawfulness of prior processing.
                  </li>
                </ul>
                <p className="mt-4">
                  To exercise any of these rights, contact us at{" "}
                  <strong>hello@citewalk.com</strong>. We will respond within
                  one month in accordance with Art. 12(3) GDPR.
                </p>
              </section>

              {/* 9. Right to Lodge a Complaint */}
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  9. Right to Lodge a Complaint
                </h2>
                <p>
                  Without prejudice to any other administrative or judicial
                  remedy, you have the right to lodge a complaint with a
                  supervisory authority pursuant to Art. 77 GDPR if you believe
                  that the processing of your personal data infringes the GDPR.
                </p>
                <p>The competent supervisory authority for Citewalk is:</p>
                <div className="bg-[#121215] p-4 border border-[#1A1A1D] font-mono text-sm mt-2">
                  Berliner Beauftragte für Datenschutz und Informationsfreiheit
                  <br />
                  Friedrichstr. 219
                  <br />
                  10969 Berlin, Germany
                  <br />
                  Website:{" "}
                  <a
                    href="https://www.datenschutz-berlin.de"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#F2F2F2] underline decoration-[#6E7A8A]"
                  >
                    www.datenschutz-berlin.de
                  </a>
                </div>
              </section>

              {/* 10. Automated Decisions & AI */}
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  10. Automated Decisions & AI
                </h2>
                <p>
                  No automated decision-making producing legal effects within
                  the meaning of Art. 22 GDPR takes place.
                </p>
                <p>
                  We do not use generative AI to create content on your behalf
                  (&quot;No AI Dictation&quot;). AI is used solely for:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Content safety:</strong> Automated spam, abuse, and
                    policy-violation detection (see Section 3.7). The AI assists
                    human moderators; it does not make final enforcement
                    decisions autonomously.
                  </li>
                  <li>
                    <strong>Optional recommendations:</strong> Content
                    suggestions in the Explore feed, which are transparently
                    labelled. You can adjust relevance settings or disable
                    recommendations in Settings.
                  </li>
                </ul>
                <p>
                  For more details on our AI practices, see our{" "}
                  <Link
                    href="/ai-transparency"
                    className="text-[#F2F2F2] underline decoration-[#6E7A8A]"
                  >
                    AI Transparency
                  </Link>{" "}
                  page.
                </p>
              </section>

              {/* 11. Children's Privacy */}
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  11. Children&apos;s Privacy
                </h2>
                <p>
                  Citewalk is not intended for children under the age of 16. We
                  do not knowingly collect personal data from children under 16.
                  If you are under 16, please do not use the service. If we
                  become aware that we have collected personal data from a child
                  under 16, we will take steps to delete such information
                  promptly.
                </p>
              </section>

              {/* 12. Changes to This Policy */}
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  12. Changes to This Policy
                </h2>
                <p>
                  We may update this Privacy Policy from time to time. We will
                  notify you of material changes by posting a notice within the
                  app or by email. The &quot;Effective&quot; date at the top of
                  this page indicates when the policy was last revised.
                </p>
              </section>

              {/* 13. Contact */}
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  13. Contact
                </h2>
                <p>
                  For any questions about this Privacy Policy or your personal
                  data, contact us at:
                </p>
                <div className="bg-[#121215] p-4 border border-[#1A1A1D] font-mono text-sm mt-2">
                  Dr. Sebastian Lindner
                  <br />
                  Email: hello@citewalk.com
                  <br />
                  Web: citewalk.com
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
