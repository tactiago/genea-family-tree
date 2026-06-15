import { describe, it, expect } from 'vitest';
import {
  computeOrganogramVisibleIds,
  createEmptyExpansion,
  getOrganogramNodeActions,
} from './organogram-visibility';
import type { Relationship } from '@/types/family';

const rel = (
  personId: string,
  relatedPersonId: string,
  type: Relationship['type'],
): Relationship => ({
  id: `${type}-${personId}-${relatedPersonId}`,
  personId,
  relatedPersonId,
  type,
});

describe('computeOrganogramVisibleIds', () => {
  const relationships: Relationship[] = [
    rel('child', 'father', 'parent'),
    rel('child', 'mother', 'parent'),
    rel('sibling', 'father', 'parent'),
    rel('sibling', 'mother', 'parent'),
    rel('father', 'grandpa', 'parent'),
    rel('father', 'grandma', 'parent'),
    rel('father', 'mother', 'spouse'),
    rel('child', 'spouse', 'spouse'),
  ];

  it('shows root and spouse only by default', () => {
    const visible = computeOrganogramVisibleIds('child', createEmptyExpansion(), relationships);
    expect(visible.has('child')).toBe(true);
    expect(visible.has('spouse')).toBe(true);
    expect(visible.has('father')).toBe(false);
    expect(visible.has('sibling')).toBe(false);
  });

  it('shows parents when expanded up', () => {
    const expansion = createEmptyExpansion();
    expansion.expandedUp.add('child');
    const visible = computeOrganogramVisibleIds('child', expansion, relationships);
    expect(visible.has('father')).toBe(true);
    expect(visible.has('mother')).toBe(true);
    expect(visible.has('grandpa')).toBe(false);
  });

  it('shows siblings only when parent expands siblings', () => {
    const expansion = createEmptyExpansion();
    expansion.expandedUp.add('child');
    const before = computeOrganogramVisibleIds('child', expansion, relationships);
    expect(before.has('sibling')).toBe(false);
    expect(before.has('father')).toBe(true);

    expansion.expandedParentSiblings.add('father');
    const after = computeOrganogramVisibleIds('child', expansion, relationships);
    expect(after.has('sibling')).toBe(true);
  });

  it('does not show siblings when expanding down on an ancestor', () => {
    const expansion = createEmptyExpansion();
    expansion.expandedUp.add('child');
    expansion.expandedDown.add('father');
    const visible = computeOrganogramVisibleIds('child', expansion, relationships);
    expect(visible.has('sibling')).toBe(false);
  });
});

describe('getOrganogramNodeActions', () => {
  const relationships: Relationship[] = [
    rel('child', 'father', 'parent'),
    rel('child', 'mother', 'parent'),
    rel('sibling', 'father', 'parent'),
    rel('father', 'mother', 'spouse'),
  ];

  it('marks root and offers expand up when parents exist', () => {
    const visible = computeOrganogramVisibleIds('child', createEmptyExpansion(), relationships);
    const actions = getOrganogramNodeActions(
      'child',
      'child',
      visible,
      createEmptyExpansion(),
      relationships,
    );
    expect(actions.isRoot).toBe(true);
    expect(actions.canExpandUp).toBe(true);
    expect(actions.canExpandDown).toBe(false);
  });

  it('hides expand up when parents are already visible', () => {
    const expansion = createEmptyExpansion();
    expansion.expandedUp.add('child');
    const visible = computeOrganogramVisibleIds('child', expansion, relationships);
    const actions = getOrganogramNodeActions('child', 'child', visible, expansion, relationships);
    expect(actions.canExpandUp).toBe(false);
    expect(actions.canCollapseUp).toBe(true);
  });

  it('hides expand down when lineage children are already visible', () => {
    const expansion = createEmptyExpansion();
    expansion.expandedDown.add('father');
    const relationshipsWithChild: Relationship[] = [
      rel('child', 'father', 'parent'),
      rel('child', 'mother', 'parent'),
      rel('father', 'mother', 'spouse'),
    ];
    expansion.expandedUp.add('child');
    const visible = computeOrganogramVisibleIds('child', expansion, relationshipsWithChild);
    const actions = getOrganogramNodeActions(
      'father',
      'child',
      visible,
      expansion,
      relationshipsWithChild,
    );
    expect(actions.canExpandDown).toBe(false);
  });
});
