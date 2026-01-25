'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function QuoteComposeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quotedPostId = searchParams.get('post');
  
  const [commentary, setCommentary] = useState('');
  const [quotedPost, setQuotedPost] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (quotedPostId) {
      // Fetch the post being quoted
      fetch(`/api/posts/${quotedPostId}`)
        .then(res => res.json())
        .then(data => setQuotedPost(data))
        .catch(err => console.error('Failed to fetch post', err));
    }
  }, [quotedPostId]);

  const handlePublish = async () => {
    if (!commentary.trim() || !quotedPostId) return;
    
    setIsPublishing(true);
    try {
      const formData = new FormData();
      formData.append('body', commentary);
      formData.append('quotePostId', quotedPostId);
      
      const res = await fetch('/api/posts/quote', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        router.push('/home');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to publish quote', error);
    } finally {
      setIsPublishing(false);
    }
  };

  if (!quotedPost) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <p className="text-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-ink/90 backdrop-blur-md border-b border-divider">
        <button
          onClick={() => router.back()}
          className="text-secondary hover:text-paper text-[17px] font-normal transition-colors px-2"
        >
          Cancel
        </button>
        <h2 className="text-paper text-[17px] font-semibold tracking-tight">Quote post</h2>
        <button
          onClick={handlePublish}
          disabled={!commentary.trim() || isPublishing}
          className="bg-primary hover:bg-primary/90 text-white text-[15px] font-semibold px-4 py-1.5 rounded-full transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPublishing ? 'Publishing...' : 'Publish'}
        </button>
      </header>

      {/* Content */}
      <main className="px-5 py-6 space-y-6">
        {/* Commentary Input */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">
            Add your commentary
          </label>
          <textarea
            value={commentary}
            onChange={(e) => setCommentary(e.target.value)}
            placeholder="What are your thoughts?"
            className="w-full min-h-[200px] px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-paper placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary resize-none text-[17px] leading-relaxed"
            autoFocus
          />
          <p className="text-xs text-tertiary mt-2">
            {commentary.length > 0 ? `${commentary.length} characters` : 'At least 1 character required'}
          </p>
        </div>

        {/* Quoted Post Preview */}
        <div className="border-t border-divider pt-6">
          <p className="text-sm font-medium text-secondary mb-3">Quoting:</p>
          <div className="pl-4 border-l-2 border-primary/50 bg-white/5 rounded-r-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
                {quotedPost.author?.displayName?.charAt(0) || 'U'}
              </div>
              <div>
                <div className="text-sm font-semibold text-paper">
                  {quotedPost.author?.displayName || 'Unknown'}
                </div>
                <div className="text-xs text-tertiary">@{quotedPost.author?.handle || 'unknown'}</div>
              </div>
            </div>
            {quotedPost.title && (
              <h3 className="text-base font-bold text-paper mb-2">{quotedPost.title}</h3>
            )}
            <p className="text-sm text-secondary line-clamp-3">{quotedPost.body}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function QuoteComposePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink flex items-center justify-center text-secondary">Loading quote...</div>}>
      <QuoteComposeContent />
    </Suspense>
  );
}