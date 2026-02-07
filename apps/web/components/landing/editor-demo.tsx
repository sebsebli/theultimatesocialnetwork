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

  // Render stylized content
  const renderContent = () => {
    const parts = content.split(/(\[\[.*?\]\])/g);
    return parts.map((part, i) => {
      if (part.startsWith("[[") && part.endsWith("]]")) {
        const linkContent = part.slice(2, -2);
        // Extract display text (after pipe) or use full content
        const displayText = linkContent.includes("|")
          ? linkContent.split("|")[1]
          : linkContent;
        return (
          <span
            key={i}
            className="text-[var(--primary)] border-b border-[var(--primary)]/50 pb-0.5"
          >
            {displayText}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-[var(--background)] border border-[var(--divider)] rounded-xl shadow-2xl overflow-hidden font-mono text-sm md:text-base">
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
      <div className="p-6 h-[240px] relative text-[var(--foreground)] leading-relaxed whitespace-pre-wrap font-serif">
        {renderContent()}
        <span
          className={`${
            cursorVisible ? "opacity-100" : "opacity-0"
          } inline-block w-[2px] h-[1.2em] bg-[var(--primary)] align-middle ml-[1px]`}
        />

        {/* Floating Menu */}
        {showMenu && (
          <div className="absolute top-[110px] left-[100px] w-48 bg-[var(--background)] border border-[var(--divider)] rounded-lg shadow-xl z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal surface - keep hardcoded color for visual distinction */}
            <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-[var(--tertiary)] bg-[#0F0F10] border-b border-[var(--divider)]">
              Link to Post or Topic
            </div>
            <div className="flex flex-col">
              <div className="px-3 py-2 text-[var(--foreground)] hover:bg-[var(--divider)] cursor-pointer flex justify-between items-center bg-[var(--divider)]">
                <span>Maria&apos;s sourdough recipe</span>
                <span className="text-[10px] text-[var(--primary)]">Post</span>
              </div>
              <div className="px-3 py-2 text-[var(--secondary)] hover:bg-[var(--divider)] cursor-pointer">
                Fermentation
              </div>
              <div className="px-3 py-2 text-[var(--secondary)] hover:bg-[var(--divider)] cursor-pointer">
                Bread
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Status */}
      {/* Modal surface - keep hardcoded color for visual distinction */}
      <div className="px-4 py-2 bg-[#0F0F10] border-t border-[var(--divider)] flex justify-between items-center text-[10px] text-[var(--primary)] font-mono tracking-wider">
        <span>MARKDOWN</span>
        <span>
          {wordCount} {wordCount === 1 ? "WORD" : "WORDS"}
        </span>
      </div>
    </div>
  );
}
