"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { useToast } from "./ui/toast";
import { ReportModal } from "./report-modal";
import { ShareModal } from "./share-modal";

interface ProfileOptionsMenuProps {
  handle: string;
  userId?: string;
  isSelf: boolean;
}

export function ProfileOptionsMenu({
  handle,
  userId,
  isSelf,
}: ProfileOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();
  const { success, error: toastError } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleShare = () => {
    setShowShareModal(true);
    setIsOpen(false);
  };

  const handleBlock = async () => {
    if (!userId || !confirm(`Are you sure you want to block @${handle}?`))
      return;
    try {
      const res = await fetch(`/api/safety/block/${userId}`, {
        method: "POST",
      });
      if (res.ok) {
        success("User blocked");
        window.location.reload();
      } else {
        throw new Error();
      }
    } catch {
      toastError("Failed to block user");
    }
    setIsOpen(false);
  };

  const handleMute = async () => {
    if (!userId || !confirm(`Are you sure you want to mute @${handle}?`))
      return;
    try {
      const res = await fetch(`/api/safety/mute/${userId}`, { method: "POST" });
      if (res.ok) {
        success("User muted");
      } else {
        throw new Error();
      }
    } catch {
      toastError("Failed to mute user");
    }
    setIsOpen(false);
  };

  const handleReport = async () => {
    if (!userId) return;
    setShowReportModal(true);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-tertiary hover:text-paper hover:bg-white/5 rounded-full transition-colors"
        aria-label="Profile options menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-ink border border-divider rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="py-1">
            <button
              onClick={handleShare}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-paper hover:bg-white/5 transition-colors"
            >
              <svg
                className="w-4 h-4 text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share Profile
            </button>
            <a
              href={`/api/rss/${handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-paper hover:bg-white/5 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <svg
                className="w-4 h-4 text-secondary"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-8.18v4.812c10.559.062 19.121 8.611 19.183 19.168h4.817c-.062-13.21-10.776-23.911-24-23.98z" />
              </svg>
              RSS Feed
            </a>
            {!isSelf && userId && (
              <>
                <div className="h-px bg-divider my-1" />
                <button
                  onClick={handleMute}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-paper hover:bg-white/5 transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                    />
                  </svg>
                  Mute User
                </button>
                <button
                  onClick={handleBlock}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-error hover:bg-white/5 transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-error"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                  Block User
                </button>
                <button
                  onClick={handleReport}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-error hover:bg-white/5 transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-error"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 21v-8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                  </svg>
                  Report User
                </button>
              </>
            )}
            {isSelf && (
              <>
                <div className="h-px bg-divider my-1" />
                <Link
                  href="/settings"
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-paper hover:bg-white/5 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <svg
                    className="w-4 h-4 text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Settings
                </Link>
                <div className="h-px bg-divider my-1" />
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-error hover:bg-white/5 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetId={userId || ""}
        targetType="USER"
      />
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={`${typeof window !== "undefined" ? window.location.origin : ""}/user/${handle}`}
        title={`@${handle}`}
      />
    </div>
  );
}
