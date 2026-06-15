import { describe, it, expect } from 'vitest';
import { computeHiddenAncestorIds } from './visibility';
import type { Relationship } from '@/types/family';

const relationships: Relationship[] = [
  { id: 'r1', personId: 'child-a', relatedPersonId: 'parent', type: 'parent' },
  { id: 'r2', personId: 'child-b', relatedPersonId: 'parent', type: 'parent' },
  { id: 'r3', personId: 'parent', relatedPersonId: 'grandparent', type: 'parent' },
];

describe('computeHiddenAncestorIds', () => {
  it('hides ancestors of a single collapsed node', () => {
    const hidden = computeHiddenAncestorIds(new Set(['child-a']), relationships);
    expect(hidden.has('parent')).toBe(true);
    expect(hidden.has('grandparent')).toBe(true);
    expect(hidden.has('child-a')).toBe(false);
  });

  it('keeps shared ancestors hidden while any sibling remains collapsed', () => {
    const hiddenBoth = computeHiddenAncestorIds(new Set(['child-a', 'child-b']), relationships);
    expect(hiddenBoth.has('parent')).toBe(true);

    const hiddenOne = computeHiddenAncestorIds(new Set(['child-b']), relationships);
    expect(hiddenOne.has('parent')).toBe(true);
    expect(hiddenOne.has('grandparent')).toBe(true);
  });

  it('reveals ancestors when no nodes are collapsed', () => {
    const hidden = computeHiddenAncestorIds(new Set(), relationships);
    expect(hidden.size).toBe(0);
  });
});
