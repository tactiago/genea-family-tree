import { Relationship, getParents } from '@/types/family';
import type { PersonLayoutPosition } from './pedigree-layout';
import type { ConnectorPath, SiblingGroup } from './connectors';
import {
  AVATAR_SIZE,
  getAvatarCenterY,
  getAvatarTopY,
  getRibbonBottomY,
  NODE_WIDTH,
} from './organogram-constants';

export { buildSiblingGroups } from './connectors';
export type { SiblingGroup, ConnectorPath } from './connectors';

interface ParentAnchor {
  id: string;
  x: number;
  y: number;
}

const PARENT_BRANCH_RATIO = 0.38;
const CHILD_BRANCH_RATIO = 0.62;

const getParentAnchors = (parentPositions: PersonLayoutPosition[]): ParentAnchor[] =>
  parentPositions.map((p) => ({
    id: p.id,
    x: p.x + p.width / 2,
    y: getRibbonBottomY(p.y),
  }));

export const areParentsCouple = (
  parentIds: string[],
  spouseLinks: Array<{ personAId: string; personBId: string }>,
): boolean => {
  if (parentIds.length !== 2) return false;
  const [a, b] = parentIds;
  return spouseLinks.some(
    (link) =>
      (link.personAId === a && link.personBId === b) ||
      (link.personAId === b && link.personBId === a),
  );
};

export const buildOrganogramCoupleDropPaths = (
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
    const midX = (left.x + left.width + (posA.x < posB.x ? posB : posA).x) / 2;
    const midY = getAvatarCenterY(left.y);
    const bottomY = Math.max(getRibbonBottomY(posA.y), getRibbonBottomY(posB.y));

    if (bottomY <= midY + 2) return;

    paths.push({
      id: `couple-drop-${link.id}`,
      d: `M ${midX} ${midY} L ${midX} ${bottomY}`,
    });
  });

  return paths;
};

export const buildOrganogramSiblingBusPaths = (
  groups: SiblingGroup[],
  positions: Map<string, PersonLayoutPosition>,
  spouseLinks: Array<{ personAId: string; personBId: string }> = [],
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

    const parentAnchors = getParentAnchors(parentPositions);
    const parentsAreCouple = areParentsCouple(group.parentIds, spouseLinks);

    const childTops = childPositions.map((p) => ({
      x: p.x + p.width / 2,
      y: getAvatarTopY(p.y),
    }));

    const parentBottomY = Math.max(...parentAnchors.map((a) => a.y));
    const childTopY = Math.min(...childTops.map((c) => c.y));
    const gap = childTopY - parentBottomY;
    if (gap <= 2) return;

    const parentBranchY = parentBottomY + gap * PARENT_BRANCH_RATIO;
    const childBranchY = parentBottomY + gap * CHILD_BRANCH_RATIO;

    const parentMinX = Math.min(...parentAnchors.map((a) => a.x));
    const parentMaxX = Math.max(...parentAnchors.map((a) => a.x));
    const parentCenterX = (parentMinX + parentMaxX) / 2;

    const childMinX = Math.min(...childTops.map((c) => c.x));
    const childMaxX = Math.max(...childTops.map((c) => c.x));

    const segments: string[] = [];

    if (parentsAreCouple) {
      segments.push(`M ${parentCenterX} ${parentBottomY}`, `L ${parentCenterX} ${childBranchY}`);
    } else {
      parentAnchors.forEach((anchor) => {
        segments.push(`M ${anchor.x} ${anchor.y}`, `L ${anchor.x} ${parentBranchY}`);
      });

      if (parentAnchors.length > 1) {
        segments.push(`M ${parentMinX} ${parentBranchY}`, `L ${parentMaxX} ${parentBranchY}`);
      }

      segments.push(`M ${parentCenterX} ${parentBranchY}`, `L ${parentCenterX} ${childBranchY}`);
    }

    const bridgeTargetX = Math.max(childMinX, Math.min(parentCenterX, childMaxX));
    if (Math.abs(parentCenterX - bridgeTargetX) > 0.5) {
      segments.push(`M ${parentCenterX} ${childBranchY}`, `L ${bridgeTargetX} ${childBranchY}`);
    }

    if (childTops.length > 1) {
      segments.push(`M ${childMinX} ${childBranchY}`, `L ${childMaxX} ${childBranchY}`);
    }

    childTops.forEach((child) => {
      segments.push(`M ${child.x} ${childBranchY}`, `L ${child.x} ${child.y}`);
    });

    paths.push({
      id: `bus-${group.parentKey}`,
      d: segments.join(' '),
    });
  });

  return paths;
};

export const buildOrganogramSpouseSegment = (
  posA: PersonLayoutPosition,
  posB: PersonLayoutPosition,
): { x1: number; y: number; x2: number } => {
  const left = posA.x < posB.x ? posA : posB;
  const right = posA.x < posB.x ? posB : posA;
  const y = getAvatarCenterY(left.y);
  const x1 = left.x + NODE_WIDTH / 2 + AVATAR_SIZE / 2;
  const x2 = right.x + NODE_WIDTH / 2 - AVATAR_SIZE / 2;
  return { x1, y, x2 };
};

export const buildOrganogramSiblingGroups = (
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
