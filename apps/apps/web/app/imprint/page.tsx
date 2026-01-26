
export default function ImprintPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-paper">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 tracking-tight">Imprint (Impressum)</h1>
        <p className="text-lg text-secondary">Information according to § 5 TMG</p>
      </header>

      <div className="prose prose-invert prose-p:text-secondary prose-headings:text-paper max-w-none">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Service Provider</h2>
          <p className="mb-2 font-bold text-white">Cite Social UG (haftungsbeschränkt) [In Foundation]</p>
          <p>Sample Street 123</p>
          <p>10115 Berlin</p>
          <p>Germany</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Contact</h2>
          <p>Email: legal@cite.social</p>
          <p>Phone: +49 (0) 30 123456789 (Support via email preferred)</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Represented by</h2>
          <p>Managing Director: [Founder Name]</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Register Entry</h2>
          <p>Entry in the Commercial Register.</p>
          <p>Register Court: Amtsgericht Charlottenburg</p>
          <p>Register Number: HRB [Pending]</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">VAT ID</h2>
          <p>Sales tax identification number according to § 27 a Umsatzsteuergesetz:</p>
          <p>DE [Pending]</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Dispute Resolution</h2>
          <p>
            The European Commission provides a platform for online dispute resolution (OS): <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://ec.europa.eu/consumers/odr/</a>.
          </p>
          <p className="mt-2">
            We are not willing or obliged to participate in dispute settlement proceedings before a consumer arbitration board.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Content Liability</h2>
          <p>
            As a service provider, we are responsible for our own content on these pages in accordance with general laws pursuant to § 7 Paragraph 1 TMG. However, according to §§ 8 to 10 TMG, we as a service provider are not obliged to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.
          </p>
        </section>
      </div>
    </div>
  );
}
