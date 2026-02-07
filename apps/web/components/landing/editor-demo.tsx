"use client";

import { useEffect, useRef, useState } from "react";
import { MdFormatQuote, MdImage, MdLink } from "react-icons/md";

const TYPING_SEQUENCE = [
  { text: "Building", delay: 50 },
  { text: " on", delay: 50 },
  { text: " ", delay: 50 },
  { text: "[[", delay: 400, action: "open_menu" },
  { text: "post:example|Maria's sourdough recipe", delay: 200 },
  { text: "]]", delay: 400, action: "close_menu" },
  { text: ",", delay: 50 },
  { text: " I", delay: 50 },
  { text: " discovered", delay: 50 },
  { text: " that", delay: 50 },
  { text: "...\n\n", delay: 300 },
  { text: "This", delay: 50 },
  { text: " is", delay: 50 },
  { text: " relevant", delay: 50 },
  { text: " to", delay: 50 },
  { text: " ", delay: 50 },
  { text: "[[", delay: 400, action: "open_menu" },
  { text: "Fermentation", delay: 100 },
  { text: "]]", delay: 400, action: "close_menu" },
  { text: " and", delay: 50 },
  { text: " ", delay: 50 },
  { text: "[[", delay: 400, action: "open_menu" },
  { text: "Bread", delay: 100 },
  { text: "]]", delay: 400, action: "close_menu" },
  { text: "...", delay: 800 },
];

export function EditorDemo() {
  const [content, setContent] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const stepIndexRef = useRef(0);

  // Blink cursor
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Typing loop
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const type = () => {
      const idx = stepIndexRef.current;

      if (idx >= TYPING_SEQUENCE.length) {
        // Reset after a long pause
        timeout = setTimeout(() => {
          setContent("");
          stepIndexRef.current = 0;
          setShowMenu(false);
          type();
        }, 5000);
        return;
      }

      const step = TYPING_SEQUENCE[idx];
      timeout = setTimeout(() => {
        if (step.action === "open_menu") setShowMenu(true);
        if (step.action === "close_menu") setShowMenu(false);

        setContent((prev) => prev + step.text);
        stepIndexRef.current = idx + 1;
        type();
      }, step.delay);
    };

    type();

    return () => clearTimeout(timeout);
  }, []);

  // Count words (strip [[...]] markers)
  const plainText = content.replace(/\[\[|\]\]/g, "").trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;

  // Render stylized content — topic pills match the Pill component style
  const renderContent = () => {
    const parts = content.split(/(\[\[.*?\]\])/g);
    return parts.map((part, i) => {
      if (part.startsWith("[[") && part.endsWith("]]")) {
        const linkContent = part.slice(2, -2);
        const isPost = linkContent.includes("post:");
        const displayText = linkContent.includes("|")
          ? linkContent.split("|")[1]
          : linkContent;

        if (isPost) {
          // Post reference — matches inline post link style
          return (
            <span
              key={i}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[var(--primary)] font-sans text-xs font-semibold"
            >
              <svg
                className="w-3 h-3 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {displayText}
            </span>
          );
        }

        // Topic reference — uses [[ ]] bracket syntax (Citewalk's identity)
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[var(--foreground)] font-sans text-xs font-semibold"
          >
            <span className="text-[var(--primary)] font-mono text-[10px]">
              [[
            </span>
            {displayText}
            <span className="text-[var(--primary)] font-mono text-[10px]">
              ]]
            </span>
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-[var(--background)] border border-[var(--divider)] rounded-xl shadow-2xl overflow-hidden text-sm md:text-base">
      {/* Toolbar */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--divider)] bg-[var(--background)]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[var(--divider)]" />
          <div className="w-3 h-3 rounded-full bg-[var(--divider)]" />
          <div className="w-3 h-3 rounded-full bg-[var(--divider)]" />
        </div>
        <div className="h-4 w-[1px] bg-[var(--divider)] mx-2" />
        <div className="flex items-center gap-3 text-[var(--tertiary)]">
          <span className="font-serif italic font-bold">B</span>
          <span className="font-serif italic">I</span>
          <MdLink size={16} />
          <MdFormatQuote size={16} />
          <MdImage size={16} />
        </div>
      </div>

      {/* Editor Area */}
      <div className="p-6 h-[240px] relative text-[var(--secondary)] text-[17px] leading-relaxed whitespace-pre-wrap font-serif">
        {renderContent()}
        <span
          className={`${cursorVisible ? "opacity-100" : "opacity-0"
            } inline-block w-[2px] h-[1.2em] bg-[var(--primary)] align-middle ml-[1px]`}
        />

        {/* Floating Menu */}
        {showMenu && (
          <div className="absolute top-[110px] left-[100px] w-52 bg-[var(--background)] border border-[var(--divider)] rounded-xl shadow-xl z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-[var(--tertiary)] bg-white/5 border-b border-[var(--divider)]">
              Link to Post or Topic
            </div>
            <div className="flex flex-col">
              <div className="px-3 py-2.5 text-[var(--foreground)] flex justify-between items-center bg-white/10 text-sm">
                <span className="font-medium">
                  Maria&apos;s sourdough recipe
                </span>
                <span className="text-[10px] text-[var(--primary)] font-mono">
                  Post
                </span>
              </div>
              <div className="px-3 py-2.5 text-[var(--secondary)] hover:bg-white/5 cursor-pointer text-sm flex items-center gap-2">
                <span className="text-[var(--primary)] font-mono text-[10px]">
                  [[]]
                </span>
                Fermentation
              </div>
              <div className="px-3 py-2.5 text-[var(--secondary)] hover:bg-white/5 cursor-pointer text-sm flex items-center gap-2">
                <span className="text-[var(--primary)] font-mono text-[10px]">
                  [[]]
                </span>
                Bread
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="px-4 py-2 bg-white/5 border-t border-[var(--divider)] flex justify-between items-center text-[10px] text-[var(--primary)] font-mono tracking-wider">
        <span>MARKDOWN</span>
        <span>
          {wordCount} {wordCount === 1 ? "WORD" : "WORDS"}
        </span>
      </div>
    </div>
  );
}
