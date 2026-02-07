import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description:
    "Community Guidelines for Citewalk. Our rules for a respectful, substantive platform where quality writing thrives.",
  alternates: {
    canonical: "https://citewalk.com/community-guidelines",
  },
  openGraph: {
    title: "Community Guidelines — Citewalk",
    description:
      "Our rules for a respectful, substantive platform where quality writing thrives.",
    url: "https://citewalk.com/community-guidelines",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Community Guidelines — Citewalk",
    description:
      "Our rules for a respectful, substantive platform where quality writing thrives.",
  },
};

export default function CommunityGuidelinesPage() {
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
          <span className="hidden sm:inline">DOC: COMMUNITY_GUIDELINES.md</span>
        </div>
        <div>REV: 2026-02-06</div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-12 border-b border-[#1A1A1D] pb-8">
          <h1 className="text-4xl md:text-5xl font-medium mb-4 tracking-tight text-[#F2F2F2]">
            Community Guidelines
          </h1>
          <div className="flex flex-col md:flex-row gap-4 md:items-center text-xs font-mono text-[#6E6E73] uppercase tracking-widest">
            <span>Effective: Feb 6, 2026</span>
            <span className="hidden md:inline text-[#333]">{"//"}</span>
            <span>DSA Art. 14 Compliant</span>
          </div>
        </div>

        <div className="prose prose-invert prose-p:text-[#A8A8AA] prose-headings:text-[#F2F2F2] prose-headings:font-medium prose-a:text-[#F2F2F2] prose-strong:text-[#F2F2F2] max-w-none font-serif leading-relaxed">
          {/* Preamble */}
          <section className="mb-12">
            <p className="text-lg leading-relaxed">
              Citewalk is built on a simple belief: ideas connect and grow when
              people engage with substance, not outrage. These guidelines exist
              to keep the platform a place where ideas can flourish, connect,
              and build on each other through thoughtful discourse. Every user
              is expected to follow them.
            </p>
          </section>

          {/* 1. Be Respectful */}
          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              1. Treat Others with Respect
            </h2>
            <p>
              Citewalk is a platform for people who want to share and discuss
              ideas. You don&apos;t have to agree with everyone, but you must
              treat every person with basic dignity.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>No harassment or bullying.</strong> Do not target
                individuals with repeated unwanted contact, threats,
                intimidation, doxxing, or coordinated abuse.
              </li>
              <li>
                <strong>No hate speech.</strong> Content that attacks or
                dehumanises people based on race, ethnicity, nationality,
                religion, gender, gender identity, sexual orientation,
                disability, or any other protected characteristic is not
                allowed.
              </li>
              <li>
                <strong>No threats of violence.</strong> Do not post content
                that threatens, incites, glorifies, or expresses desire for
                violence against individuals or groups.
              </li>
            </ul>
          </section>

          {/* 2. Post Honestly */}
          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              2. Post Honestly
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>No deliberate misinformation.</strong> Do not
                intentionally spread false claims, fabricated stories, or
                manipulated media designed to deceive.
              </li>
              <li>
                <strong>No impersonation.</strong> Do not pretend to be another
                person, organisation, or entity to mislead others.
              </li>
              <li>
                <strong>Respect intellectual property.</strong> Do not post
                copyrighted material without authorisation or proper
                attribution.
              </li>
            </ul>
          </section>

          {/* 3. No Spam or Manipulation */}
          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              3. No Spam or Manipulation
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>No spam.</strong> This includes bulk posting, repetitive
                content, or unsolicited promotional messages.
              </li>
              <li>
                <strong>No excessive advertising.</strong> While sharing your
                work is fine, turning every post into an advertisement is not.
              </li>
              <li>
                <strong>No platform manipulation.</strong> Do not use bots, fake
                accounts, or automated tools to artificially inflate engagement,
                follows, or citations.
              </li>
            </ul>
          </section>

          {/* 4. Keep It Legal */}
          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              4. Keep It Legal
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>No illegal content.</strong> Do not post content that
                violates applicable law, including but not limited to: terrorist
                content, child sexual abuse material (CSAM), content inciting
                hatred (Volksverhetzung, &sect;130 StGB), or content
                facilitating illegal activities.
              </li>
              <li>
                <strong>No pornography or sexual exploitation.</strong> Explicit
                sexual content, &ldquo;hot-or-not&rdquo; features, and content
                that objectifies real people are not permitted.
              </li>
              <li>
                <strong>No illegal trade.</strong> Do not use Citewalk to
                facilitate the sale of illegal goods, services, or substances.
              </li>
            </ul>
          </section>

          {/* 5. Protect Minors */}
          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              5. Protect Minors
            </h2>
            <p>
              Citewalk requires users to be at least 16 years old. Content that
              endangers minors or exploits children in any way is strictly
              prohibited and will be reported to the relevant authorities
              immediately.
            </p>
          </section>

          {/* 6. Content Warnings */}
          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              6. Content Warnings
            </h2>
            <p>
              If your post discusses sensitive topics (e.g. graphic descriptions
              of violence in a historical context, disturbing news events, or
              other content that some readers may find distressing), use a{" "}
              <strong>content warning</strong> when composing your post. This
              allows readers to make an informed choice before viewing.
            </p>
            <p>
              Content warnings are <strong>not</strong> a loophole. Adding a
              warning does not make otherwise prohibited content acceptable.
            </p>
          </section>

          {/* 7. How We Moderate */}
          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              7. How We Moderate
            </h2>
            <p>
              We use a combination of automated systems and human review to
              enforce these guidelines:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Automated checks.</strong> Posts and images are
                automatically analysed for spam, abuse, and policy violations
                using AI-based classifiers. The AI assists human moderators — it
                does not make final decisions autonomously.
              </li>
              <li>
                <strong>User reports.</strong> Anyone can report content that
                violates these guidelines. Reports are reviewed by our team.
                When content accumulates multiple reports, it may be
                automatically reviewed or temporarily restricted pending human
                review.
              </li>
              <li>
                <strong>Image moderation.</strong> All uploaded images are
                scanned for NSFW content. Images that fail moderation are
                rejected.
              </li>
            </ul>
          </section>

          {/* 8. Enforcement */}
          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              8. Enforcement Actions
            </h2>
            <p>
              Depending on the severity and frequency of violations, we may take
              the following actions:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Content removal.</strong> Individual posts or replies
                that violate these guidelines will be removed.
              </li>
              <li>
                <strong>Warning.</strong> You may receive a notification
                explaining what was removed and why.
              </li>
              <li>
                <strong>Temporary suspension.</strong> Repeated violations may
                result in a temporary account suspension.
              </li>
              <li>
                <strong>Permanent ban.</strong> Severe or persistent violations
                will result in permanent removal from the platform.
              </li>
            </ul>
            <p className="mt-4">
              When we remove content, you will receive a{" "}
              <strong>notification</strong> explaining the reason, the specific
              guideline violated, and how to appeal. This is in compliance with
              the EU Digital Services Act (Art. 17).
            </p>
          </section>

          {/* 9. Appeals */}
          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              9. Appeals
            </h2>
            <p>
              If you believe your content was removed in error, you have the
              right to appeal. You can appeal any moderation decision within{" "}
              <strong>30 days</strong> of receiving the notification.
            </p>
            <p>To submit an appeal:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Open the moderation notification in your Activity feed and tap{" "}
                <strong>&ldquo;Appeal&rdquo;</strong>.
              </li>
              <li>
                Provide a brief explanation of why you believe the removal was
                incorrect.
              </li>
              <li>
                Your appeal will be reviewed by a human moderator (different
                from the original reviewer when possible).
              </li>
              <li>
                You will receive a response within <strong>14 days</strong>.
              </li>
            </ul>
            <p className="mt-4">
              If your appeal is upheld, the content will be restored and no
              record will count against your account. This complaint-handling
              system is provided in compliance with the EU Digital Services Act
              (Art. 20).
            </p>
          </section>

          {/* 10. Reporting */}
          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              10. How to Report
            </h2>
            <p>If you see content that violates these guidelines, report it:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>On a post or comment:</strong> Tap the options menu
                (&hellip;) and select <strong>&ldquo;Report&rdquo;</strong>.
              </li>
              <li>
                <strong>On a user profile:</strong> Tap the options menu and
                select <strong>&ldquo;Report user&rdquo;</strong>.
              </li>
              <li>
                <strong>In a message:</strong> Long-press the message and select{" "}
                <strong>&ldquo;Report&rdquo;</strong>.
              </li>
              <li>
                <strong>By email:</strong> Contact us at{" "}
                <a
                  href="mailto:hello@citewalk.com"
                  className="text-[#F2F2F2] underline decoration-[#6E7A8A]"
                >
                  hello@citewalk.com
                </a>{" "}
                with details of the content and why you believe it violates our
                guidelines.
              </li>
            </ul>
            <p className="mt-4">
              You can select from the following report reasons: Spam,
              Harassment, Misinformation, Violence, Hate speech, or Other.
              Adding a brief description helps us review faster.
            </p>
          </section>

          {/* 11. Your Safety Tools */}
          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              11. Your Safety Tools
            </h2>
            <p>
              In addition to reporting, you have several tools to control your
              experience:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Block.</strong> Prevents a user from seeing your content
                and you from seeing theirs. They cannot contact you.
              </li>
              <li>
                <strong>Mute.</strong> Hides a user&apos;s content from your
                feeds without them knowing.
              </li>
              <li>
                <strong>Content warnings.</strong> Posts with content warnings
                are collapsed by default, letting you choose whether to view
                them.
              </li>
            </ul>
          </section>

          {/* 12. Contact */}
          <section className="mb-12">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              12. Contact
            </h2>
            <p>
              For questions about these guidelines, or to report content not
              covered by the in-app reporting tools:
            </p>
            <div className="bg-[#121215] p-4 border border-[#1A1A1D] font-mono text-sm mt-2">
              Email: hello@citewalk.com
              <br />
              Web: citewalk.com
            </div>
            <p className="mt-4">
              These guidelines may be updated from time to time. Material
              changes will be announced within the app. The
              &ldquo;Effective&rdquo; date at the top indicates when these
              guidelines were last revised.
            </p>
          </section>

          {/* Related documents */}
          <section className="mb-12 border-t border-[#1A1A1D] pt-8">
            <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
              Related Documents
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-[#F2F2F2] underline decoration-[#6E7A8A]"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-[#F2F2F2] underline decoration-[#6E7A8A]"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/imprint"
                  className="text-[#F2F2F2] underline decoration-[#6E7A8A]"
                >
                  Imprint
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
