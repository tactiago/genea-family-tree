import { Relationship, getChildren, getParents, getSpouses } from '@/types/family';

export interface OrganogramExpansionState {
  expandedUp: Set<string>;
  expandedDown: Set<string>;
  expandedParentSiblings: Set<string>;
}

export const createEmptyExpansion = (): OrganogramExpansionState => ({
  expandedUp: new Set(),
  expandedDown: new Set(),
  expandedParentSiblings: new Set(),
});

const addPersonWithSpouses = (personId: string, visible: Set<string>, relationships: Relationship[]) => {
  visible.add(personId);
  getSpouses(personId, relationships).forEach((spouseId) => visible.add(spouseId));
};

const isAncestorOf = (
  ancestorId: string,
  personId: string,
  relationships: Relationship[],
): boolean => {
  const visited = new Set<string>();
  const queue = [personId];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (current === ancestorId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    getParents(current, relationships).forEach((parentId) => queue.push(parentId));
  }

  return false;
};

const isDescendantOf = (
  descendantId: string,
  personId: string,
  relationships: Relationship[],
): boolean => {
  const visited = new Set<string>();
  const queue = [personId];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (current === descendantId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    getChildren(current, relationships).forEach((childId) => queue.push(childId));
  }

  return false;
};

const shouldShowChildOnExpandDown = (
  parentId: string,
  childId: string,
  rootId: string,
  relationships: Relationship[],
): boolean => {
  if (parentId === rootId || isDescendantOf(parentId, rootId, relationships)) {
    return true;
  }

  if (isAncestorOf(parentId, rootId, relationships)) {
    return childId === rootId || isAncestorOf(childId, rootId, relationships);
  }

  return false;
};

export const computeOrganogramVisibleIds = (
  rootId: string | null,
  expansion: OrganogramExpansionState,
  relationships: Relationship[],
): Set<string> => {
  if (!rootId) return new Set();

  const visible = new Set<string>();
  addPersonWithSpouses(rootId, visible, relationships);

  let changed = true;
  while (changed) {
    changed = false;
    const snapshot = [...visible];

    snapshot.forEach((personId) => {
      if (expansion.expandedDown.has(personId)) {
        getChildren(personId, relationships).forEach((childId) => {
          if (!shouldShowChildOnExpandDown(personId, childId, rootId, relationships)) return;
          const sizeBefore = visible.size;
          addPersonWithSpouses(childId, visible, relationships);
          if (visible.size > sizeBefore) changed = true;
        });
      }

      if (expansion.expandedUp.has(personId)) {
        getParents(personId, relationships).forEach((parentId) => {
          const sizeBefore = visible.size;
          addPersonWithSpouses(parentId, visible, relationships);
          if (visible.size > sizeBefore) changed = true;
        });
      }
    });

    snapshot.forEach((personId) => {
      if (!expansion.expandedParentSiblings.has(personId)) return;

      getChildren(personId, relationships).forEach((childId) => {
        const sizeBefore = visible.size;
        addPersonWithSpouses(childId, visible, relationships);
        if (visible.size > sizeBefore) changed = true;
      });
    });
  }

  return visible;
};

export interface OrganogramNodeActions {
  canExpandUp: boolean;
  canCollapseUp: boolean;
  canExpandDown: boolean;
  canCollapseDown: boolean;
  canExpandSiblings: boolean;
  canCollapseSiblings: boolean;
  isRoot: boolean;
}

const wouldShrinkingVisibility = (
  personId: string,
  toggle: 'up' | 'down' | 'siblings',
  rootId: string,
  expansion: OrganogramExpansionState,
  relationships: Relationship[],
  currentVisible: Set<string>,
): boolean => {
  const next: OrganogramExpansionState = {
    expandedUp: new Set(expansion.expandedUp),
    expandedDown: new Set(expansion.expandedDown),
    expandedParentSiblings: new Set(expansion.expandedParentSiblings),
  };

  if (toggle === 'up') next.expandedUp.delete(personId);
  else if (toggle === 'down') next.expandedDown.delete(personId);
  else next.expandedParentSiblings.delete(personId);

  const newVisible = computeOrganogramVisibleIds(rootId, next, relationships);
  return newVisible.size < currentVisible.size;
};

export const getOrganogramNodeActions = (
  personId: string,
  rootId: string | null,
  visibleIds: Set<string>,
  expansion: OrganogramExpansionState,
  relationships: Relationship[],
): OrganogramNodeActions => {
  if (!rootId) {
    return {
      canExpandUp: false,
      canCollapseUp: false,
      canExpandDown: false,
      canCollapseDown: false,
      canExpandSiblings: false,
      canCollapseSiblings: false,
      isRoot: false,
    };
  }

  const parents = getParents(personId, relationships);
  const children = getChildren(personId, relationships);

  const isExpandedUp = expansion.expandedUp.has(personId);
  const isExpandedDown = expansion.expandedDown.has(personId);
  const isExpandedSiblings = expansion.expandedParentSiblings.has(personId);

  const hasHiddenParent = parents.some((parentId) => !visibleIds.has(parentId));

  const hasHiddenLineageChild = children.some(
    (childId) =>
      shouldShowChildOnExpandDown(personId, childId, rootId, relationships) &&
      !visibleIds.has(childId),
  );

  const hasHiddenSibling = children.some(
    (childId) =>
      !visibleIds.has(childId) &&
      !shouldShowChildOnExpandDown(personId, childId, rootId, relationships),
  );

  const canExpandUp = hasHiddenParent;
  const canCollapseUp =
    isExpandedUp && wouldShrinkingVisibility(personId, 'up', rootId, expansion, relationships, visibleIds);

  const canExpandDown = hasHiddenLineageChild;
  const canCollapseDown =
    isExpandedDown &&
    wouldShrinkingVisibility(personId, 'down', rootId, expansion, relationships, visibleIds);

  const canExpandSiblings = hasHiddenSibling && !isExpandedSiblings;
  const canCollapseSiblings =
    isExpandedSiblings &&
    wouldShrinkingVisibility(personId, 'siblings', rootId, expansion, relationships, visibleIds);

  return {
    canExpandUp,
    canCollapseUp,
    canExpandDown,
    canCollapseDown,
    canExpandSiblings,
    canCollapseSiblings,
    isRoot: personId === rootId,
  };
};
