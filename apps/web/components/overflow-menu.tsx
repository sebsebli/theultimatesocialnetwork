'use client';

import { useState, useRef, useEffect } from 'react';

interface OverflowMenuProps {
  onReport?: () => void;
  onMute?: () => void;
  onBlock?: () => void;
  onCopyLink?: () => void;
  postId?: string;
  replyId?: string;
  userId?: string;
  isAuthor?: boolean;
}

export function OverflowMenu({
  onReport,
  onMute,
  onBlock,
  onCopyLink,
  postId,
  replyId,
  userId,
  isAuthor = false,
}: OverflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCopyLink = () => {
    if (postId) {
      const url = `${window.location.origin}/post/${postId}`;
      navigator.clipboard.writeText(url);
    }
    onCopyLink?.();
    setIsOpen(false);
  };

  const handleReport = async () => {
    if (onReport) {
      onReport();
    } else if (postId || replyId) {
      // Default report behavior
      try {
        await fetch('/api/safety/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetId: postId || replyId,
            targetType: postId ? 'POST' : 'REPLY',
            reason: 'Reported via overflow menu',
          }),
        });
      } catch (error) {
        console.error('Failed to report', error);
      }
    }
    setIsOpen(false);
  };

  const handleMute = async () => {
    if (onMute) {
      onMute();
    } else if (userId) {
      try {
        await fetch(`/api/safety/mute/${userId}`, { method: 'POST' });
      } catch (error) {
        console.error('Failed to mute', error);
      }
    }
    setIsOpen(false);
  };

  const handleBlock = async () => {
    if (onBlock) {
      onBlock();
    } else if (userId) {
      try {
        await fetch(`/api/safety/block/${userId}`, { method: 'POST' });
      } catch (error) {
        console.error('Failed to block', error);
      }
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-tertiary hover:text-paper transition-colors"
        aria-label="More options"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-ink border border-divider rounded-lg shadow-lg z-50 overflow-hidden">
          {onCopyLink && (
            <button
              onClick={handleCopyLink}
              className="w-full px-4 py-3 text-left text-paper hover:bg-white/10 transition-colors text-sm"
            >
              Copy link
            </button>
          )}
          {!isAuthor && userId && (
            <>
              <button
                onClick={handleMute}
                className="w-full px-4 py-3 text-left text-paper hover:bg-white/10 transition-colors text-sm"
              >
                Mute @{userId}
              </button>
              <button
                onClick={handleBlock}
                className="w-full px-4 py-3 text-left text-red-500 hover:bg-white/10 transition-colors text-sm"
              >
                Block @{userId}
              </button>
            </>
          )}
          {(postId || replyId) && (
            <button
              onClick={handleReport}
              className="w-full px-4 py-3 text-left text-red-500 hover:bg-white/10 transition-colors text-sm border-t border-divider"
            >
              Report
            </button>
          )}
        </div>
      )}
    </div>
  );
}
