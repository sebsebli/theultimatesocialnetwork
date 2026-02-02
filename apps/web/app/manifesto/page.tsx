import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { MdVerified, MdLink, MdFingerprint } from "react-icons/md";

export const metadata: Metadata = {
  title: "Protocol Manifesto | Citewalk",
  description:
    "The founding principles of the Citewalk protocol. Verifiable truth in a post-truth era.",
  alternates: {
    canonical: "https://citewalk.com/manifesto",
  },
};

export default function ManifestoPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F2F2F2] font-serif selection:bg-[#F2F2F2] selection:text-[#0B0B0C]">
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
          <span className="hidden sm:inline">DOC: MANIFESTO_V1.md</span>
        </div>
        <div className="flex items-center gap-2">
          <MdFingerprint className="text-[#6E7A8A]" />
          <span className="hidden sm:inline">SHA-256: 7a9...f41</span>
        </div>
      </header>

      <div className="pt-32 pb-32 px-6 md:px-12 max-w-[1400px] mx-auto flex flex-col md:flex-row gap-20">
        {/* Sidebar Nav */}
        <aside className="hidden md:block w-64 shrink-0 sticky top-32 h-[calc(100vh-8rem)]">
          <nav className="space-y-6 border-l border-[#1A1A1D] pl-6">
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-[#6E7A8A] uppercase tracking-widest">
                Contents
              </div>
              <ul className="space-y-3 text-sm font-sans text-[#A8A8AA]">
                <li>
                  <a
                    href="#preamble"
                    className="hover:text-[#F2F2F2] transition-colors block"
                  >
                    00. Preamble
                  </a>
                </li>
                <li>
                  <a
                    href="#attention"
                    className="hover:text-[#F2F2F2] transition-colors block"
                  >
                    01. The Crisis of Context
                  </a>
                </li>
                <li>
                  <a
                    href="#intention"
                    className="hover:text-[#F2F2F2] transition-colors block"
                  >
                    02. The Architecture of Trust
                  </a>
                </li>
                <li>
                  <a
                    href="#sovereignty"
                    className="hover:text-[#F2F2F2] transition-colors block"
                  >
                    03. Digital Sovereignty
                  </a>
                </li>
              </ul>
            </div>

            <div className="pt-8 border-t border-[#1A1A1D]">
              <div className="text-[10px] font-mono text-[#6E7A8A] uppercase tracking-widest mb-4">
                Signatories
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1A1A1D]">
                  <Image
                    src="/sebastianlindner.jpeg"
                    alt=""
                    width={32}
                    height={32}
                  />
                </div>
                <div className="text-xs font-sans">
                  <div className="text-[#F2F2F2]">Dr. Lindner</div>
                  <div className="text-[#6E6E73]">Operator</div>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Document */}
        <main className="max-w-2xl">
          <section id="preamble" className="mb-24">
            <h1 className="text-5xl md:text-7xl leading-[0.95] font-medium mb-12 text-[#F2F2F2]">
              The Algorithm <br />
              <span className="text-[#6E7A8A] italic">of Truth.</span>
            </h1>

            <p className="text-xl md:text-2xl leading-relaxed text-[#A8A8AA] border-l-2 border-[#6E7A8A] pl-8 py-2">
              We are living through a collapse of context. The internet has
              become a machine for amnesia. We are building the machine for
              memory.
            </p>
          </section>

          <section id="attention" className="mb-20">
            <div className="flex items-baseline gap-4 mb-8 border-b border-[#1A1A1D] pb-4">
              <span className="font-mono text-[#6E7A8A] text-xs">01</span>
              <h2 className="text-2xl font-sans font-bold text-[#F2F2F2]">
                The Crisis of Context
              </h2>
            </div>
            <div className="prose prose-invert prose-lg text-[#A8A8AA] font-serif">
              <p>
                Social media is designed to strip information of its origin. A
                screenshot travels faster than a citation. Outrage travels
                faster than correction.
              </p>
              <p>
                This is not an accident. It is a business model. When context
                dies, engagement rises. But a society without context is a mob.
              </p>
            </div>
          </section>

          <section id="intention" className="mb-20">
            <div className="flex items-baseline gap-4 mb-8 border-b border-[#1A1A1D] pb-4">
              <span className="font-mono text-[#6E7A8A] text-xs">02</span>
              <h2 className="text-2xl font-sans font-bold text-[#F2F2F2]">
                The Architecture of Trust
              </h2>
            </div>
            <div className="prose prose-invert prose-lg text-[#A8A8AA] font-serif space-y-8">
              <p>
                We are building a social network that functions like a
                scientific journal. Claims require evidence. Reputation is
                earned, not bought or gamed.
              </p>

              <div className="grid gap-6">
                <div className="bg-[#121215] p-6 rounded border border-[#1A1A1D]">
                  <h3 className="font-sans font-bold text-[#F2F2F2] flex items-center gap-2 mb-2">
                    <MdVerified className="text-[#6E7A8A]" />
                    Citations are Currency
                  </h3>
                  <p className="text-base">
                    In a feed, the loudest voice wins. In a graph, the most
                    cited voice wins. We measure authority by how many other
                    thinkers link to your ideas.
                  </p>
                </div>

                <div className="bg-[#121215] p-6 rounded border border-[#1A1A1D]">
                  <h3 className="font-sans font-bold text-[#F2F2F2] flex items-center gap-2 mb-2">
                    <MdLink className="text-[#6E7A8A]" />
                    The Web We Lost
                  </h3>
                  <p className="text-base">
                    Hyperlinks were the internet&apos;s superpower. We are
                    bringing them back. Citewalk prevents link rot by archiving
                    every external source you cite.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="sovereignty" className="mb-20">
            <div className="flex items-baseline gap-4 mb-8 border-b border-[#1A1A1D] pb-4">
              <span className="font-mono text-[#6E7A8A] text-xs">03</span>
              <h2 className="text-2xl font-sans font-bold text-[#F2F2F2]">
                Digital Sovereignty
              </h2>
            </div>
            <div className="prose prose-invert prose-lg text-[#A8A8AA] font-serif">
              <p>We do not have users. We have authors.</p>
              <p>
                Citewalk is an independent European initiative. We host in the
                EU. We follow GDPR not because we have to, but because we
                believe in data sovereignty as a fundamental human right.
              </p>
              <p>
                Your data is yours. It is portable (we revived RSS), exportable
                (JSON), and private. We will never sell it to advertisers.
              </p>
            </div>
          </section>

          <div className="pt-12 border-t border-[#1A1A1D] flex justify-between items-center">
            <div className="text-sm font-sans text-[#6E6E73]">
              Last updated: Feb 2026
            </div>
            <Link
              href="/sign-in"
              className="px-6 py-2 bg-[#F2F2F2] text-[#0B0B0C] font-sans font-bold text-sm hover:bg-white transition-colors"
            >
              Initialize Session
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
