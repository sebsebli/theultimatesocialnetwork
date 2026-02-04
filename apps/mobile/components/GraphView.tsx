import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Pressable, ActivityIndicator, LayoutChangeEvent } from 'react-native';
import Svg, { Line, Circle, G, Text as SvgText } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { api } from '../utils/api';
import { COLORS, FONTS, SPACING, SIZES } from '../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

interface GraphNode {
  id: string;
  type: 'post' | 'topic' | 'user' | 'external';
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

export function GraphView({ postId }: { postId: string }) {
  const router = useRouter();
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 300 });

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    api.get(`/posts/${postId}/graph`)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        // console.error('Failed to load graph', err);
      })
      .finally(() => setLoading(false));
  }, [postId]);

  const layout = useMemo(() => {
    if (!data || containerSize.width === 0) return null;

    const { width, height } = containerSize;
    const cx = width / 2;
    const cy = height / 2;
    const R1 = Math.min(width, height) * 0.35; // Radius for L1
    const R2 = 40; // Offset for L2

    const nodesMap = new Map<string, GraphNode>();
    data.nodes.forEach(n => nodesMap.set(n.id, { ...n }));

    const centerNode = nodesMap.get(data.centerId);
    if (centerNode) {
      centerNode.x = cx;
      centerNode.y = cy;
    }

    // Separate L1 Incoming vs Outgoing
    const l1IncomingIds = new Set<string>();
    const l1OutgoingIds = new Set<string>();
    const l2Nodes = new Set<string>();

    data.edges.forEach(e => {
      if (e.target === data.centerId) l1IncomingIds.add(e.source);
      else if (e.source === data.centerId) l1OutgoingIds.add(e.target);
      else {
        // L2 edge: source or target must be L1. 
        // If source is L1, target is L2.
        if (l1OutgoingIds.has(e.source) || l1IncomingIds.has(e.source)) l2Nodes.add(e.target);
        // If target is L1, source is L2 (incoming to neighbor)
        if (l1OutgoingIds.has(e.target) || l1IncomingIds.has(e.target)) l2Nodes.add(e.source);
      }
    });

    const placeNodesOnArc = (ids: string[], startAngle: number, endAngle: number) => {
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

    // Top Arc: Incoming (Citations) - PI to 2PI (Top Half)
    placeNodesOnArc(Array.from(l1IncomingIds), Math.PI * 1.1, Math.PI * 1.9);

    // Bottom Arc: Outgoing (Sources) - 0 to PI (Bottom Half)
    placeNodesOnArc(Array.from(l1OutgoingIds), 0.1, Math.PI * 0.9);

    // Place L2 nodes relative to their parents
    // Simple heuristic: Place them slightly further out on the same vector
    const processedL2 = new Set<string>();
    data.edges.forEach(e => {
      // Outgoing L2: L1 -> L2
      if (nodesMap.has(e.source) && nodesMap.has(e.target) && !processedL2.has(e.target) && nodesMap.get(e.target)?.isL2) {
        const parent = nodesMap.get(e.source)!;
        if (parent.x !== undefined && parent.y !== undefined) {
          // Vector from Center to Parent
          const dx = parent.x - cx;
          const dy = parent.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            // Add jitter or spread if multiple children
            const child = nodesMap.get(e.target)!;
            // Just push it out by R2
            child.x = parent.x + (dx / dist) * R2;
            child.y = parent.y + (dy / dist) * R2;
            processedL2.add(e.target);
          }
        }
      }
    });

    return { nodes: Array.from(nodesMap.values()), edges: data.edges };
  }, [data, containerSize]);

  const handleNodePress = (node: GraphNode) => {
    if (node.isCenter) return;
    if (node.type === 'post') router.push(`/post/${node.id}`);
    else if (node.type === 'topic') router.push(`/topic/${encodeURIComponent(node.label)}`);
    else if (node.type === 'user') router.push(`/user/${node.label}`);
    else if (node.type === 'external' && node.url) {
      // Use standard linking or router
    }
  };

  if (loading) return <View style={{ height: 300, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={COLORS.primary} /></View>;
  if (!data || data.nodes.length <= 1) return null; // Only center node? Hide graph.

  return (
    <View 
      style={{ marginVertical: SPACING.l }}
      onLayout={(e: LayoutChangeEvent) => setContainerSize({ width: e.nativeEvent.layout.width, height: 320 })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.l, marginBottom: SPACING.m }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.tertiary, textTransform: 'uppercase', fontFamily: FONTS.semiBold }}>
          CITEWALK GRAPH
        </Text>
      </View>
      
      <Svg width={containerSize.width} height={containerSize.height}>
        {/* Edges */}
        {layout?.edges.map((e, i) => {
          const start = layout.nodes.find(n => n.id === e.source);
          const end = layout.nodes.find(n => n.id === e.target);
          if (!start?.x || !end?.x) return null;
          return (
            <Line
              key={`edge-${i}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={COLORS.divider}
              strokeWidth={1}
            />
          );
        })}

        {/* Nodes */}
        {layout?.nodes.map((n) => {
          if (n.x === undefined || n.y === undefined) return null;
          const r = n.isCenter ? 24 : n.isL2 ? 8 : 16;
          const color = n.isCenter ? COLORS.primary : n.isL2 ? COLORS.tertiary : COLORS.secondary;
          
          return (
            <G key={n.id} onPress={() => handleNodePress(n)}>
              <Circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill={COLORS.ink}
                stroke={color}
                strokeWidth={n.isCenter ? 3 : 2}
              />
              {/* Initials/Icon */}
              {!n.isL2 && (
                <SvgText
                  x={n.x}
                  y={n.y + (n.isCenter ? 6 : 4)}
                  fontSize={n.isCenter ? 14 : 10}
                  fill={color}
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {n.label.substring(0, 1).toUpperCase()}
                </SvgText>
              )}
            </G>
          );
        })}
      </Svg>
      
      <Text style={{ textAlign: 'center', color: COLORS.tertiary, fontSize: 10, marginTop: -20 }}>
        {data.nodes.length} Connected Nodes
      </Text>
    </View>
  );
}
