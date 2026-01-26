import Link from 'next/link';

export default function ImprintPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F2F2F2]">
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center px-6 py-6 md:px-12 bg-[#0B0B0C]/80 backdrop-blur-md border-b border-[#1A1A1D]">
        <Link href="/" className="text-sm font-medium text-[#A8A8AA] hover:text-[#F2F2F2] transition-colors">
          &larr; Back to Home
        </Link>
      </nav>

      <main className="max-w-[680px] mx-auto pt-32 pb-20 px-6">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#F2F2F2] mb-8">Imprint</h1>
        
        <div className="prose prose-invert prose-lg text-[#A8A8AA] max-w-none">
          <p className="italic text-sm text-[#6E6E73] mb-8">Information pursuant to § 5 TMG</p>

          <section className="mb-8">
            <h3 className="text-[#F2F2F2] font-medium text-lg mb-2">Operator</h3>
            <p>
              <strong>CITE Systems GmbH</strong><br />
              Musterstraße 123<br />
              10115 Berlin<br />
              Germany
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-[#F2F2F2] font-medium text-lg mb-2">Represented by</h3>
            <p>
              Max Mustermann (CEO)<br />
              Erika Mustermann (CTO)
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-[#F2F2F2] font-medium text-lg mb-2">Contact</h3>
            <p>
              Email: <a href="mailto:contact@cite.app" className="text-[#6E7A8A] hover:text-[#F2F2F2]">contact@cite.app</a><br />
              Phone: +49 (0) 30 12345678
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-[#F2F2F2] font-medium text-lg mb-2">Register Entry</h3>
            <p>
              Entry in the Commercial Register.<br />
              Register Court: Amtsgericht Charlottenburg<br />
              Register Number: HRB 123456 B
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-[#F2F2F2] font-medium text-lg mb-2">VAT ID</h3>
            <p>
              Sales tax identification number according to § 27a Sales Tax Law:<br />
              DE 123 456 789
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-[#F2F2F2] font-medium text-lg mb-2">Hosting</h3>
            <p>
              This application is hosted on infrastructure provided by:<br />
              <strong>Hetzner Online GmbH</strong><br />
              Industriestr. 25<br />
              91710 Gunzenhausen<br />
              Germany
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
