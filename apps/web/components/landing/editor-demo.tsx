"use client";

import { useEffect, useState } from "react";
import { MdFormatQuote, MdImage, MdLink } from "react-icons/md";

const TYPING_SEQUENCE = [
  { text: "The ", delay: 50 },
  { text: "internet", delay: 50 },
  { text: " was", delay: 50 },
  { text: " designed", delay: 50 },
  { text: " to", delay: 50 },
  { text: " be", delay: 50 },
  { text: " a", delay: 50 },
  { text: " library.\n\n", delay: 300 },
  { text: "Instead,", delay: 50 },
  { text: " we", delay: 50 },
  { text: " got", delay: 50 },
  { text: " ", delay: 50 },
  { text: "[[", delay: 400, action: "open_menu" },
  { text: "Algo", delay: 100 },
  { text: "rithmic", delay: 100 },
  { text: " Anxiety", delay: 100 },
  { text: "]]", delay: 400, action: "close_menu" },
  { text: ".", delay: 800 },
];

export function EditorDemo() {
  const [content, setContent] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);

  // Blink cursor
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Typing loop
  useEffect(() => {
    if (stepIndex >= TYPING_SEQUENCE.length) {
      // Reset after a long pause
      const timeout = setTimeout(() => {
        setContent("");
        setStepIndex(0);
        setShowMenu(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }

    const step = TYPING_SEQUENCE[stepIndex];
    const timeout = setTimeout(() => {
      if (step.action === "open_menu") setShowMenu(true);
      if (step.action === "close_menu") setShowMenu(false);

      setContent((prev) => prev + step.text);
      setStepIndex((prev) => prev + 1);
    }, step.delay);

    return () => clearTimeout(timeout);
  }, [stepIndex]);

  // Render stylized content
  const renderContent = () => {
    // Basic regex to highlight [[...]]
    const parts = content.split(/(\[\[.*?\].*?\]\])/g);
    return parts.map((part, i) => {
      if (part.startsWith("[[") && part.endsWith("]]")) {
        return (
          <span
            key={i}
            className="text-[#6E7A8A] border-b border-[#6E7A8A]/50 pb-0.5"
          >
            {part.slice(2, -2)}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-[#0B0B0C] border border-[#1A1A1D] rounded-xl shadow-2xl overflow-hidden font-mono text-sm md:text-base">
      {/* Toolbar */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[#1A1A1D] bg-[#0B0B0C]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#1A1A1D]" />
          <div className="w-3 h-3 rounded-full bg-[#1A1A1D]" />
          <div className="w-3 h-3 rounded-full bg-[#1A1A1D]" />
        </div>
        <div className="h-4 w-[1px] bg-[#1A1A1D] mx-2" />
        <div className="flex items-center gap-3 text-[#6E6E73]">
          <span className="font-serif italic font-bold">B</span>
          <span className="font-serif italic">I</span>
          <MdLink size={16} />
          <MdFormatQuote size={16} />
          <MdImage size={16} />
        </div>
      </div>

      {/* Editor Area */}
      <div className="p-6 h-[240px] relative text-[#F2F2F2] leading-relaxed whitespace-pre-wrap font-serif">
        {renderContent()}
        <span
          className={`${
            cursorVisible ? "opacity-100" : "opacity-0"
          } inline-block w-[2px] h-[1.2em] bg-[#6E7A8A] align-middle ml-[1px]`}
        />

        {/* Floating Menu */}
        {showMenu && (
          <div className="absolute top-[110px] left-[100px] w-48 bg-[#0B0B0C] border border-[#1A1A1D] rounded-lg shadow-xl z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-[#6E6E73] bg-[#0F0F10] border-b border-[#1A1A1D]">
              Link to Topic
            </div>
            <div className="flex flex-col">
              <div className="px-3 py-2 text-[#F2F2F2] hover:bg-[#1A1A1D] cursor-pointer flex justify-between items-center bg-[#1A1A1D]">
                <span>Algorithmic Anxiety</span>
                <span className="text-[10px] text-[#6E7A8A]">New</span>
              </div>
              <div className="px-3 py-2 text-[#A8A8AA] hover:bg-[#1A1A1D] cursor-pointer">
                Algorithm
              </div>
              <div className="px-3 py-2 text-[#A8A8AA] hover:bg-[#1A1A1D] cursor-pointer">
                Algorithms of Oppression
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="px-4 py-2 bg-[#0F0F10] border-t border-[#1A1A1D] flex justify-between items-center text-[10px] text-[#6E7A8A] font-mono tracking-wider">
        <span>MARKDOWN MODE</span>
        <span>0 WORDS</span>
      </div>
    </div>
  );
}
