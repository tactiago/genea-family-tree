import { Person, Relationship, getChildren } from '@/types/family';
import { buildGenerationalLevels, buildLevelsFromRoot } from './levels';
import {
  CARD_WIDTH as DEFAULT_CARD_WIDTH,
  CARD_HEIGHT as DEFAULT_CARD_HEIGHT,
  SPOUSE_GAP as DEFAULT_SPOUSE_GAP,
  BRANCH_GAP as DEFAULT_BRANCH_GAP,
  ROW_GAP as DEFAULT_ROW_GAP,
} from './pedigree-constants';

export interface PedigreeLayoutMetrics {
  CARD_WIDTH: number;
  CARD_HEIGHT: number;
  SPOUSE_GAP: number;
  BRANCH_GAP: number;
  ROW_GAP: number;
}

export interface PedigreeLayoutOptions {
  rootId?: string;
  metrics?: PedigreeLayoutMetrics;
}

export interface PersonLayoutPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
}

export interface SpouseLinkLayout {
  id: string;
  personAId: string;
  personBId: string;
  marriageDate?: string;
}

export interface ParentChildLinkLayout {
  id: string;
  parentId: string;
  childId: string;
}

export interface PedigreeLayoutResult {
  positions: Map<string, PersonLayoutPosition>;
  spouseLinks: SpouseLinkLayout[];
  parentChildLinks: ParentChildLinkLayout[];
  bounds: { width: number; height: number };
}

type FamilyUnit = {
  key: string;
  personIds: string[];
  level: number;
  desiredX: number;
  centerX: number;
  left: number;
  width: number;
};

const getUnitWidth = (personCount: number, cardWidth: number, spouseGap: number): number => {
  if (personCount <= 1) return cardWidth;
  return cardWidth * 2 + spouseGap;
};

const buildSpousePairs = (
  visibleIds: Set<string>,
  relationships: Relationship[],
): Map<string, string> => {
  const spouseOf = new Map<string, string>();

  relationships
    .filter((r) => r.type === 'spouse')
    .forEach((r) => {
      if (!visibleIds.has(r.personId) || !visibleIds.has(r.relatedPersonId)) return;
      spouseOf.set(r.personId, r.relatedPersonId);
      spouseOf.set(r.relatedPersonId, r.personId);
    });

  return spouseOf;
};

const buildUnitsForLevel = (
  level: number,
  levelPersonIds: string[],
  spouseOf: Map<string, string>,
  cardWidth: number,
  spouseGap: number,
): FamilyUnit[] => {
  const used = new Set<string>();
  const units: FamilyUnit[] = [];

  levelPersonIds.forEach((id) => {
    if (used.has(id)) return;

    const spouseId = spouseOf.get(id);
    if (spouseId && levelPersonIds.includes(spouseId) && !used.has(spouseId)) {
      const personIds = [id, spouseId].sort();
      units.push({
        key: personIds[0],
        personIds,
        level,
        desiredX: 0,
        centerX: 0,
        left: 0,
        width: getUnitWidth(2, cardWidth, spouseGap),
      });
      used.add(id);
      used.add(spouseId);
    } else {
      units.push({
        key: id,
        personIds: [id],
        level,
        desiredX: 0,
        centerX: 0,
        left: 0,
        width: getUnitWidth(1, cardWidth, spouseGap),
      });
      used.add(id);
    }
  });

  return units;
};

const resolveRowCollisions = (units: FamilyUnit[], branchGap: number): void => {
  if (units.length === 0) return;

  units.sort((a, b) => a.desiredX - b.desiredX);

  let rightEdge = units[0].desiredX - units[0].width / 2 - branchGap;

  units.forEach((unit) => {
    const minCenter = rightEdge + branchGap + unit.width / 2;
    unit.centerX = Math.max(unit.desiredX, minCenter);
    rightEdge = unit.centerX + unit.width / 2;
  });

  units.forEach((unit) => {
    unit.left = unit.centerX - unit.width / 2;
  });
};

const getVisibleChildrenCenters = (
  unit: FamilyUnit,
  personCenterX: Map<string, number>,
  relationships: Relationship[],
  visibleIds: Set<string>,
): number[] => {
  const centers: number[] = [];

  unit.personIds.forEach((personId) => {
    getChildren(personId, relationships).forEach((childId) => {
      if (!visibleIds.has(childId)) return;
      const cx = personCenterX.get(childId);
      if (cx !== undefined) centers.push(cx);
    });
  });

  return centers;
};

export const layoutPedigree = (
  persons: Person[],
  relationships: Relationship[],
  visibleIds: Set<string>,
  options: PedigreeLayoutOptions = {},
): PedigreeLayoutResult => {
  const {
    CARD_WIDTH,
    CARD_HEIGHT,
    SPOUSE_GAP,
    BRANCH_GAP,
    ROW_GAP,
  } = {
    CARD_WIDTH: DEFAULT_CARD_WIDTH,
    CARD_HEIGHT: DEFAULT_CARD_HEIGHT,
    SPOUSE_GAP: DEFAULT_SPOUSE_GAP,
    BRANCH_GAP: DEFAULT_BRANCH_GAP,
    ROW_GAP: DEFAULT_ROW_GAP,
    ...options.metrics,
  };

  const visiblePersons = persons.filter((p) => visibleIds.has(p.id));
  const levelById = options.rootId
    ? buildLevelsFromRoot(options.rootId, visiblePersons, relationships)
    : buildGenerationalLevels(visiblePersons, relationships);
  const spouseOf = buildSpousePairs(visibleIds, relationships);

  const levels = Array.from(new Set(visiblePersons.map((p) => levelById.get(p.id) ?? 0))).sort(
    (a, b) => a - b,
  );
  const maxLevel = levels.length > 0 ? Math.max(...levels) : 0;

  const personCenterX = new Map<string, number>();
  const positions = new Map<string, PersonLayoutPosition>();
  let orphanCursor = 0;

  levels.forEach((level) => {
    const levelPersonIds = visiblePersons
      .filter((p) => (levelById.get(p.id) ?? 0) === level)
      .map((p) => p.id);

    const units = buildUnitsForLevel(level, levelPersonIds, spouseOf, CARD_WIDTH, SPOUSE_GAP);

    units.forEach((unit) => {
      const childCenters = getVisibleChildrenCenters(unit, personCenterX, relationships, visibleIds);

      if (childCenters.length > 0) {
        unit.desiredX = childCenters.reduce((sum, x) => sum + x, 0) / childCenters.length;
      } else {
        unit.desiredX = orphanCursor + unit.width / 2;
        orphanCursor += unit.width + BRANCH_GAP;
      }
    });

    resolveRowCollisions(units, BRANCH_GAP);

    const rowY = (maxLevel - level) * (CARD_HEIGHT + ROW_GAP);

    units.forEach((unit) => {
      unit.personIds.forEach((personId, index) => {
        const x =
          unit.personIds.length === 1
            ? unit.left
            : unit.left + index * (CARD_WIDTH + SPOUSE_GAP);

        personCenterX.set(personId, x + CARD_WIDTH / 2);

        positions.set(personId, {
          id: personId,
          x,
          y: rowY,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          level,
        });
      });
    });
  });

  const spouseLinks: SpouseLinkLayout[] = [];
  const addedSpousePairs = new Set<string>();

  relationships
    .filter((r) => r.type === 'spouse')
    .forEach((r) => {
      if (!visibleIds.has(r.personId) || !visibleIds.has(r.relatedPersonId)) return;
      const pairKey = [r.personId, r.relatedPersonId].sort().join(':');
      if (addedSpousePairs.has(pairKey)) return;
      addedSpousePairs.add(pairKey);

      spouseLinks.push({
        id: pairKey,
        personAId: r.personId,
        personBId: r.relatedPersonId,
        marriageDate: r.marriageDate,
      });
    });

  const parentChildLinks: ParentChildLinkLayout[] = [];
  const addedParentChild = new Set<string>();

  relationships
    .filter((r) => r.type === 'parent')
    .forEach((r) => {
      const childId = r.personId;
      const parentId = r.relatedPersonId;
      if (!visibleIds.has(childId) || !visibleIds.has(parentId)) return;

      const linkId = `${parentId}-${childId}`;
      if (addedParentChild.has(linkId)) return;
      addedParentChild.add(linkId);

      parentChildLinks.push({ id: linkId, parentId, childId });
    });

  let boundsWidth = 0;
  let boundsHeight = 0;

  positions.forEach((pos) => {
    boundsWidth = Math.max(boundsWidth, pos.x + pos.width + 40);
    boundsHeight = Math.max(boundsHeight, pos.y + pos.height + 40);
  });

  return {
    positions,
    spouseLinks,
    parentChildLinks,
    bounds: { width: Math.max(boundsWidth, 400), height: Math.max(boundsHeight, 300) },
  };
};
