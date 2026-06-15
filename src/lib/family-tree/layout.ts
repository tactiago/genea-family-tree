import type { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import { NODE_WIDTH, NODE_HEIGHT, NODE_POSITIONS_STORAGE_KEY_V2 } from './constants';

export interface LayoutMetrics {
  CARD_WIDTH: number;
  CARD_HEIGHT: number;
  SPOUSE_GAP: number;
  BRANCH_GAP: number;
  ROW_GAP: number;
}

const defaultMetrics: LayoutMetrics = {
  CARD_WIDTH: NODE_WIDTH,
  CARD_HEIGHT: NODE_HEIGHT,
  SPOUSE_GAP: NODE_WIDTH + 8,
  BRANCH_GAP: NODE_WIDTH + 24,
  ROW_GAP: NODE_HEIGHT + 80,
};

const buildRowUnits = (
  row: Array<{ id: string; x: number; y: number }>,
  spousePairs: Array<[string, string]>,
): Array<Array<{ id: string; x: number; y: number }>> => {
  const inRow = new Set(row.map((n) => n.id));
  const used = new Set<string>();
  const units: Array<Array<{ id: string; x: number; y: number }>> = [];

  spousePairs.forEach(([a, b]) => {
    if (inRow.has(a) && inRow.has(b) && !used.has(a) && !used.has(b)) {
      const na = row.find((n) => n.id === a)!;
      const nb = row.find((n) => n.id === b)!;
      units.push([na, nb]);
      used.add(a);
      used.add(b);
    }
  });

  row.forEach((node) => {
    if (!used.has(node.id)) units.push([node]);
  });

  return units;
};

export const layoutTree = (
  nodes: Node[],
  edgesForDisplay: Edge[],
  edgesForLayout: Edge[],
  levelById?: Map<string, number>,
  metrics: LayoutMetrics = defaultMetrics,
): { nodes: Node[]; edges: Edge[] } => {
  const { CARD_WIDTH, CARD_HEIGHT, SPOUSE_GAP, BRANCH_GAP, ROW_GAP } = metrics;
  const g = new dagre.graphlib.Graph();
  const spousePairs: Array<[string, string]> = [];

  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'TB',
    ranksep: CARD_HEIGHT + 60,
    nodesep: CARD_WIDTH + 40,
  });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: CARD_WIDTH, height: CARD_HEIGHT });
  });

  edgesForDisplay.forEach((edge) => {
    if (edge.type === 'spouse') {
      spousePairs.push([edge.source, edge.target]);
    }
  });

  edgesForLayout.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const rawPositions = new Map<string, { x: number; y: number }>();
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const pos = g.node(node.id);
    if (!pos) return;
    rawPositions.set(node.id, { x: pos.x, y: pos.y });
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y);
  });

  const positions = new Map<string, { x: number; y: number }>();
  const VERTICAL_GAP = ROW_GAP;
  const levelToRow = new Map<number, number>();

  if (levelById && levelById.size > 0) {
    const uniqueLevels = Array.from(new Set(levelById.values())).sort((a, b) => a - b);
    uniqueLevels.forEach((level, index) => {
      levelToRow.set(level, index);
    });

    nodes.forEach((node) => {
      const base = rawPositions.get(node.id);
      if (!base) return;

      const level = levelById.get(node.id) ?? 0;
      const rowIndex = levelToRow.get(level) ?? 0;
      const y = rowIndex * VERTICAL_GAP;
      positions.set(node.id, { x: base.x, y });
    });
  } else {
    rawPositions.forEach((p, id) => {
      const flippedY = maxY - (p.y - minY);
      positions.set(id, { x: p.x, y: flippedY });
    });
  }


  spousePairs.forEach(([sourceId, targetId]) => {
    const sourcePos = positions.get(sourceId);
    const targetPos = positions.get(targetId);

    if (!sourcePos || !targetPos) return;

    const midX = (sourcePos.x + targetPos.x) / 2;
    const midY = (sourcePos.y + targetPos.y) / 2;
    const offset = SPOUSE_GAP / 2;

    positions.set(sourceId, { x: midX - offset, y: midY });
    positions.set(targetId, { x: midX + offset, y: midY });
  });

  const ROW_TOLERANCE = CARD_HEIGHT / 2;
  const rows = new Map<number, Array<{ id: string; x: number; y: number }>>();

  positions.forEach((pos, id) => {
    const rowKey =
      levelById && levelById.has(id) && levelToRow.has(levelById.get(id)!)
        ? levelToRow.get(levelById.get(id)!)!
        : Math.round(pos.y / ROW_TOLERANCE);
    const row = rows.get(rowKey) ?? [];
    row.push({ id, x: pos.x, y: pos.y });
    rows.set(rowKey, row);
  });

  const parentToChildren = new Map<string, string[]>();
  edgesForLayout.forEach((edge) => {
    const children = parentToChildren.get(edge.source) ?? [];
    children.push(edge.target);
    parentToChildren.set(edge.source, children);
  });

  const sortedRowKeys = Array.from(rows.keys()).sort((a, b) => a - b);

  sortedRowKeys.forEach((rowKey, rowIndex) => {
    const row = rows.get(rowKey)!;
    const prevRow = rowIndex > 0 ? rows.get(sortedRowKeys[rowIndex - 1]) : null;

    const prevRowXById = prevRow ? new Map(prevRow.map((n) => [n.id, n.x])) : null;
    const anchorX = (nodeInRow: { id: string; x: number }): number => {
      const children = parentToChildren.get(nodeInRow.id) ?? [];
      if (children.length === 0 || !prevRowXById) return nodeInRow.x;
      const childX = children
        .map((cid) => prevRowXById.get(cid))
        .filter((x): x is number => x !== undefined);
      if (childX.length === 0) return nodeInRow.x;
      return Math.min(...childX);
    };

    const units = buildRowUnits(row, spousePairs);

    const unitAnchor = (unit: typeof row): number =>
      Math.min(...unit.map((n) => anchorX(n)));
    units.sort((ua, ub) => unitAnchor(ua) - unitAnchor(ub));

    let rightEdge = Number.NEGATIVE_INFINITY;
    units.forEach((unit) => {
      const n = unit.length;
      const targetCenter = unit.reduce((sum, node) => sum + anchorX(node), 0) / n;
      const unitWidth = n * CARD_WIDTH + (n - 1) * SPOUSE_GAP;
      let unitCenter = targetCenter;
      const unitLeft = unitCenter - unitWidth / 2;
      if (unitLeft < rightEdge + BRANCH_GAP) {
        unitCenter = rightEdge + BRANCH_GAP + unitWidth / 2;
      }
      rightEdge = unitCenter + unitWidth / 2;
      const startX = unitCenter - unitWidth / 2 + CARD_WIDTH / 2;
      unit.forEach((node, i) => {
        node.x = startX + i * (CARD_WIDTH + SPOUSE_GAP);
        positions.set(node.id, { x: node.x, y: node.y });
      });
    });
  });

  const layoutedNodes = nodes.map((node) => {
    const pos = positions.get(node.id);
    if (!pos) return node;

    return {
      ...node,
      position: { x: pos.x - CARD_WIDTH / 2, y: pos.y - CARD_HEIGHT / 2 },
    };
  });

  return { nodes: layoutedNodes, edges: edgesForDisplay };
};

export const loadSavedPositions = (nodeIds: string[]): Record<string, { x: number; y: number }> | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(NODE_POSITIONS_STORAGE_KEY_V2);
    if (!raw) return null;
    const saved: Record<string, { x: number; y: number }> = JSON.parse(raw);
    const hasAny = nodeIds.some((id) => saved[id]);
    return hasAny ? saved : null;
  } catch {
    return null;
  }
};

export const mergeSavedPositions = (
  layoutNodes: Node[],
  saved: Record<string, { x: number; y: number }> | null,
): Node[] => {
  if (!saved) return layoutNodes;

  return layoutNodes.map((node) =>
    saved[node.id] ? { ...node, position: saved[node.id] } : node,
  );
};
