'use client';

interface FiltersProps {
  language: 'my-languages' | 'all';
  onLanguageChange: (lang: 'my-languages' | 'all') => void;
  sort: 'recommended' | 'newest' | 'most-cited';
  onSortChange: (sort: 'recommended' | 'newest' | 'most-cited') => void;
}

export function ExploreFilters({ language, onLanguageChange, sort, onSortChange }: FiltersProps) {
  return (
    <div className="flex items-center gap-4 px-6 py-3 border-b border-divider">
      {/* Language Filter */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onLanguageChange('my-languages')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            language === 'my-languages'
              ? 'bg-primary text-white'
              : 'bg-white/5 text-secondary hover:bg-white/10'
          }`}
        >
          My languages
        </button>
        <button
          onClick={() => onLanguageChange('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            language === 'all'
              ? 'bg-primary text-white'
              : 'bg-white/5 text-secondary hover:bg-white/10'
          }`}
        >
          All
        </button>
      </div>

      {/* Sort Filter */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSortChange('recommended')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            sort === 'recommended'
              ? 'bg-primary text-white'
              : 'bg-white/5 text-secondary hover:bg-white/10'
          }`}
        >
          Recommended
        </button>
        <button
          onClick={() => onSortChange('newest')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            sort === 'newest'
              ? 'bg-primary text-white'
              : 'bg-white/5 text-secondary hover:bg-white/10'
          }`}
        >
          Newest
        </button>
        <button
          onClick={() => onSortChange('most-cited')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            sort === 'most-cited'
              ? 'bg-primary text-white'
              : 'bg-white/5 text-secondary hover:bg-white/10'
          }`}
        >
          Most cited
        </button>
      </div>
    </div>
  );
}
