import React, { useEffect, useState, useMemo } from "react";
import { View, Text, Pressable, LayoutChangeEvent } from "react-native";
import Svg, {
  Line,
  Circle,
  G,
  Text as SvgText,
  Defs,
  RadialGradient,
  Stop,
} from "react-native-svg";
import { useRouter } from "expo-router";
import { useOpenExternalLink } from "../hooks/useOpenExternalLink";
import { api } from "../utils/api";
import {
  COLORS,
  FONTS,
  SPACING,
  SIZES,
  createStyles,
} from "../constants/theme";
import { InlineSkeleton } from "./LoadingSkeleton";
import { MaterialIcons } from "@expo/vector-icons";

// ── Render budget ──────────────────────────────────────
// Prevents the SVG from choking when the API returns hundreds of nodes.
const MAX_L1_RENDER = 40;
const MAX_L2_RENDER = 30;
const MAX_TOTAL_RENDER = 60;

// ── Node-type palette (designed for dark backgrounds) ──
// These are intentionally distinct from the main theme to differentiate graph nodes by type.
const TYPE_COLORS: Record<string, string> = {
  post: COLORS.primary, // primary brand color for posts
  topic: COLORS.graphTopic, // mint for topics
  user: COLORS.graphUser, // sky blue for users
  external: COLORS.graphSource, // amber for external sources
};

// ── Interfaces ─────────────────────────────────────────
interface GraphNode {
  id: string;
  type: "post" | "topic" | "user" | "external";
  label: string;
  image?: string | null;
  author?: string;
  url?: string;
  isCenter?: boolean;
  isL2?: boolean;
  // computed by layout
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

interface LayoutResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  overflowCount: number;
  l1InCount: number;
  l1OutCount: number;
  showLabels: boolean;
}

// ── Component ──────────────────────────────────────────
export function GraphView({ postId }: { postId: string }) {
  const router = useRouter();
  const { openExternalLink } = useOpenExternalLink();
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);

  const GRAPH_HEIGHT = 380;

  // ── Fetch graph data ──────────────────────────────
  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    setData(null);
    api
      .get(`/posts/${postId}/graph`)
      .then((res) => {
        const data = res as GraphData | null;
        setData(data ?? null);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [postId]);

  // ── Layout computation ────────────────────────────
  const layout: LayoutResult = useMemo(() => {
    const empty: LayoutResult = {
      nodes: [],
      edges: [],
      overflowCount: 0,
      l1InCount: 0,
      l1OutCount: 0,
      showLabels: false,
    };
    if (!data || containerWidth === 0) return empty;

    const width = containerWidth;
    const height = GRAPH_HEIGHT;
    const cx = width / 2;
    const cy = height / 2;
    const R1 = Math.min(width, height) * 0.28; // inner ring  (L1)
    const R2 = Math.min(width, height) * 0.44; // outer ring  (L2)

    // ── Build a mutable map of all nodes ────────────
    const nodesMap = new Map<string, GraphNode>();
    data.nodes.forEach((n) => nodesMap.set(n.id, { ...n }));

    // ── Classify into L1-incoming, L1-outgoing, L2 ──
    const l1Incoming: string[] = [];
    const l1Outgoing: string[] = [];

    data.edges.forEach((e) => {
      if (
        e.target === data.centerId &&
        nodesMap.has(e.source) &&
        e.source !== data.centerId
      ) {
        if (!l1Incoming.includes(e.source)) l1Incoming.push(e.source);
      } else if (
        e.source === data.centerId &&
        nodesMap.has(e.target) &&
        e.target !== data.centerId
      ) {
        if (!l1Outgoing.includes(e.target)) l1Outgoing.push(e.target);
      }
    });

    const l1Set = new Set([...l1Incoming, ...l1Outgoing]);
    const l2Ids = new Set<string>();

    // Edges between L1 nodes → the far side is L2
    data.edges.forEach((e) => {
      if (e.source === data.centerId || e.target === data.centerId) return;
      if (l1Set.has(e.source) && !l1Set.has(e.target) && nodesMap.has(e.target))
        l2Ids.add(e.target);
      if (l1Set.has(e.target) && !l1Set.has(e.source) && nodesMap.has(e.source))
        l2Ids.add(e.source);
    });

    // Nodes the API already flagged
    data.nodes.forEach((n) => {
      if (n.isL2 && !l1Set.has(n.id) && n.id !== data.centerId) l2Ids.add(n.id);
    });

    // ── Apply render budget ─────────────────────────
    const cappedL1In = l1Incoming.slice(0, MAX_L1_RENDER);
    const cappedL1Out = l1Outgoing.slice(0, MAX_L1_RENDER);
    const l1Total = cappedL1In.length + cappedL1Out.length;
    const l2Budget = Math.min(
      MAX_L2_RENDER,
      MAX_TOTAL_RENDER - l1Total - 1,
    );
    const cappedL2 = Array.from(l2Ids).slice(0, Math.max(0, l2Budget));

    const renderedIds = new Set([
      data.centerId,
      ...cappedL1In,
      ...cappedL1Out,
      ...cappedL2,
    ]);
    const overflow = Math.max(0, data.nodes.length - renderedIds.size);

    // ── Place center node ───────────────────────────
    const centerNode = nodesMap.get(data.centerId);
    if (centerNode) {
      centerNode.x = cx;
      centerNode.y = cy;
    }

    // ── Helper: distribute ids on an arc ────────────
    const placeOnArc = (
      ids: string[],
      startAngle: number,
      endAngle: number,
      radius: number,
    ) => {
      const count = ids.length;
      if (count === 0) return;
      const step = (endAngle - startAngle) / (count + 1);
      ids.forEach((id, i) => {
        const node = nodesMap.get(id);
        if (!node) return;
        const angle = startAngle + step * (i + 1);
        node.x = cx + radius * Math.cos(angle);
        node.y = cy + radius * Math.sin(angle);
      });
    };

    // SVG y-down: π→2π is top half,  0→π is bottom half
    placeOnArc(cappedL1In, Math.PI + 0.15, Math.PI * 2 - 0.15, R1);
    placeOnArc(cappedL1Out, 0.15, Math.PI - 0.15, R1);

    // ── Place L2 nodes fanned around their parents ──
    const l2ParentMap = new Map<string, string>();
    data.edges.forEach((e) => {
      if (
        cappedL2.includes(e.target) &&
        l1Set.has(e.source) &&
        !l2ParentMap.has(e.target)
      )
        l2ParentMap.set(e.target, e.source);
      if (
        cappedL2.includes(e.source) &&
        l1Set.has(e.target) &&
        !l2ParentMap.has(e.source)
      )
        l2ParentMap.set(e.source, e.target);
    });

    // Group children by parent
    const l2ByParent = new Map<string, string[]>();
    cappedL2.forEach((l2Id) => {
      const parentId = l2ParentMap.get(l2Id);
      if (parentId) {
        const arr = l2ByParent.get(parentId) || [];
        arr.push(l2Id);
        l2ByParent.set(parentId, arr);
      }
    });

    l2ByParent.forEach((children, parentId) => {
      const parent = nodesMap.get(parentId);
      if (!parent || parent.x === undefined || parent.y === undefined) return;
      const dx = parent.x - cx;
      const dy = parent.y - cy;
      const parentAngle = Math.atan2(dy, dx);
      const fanSpread = Math.PI * 0.3;
      const count = children.length;
      children.forEach((childId, i) => {
        const child = nodesMap.get(childId);
        if (!child) return;
        const offset =
          count === 1 ? 0 : fanSpread * (i / (count - 1) - 0.5);
        const angle = parentAngle + offset;
        child.x = cx + R2 * Math.cos(angle);
        child.y = cy + R2 * Math.sin(angle);
      });
    });

    // Orphan L2s (no parent edge matched) → spread evenly on outer ring
    const orphanL2 = cappedL2.filter((id) => {
      const n = nodesMap.get(id);
      return n && n.x === undefined;
    });
    if (orphanL2.length > 0) placeOnArc(orphanL2, 0, Math.PI * 2, R2);

    // ── Filtered output ─────────────────────────────
    const filteredEdges = data.edges.filter(
      (e) => renderedIds.has(e.source) && renderedIds.has(e.target),
    );
    const filteredNodes = Array.from(nodesMap.values()).filter((n) =>
      renderedIds.has(n.id),
    );

    // Only show labels when the arcs aren't overcrowded
    const showLabels =
      cappedL1In.length <= 12 && cappedL1Out.length <= 12;

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      overflowCount: overflow,
      l1InCount: l1Incoming.length,
      l1OutCount: l1Outgoing.length,
      showLabels,
    };
  }, [data, containerWidth, GRAPH_HEIGHT]);

  // ── Navigation ────────────────────────────────────
  const handleNodePress = (node: GraphNode) => {
    if (node.isCenter) return;
    if (node.type === "post") router.push(`/post/${node.id}`);
    else if (node.type === "topic")
      router.push(`/topic/${encodeURIComponent(node.label)}`);
    else if (node.type === "user") router.push(`/user/${node.label}`);
    else if (node.type === "external" && node.url)
      openExternalLink(node.url);
  };

  const nodeColor = (n: GraphNode) =>
    n.isCenter ? COLORS.primary : (TYPE_COLORS[n.type] ?? COLORS.secondary);

  // ── Loading state ─────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <InlineSkeleton />
      </View>
    );
  }

  // ── Empty / error state ───────────────────────────
  if (!data || data.nodes.length <= 1) {
    return (
      <View style={styles.emptyWrap}>
        <MaterialIcons
          name="account-tree"
          size={32}
          color={COLORS.tertiary}
          style={{ marginBottom: SPACING.m }}
        />
        <Text style={styles.emptyText}>
          {!data
            ? "Could not load graph"
            : "No connections yet — cite other posts or get cited to see the graph here."}
        </Text>
      </View>
    );
  }

  // ── Sort nodes: L2 first (bottom layer), then L1, then center on top
  const sortedNodes = useMemo(() => {
    return [...layout.nodes].sort((a, b) => {
      if (a.isCenter) return 1;
      if (b.isCenter) return -1;
      if (a.isL2 && !b.isL2) return -1;
      if (!a.isL2 && b.isL2) return 1;
      return 0;
    });
  }, [layout.nodes]);

  const cx = containerWidth / 2;
  const cy = GRAPH_HEIGHT / 2;
  const R1 = Math.min(containerWidth, GRAPH_HEIGHT) * 0.28;
  const R2 = Math.min(containerWidth, GRAPH_HEIGHT) * 0.44;

  return (
    <View
      style={styles.container}
      onLayout={(e: LayoutChangeEvent) =>
        setContainerWidth(e.nativeEvent.layout.width)
      }
    >
      {/* ── "Cited by" label above graph ── */}
      {layout.l1InCount > 0 && (
        <View style={styles.arcLabel}>
          <Text style={styles.arcLabelText}>
            CITED BY ({layout.l1InCount})
          </Text>
        </View>
      )}

      {containerWidth > 0 && (
        <Svg width={containerWidth} height={GRAPH_HEIGHT}>
          {/* ── Gradient definition for center glow ── */}
          <Defs>
            <RadialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={COLORS.primary} stopOpacity="0.4" />
              <Stop
                offset="100%"
                stopColor={COLORS.primary}
                stopOpacity="0"
              />
            </RadialGradient>
          </Defs>

          {/* ── Subtle concentric ring guides ── */}
          <Circle
            cx={cx}
            cy={cy}
            r={R1}
            fill="none"
            stroke={`${COLORS.divider}40`}
            strokeWidth={0.5}
            strokeDasharray="4,6"
          />
          <Circle
            cx={cx}
            cy={cy}
            r={R2}
            fill="none"
            stroke={`${COLORS.divider}20`}
            strokeWidth={0.5}
            strokeDasharray="4,6"
          />

          {/* ── Center glow disc ── */}
          {(() => {
            const center = layout.nodes.find((n) => n.isCenter);
            if (!center || center.x === undefined || center.y === undefined)
              return null;
            return (
              <Circle
                cx={center.x}
                cy={center.y}
                r={50}
                fill="url(#centerGlow)"
              />
            );
          })()}

          {/* ── Edges ── */}
          {layout.edges.map((e, i) => {
            const start = layout.nodes.find((n) => n.id === e.source);
            const end = layout.nodes.find((n) => n.id === e.target);
            if (
              !start?.x ||
              !end?.x ||
              start.y === undefined ||
              end.y === undefined
            )
              return null;

            const isL2Edge =
              (start.isL2 || end.isL2) &&
              !start.isCenter &&
              !end.isCenter;

            return (
              <Line
                key={`e-${i}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={
                  isL2Edge
                    ? `${COLORS.divider}80`
                    : `${COLORS.secondary}50`
                }
                strokeWidth={isL2Edge ? 0.5 : 1}
                strokeDasharray={isL2Edge ? "3,4" : undefined}
              />
            );
          })}

          {/* ── Nodes ── */}
          {sortedNodes.map((n) => {
            if (n.x === undefined || n.y === undefined) return null;
            const color = nodeColor(n);
            const isCenter = !!n.isCenter;
            const isL2 = !!n.isL2;
            const r = isCenter ? 22 : isL2 ? 4.5 : 13;

            return (
              <G key={n.id} onPress={() => handleNodePress(n)}>
                {/* Outer halo for L1 nodes */}
                {!isL2 && !isCenter && (
                  <Circle
                    cx={n.x}
                    cy={n.y}
                    r={r + 3}
                    fill="none"
                    stroke={`${color}25`}
                    strokeWidth={2}
                  />
                )}

                {/* Main circle */}
                <Circle
                  cx={n.x}
                  cy={n.y}
                  r={r}
                  fill={
                    isCenter
                      ? color
                      : isL2
                        ? `${color}70`
                        : COLORS.ink
                  }
                  stroke={isL2 ? "none" : color}
                  strokeWidth={isCenter ? 3 : 1.5}
                />

                {/* Center: two-letter abbreviation */}
                {isCenter && (
                  <SvgText
                    x={n.x}
                    y={n.y + 5}
                    fontSize={12}
                    fill={COLORS.ink}
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {n.label.substring(0, 2).toUpperCase()}
                  </SvgText>
                )}

                {/* L1: single letter inside */}
                {!isCenter && !isL2 && (
                  <SvgText
                    x={n.x}
                    y={n.y + 4}
                    fontSize={9}
                    fill={color}
                    textAnchor="middle"
                    fontWeight="600"
                  >
                    {n.label.substring(0, 1).toUpperCase()}
                  </SvgText>
                )}

                {/* L1: truncated label below node (when not overcrowded) */}
                {!isCenter && !isL2 && layout.showLabels && (
                  <SvgText
                    x={n.x}
                    y={n.y + r + 12}
                    fontSize={7.5}
                    fill={COLORS.tertiary}
                    textAnchor="middle"
                    fontFamily={FONTS.regular}
                  >
                    {n.label.length > 14
                      ? n.label.substring(0, 13) + "\u2026"
                      : n.label}
                  </SvgText>
                )}
              </G>
            );
          })}
        </Svg>
      )}

      {/* ── "Sources" label below graph ── */}
      {layout.l1OutCount > 0 && (
        <View style={styles.arcLabel}>
          <Text style={styles.arcLabelText}>
            SOURCES ({layout.l1OutCount})
          </Text>
        </View>
      )}

      {/* ── Legend ── */}
      <View style={styles.legend}>
        {(
          [
            ["post", "Post"],
            ["topic", "Topic"],
            ["user", "User"],
            ["external", "Link"],
          ] as const
        ).map(([type, label]) => (
          <View key={type} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: TYPE_COLORS[type] },
              ]}
            />
            <Text style={styles.legendLabel}>{label}</Text>
          </View>
        ))}
        <View style={styles.legendItem}>
          <View style={[styles.legendDotSmall, { backgroundColor: COLORS.tertiary }]} />
          <Text style={styles.legendLabel}>L2</Text>
        </View>
      </View>

      {/* ── Footer ── */}
      <Text style={styles.footer}>
        {data.nodes.length} node{data.nodes.length !== 1 ? "s" : ""}
        {layout.overflowCount > 0
          ? ` \u00B7 ${layout.overflowCount} not shown`
          : ""}
        {" \u00B7 tap to explore"}
      </Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────
const styles = createStyles({
  container: {
    marginVertical: SPACING.m,
  },
  loadingWrap: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyWrap: {
    marginVertical: SPACING.l,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.l,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.tertiary,
    textAlign: "center",
    fontFamily: FONTS.regular,
  },
  arcLabel: {
    alignItems: "center",
    paddingVertical: SPACING.xs,
  },
  arcLabelText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: COLORS.tertiary,
    fontFamily: FONTS.semiBold,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: SPACING.m,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.s,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
  legendLabel: {
    fontSize: 10,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  footer: {
    textAlign: "center",
    fontSize: 10,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.s,
    opacity: 0.7,
  },
});
