'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AutocompleteDropdown } from '@/components/autocomplete-dropdown';
import { ImageUploader } from '@/components/image-uploader';
import { DesktopSidebar } from '@/components/desktop-sidebar';
import { DesktopRightSidebar } from '@/components/desktop-right-sidebar';

function ComposeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quotePostId = searchParams.get('quote');
  
  const [body, setBody] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [headerImageKey, setHeaderImageKey] = useState<string | null>(null);
  const [autocomplete, setAutocomplete] = useState<{
    show: boolean;
    query: string;
    type: 'topic' | 'post' | 'user' | 'all';
    position: { top: number; left: number };
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePublish = async () => {
    if (!body.trim()) return;
    
    setIsPublishing(true);
    try {
      // Check if this is a quote
      if (quotePostId) {
        const res = await fetch('/api/posts/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId: quotePostId,
            body,
          }),
        });
        
        if (res.ok) {
          router.push('/home');
          router.refresh();
        }
      } else {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            body,
            headerImageKey,
          }),
        });
        
        if (res.ok) {
          router.push('/home');
          router.refresh();
        }
      }
    } catch (error) {
      console.error('Failed to publish', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.substring(start, end);
    const newText = body.substring(0, start) + before + selected + after + body.substring(end);
    setBody(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newPos = start + before.length + selected.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const insertTitle = () => {
    if (!body.trim() || !body.startsWith('#')) {
      setBody('# ' + body);
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(2, 2);
      }, 0);
    }
  };

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newBody = e.target.value;
    setBody(newBody);

    const textarea = e.target;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = newBody.substring(0, cursorPos);

    const wikilinkMatch = textBeforeCursor.match(/\[\[([^\]]*)$/);
    if (wikilinkMatch) {
      const query = wikilinkMatch[1];
      const rect = textarea.getBoundingClientRect();
      const lineHeight = 24; // Approximate line height
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines.length - 1;
      
      setAutocomplete({
        show: true,
        query,
        type: 'all',
        position: {
          top: rect.top + (currentLine * lineHeight) + lineHeight,
          left: rect.left + 20,
        },
      });
      return;
    }

    // Detect @ for mention autocomplete
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const query = mentionMatch[1];
      const rect = textarea.getBoundingClientRect();
      const lineHeight = 24;
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines.length - 1;
      
      setAutocomplete({
        show: true,
        query,
        type: 'user',
        position: {
          top: rect.top + (currentLine * lineHeight) + lineHeight,
          left: rect.left + 20,
        },
      });
      return;
    }

    setAutocomplete(null);
  };

  const handleAutocompleteSelect = (item: { id: string; type: 'topic' | 'post' | 'user' | 'all'; title: string; slug?: string }) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = body.substring(0, cursorPos);
    const textAfterCursor = body.substring(cursorPos);

    let replacement = '';
    if (item.type === 'user') {
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
      if (mentionMatch) {
        replacement = `@${item.title.split('@')[1] || item.title} `;
        const newText = textBeforeCursor.replace(/@\w*$/, replacement) + textAfterCursor;
        setBody(newText);
        setTimeout(() => {
          const newPos = cursorPos - mentionMatch[0].length + replacement.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
      }
    } else if (item.type === 'topic') {
      const wikilinkMatch = textBeforeCursor.match(/\[\[([^\]]*)$/);
      if (wikilinkMatch) {
        replacement = `[[${item.slug || item.title}]]`;
        const newText = textBeforeCursor.replace(/\[\[[^\]]*$/, replacement) + textAfterCursor;
        setBody(newText);
        setTimeout(() => {
          const newPos = cursorPos - wikilinkMatch[0].length + replacement.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
      }
    } else if (item.type === 'post') {
      const wikilinkMatch = textBeforeCursor.match(/\[\[([^\]]*)$/);
      if (wikilinkMatch) {
        replacement = `[[post:${item.id}]]`;
        const newText = textBeforeCursor.replace(/\[\[[^\]]*$/, replacement) + textAfterCursor;
        setBody(newText);
        setTimeout(() => {
          const newPos = cursorPos - wikilinkMatch[0].length + replacement.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
      }
    }

    setAutocomplete(null);
  };

  return (
    <div className="flex min-h-screen bg-ink">
      <DesktopSidebar />
      <main className="flex-1 flex justify-center lg:max-w-4xl xl:max-w-5xl">
        <div className="w-full border-x border-divider min-h-screen">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-ink/90 backdrop-blur-md border-b border-divider">
        <button
          onClick={() => router.back()}
          className="text-secondary hover:text-paper text-base font-normal transition-colors px-2"
        >
          Cancel
        </button>
        <h2 className="text-paper text-base font-bold tracking-tight">New post</h2>
        <button
          onClick={handlePublish}
          disabled={!body.trim() || isPublishing}
          className="bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPublishing ? 'Publishing...' : 'Publish'}
        </button>
      </header>

      {/* Editor Content Area */}
      <main ref={containerRef} className="flex-1 flex flex-col px-5 pt-6 pb-32 min-h-[calc(100vh-60px)]">
        {/* Title Input (if starts with #) */}
        {body.startsWith('#') && (
          <div className="relative mb-6 group">
            <input
              type="text"
              value={body.split('\n')[0].replace(/^#\s*/, '')}
              onChange={(e) => {
                const lines = body.split('\n');
                lines[0] = '# ' + e.target.value;
                setBody(lines.join('\n'));
              }}
              placeholder="Title"
              className="w-full bg-transparent text-white text-[32px] font-bold leading-tight placeholder-tertiary border-none focus:ring-0 p-0 m-0 outline-none"
            />
          </div>
        )}

        {/* Body Text */}
        <div ref={containerRef} className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={handleBodyChange}
            placeholder={body.startsWith('#') ? "Start writing..." : "# Title\n\nStart writing... Link with [[Topic]] or [[post:uuid]]"}
            className="w-full flex-1 text-[17px] leading-[1.6] text-secondary font-normal whitespace-pre-wrap outline-none resize-none bg-transparent min-h-[200px]"
            style={{ fontFamily: 'inherit' }}
          />
          {autocomplete?.show && (
            <AutocompleteDropdown
              query={autocomplete.query}
              type={autocomplete.type}
              onSelect={handleAutocompleteSelect}
              position={autocomplete.position}
              onClose={() => setAutocomplete(null)}
            />
          )}
        </div>
      </main>

      {/* Formatting Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-[#1e1f21] border-t border-white/10 px-4 py-3 flex items-center justify-between z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
        {/* Left Group: Formatting */}
        <div className="flex items-center gap-1">
          <button
            onClick={insertTitle}
            className="size-10 flex items-center justify-center rounded-lg text-tertiary hover:text-paper hover:bg-white/5 transition-colors"
            title="Title"
          >
            <span className="font-serif font-bold text-xl">T</span>
          </button>
          <button
            onClick={() => insertText('**', '**')}
            className="size-10 flex items-center justify-center rounded-lg text-tertiary hover:text-paper hover:bg-white/5 transition-colors"
            title="Bold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9" />
            </svg>
          </button>
          <button
            onClick={() => insertText('_', '_')}
            className="size-10 flex items-center justify-center rounded-lg text-tertiary hover:text-paper hover:bg-white/5 transition-colors"
            title="Italic"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
        </div>
        
        <div className="w-px h-6 bg-white/10 mx-1"></div>
        
        {/* Right Group: Linking */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const link = prompt('Enter URL:');
              if (link) {
                const text = prompt('Display text (optional):') || link;
                insertText(`[${text}](`, ')');
              }
            }}
            className="size-10 flex items-center justify-center rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-colors ring-1 ring-primary/30"
            title="Link"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          <button
            onClick={() => {
              const topic = prompt('Topic name:');
              if (topic) {
                const alias = prompt('Display text (optional):');
                insertText(`[[${topic}${alias ? '|' + alias : ''}]]`);
              }
            }}
            className="size-10 flex items-center justify-center rounded-lg text-tertiary hover:text-paper hover:bg-white/5 transition-colors"
            title="Topic"
          >
            <svg className="w-5 h-5 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </button>
          <button
            onClick={() => {
              const postId = prompt('Post UUID:');
              if (postId) {
                const alias = prompt('Display text (optional):');
                insertText(`[[post:${postId}${alias ? '|' + alias : ''}]]`);
              }
            }}
            className="size-10 flex items-center justify-center rounded-lg text-tertiary hover:text-paper hover:bg-white/5 transition-colors ml-2"
            title="Post link"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button
            onClick={() => {
              const handle = prompt('User handle:');
              if (handle) {
                insertText(`@${handle} `);
              }
            }}
            className="size-10 flex items-center justify-center rounded-lg text-tertiary hover:text-paper hover:bg-white/5 transition-colors"
            title="Mention"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
          <ImageUploader onUploadComplete={(key) => setHeaderImageKey(key)} />
        </div>
      </div>
        </div>
      </main>
      <DesktopRightSidebar />
    </div>
  );
}

export default function ComposePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink flex items-center justify-center text-secondary">Loading editor...</div>}>
      <ComposeContent />
    </Suspense>
  );
}