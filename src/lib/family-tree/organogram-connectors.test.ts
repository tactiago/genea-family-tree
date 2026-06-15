import { describe, it, expect } from 'vitest';
import {
  areParentsCouple,
  buildOrganogramSiblingBusPaths,
} from './organogram-connectors';
import type { PersonLayoutPosition } from './pedigree-layout';
import { getAvatarTopY, getRibbonBottomY, NODE_WIDTH } from './organogram-constants';

const makePos = (id: string, x: number, y: number, level = 1): PersonLayoutPosition => ({
  id,
  x,
  y,
  width: NODE_WIDTH,
  height: 200,
  level,
});

const centerX = (x: number) => x + NODE_WIDTH / 2;

describe('areParentsCouple', () => {
  it('detects spouse link between parents', () => {
    const links = [{ personAId: 'a', personBId: 'b' }];
    expect(areParentsCouple(['a', 'b'], links)).toBe(true);
    expect(areParentsCouple(['b', 'a'], links)).toBe(true);
    expect(areParentsCouple(['a', 'c'], links)).toBe(false);
  });
});

describe('buildOrganogramSiblingBusPaths', () => {
  it('draws a drop from each unmarried parent down to the child bus', () => {
    const brunoX = centerX(0);
    const karineX = centerX(180);
    const parentY = 0;
    const ribbonBottom = getRibbonBottomY(parentY);

    const groups = [
      { parentKey: 'bruno:karine', parentIds: ['bruno', 'karine'], childIds: ['tiago'] },
    ];
    const positions = new Map<string, PersonLayoutPosition>([
      ['bruno', makePos('bruno', 0, parentY)],
      ['karine', makePos('karine', 180, parentY)],
      ['tiago', makePos('tiago', 90, 220, 0)],
    ]);

    const paths = buildOrganogramSiblingBusPaths(groups, positions, []);
    expect(paths).toHaveLength(1);
    expect(paths[0].d).toContain(`M ${brunoX} ${ribbonBottom}`);
    expect(paths[0].d).toContain(`M ${karineX} ${ribbonBottom}`);
  });

  it('uses a single center drop for married parents', () => {
    const parentY = 0;
    const ribbonBottom = getRibbonBottomY(parentY);
    const coupleCenterX = (centerX(0) + centerX(180)) / 2;

    const groups = [{ parentKey: 'a:b', parentIds: ['a', 'b'], childIds: ['child'] }];
    const positions = new Map<string, PersonLayoutPosition>([
      ['a', makePos('a', 0, parentY)],
      ['b', makePos('b', 180, parentY)],
      ['child', makePos('child', 90, 220, 0)],
    ]);
    const spouseLinks = [{ personAId: 'a', personBId: 'b' }];

    const paths = buildOrganogramSiblingBusPaths(groups, positions, spouseLinks);
    expect(paths[0].d).toContain(`M ${coupleCenterX} ${ribbonBottom}`);
    expect(paths[0].d).not.toContain(`M ${centerX(0)} ${ribbonBottom} L ${centerX(0)}`);
  });

  it('does not extend the child bus to a distant parent without a visible child there', () => {
    const parentY = 0;
    const josenildoX = centerX(0);
    const patriciaX = centerX(500);
    const tiagoX = centerX(80);

    const groups = [
      { parentKey: 'jose:patricia', parentIds: ['jose', 'patricia'], childIds: ['tiago'] },
    ];
    const positions = new Map<string, PersonLayoutPosition>([
      ['jose', makePos('jose', 0, parentY)],
      ['patricia', makePos('patricia', 500, parentY)],
      ['tiago', makePos('tiago', 80, 220, 0)],
    ]);

    const paths = buildOrganogramSiblingBusPaths(groups, positions, []);
    const path = paths[0].d;

    const childTop = getAvatarTopY(220);
    expect(path).toContain(`L ${tiagoX} ${childTop}`);
    // Parent-to-parent link at the upper branch is fine; child branch must not reach Patricia.
    expect(path).not.toContain(`L ${patriciaX} ${childTop}`);
    expect(path).not.toContain(`M ${patriciaX} ${childTop}`);
  });

  it('keeps separate lineage buses isolated from each other', () => {
    const parentY = 0;
    const childY = 220;

    const groups = [
      { parentKey: 'p1:p2', parentIds: ['p1', 'p2'], childIds: ['c1', 'c2'] },
      { parentKey: 'p3:p4', parentIds: ['p3', 'p4'], childIds: ['c3', 'c4'] },
    ];
    const positions = new Map<string, PersonLayoutPosition>([
      ['p1', makePos('p1', 0, parentY)],
      ['p2', makePos('p2', 150, parentY)],
      ['c1', makePos('c1', 40, childY, 0)],
      ['c2', makePos('c2', 120, childY, 0)],
      ['p3', makePos('p3', 500, parentY)],
      ['p4', makePos('p4', 650, parentY)],
      ['c3', makePos('c3', 540, childY, 0)],
      ['c4', makePos('c4', 620, childY, 0)],
    ]);
    const spouseLinks = [
      { personAId: 'p1', personBId: 'p2' },
      { personAId: 'p3', personBId: 'p4' },
    ];

    const paths = buildOrganogramSiblingBusPaths(groups, positions, spouseLinks);
    expect(paths).toHaveLength(2);

    const family1ChildMin = centerX(40);
    const family1ChildMax = centerX(120);
    const family2ChildMin = centerX(540);
    const family2ChildMax = centerX(620);

    expect(paths[0].d).toContain(`M ${family1ChildMin}`);
    expect(paths[0].d).toContain(`L ${family1ChildMax}`);
    expect(paths[0].d).not.toContain(`L ${family2ChildMax}`);

    expect(paths[1].d).toContain(`M ${family2ChildMin}`);
    expect(paths[1].d).toContain(`L ${family2ChildMax}`);
    expect(paths[1].d).not.toContain(`L ${family1ChildMax}`);
  });

  it('skips groups with no visible children', () => {
    const groups = [{ parentKey: 'p1', parentIds: ['p1'], childIds: ['hidden-child'] }];
    const positions = new Map<string, PersonLayoutPosition>([
      ['p1', makePos('p1', 0, 0)],
    ]);

    const paths = buildOrganogramSiblingBusPaths(groups, positions, []);
    expect(paths).toHaveLength(0);
  });
});
