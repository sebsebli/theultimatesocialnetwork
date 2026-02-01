"use client";

import { useState, useRef, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { AutocompleteDropdown } from "@/components/autocomplete-dropdown";
import { useAuth } from "@/components/auth-provider";
import { ImageUploader } from "@/components/image-uploader";
import { ReadingMode } from "@/components/reading-mode";
import { getCaretCoordinates } from "@/utils/textarea-caret";
import { getImageUrl } from "@/lib/security";
import {
  enforceTitleAndAliasLimits,
  getProtectedRanges,
  selectionOverlapsProtected,
  hasOverlongHeading,
  hasOverlongRefTitle,
  getTitleFromBody,
  BODY_MAX_LENGTH,
  BODY_MIN_LENGTH,
  TITLE_MAX_LENGTH,
  MAX_TOPIC_REFS,
} from "@/utils/compose-helpers";

function ComposeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const quotePostId = searchParams.get("quote");
  const replyToPostId = searchParams.get("replyTo");

  const [body, setBody] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [headerImageKey, setHeaderImageKey] = useState<string | null>(null);
  const [headerImageBlurhash, setHeaderImageBlurhash] = useState<string | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [previewBody, setPreviewBody] = useState("");

  const [autocomplete, setAutocomplete] = useState<{
    show: boolean;
    query: string;
    type: "topic" | "post" | "user" | "all";
    position: { top: number; left: number };
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Effect to resolve post titles for preview
  useEffect(() => {
    if (viewMode === "preview") {
      resolvePostTitles(body).then(setPreviewBody);
    }
  }, [viewMode, body]);

  const resolvePostTitles = async (text: string) => {
    const postLinkRegex = /\[\[post:([a-f0-9\-]+)\]\]/g;
    let match;
    const idsToFetch = new Set<string>();

    while ((match = postLinkRegex.exec(text)) !== null) {
      idsToFetch.add(match[1]);
    }

    if (idsToFetch.size === 0) return text;

    let resolvedText = text;
    try {
      const ids = Array.from(idsToFetch);
      const titles = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(`/api/posts/${id}`);
            if (res.ok) {
              const post = await res.json();
              return { id, title: post.title || "Untitled Post" };
            }
          } catch {}
          return { id, title: "Linked Post" };
        }),
      );

      titles.forEach(({ id, title }) => {
        const regex = new RegExp(`\\[\\[post:${id}\\]\\]`, "g");
        resolvedText = resolvedText.replace(regex, `[[post:${id}|${title}]]`);
      });
    } catch (e) {
      console.error("Failed to resolve titles", e);
    }
    return resolvedText;
  };

  const handlePublish = async () => {
    const trimmedBody = body.trim();
    if (!trimmedBody) return;

    if (trimmedBody.length < BODY_MIN_LENGTH) {
      alert(`Post must be at least ${BODY_MIN_LENGTH} characters.`);
      return;
    }
    if (trimmedBody.length > BODY_MAX_LENGTH) {
      alert("Post is too long. Please shorten it.");
      return;
    }
    const topicRefMatches = body.match(/\[\[[^\]]*\]\]/g) || [];
    if (topicRefMatches.length > MAX_TOPIC_REFS) {
      alert(`Too many topic/post references. Maximum ${MAX_TOPIC_REFS}.`);
      return;
    }
    if (hasOverlongHeading(trimmedBody)) {
      alert(
        `Headings (H1, H2, H3) must be at most ${TITLE_MAX_LENGTH} characters.`,
      );
      return;
    }
    if (hasOverlongRefTitle(trimmedBody)) {
      alert(
        `Link and tag titles must be at most ${TITLE_MAX_LENGTH} characters.`,
      );
      return;
    }

    setIsPublishing(true);
    try {
      if (quotePostId) {
        const res = await fetch("/api/posts/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: quotePostId, body: trimmedBody }),
        });
        if (res.ok) {
          router.push("/home");
          router.refresh();
        }
      } else if (replyToPostId) {
        const res = await fetch(`/api/posts/${replyToPostId}/replies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: trimmedBody }),
        });
        if (res.ok) {
          router.push(`/post/${replyToPostId}`);
          router.refresh();
        }
      } else {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body: trimmedBody,
            headerImageKey,
            headerImageBlurhash,
          }),
        });
        if (res.ok) {
          router.push("/home");
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Failed to publish", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const insertText = (before: string, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Check protected ranges for formatting
    const isFormatting =
      before === "**" || before === "_" || before.startsWith("#");
    if (isFormatting) {
      const ranges = getProtectedRanges(body);
      const sel = { start, end };
      if (selectionOverlapsProtected(sel, ranges)) {
        alert(
          "Articles, topic tags and links cannot use headings, bold or italic.",
        );
        return;
      }
    }

    const selected = body.substring(start, end);
    const newText =
      body.substring(0, start) +
      before +
      selected +
      after +
      body.substring(end);

    setBody(enforceTitleAndAliasLimits(newText, TITLE_MAX_LENGTH));

    setTimeout(() => {
      textarea.focus();
      const newPos = start + before.length + selected.length + after.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const addLink = () => {
    const url = prompt("URL:");
    if (url) {
      insertText("[", `](${url})`);
    }
  };

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newBody = e.target.value;
    setBody(enforceTitleAndAliasLimits(newBody, TITLE_MAX_LENGTH));
    checkAutocomplete(e.target, newBody);
  };

  const checkAutocomplete = (
    textarea: HTMLTextAreaElement,
    currentBody: string,
  ) => {
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = currentBody.substring(0, cursorPos);

    const setPosition = (
      query: string,
      type: "topic" | "post" | "user" | "all",
    ) => {
      const coords = getCaretCoordinates(textarea, cursorPos);
      setAutocomplete({
        show: true,
        query,
        type,
        position: {
          top: coords.top + coords.height + 10,
          left: coords.left,
        },
      });
    };

    const wikilinkMatch = textBeforeCursor.match(/|||\\\[\[([^\]]*)$/);
    if (wikilinkMatch) {
      setPosition(wikilinkMatch[1], "all");
      return;
    }

    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      setPosition(mentionMatch[1], "user");
      return;
    }

    setAutocomplete(null);
  };

  const handleAutocompleteSelect = (item: {
    id: string;
    type: "topic" | "post" | "user" | "all";
    title: string;
    slug?: string;
  }) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = body.substring(0, cursorPos);
    const textAfterCursor = body.substring(cursorPos);

    let replacement = "";
    if (item.type === "user") {
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
      if (mentionMatch) {
        replacement = `@${item.title.split("@")[1] || item.title} `;
        const newText =
          textBeforeCursor.replace(/@\w*$/, replacement) + textAfterCursor;
        setBody(enforceTitleAndAliasLimits(newText, TITLE_MAX_LENGTH));
        setTimeout(() => {
          const newPos =
            cursorPos - mentionMatch[0].length + replacement.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
      }
    } else if (item.type === "topic") {
      const wikilinkMatch = textBeforeCursor.match(/|||\\\[\[([^\]]*)$/);
      if (wikilinkMatch) {
        replacement = `[[${item.slug || item.title}]]`;
        const newText =
          textBeforeCursor.replace(/|||\\\[\[[^\]]*$/, replacement) +
          textAfterCursor;
        setBody(enforceTitleAndAliasLimits(newText, TITLE_MAX_LENGTH));
        setTimeout(() => {
          const newPos =
            cursorPos - wikilinkMatch[0].length + replacement.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
      }
    } else if (item.type === "post") {
      const wikilinkMatch = textBeforeCursor.match(/|||\\\[\[([^\]]*)$/);
      if (wikilinkMatch) {
        replacement = `[[post:${item.id}]]`;
        const newText =
          textBeforeCursor.replace(/|||\\\[\[[^\]]*$/, replacement) +
          textAfterCursor;
        setBody(enforceTitleAndAliasLimits(newText, TITLE_MAX_LENGTH));
        setTimeout(() => {
          const newPos =
            cursorPos - wikilinkMatch[0].length + replacement.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
      }
    }

    setAutocomplete(null);
  };

  const previewPost = {
    id: "preview",
    title: getTitleFromBody(previewBody) || undefined,
    body: previewBody,
    createdAt: new Date().toISOString(),
    author: {
      id: "me",
      handle: "me",
      displayName: "Me",
    },
    replyCount: 0,
    quoteCount: 0,
    headerImageKey: headerImageKey || undefined,
    // Note: We don't have a blob URL for preview here efficiently without object URL,
    // but ReadingMode likely needs the key.
    // If we have a key, ReadingMode will construct the URL.
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 py-3 bg-ink/90 backdrop-blur-md border-b border-divider">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-secondary hover:text-paper text-base font-normal transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
            <button
              onClick={() => setViewMode("edit")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === "edit"
                  ? "bg-primary text-white shadow-sm"
                  : "text-secondary hover:text-paper"
              }`}
            >
              Write
            </button>
            <button
              onClick={() => {
                if (body.trim().length < BODY_MIN_LENGTH) return;
                setViewMode("preview");
              }}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === "preview"
                  ? "bg-primary text-white shadow-sm"
                  : "text-secondary hover:text-paper"
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-tertiary hidden sm:inline-block">
            {body.length} / {BODY_MAX_LENGTH}
          </span>
          <button
            onClick={handlePublish}
            disabled={!body.trim() || isPublishing}
            className="bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-5 py-2 rounded-full transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isPublishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col px-6 pt-6 pb-32 relative">
        {viewMode === "edit" ? (
          <>
            <div ref={containerRef} className="relative flex-1">
              {headerImageKey && (
                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden group">
                  <Image
                    src={getImageUrl(headerImageKey)}
                    alt="Header preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => {
                      setHeaderImageKey(null);
                      setHeaderImageBlurhash(null);
                    }}
                    className="absolute top-2 right-2 bg-black/60 p-2 rounded-full text-white hover:bg-black/80 transition-colors"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={body}
                onChange={handleBodyChange}
                onScroll={() => setAutocomplete(null)}
                placeholder={
                  body.startsWith("#")
                    ? "Start writing..."
                    : "# Title (optional)\n\nStart writing... Link with [[Topic]] or [[post:uuid]]"
                }
                className="w-full h-full text-[18px] leading-[1.6] text-paper font-normal whitespace-pre-wrap outline-none resize-none bg-transparent min-h-[300px] font-sans selection:bg-primary/30 selection:text-white"
                spellCheck={false}
              />
              {autocomplete?.show && (
                <div style={{ position: "relative" }}>
                  <AutocompleteDropdown
                    query={autocomplete.query}
                    type={autocomplete.type}
                    onSelect={handleAutocompleteSelect}
                    position={autocomplete.position}
                    onClose={() => setAutocomplete(null)}
                    excludeUserId={user?.id as string | undefined}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="max-w-2xl mx-auto w-full animate-in fade-in duration-200">
            {/* Use ReadingMode for preview parity */}
            <ReadingMode post={previewPost} />
          </div>
        )}
      </div>

      {viewMode === "edit" && (
        <div className="fixed bottom-0 left-0 right-0 w-full lg:pl-64 xl:pr-80 z-50">
          <div className="bg-[#1e1f21] border-t border-white/10 px-4 py-3 flex items-center justify-between shadow-[0_-5px_20px_rgba(0,0,0,0.3)] backdrop-blur-xl bg-opacity-95">
            <div className="flex items-center gap-1">
              <button
                onClick={() => insertText("# ")}
                className="size-10 flex items-center justify-center rounded-lg text-tertiary hover:text-paper hover:bg-white/5 transition-colors"
                title="Heading 1"
              >
                <span className="font-serif font-bold text-lg">H1</span>
              </button>
              <button
                onClick={() => insertText("## ")}
                className="size-10 flex items-center justify-center rounded-lg text-tertiary hover:text-paper hover:bg-white/5 transition-colors"
                title="Heading 2"
              >
                <span className="font-serif font-bold text-lg">H2</span>
              </button>
              <button
                onClick={() => insertText("**", "**")}
                className="size-10 flex items-center justify-center rounded-lg text-tertiary hover:text-paper hover:bg-white/5 transition-colors"
                title="Bold"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 12h9"
                  />
                </svg>
              </button>
              <button
                onClick={() => insertText("_", "_")}
                className="size-10 flex items-center justify-center rounded-lg text-tertiary hover:text-paper hover:bg-white/5 transition-colors"
                title="Italic"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </button>
              <button
                onClick={() => insertText("> ")}
                className="size-10 flex items-center justify-center rounded-lg text-tertiary hover:text-paper hover:bg-white/5 transition-colors"
                title="Quote"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
              </button>
            </div>

            <div className="w-px h-6 bg-white/10 mx-2"></div>

            <div className="flex items-center gap-1">
              <button
                onClick={addLink}
                className="size-10 flex items-center justify-center rounded-lg text-tertiary hover:text-paper hover:bg-white/5 transition-colors"
                title="Add Link"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </button>
              <button
                onClick={() => {
                  const topic = prompt("Topic name:");
                  if (topic) insertText(`[[${topic}]]`);
                }}
                className="h-10 px-3 flex items-center gap-2 rounded-lg text-tertiary hover:text-paper hover:bg-white/5 transition-colors"
                title="Link Topic"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                  />
                </svg>
                <span className="text-sm font-medium hidden sm:block">
                  Topic
                </span>
              </button>
              <button
                onClick={() =>
                  document.getElementById("header-image-upload")?.click()
                }
                className={`size-10 flex items-center justify-center rounded-lg transition-colors ${headerImageKey ? "text-primary bg-primary/10" : "text-tertiary hover:text-paper hover:bg-white/5"}`}
                title="Header Image"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <div className="hidden">
                <ImageUploader
                  onUploadComplete={(key, url, blurhash) => {
                    setHeaderImageKey(key);
                    if (blurhash) setHeaderImageBlurhash(blurhash);
                  }}
                  id="header-image-upload"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComposePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ink flex items-center justify-center text-secondary">
          Loading editor...
        </div>
      }
    >
      <ComposeContent />
    </Suspense>
  );
}
