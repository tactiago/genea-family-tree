import type { Node, Edge } from '@xyflow/react';
import { Relationship } from '@/types/family';
import { collectAncestorIds } from './ancestors';

export const computeHiddenAncestorIds = (
  collapsedNodeIds: Set<string>,
  relationships: Relationship[],
): Set<string> => {
  const hidden = new Set<string>();

  collapsedNodeIds.forEach((nodeId) => {
    collectAncestorIds(nodeId, relationships).forEach((ancestorId) => {
      hidden.add(ancestorId);
    });
  });

  return hidden;
};

export const applyVisibility = (
  nodes: Node[],
  edges: Edge[],
  hiddenIds: Set<string>,
  collapsedNodeIds: Set<string>,
): { nodes: Node[]; edges: Edge[] } => {
  const visibleNodes = nodes.map((node) => ({
    ...node,
    hidden: hiddenIds.has(node.id),
    data: {
      ...node.data,
      ancestorsCollapsed: collapsedNodeIds.has(node.id),
    },
  }));

  const visibleEdges = edges.map((edge) => {
    const sourceHidden = hiddenIds.has(edge.source as string);
    const targetHidden = hiddenIds.has(edge.target as string);
    return {
      ...edge,
      hidden: sourceHidden || targetHidden,
    };
  });

  return { nodes: visibleNodes, edges: visibleEdges };
};
