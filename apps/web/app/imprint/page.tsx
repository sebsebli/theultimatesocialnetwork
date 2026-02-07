import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getLocale } from "next-intl/server";
import { ImprintContentDE } from "./de";

export const metadata: Metadata = {
  title: "Imprint",
  description:
    "Legal Imprint (Impressum) for Citewalk. Operated by Dr. Sebastian Lindner, Halle, Germany.",
  alternates: {
    canonical: "https://citewalk.com/imprint",
  },
  openGraph: {
    title: "Imprint — Citewalk",
    description: "Legal Imprint (Impressum) for Citewalk.",
    url: "https://citewalk.com/imprint",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Imprint — Citewalk",
    description: "Legal Imprint (Impressum) for Citewalk.",
  },
};

export default async function ImprintPage() {
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
          <span className="hidden sm:inline">DOC: IMPRINT.md</span>
        </div>
        <div>REG: TMG §5</div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-12 border-b border-[#1A1A1D] pb-8">
          <h1 className="text-4xl md:text-5xl font-medium mb-4 tracking-tight text-[#F2F2F2]">
            {isGerman ? "Impressum" : "Imprint"}
          </h1>
          <div className="flex flex-col md:flex-row gap-4 md:items-center text-xs font-mono text-[#6E6E73] uppercase tracking-widest">
            <span>Impressum</span>
            <span className="hidden md:inline text-[#333]">{"//"}</span>
            <span>Legal Disclosure</span>
          </div>
        </div>

        <div className="prose prose-invert prose-p:text-[#A8A8AA] prose-headings:text-[#F2F2F2] prose-headings:font-medium prose-a:text-[#F2F2F2] prose-strong:text-[#F2F2F2] max-w-none font-serif leading-relaxed">
          {isGerman ? (
            <ImprintContentDE />
          ) : (
            <>
              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  Service Provider
                </h2>
                <div className="bg-[#121215] p-6 border border-[#1A1A1D] rounded">
                  <p className="mb-2 font-bold text-white text-lg">
                    Dr. Sebastian Lindner
                  </p>
                  <p className="font-mono text-sm">c/o Grosch Postflex #2836</p>
                  <p className="font-mono text-sm">Emsdettener Str. 10</p>
                  <p className="font-mono text-sm">48268 Greven</p>
                  <p className="font-mono text-sm">Germany</p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  Contact
                </h2>
                <div className="grid gap-2 font-mono text-sm">
                  <div className="flex justify-between border-b border-[#1A1A1D] pb-2">
                    <span className="text-[#6E6E73]">EMAIL</span>
                    <span>hello@citewalk.com</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1A1A1D] pb-2">
                    <span className="text-[#6E6E73]">WEB</span>
                    <span>citewalk.com</span>
                  </div>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  Legal Status
                </h2>
                <p>
                  Operated as a private initiative / freelancer
                  (Freiberufler/Einzelunternehmer).
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  Dispute Resolution
                </h2>
                <p>
                  The European Commission provides a platform for online dispute
                  resolution (OS):{" "}
                  <a
                    href="https://ec.europa.eu/consumers/odr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#F2F2F2] underline decoration-[#6E7A8A]"
                  >
                    https://ec.europa.eu/consumers/odr/
                  </a>
                  .
                </p>
                <p className="mt-2">
                  We are not willing or obliged to participate in dispute
                  settlement proceedings before a consumer arbitration board.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
                  Content Liability
                </h2>
                <p>
                  As a service provider, we are responsible for our own content
                  on these pages in accordance with general laws pursuant to § 7
                  Paragraph 1 TMG.
                </p>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
