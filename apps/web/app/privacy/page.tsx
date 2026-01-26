import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F2F2F2]">
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center px-6 py-6 md:px-12 bg-[#0B0B0C]/80 backdrop-blur-md border-b border-[#1A1A1D]">
        <Link href="/" className="text-sm font-medium text-[#A8A8AA] hover:text-[#F2F2F2] transition-colors">
          &larr; Back to Home
        </Link>
      </nav>

      <main className="max-w-[680px] mx-auto pt-32 pb-20 px-6">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#F2F2F2] mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert prose-lg text-[#A8A8AA] max-w-none">
          <p className="mb-8 font-medium text-[#F2F2F2]">Effective Date: January 24, 2026</p>
          
          <h2 className="text-xl font-semibold text-[#F2F2F2] mt-12 mb-4">1. Introduction</h2>
          <p>
            CITE Systems GmbH ("we", "us", or "our") respects your privacy and is committed to protecting your personal data. 
            This privacy policy will inform you as to how we look after your personal data when you visit our website or use our application 
            and tell you about your privacy rights and how the law protects you.
          </p>

          <h2 className="text-xl font-semibold text-[#F2F2F2] mt-12 mb-4">2. Data Controller</h2>
          <p>
            CITE Systems GmbH<br />
            [Street Address]<br />
            [City, Zip Code]<br />
            Germany<br />
            Email: <a href="mailto:privacy@cite.app" className="text-[#6E7A8A] hover:text-[#F2F2F2]">privacy@cite.app</a>
          </p>

          <h2 className="text-xl font-semibold text-[#F2F2F2] mt-12 mb-4">3. The Data We Collect</h2>
          <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
          <ul className="list-disc pl-5 mt-4 space-y-2">
            <li><strong>Identity Data:</strong> includes username (handle), display name.</li>
            <li><strong>Contact Data:</strong> includes email address.</li>
            <li><strong>Content Data:</strong> includes posts, replies, quotes, and collections you create.</li>
            <li><strong>Technical Data:</strong> includes internet protocol (IP) address, login data, browser type and version, time zone setting and location, and device information.</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#F2F2F2] mt-12 mb-4">4. How We Use Your Data</h2>
          <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
          <ul className="list-disc pl-5 mt-4 space-y-2">
            <li>To register you as a new customer (performance of a contract).</li>
            <li>To enable you to post content and interact with other users (performance of a contract).</li>
            <li>To manage our relationship with you (legal obligation).</li>
            <li>To improve our website, products/services, marketing, customer relationships and experiences (legitimate interests).</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#F2F2F2] mt-12 mb-4">5. Data Storage & Hosting</h2>
          <p>
            Your data is stored exclusively on servers located within the European Union. We use Hetzner Online GmbH (Gunzenhausen, Germany) 
            as our hosting provider. This ensures strict adherence to GDPR regulations regarding data sovereignty and security.
          </p>

          <h2 className="text-xl font-semibold text-[#F2F2F2] mt-12 mb-4">6. Your Legal Rights</h2>
          <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
          <ul className="list-disc pl-5 mt-4 space-y-2">
            <li>Request access to your personal data.</li>
            <li>Request correction of your personal data.</li>
            <li>Request erasure of your personal data ("right to be forgotten").</li>
            <li>Object to processing of your personal data.</li>
            <li>Request restriction of processing your personal data.</li>
            <li>Request transfer of your personal data.</li>
            <li>Right to withdraw consent.</li>
          </ul>
          <p className="mt-6">
            You can exercise these rights by contacting us or using the "Data Export" and "Delete Account" functions in your settings.
          </p>
        </div>
      </main>
    </div>
  );
}
