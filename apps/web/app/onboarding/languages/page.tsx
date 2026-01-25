'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'ru', name: 'Russian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'da', name: 'Danish' },
  { code: 'cs', name: 'Czech' },
  { code: 'hu', name: 'Hungarian' },
];

export default function OnboardingLanguagesPage() {
  const router = useRouter();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showOnlyMyLanguages, setShowOnlyMyLanguages] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleLanguage = (code: string) => {
    if (selectedLanguages.includes(code)) {
      setSelectedLanguages(selectedLanguages.filter(l => l !== code));
    } else if (selectedLanguages.length < 3) {
      setSelectedLanguages([...selectedLanguages, code]);
    }
  };

  const filteredLanguages = LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContinue = async () => {
    try {
      await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languages: selectedLanguages }),
      });
    } catch (e) {
      console.error('Failed to save languages', e);
    }
    router.push('/onboarding/starter-packs');
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-paper mb-2">Languages you read</h1>
            <p className="text-secondary text-sm">This shapes Explore and recommendations.</p>
          </div>
          <button
            onClick={() => router.push('/onboarding/starter-packs')}
            className="text-primary text-sm font-medium"
          >
            Skip
          </button>
        </div>

        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search languages..."
            className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-lg text-paper placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => toggleLanguage(lang.code)}
              className={`w-full p-3 rounded-lg border transition-colors text-left ${
                selectedLanguages.includes(lang.code)
                  ? 'bg-primary/20 border-primary text-paper'
                  : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{lang.name}</span>
                {selectedLanguages.includes(lang.code) && (
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
          <input
            type="checkbox"
            id="show-only"
            checked={showOnlyMyLanguages}
            onChange={(e) => setShowOnlyMyLanguages(e.target.checked)}
            className="w-4 h-4 text-primary"
          />
          <label htmlFor="show-only" className="text-sm text-secondary cursor-pointer">
            Show only my languages in Explore
          </label>
        </div>

        <button
          onClick={handleContinue}
          disabled={selectedLanguages.length === 0}
          className="w-full h-14 bg-primary hover:bg-[#7d8b9d] transition-colors text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
