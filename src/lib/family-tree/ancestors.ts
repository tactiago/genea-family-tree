import { Relationship, getParents } from '@/types/family';

export const collectAncestorIds = (rootId: string, relationships: Relationship[]): Set<string> => {
  const result = new Set<string>();
  const stack = [...getParents(rootId, relationships)];

  while (stack.length > 0) {
    const current = stack.pop() as string;
    if (result.has(current)) continue;
    result.add(current);

    getParents(current, relationships).forEach((parentId) => {
      if (!result.has(parentId)) {
        stack.push(parentId);
      }
    });
  }

  return result;
};
