import { Relationship, getParents } from '@/types/family';
import type { PersonLayoutPosition } from './pedigree-layout';

export interface SiblingGroup {
  parentKey: string;
  parentIds: string[];
  childIds: string[];
}

export interface ConnectorPath {
  id: string;
  d: string;
}

const getBottomCenter = (positions: PersonLayoutPosition[]) => {
  const minX = Math.min(...positions.map((p) => p.x));
  const maxX = Math.max(...positions.map((p) => p.x + p.width));
  const maxY = Math.max(...positions.map((p) => p.y + p.height));
  return { x: (minX + maxX) / 2, y: maxY };
};

export const buildSiblingGroups = (
  visibleIds: Set<string>,
  relationships: Relationship[],
): SiblingGroup[] => {
  const groups = new Map<string, SiblingGroup>();

  visibleIds.forEach((childId) => {
    const parentIds = getParents(childId, relationships)
      .filter((id) => visibleIds.has(id))
      .sort();

    if (parentIds.length === 0) return;

    const parentKey = parentIds.join(':');
    const existing = groups.get(parentKey);

    if (existing) {
      if (!existing.childIds.includes(childId)) {
        existing.childIds.push(childId);
      }
    } else {
      groups.set(parentKey, { parentKey, parentIds, childIds: [childId] });
    }
  });

  groups.forEach((group) => {
    group.childIds.sort((a, b) => a.localeCompare(b));
  });

  return Array.from(groups.values());
};

export const buildCoupleDropPaths = (
  spouseLinks: Array<{ id: string; personAId: string; personBId: string }>,
  positions: Map<string, PersonLayoutPosition>,
  siblingGroups: SiblingGroup[],
): ConnectorPath[] => {
  const paths: ConnectorPath[] = [];

  const parentKeysWithChildren = new Set(siblingGroups.map((g) => g.parentKey));

  spouseLinks.forEach((link) => {
    const posA = positions.get(link.personAId);
    const posB = positions.get(link.personBId);
    if (!posA || !posB) return;

    const parentKey = [link.personAId, link.personBId].sort().join(':');
    if (!parentKeysWithChildren.has(parentKey)) return;

    const left = posA.x < posB.x ? posA : posB;
    const right = posA.x < posB.x ? posB : posA;
    const midX = (left.x + left.width + right.x) / 2;
    const midY = left.y + left.height / 2;
    const bottomY = Math.max(posA.y + posA.height, posB.y + posB.height);

    if (bottomY <= midY + 2) return;

    paths.push({
      id: `couple-drop-${link.id}`,
      d: `M ${midX} ${midY} L ${midX} ${bottomY}`,
    });
  });

  return paths;
};

export const buildSiblingBusPaths = (
  groups: SiblingGroup[],
  positions: Map<string, PersonLayoutPosition>,
): ConnectorPath[] => {
  const paths: ConnectorPath[] = [];

  groups.forEach((group) => {
    const parentPositions = group.parentIds
      .map((id) => positions.get(id))
      .filter((p): p is PersonLayoutPosition => Boolean(p));

    const childPositions = group.childIds
      .map((id) => positions.get(id))
      .filter((p): p is PersonLayoutPosition => Boolean(p));

    if (parentPositions.length === 0 || childPositions.length === 0) return;

    const parentBottom = getBottomCenter(parentPositions);
    const childTops = childPositions.map((p) => ({
      x: p.x + p.width / 2,
      y: p.y,
    }));

    const minChildX = Math.min(...childTops.map((c) => c.x));
    const maxChildX = Math.max(...childTops.map((c) => c.x));
    const childTopY = Math.min(...childTops.map((c) => c.y));
    const branchY = parentBottom.y + (childTopY - parentBottom.y) / 2;

    const segments: string[] = [
      `M ${parentBottom.x} ${parentBottom.y}`,
      `L ${parentBottom.x} ${branchY}`,
    ];

    if (childPositions.length === 1) {
      const child = childTops[0];
      segments.push(`L ${child.x} ${branchY}`, `L ${child.x} ${child.y}`);
    } else {
      const busLeft = Math.min(parentBottom.x, minChildX);
      const busRight = Math.max(parentBottom.x, maxChildX);
      segments.push(`L ${busLeft} ${branchY}`, `L ${busRight} ${branchY}`);

      childTops.forEach((child) => {
        segments.push(`M ${child.x} ${branchY}`, `L ${child.x} ${child.y}`);
      });
    }

    paths.push({
      id: `bus-${group.parentKey}`,
      d: segments.join(' '),
    });
  });

  return paths;
};
