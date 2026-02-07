"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

interface GraphNode {
  id: string;
  type: "post" | "topic" | "user" | "external";
  label: string;
  image?: string | null;
  author?: string;
  url?: string;
  isCenter?: boolean;
  isL2?: boolean;
  x?: number;
  y?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

interface GraphData {
  centerId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphViewProps {
  postId: string;
  /** When true, render without section border and heading (used inside post tabs). */
  asTabContent?: boolean;
}

export function GraphView({ postId, asTabContent = false }: GraphViewProps) {
  const router = useRouter();
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 300 });

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    const run = async () => {
      const res = await fetch(`/api/posts/${postId}/graph`);
      const json = res.ok ? await res.json() : null;
      if (!cancelled) {
        setData(json ?? null);
      }
      if (!cancelled) setLoading(false);
    };
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    run();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const layout = useMemo(() => {
    if (!data || containerSize.width === 0) return null;

    const { width, height } = containerSize;
    const cx = width / 2;
    const cy = height / 2;
    const R1 = Math.min(width, height) * 0.35;
    const R2 = 40;

    const nodesMap = new Map<string, GraphNode>();
    data.nodes.forEach((n) => nodesMap.set(n.id, { ...n }));

    const centerNode = nodesMap.get(data.centerId);
    if (centerNode) {
      centerNode.x = cx;
      centerNode.y = cy;
    }

    const l1IncomingIds = new Set<string>();
    const l1OutgoingIds = new Set<string>();
    const l2Nodes = new Set<string>();

    data.edges.forEach((e) => {
      if (e.target === data.centerId) l1IncomingIds.add(e.source);
      else if (e.source === data.centerId) l1OutgoingIds.add(e.target);
      else {
        if (
          l1OutgoingIds.has(e.source) ||
          l1IncomingIds.has(e.source)
        )
          l2Nodes.add(e.target);
        if (
          l1OutgoingIds.has(e.target) ||
          l1IncomingIds.has(e.target)
        )
          l2Nodes.add(e.source);
      }
    });

    const placeNodesOnArc = (
      ids: string[],
      startAngle: number,
      endAngle: number
    ) => {
      const count = ids.length;
      if (count === 0) return;
      const step = (endAngle - startAngle) / (count + 1);
      ids.forEach((id, i) => {
        const node = nodesMap.get(id);
        if (!node) return;
        const angle = startAngle + step * (i + 1);
        node.x = cx + R1 * Math.cos(angle);
        node.y = cy + R1 * Math.sin(angle);
      });
    };

    placeNodesOnArc(Array.from(l1IncomingIds), Math.PI * 1.1, Math.PI * 1.9);
    placeNodesOnArc(Array.from(l1OutgoingIds), 0.1, Math.PI * 0.9);

    const processedL2 = new Set<string>();
    data.edges.forEach((e) => {
      if (
        nodesMap.has(e.source) &&
        nodesMap.has(e.target) &&
        !processedL2.has(e.target) &&
        nodesMap.get(e.target)?.isL2
      ) {
        const parent = nodesMap.get(e.source)!;
        if (parent.x !== undefined && parent.y !== undefined) {
          const dx = parent.x - cx;
          const dy = parent.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            const child = nodesMap.get(e.target)!;
            child.x = parent.x + (dx / dist) * R2;
            child.y = parent.y + (dy / dist) * R2;
            processedL2.add(e.target);
          }
        }
      }
    });

    return { nodes: Array.from(nodesMap.values()), edges: data.edges };
  }, [data, containerSize]);

  const Wrapper = asTabContent ? "div" : "section";
  const wrapperClass = asTabContent ? "pt-1" : "border-t border-divider pt-8 mt-4";
  const heading = !asTabContent && (
    <h2 className="text-xs font-bold uppercase tracking-wider text-tertiary mb-4">
      Citewalk Graph
    </h2>
  );

  if (loading) {
    return (
      <Wrapper className={wrapperClass}>
        {heading}
        <div
          className="h-[300px] flex items-center justify-center bg-white/5 rounded-xl"
          aria-hidden
        >
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Wrapper>
    );
  }

  // Show placeholder when no graph data or only the center node (no connections)
  if (!data || data.nodes.length <= 1) {
    return (
      <Wrapper className={wrapperClass}>
        {heading}
        <div className="rounded-xl bg-white/5 border border-divider/50 flex items-center justify-center min-h-[120px] px-4">
          <p className="text-tertiary text-sm text-center">
            {!data
              ? "Could not load graph"
              : "No connections yet — cite other posts or get cited to see the graph here."}
          </p>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper
      className={wrapperClass}
      ref={(el) => {
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
          const { width } = entries[0]?.contentRect ?? {};
          if (width) setContainerSize({ width, height: 320 });
        });
        ro.observe(el);
      }}
    >
      {heading}
      <div className="overflow-hidden rounded-xl bg-white/5">
        <svg
          width={containerSize.width}
          height={containerSize.height}
          className="max-w-full"
        >
          {layout?.edges.map((e, i) => {
            const start = layout.nodes.find((n) => n.id === e.source);
            const end = layout.nodes.find((n) => n.id === e.target);
            if (!start?.x || !end?.x) return null;
            return (
              <line
                key={`edge-${i}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="currentColor"
                strokeOpacity={0.3}
                strokeWidth={1}
              />
            );
          })}
          {layout?.nodes.map((n) => {
            if (n.x === undefined || n.y === undefined) return null;
            const r = n.isCenter ? 24 : n.isL2 ? 8 : 16;
            const handleClick = () => {
              if (n.isCenter || n.type === "external") return;
              if (n.type === "post") router.push(`/post/${n.id}`);
              else if (n.type === "topic")
                router.push(`/topic/${encodeURIComponent(n.label)}`);
              else if (n.type === "user") router.push(`/user/${n.label}`);
            };
            const isClickable =
              !n.isCenter && n.type !== "external";
            const content = (
              <g
                key={n.id}
                onClick={isClickable ? handleClick : undefined}
                style={
                  isClickable
                    ? { cursor: "pointer" }
                    : undefined
                }
                role={isClickable ? "button" : undefined}
                aria-label={
                  isClickable
                    ? `Go to ${n.type}: ${n.label}`
                    : undefined
                }
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r}
                  fill="var(--color-ink)"
                  stroke={
                    n.isCenter
                      ? "var(--color-primary)"
                      : n.type === "topic"
                        ? "var(--color-topic, var(--color-primary))"
                        : n.type === "user"
                          ? "#7CB3F0"
                          : n.type === "external"
                            ? "var(--color-tertiary)"
                            : "var(--color-secondary)"
                  }
                  strokeWidth={n.isCenter ? 3 : 2}
                />
                {!n.isL2 && (
                  <text
                    x={n.x}
                    y={n.y + (n.isCenter ? 6 : 4)}
                    fontSize={n.isCenter ? 14 : 10}
                    fill={
                      n.isCenter
                        ? "var(--color-primary)"
                        : "var(--color-secondary)"
                    }
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {n.label.substring(0, 1).toUpperCase()}
                  </text>
                )}
              </g>
            );
            return content;
          })}
        </svg>
      </div>
      {/* Legend — matches mobile GraphView */}
      <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: "var(--color-primary)" }} />
          <span className="text-[10px] text-tertiary uppercase tracking-wider font-medium">Post</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: "var(--color-topic, var(--color-primary))" }} />
          <span className="text-[10px] text-tertiary uppercase tracking-wider font-medium">Topic</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: "#7CB3F0" }} />
          <span className="text-[10px] text-tertiary uppercase tracking-wider font-medium">User</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: "var(--color-tertiary)" }} />
          <span className="text-[10px] text-tertiary uppercase tracking-wider font-medium">External</span>
        </div>
      </div>
      <p className="text-center text-tertiary text-xs mt-1.5">
        {data.nodes.length} connected nodes
      </p>
    </Wrapper>
  );
}
