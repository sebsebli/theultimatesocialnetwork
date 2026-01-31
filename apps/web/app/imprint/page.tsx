import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Imprint | Citewalk",
  description: "Legal Imprint (Impressum) for Citewalk.",
  alternates: {
    canonical: "https://citewalk.com/imprint",
  },
};

export default function ImprintPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-paper">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 tracking-tight">
          Imprint (Impressum)
        </h1>
        <p className="text-lg text-secondary">
          Information according to § 5 TMG
        </p>
      </header>

      <div className="prose prose-invert prose-p:text-secondary prose-headings:text-paper max-w-none">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Service Provider</h2>
          <p className="mb-2 font-bold text-white">Dr. Sebastian Lindner</p>
          <p>[Address Placeholder]</p>
          <p>10115 Berlin</p>
          <p>Germany</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Contact</h2>
          <p>Email: hello@citewalk.com</p>
          <p>Web: citewalk.com</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Legal Status</h2>
          <p>
            Operated as a private initiative / freelancer
            (Freiberufler/Einzelunternehmer).
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Dispute Resolution</h2>
          <p>
            The European Commission provides a platform for online dispute
            resolution (OS):{" "}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              https://ec.europa.eu/consumers/odr/
            </a>
            .
          </p>
          <p className="mt-2">
            We are not willing or obliged to participate in dispute settlement
            proceedings before a consumer arbitration board.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Content Liability</h2>
          <p>
            As a service provider, we are responsible for our own content on
            these pages in accordance with general laws pursuant to § 7
            Paragraph 1 TMG.
          </p>
        </section>
      </div>
    </div>
  );
}
