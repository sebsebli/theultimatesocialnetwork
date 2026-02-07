"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hero animation for the landing page.
 * Shows a typing animation in a minimal editor that demonstrates
 * Citewalk's [[ ]] link syntax + autocomplete, while a mini knowledge
 * graph grows on the right as connections are made.
 */

/* ── Graph node data (grows as typing progresses) ── */
interface GraphNode {
  id: string;
  label: string;
  type: "post" | "topic";
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
}

const FINAL_NODES: GraphNode[] = [
  { id: "center", label: "Your post", type: "post", x: 200, y: 160 },
  { id: "n1", label: "Jan's guide", type: "post", x: 70, y: 60 },
  { id: "n2", label: "Fermentation", type: "topic", x: 340, y: 55 },
  { id: "n3", label: "Bread", type: "topic", x: 335, y: 265 },
  { id: "n4", label: "Alex's reply", type: "post", x: 60, y: 265 },
];

const FINAL_EDGES: GraphEdge[] = [
  { from: "center", to: "n1" },
  { from: "center", to: "n2" },
  { from: "center", to: "n3" },
  { from: "n4", to: "center" },
];

/* ── L2 ghost nodes — faint second-degree connections ── */
interface L2Node {
  id: string;
  label: string;
  type: "post" | "topic";
  x: number;
  y: number;
  parentId: string; // which L1 node this connects to
  parentIndex: number; // visibility threshold (show when parent's nodeIndex is visible)
}

const L2_NODES: L2Node[] = [
  // From n1 (Jan's guide — top-left)
  { id: "l2a", label: "Yeast basics", type: "post", x: 8, y: 12, parentId: "n1", parentIndex: 1 },
  { id: "l2b", label: "Starters", type: "topic", x: 130, y: 6, parentId: "n1", parentIndex: 1 },
  // From n2 (Fermentation — top-right)
  { id: "l2c", label: "Kimchi", type: "topic", x: 395, y: 10, parentId: "n2", parentIndex: 2 },
  { id: "l2d", label: "Sarah's post", type: "post", x: 388, y: 110, parentId: "n2", parentIndex: 2 },
  // From n3 (Bread — bottom-right)
  { id: "l2e", label: "Sourdough", type: "topic", x: 390, y: 210, parentId: "n3", parentIndex: 3 },
  { id: "l2f", label: "Recipe notes", type: "post", x: 300, y: 310, parentId: "n3", parentIndex: 3 },
  // From n4 (Alex's reply — bottom-left)
  { id: "l2g", label: "Discussion", type: "post", x: 10, y: 310, parentId: "n4", parentIndex: 4 },
  { id: "l2h", label: "Baking", type: "topic", x: 8, y: 180, parentId: "n4", parentIndex: 4 },
];

/* ── Typing sequence ── */
interface Step {
  text: string;
  delay: number;
  action?: "open_menu" | "close_menu" | "add_node";
  nodeIndex?: number;
}

const SEQUENCE: Step[] = [
  { text: "B", delay: 60 },
  { text: "u", delay: 40 },
  { text: "i", delay: 40 },
  { text: "l", delay: 40 },
  { text: "d", delay: 40 },
  { text: "i", delay: 40 },
  { text: "n", delay: 40 },
  { text: "g", delay: 40 },
  { text: " ", delay: 40 },
  { text: "o", delay: 40 },
  { text: "n", delay: 40 },
  { text: " ", delay: 80 },
  { text: "[", delay: 300 },
  { text: "[", delay: 150, action: "open_menu" },
  // autocomplete visible for a beat
  { text: "Jan's starter guide", delay: 600, action: "close_menu", nodeIndex: 1 },
  { text: "]]", delay: 200, action: "add_node", nodeIndex: 1 },
  { text: ",", delay: 60 },
  { text: " ", delay: 60 },
  { text: "t", delay: 40 },
  { text: "h", delay: 40 },
  { text: "i", delay: 40 },
  { text: "s", delay: 40 },
  { text: " ", delay: 40 },
  { text: "r", delay: 40 },
  { text: "e", delay: 40 },
  { text: "l", delay: 40 },
  { text: "a", delay: 40 },
  { text: "t", delay: 40 },
  { text: "e", delay: 40 },
  { text: "s", delay: 40 },
  { text: " ", delay: 40 },
  { text: "t", delay: 40 },
  { text: "o", delay: 40 },
  { text: " ", delay: 80 },
  { text: "[", delay: 300 },
  { text: "[", delay: 150, action: "open_menu" },
  { text: "Fermentation", delay: 500, action: "close_menu", nodeIndex: 2 },
  { text: "]]", delay: 200, action: "add_node", nodeIndex: 2 },
  { text: " ", delay: 60 },
  { text: "a", delay: 40 },
  { text: "n", delay: 40 },
  { text: "d", delay: 40 },
  { text: " ", delay: 80 },
  { text: "[", delay: 300 },
  { text: "[", delay: 150, action: "open_menu" },
  { text: "Bread", delay: 400, action: "close_menu", nodeIndex: 3 },
  { text: "]]", delay: 200, action: "add_node", nodeIndex: 3 },
  { text: ".", delay: 400 },
  // Pause, then add the "built upon by" node
  { text: "", delay: 1200, action: "add_node", nodeIndex: 4 },
];

/* ── Render styled content ── */
function renderStyledText(raw: string) {
  const parts = raw.split(/(\[\[.*?\]\])/g);
  return parts.map((part, i) => {
    if (part.startsWith("[[") && part.endsWith("]]")) {
      const inner = part.slice(2, -2);
      const isPost = inner.includes("guide") || inner.includes("reply");
      if (isPost) {
        return (
          <span
            key={i}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 border border-divider text-[var(--primary)] font-sans text-xs font-semibold align-baseline"
          >
            <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {inner}
          </span>
        );
      }
      return (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-divider text-[var(--foreground)] font-sans text-xs font-semibold align-baseline"
        >
          <span className="text-[var(--primary)] font-mono text-[10px]">[[</span>
          {inner}
          <span className="text-[var(--primary)] font-mono text-[10px]">]]</span>
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/* ── Mini graph SVG — polished, with glow, animation & L2 ghost nodes ── */
function MiniGraph({
  visibleNodes,
  visibleEdges,
}: {
  visibleNodes: number;
  visibleEdges: number;
}) {
  const nodes = FINAL_NODES.slice(0, visibleNodes);
  const edges = FINAL_EDGES.slice(0, visibleEdges);

  // L2 nodes become visible once their parent L1 node is shown
  const visibleL2 = L2_NODES.filter((l2) => visibleNodes > l2.parentIndex);

  return (
    <svg viewBox="0 0 400 320" className="w-full h-full" style={{ filter: "drop-shadow(0 0 40px rgba(147,160,176,0.06))" }}>
      <defs>
        {/* Glow for center node */}
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </radialGradient>
        {/* Glow for topic nodes */}
        <radialGradient id="topicGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </radialGradient>
        {/* Glow for post nodes */}
        <radialGradient id="postGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.1" />
          <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0" />
        </radialGradient>
        {/* Animated dash */}
        <style>{`
          @keyframes dash-flow {
            to { stroke-dashoffset: -20; }
          }
          @keyframes node-enter {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes l2-fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes edge-draw {
            from { stroke-dashoffset: 200; }
            to { stroke-dashoffset: 0; }
          }
        `}</style>
      </defs>

      {/* Subtle grid pattern */}
      <pattern id="graph-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="0.5" fill="var(--foreground)" opacity="0.06" />
      </pattern>
      <rect width="400" height="320" fill="url(#graph-grid)" />

      {/* ── L2 ghost edges (rendered first, behind everything) ── */}
      {visibleL2.map((l2, i) => {
        const parent = FINAL_NODES.find((n) => n.id === l2.parentId);
        if (!parent) return null;
        return (
          <line
            key={`l2e-${l2.id}`}
            x1={parent.x}
            y1={parent.y}
            x2={l2.x}
            y2={l2.y}
            stroke="var(--foreground)"
            strokeWidth={0.75}
            strokeOpacity={0.08}
            strokeLinecap="round"
            strokeDasharray="4 6"
            style={{
              animation: "l2-fade-in 1.2s ease-out forwards",
              animationDelay: `${0.3 + i * 0.15}s`,
              opacity: 0,
            }}
          />
        );
      })}

      {/* ── L2 ghost nodes ── */}
      {visibleL2.map((l2, i) => {
        const isTopic = l2.type === "topic";
        const r = 10;
        return (
          <g
            key={l2.id}
            style={{
              animation: "l2-fade-in 1s ease-out forwards",
              animationDelay: `${0.5 + i * 0.15}s`,
              opacity: 0,
            }}
          >
            {/* Tiny ghost circle */}
            <circle
              cx={l2.x}
              cy={l2.y}
              r={r}
              fill={isTopic ? "var(--primary)" : "var(--foreground)"}
              fillOpacity={0.04}
              stroke={isTopic ? "var(--primary)" : "var(--foreground)"}
              strokeWidth={0.75}
              strokeOpacity={0.12}
            />
            {/* Tiny icon */}
            {isTopic ? (
              <text
                x={l2.x}
                y={l2.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--primary)"
                fontSize={6}
                fontFamily="monospace"
                fontWeight={700}
                opacity={0.25}
              >
                [[]]
              </text>
            ) : (
              <text
                x={l2.x}
                y={l2.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--foreground)"
                fontSize={7}
                opacity={0.2}
              >
                ✎
              </text>
            )}
            {/* Faint label */}
            <text
              x={l2.x}
              y={l2.y + r + 10}
              textAnchor="middle"
              fill="var(--foreground)"
              fontSize={8}
              fontWeight={400}
              opacity={0.2}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {l2.label}
            </text>
          </g>
        );
      })}

      {/* ── L1 Edges with animated dashes ── */}
      {edges.map((edge, i) => {
        const from = FINAL_NODES.find((n) => n.id === edge.from);
        const to = FINAL_NODES.find((n) => n.id === edge.to);
        if (!from || !to) return null;
        return (
          <g key={`e-${i}`}>
            {/* Soft glow line behind */}
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="var(--primary)"
              strokeWidth={4}
              strokeOpacity={0.06}
              strokeLinecap="round"
            />
            {/* Main edge */}
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="var(--primary)"
              strokeWidth={1.5}
              strokeOpacity={0.35}
              strokeLinecap="round"
              strokeDasharray="200"
              style={{
                animation: "edge-draw 0.8s ease-out forwards",
              }}
            />
            {/* Animated flow particles */}
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="var(--primary)"
              strokeWidth={1}
              strokeOpacity={0.2}
              strokeLinecap="round"
              strokeDasharray="3 17"
              style={{
                animation: "dash-flow 2s linear infinite",
                animationDelay: `${i * 0.3}s`,
              }}
            />
          </g>
        );
      })}

      {/* ── L1 Nodes ── */}
      {nodes.map((node, i) => {
        const isCenter = node.id === "center";
        const isTopic = node.type === "topic";
        const r = isCenter ? 28 : 20;
        const glowR = isCenter ? 50 : 36;
        const glowId = isCenter ? "centerGlow" : isTopic ? "topicGlow" : "postGlow";

        return (
          <g
            key={node.id}
            style={{
              transformOrigin: `${node.x}px ${node.y}px`,
              animation: `node-enter 0.5s ease-out forwards`,
              animationDelay: `${i * 80}ms`,
            }}
          >
            {/* Outer glow */}
            <circle
              cx={node.x}
              cy={node.y}
              r={glowR}
              fill={`url(#${glowId})`}
            />

            {/* Main circle — frosted glass effect */}
            <circle
              cx={node.x}
              cy={node.y}
              r={r}
              fill={isCenter ? "var(--primary)" : isTopic ? "var(--primary)" : "var(--foreground)"}
              fillOpacity={isCenter ? 0.12 : 0.07}
              stroke={isCenter ? "var(--primary)" : isTopic ? "var(--primary)" : "var(--foreground)"}
              strokeWidth={isCenter ? 2 : 1.5}
              strokeOpacity={isCenter ? 0.5 : 0.25}
            />
            {/* Inner highlight ring (center only) */}
            {isCenter && (
              <circle
                cx={node.x}
                cy={node.y}
                r={r - 4}
                fill="none"
                stroke="var(--primary)"
                strokeWidth={0.5}
                strokeOpacity={0.2}
              />
            )}

            {/* Node icon */}
            {isTopic && (
              <text
                x={node.x}
                y={node.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--primary)"
                fontSize={10}
                fontFamily="monospace"
                fontWeight={700}
                opacity={0.6}
              >
                [[]]
              </text>
            )}
            {node.type === "post" && !isCenter && (
              <text
                x={node.x}
                y={node.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--foreground)"
                fontSize={10}
                opacity={0.4}
              >
                ✎
              </text>
            )}
            {isCenter && (
              <text
                x={node.x}
                y={node.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--primary)"
                fontSize={11}
                fontWeight={600}
                opacity={0.7}
              >
                ✎
              </text>
            )}

            {/* Label */}
            <text
              x={node.x}
              y={node.y + r + 14}
              textAnchor="middle"
              fill="var(--foreground)"
              fontSize={11}
              fontWeight={isCenter ? 600 : 500}
              opacity={isCenter ? 0.85 : 0.6}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Main component ── */
export function HeroAnimation() {
  const [content, setContent] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [menuHighlight, setMenuHighlight] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [visibleNodes, setVisibleNodes] = useState(1); // center always visible
  const [visibleEdges, setVisibleEdges] = useState(0);
  const stepRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Cursor blink
  useEffect(() => {
    const iv = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(iv);
  }, []);

  // Typing loop
  useEffect(() => {
    const type = () => {
      const idx = stepRef.current;
      if (idx >= SEQUENCE.length) {
        // Pause then reset
        timeoutRef.current = setTimeout(() => {
          setContent("");
          setShowMenu(false);
          setMenuHighlight("");
          setVisibleNodes(1);
          setVisibleEdges(0);
          stepRef.current = 0;
          type();
        }, 4000);
        return;
      }

      const step = SEQUENCE[idx];
      timeoutRef.current = setTimeout(() => {
        if (step.action === "open_menu") {
          setShowMenu(true);
          setMenuHighlight("");
        }
        if (step.action === "close_menu") {
          setShowMenu(false);
          if (step.text) setMenuHighlight(step.text);
        }
        if (step.action === "add_node" && step.nodeIndex != null) {
          setVisibleNodes((v) => Math.max(v, step.nodeIndex! + 1));
          setVisibleEdges((v) => Math.max(v, step.nodeIndex!));
        }

        if (step.text) {
          if (step.action === "close_menu") {
            setContent((prev) => prev + step.text);
          } else if (step.action === "add_node" && step.text === "]]") {
            setContent((prev) => prev + step.text);
          } else {
            setContent((prev) => prev + step.text);
          }
        }

        stepRef.current = idx + 1;
        type();
      }, step.delay);
    };

    type();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="w-full flex flex-col lg:flex-row items-center gap-6">
      {/* Editor panel */}
      <div className="flex-1 w-full max-w-md relative">
        <div className="bg-[var(--background)] border border-[var(--divider)] rounded-xl shadow-2xl">
          {/* Toolbar */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[var(--divider)]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--divider)]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--divider)]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--divider)]" />
            </div>
            <div className="flex-1" />
            <span className="text-[10px] text-[var(--tertiary)] font-mono tracking-wider">
              NEW POST
            </span>
          </div>

          {/* Editor body — tall enough for dropdown */}
          <div className="relative p-5 min-h-[220px] text-[15px] leading-relaxed text-[var(--secondary)] font-serif whitespace-pre-wrap">
            {renderStyledText(content)}
            <span
              className={`inline-block w-[2px] h-[1.1em] bg-[var(--primary)] align-middle ml-[1px] transition-opacity duration-100 ${cursorVisible ? "opacity-100" : "opacity-0"}`}
            />
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-[var(--divider)] flex items-center justify-between text-[10px] text-[var(--primary)] font-mono tracking-wider">
            <span>MARKDOWN</span>
            <span>PUBLISH →</span>
          </div>
        </div>

        {/* Autocomplete dropdown — positioned absolutely outside the overflow container */}
        {showMenu && (
          <div
            className="absolute left-5 w-64 bg-[var(--background)] border border-[var(--divider)] rounded-lg shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
            style={{ top: "calc(44px + 90px)" }}
          >
            <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-[var(--tertiary)] border-b border-[var(--divider)] font-mono">
              Link to…
            </div>
            <div className="flex flex-col py-1">
              <div className="px-3 py-2.5 text-sm flex items-center gap-2.5 bg-[var(--primary)]/10 text-[var(--foreground)] mx-1 rounded">
                <svg className="w-4 h-4 text-[var(--primary)] opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium truncate">Jan&apos;s starter guide</span>
                <span className="text-[10px] text-[var(--primary)] font-mono ml-auto shrink-0">Post</span>
              </div>
              <div className="px-3 py-2.5 text-sm flex items-center gap-2.5 text-[var(--secondary)] mx-1 rounded hover:bg-white/5">
                <span className="text-[var(--primary)] font-mono text-xs font-bold shrink-0 w-4 text-center">[[</span>
                <span className="truncate">Fermentation</span>
                <span className="text-[10px] text-[var(--tertiary)] font-mono ml-auto shrink-0">Topic</span>
              </div>
              <div className="px-3 py-2.5 text-sm flex items-center gap-2.5 text-[var(--secondary)] mx-1 rounded hover:bg-white/5">
                <span className="text-[var(--primary)] font-mono text-xs font-bold shrink-0 w-4 text-center">[[</span>
                <span className="truncate">Bread</span>
                <span className="text-[10px] text-[var(--tertiary)] font-mono ml-auto shrink-0">Topic</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Graph panel */}
      <div className="flex-1 w-full max-w-sm hidden md:block">
        <div className="relative" style={{ aspectRatio: "400 / 320" }}>
          <MiniGraph visibleNodes={visibleNodes} visibleEdges={visibleEdges} />
          {visibleNodes > 1 && (
            <div className="absolute bottom-2 left-0 right-0 text-center">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--tertiary)] font-mono tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] opacity-50 animate-pulse" />
                {visibleEdges} {visibleEdges === 1 ? "connection" : "connections"} formed
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
