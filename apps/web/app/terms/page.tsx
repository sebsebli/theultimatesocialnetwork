export default function TermsPage() {
  return (
    <div className="max-w-[680px] mx-auto min-h-screen border-x border-divider bg-ink px-6 py-12">
      <h1 className="text-3xl font-bold text-paper mb-6">Terms of Service</h1>
      <div className="prose prose-invert max-w-none text-secondary">
        <p className="mb-4">Effective Date: January 24, 2026</p>

        <h2 className="text-xl font-semibold text-paper mt-8 mb-4">1. Acceptance of Terms</h2>
        <p>
          By accessing or using the CITE application and website, you agree to be bound by these Terms of Service ("Terms"). 
          If you do not agree to these Terms, you may not use the Service.
        </p>

        <h2 className="text-xl font-semibold text-paper mt-8 mb-4">2. User Accounts</h2>
        <p>
          To access certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information 
          during the registration process and to update such information to keep it accurate, current, and complete. 
          You are responsible for safeguarding your account credentials.
        </p>

        <h2 className="text-xl font-semibold text-paper mt-8 mb-4">3. Content Ownership and License</h2>
        <p>
          <strong>Your Content:</strong> You retain all rights and ownership of the content (posts, text, images) you submit, post, or display on or through the Service.
        </p>
        <p className="mt-2">
          <strong>License to CITE:</strong> By submitting, posting, or displaying Content on or through the Service, you grant us a worldwide, non-exclusive, 
          royalty-free license (with the right to sublicense) to use, copy, reproduce, process, adapt, modify, publish, transmit, display, and distribute 
          such Content in any and all media or distribution methods (now known or later developed). This license authorizes us to make your Content available 
          to the rest of the world and to let others do the same.
        </p>

        <h2 className="text-xl font-semibold text-paper mt-8 mb-4">4. Acceptable Use</h2>
        <p>You agree not to use the Service to:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Violate any laws or regulations.</li>
          <li>Harass, abuse, or harm another person.</li>
          <li>Post content that is hate speech, threatening, or pornographic.</li>
          <li>Spam or solicit other users.</li>
          <li>Interfere with or disrupt the Service.</li>
        </ul>

        <h2 className="text-xl font-semibold text-paper mt-8 mb-4">5. Termination</h2>
        <p>
          We may suspend or terminate your access to the Service at any time, for any reason, including if we reasonably believe you have violated these Terms.
        </p>

        <h2 className="text-xl font-semibold text-paper mt-8 mb-4">6. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, CITE Systems GmbH shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
          or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
        </p>

        <h2 className="text-xl font-semibold text-paper mt-8 mb-4">7. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Germany, without regard to its conflict of law provisions.
        </p>
      </div>
    </div>
  );
}