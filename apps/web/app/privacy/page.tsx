import Link from "next/link";
import Image from "next/image";
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

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-12 border-b border-[#1A1A1D] pb-8">
          <h1 className="text-4xl md:text-5xl font-medium mb-4 tracking-tight text-[#F2F2F2]">
            Privacy Policy
          </h1>
          <div className="flex flex-col md:flex-row gap-4 md:items-center text-xs font-mono text-[#6E6E73] uppercase tracking-widest">
            <span>Effective: Jan 31, 2026</span>
            <span className="hidden md:inline text-[#333]">{"//"}</span>
            <span>Controller: Dr. Lindner</span>
          </div>
        </div>

        <div className="prose prose-invert prose-p:text-[#A8A8AA] prose-headings:text-[#F2F2F2] prose-headings:font-medium prose-a:text-[#F2F2F2] prose-strong:text-[#F2F2F2] max-w-none font-serif leading-relaxed">
          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              1. Controller
            </h2>
            <p>Controller within the meaning of Art. 4(7) GDPR:</p>
            <div className="bg-[#121215] p-4 border border-[#1A1A1D] font-mono text-sm">
              Dr. Sebastian Lindner
              <br />
              c/o [Address Placeholder]
              <br />
              10115 Berlin, Germany
              <br />
              Email: hello@citewalk.com
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              2. Principles of Processing
            </h2>
            <p>
              We process personal data in accordance with Art. 5 GDPR, in
              particular lawfulness, purpose limitation, data minimization, and
              storage limitation.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              3. Categories of Data & Legal Bases
            </h2>

            <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
              3.1 Account Data
            </h3>
            <p>
              <strong>Data:</strong> Email address, username, display name,
              password hash (if applicable), account settings.
            </p>
            <p>
              <strong>Legal Basis:</strong> Art. 6(1)(b) GDPR (contract
              performance).
            </p>

            <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
              3.2 User Content
            </h3>
            <p>
              <strong>Data:</strong> Posts, replies, messages, profile
              information, collections.
            </p>
            <p>
              <strong>Legal Basis:</strong> Art. 6(1)(b) GDPR and Art. 6(1)(f)
              GDPR (legitimate interest in operating a communication platform).
            </p>

            <h3 className="text-lg font-sans font-medium text-[#F2F2F2] mb-2 mt-8">
              3.3 Waiting List
            </h3>
            <p>
              <strong>Data:</strong> Email address, and (for abuse prevention) a
              hashed IP. You give explicit consent when you join the waiting
              list.
            </p>
            <p>
              <strong>Purpose & Legal Basis:</strong> To contact you about
              Citewalk project updates and your invitation to the open beta
              program, based on your consent (Art. 6(1)(a) GDPR). Consent is
              given by ticking the consent box before submitting.
            </p>
            <p>
              <strong>Withdrawal:</strong> You may withdraw consent at any time
              by emailing hello@citewalk.com; we will remove your data from the
              waiting list and stop contacting you.
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
              <strong>Retention:</strong> Up to 14 days, unless required longer
              for security investigations or legal obligations.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              4. Processors & Hosting
            </h2>
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
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              6. Retention & Deletion
            </h2>
            <p>
              Personal data is deleted when no longer required for the purposes
              stated or upon account deletion, unless statutory retention
              obligations apply.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              8. Data Subject Rights
            </h2>
            <p>
              Users have rights under Arts. 15–21 GDPR (Access, Rectification,
              Erasure, Portability). Requests may be submitted via
              hello@citewalk.com.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
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
      </main>
    </div>
  );
}
