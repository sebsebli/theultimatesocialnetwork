/** German translation of the Imprint (Impressum). */
export function ImprintContentDE() {
  return (
    <>
      <section className="mb-12">
        <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
          Diensteanbieter
        </h2>
        <div className="bg-[#121215] p-6 border border-[#1A1A1D] rounded">
          <p className="mb-2 font-bold text-white text-lg">
            Dr. Sebastian Lindner
          </p>
          <p className="font-mono text-sm">c/o Grosch Postflex #2836</p>
          <p className="font-mono text-sm">Emsdettener Str. 10</p>
          <p className="font-mono text-sm">48268 Greven</p>
          <p className="font-mono text-sm">Deutschland</p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
          Kontakt
        </h2>
        <div className="grid gap-2 font-mono text-sm">
          <div className="flex justify-between border-b border-[#1A1A1D] pb-2">
            <span className="text-[#6E6E73]">E-MAIL</span>
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
          Rechtsform
        </h2>
        <p>
          Betrieben als Privatinitiative / Freiberufler (Einzelunternehmer).
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
          Streitbeilegung
        </h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur
          Online-Streitbeilegung (OS) bereit:{" "}
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
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren
          vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-sans font-bold uppercase tracking-wide text-[#6E6E73] mb-6 border-b border-[#1A1A1D] pb-2">
          Haftung für Inhalte
        </h2>
        <p>
          Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach
          den allgemeinen Gesetzen verantwortlich gemäß § 7 Abs. 1 TMG.
        </p>
      </section>
    </>
  );
}
