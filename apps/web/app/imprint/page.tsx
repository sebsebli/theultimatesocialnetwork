export default function ImprintPage() {
  return (
    <div className="max-w-[680px] mx-auto min-h-screen border-x border-divider bg-ink px-6 py-12">
      <h1 className="text-3xl font-bold text-paper mb-6">Imprint (Impressum)</h1>
      <div className="prose prose-invert max-w-none text-secondary">
        <p className="italic mb-4">Information pursuant to § 5 TMG</p>

        <h2 className="text-xl font-semibold text-paper mt-8 mb-4">Operator</h2>
        <p>
          <strong>CITE Systems GmbH</strong><br />
          Musterstraße 123<br />
          10115 Berlin<br />
          Germany
        </p>

        <h2 className="text-xl font-semibold text-paper mt-8 mb-4">Represented by</h2>
        <p>
          Max Mustermann (CEO)<br />
          Erika Mustermann (CTO)
        </p>

        <h2 className="text-xl font-semibold text-paper mt-8 mb-4">Contact</h2>
        <p>
          Email: contact@cite.app<br />
          Phone: +49 (0) 30 12345678
        </p>

        <h2 className="text-xl font-semibold text-paper mt-8 mb-4">Register Entry</h2>
        <p>
          Entry in the Commercial Register.<br />
          Register Court: Amtsgericht Charlottenburg<br />
          Register Number: HRB 123456 B
        </p>

        <h2 className="text-xl font-semibold text-paper mt-8 mb-4">VAT ID</h2>
        <p>
          Sales tax identification number according to § 27a Sales Tax Law:<br />
          DE 123 456 789
        </p>

        <h2 className="text-xl font-semibold text-paper mt-8 mb-4">Hosting</h2>
        <p>
          This application is hosted on infrastructure provided by:<br />
          <strong>Hetzner Online GmbH</strong><br />
          Industriestr. 25<br />
          91710 Gunzenhausen<br />
          Germany
        </p>
      </div>
    </div>
  );
}