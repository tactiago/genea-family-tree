import { describe, it, expect } from 'vitest';
import { buildSiblingGroups, buildSiblingBusPaths } from './connectors';
import type { PersonLayoutPosition } from './pedigree-layout';
import type { Relationship } from '@/types/family';

const relationships: Relationship[] = [
  { id: 'r1', personId: 'c1', relatedPersonId: 'p1', type: 'parent' },
  { id: 'r2', personId: 'c2', relatedPersonId: 'p1', type: 'parent' },
  { id: 'r3', personId: 'c3', relatedPersonId: 'p1', type: 'parent' },
];

describe('buildSiblingBusPaths', () => {
  it('draws a branch line spanning all siblings', () => {
    const visible = new Set(['p1', 'c1', 'c2', 'c3']);
    const groups = buildSiblingGroups(visible, relationships);
    const positions = new Map<string, PersonLayoutPosition>([
      ['p1', { id: 'p1', x: 200, y: 0, width: 150, height: 108, level: 1 }],
      ['c1', { id: 'c1', x: 0, y: 180, width: 150, height: 108, level: 0 }],
      ['c2', { id: 'c2', x: 200, y: 180, width: 150, height: 108, level: 0 }],
      ['c3', { id: 'c3', x: 400, y: 180, width: 150, height: 108, level: 0 }],
    ]);

    const paths = buildSiblingBusPaths(groups, positions);
    expect(paths).toHaveLength(1);
    expect(paths[0].d).toContain('75');
    expect(paths[0].d).toContain('475');
  });
});
