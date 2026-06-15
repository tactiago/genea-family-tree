import { Person, Relationship, getChildren, getParents, getSpouses } from '@/types/family';

const assignFromSeed = (
  seedId: string,
  levelById: Map<string, number>,
  relationships: Relationship[],
) => {
  if (levelById.has(seedId)) return;
  levelById.set(seedId, 0);

  const queue: string[] = [seedId];

  while (queue.length > 0) {
    const currentId = queue.shift() as string;
    const currentLevel = levelById.get(currentId) ?? 0;

    getChildren(currentId, relationships).forEach((childId) => {
      if (!levelById.has(childId)) {
        levelById.set(childId, currentLevel - 1);
        queue.push(childId);
      }
    });

    getParents(currentId, relationships).forEach((parentId) => {
      if (!levelById.has(parentId)) {
        levelById.set(parentId, currentLevel + 1);
        queue.push(parentId);
      }
    });

    getSpouses(currentId, relationships).forEach((spouseId) => {
      if (!levelById.has(spouseId)) {
        levelById.set(spouseId, currentLevel);
        queue.push(spouseId);
      }
    });
  }
};

export const buildGenerationalLevels = (
  persons: Person[],
  relationships: Relationship[],
): Map<string, number> => {
  const levelById = new Map<string, number>();

  if (persons.length === 0) return levelById;

  assignFromSeed(persons[0].id, levelById, relationships);

  persons.forEach((person) => {
    if (!levelById.has(person.id)) {
      assignFromSeed(person.id, levelById, relationships);
    }
  });

  return levelById;
};

export const buildLevelsFromRoot = (
  rootId: string,
  persons: Person[],
  relationships: Relationship[],
): Map<string, number> => {
  const levelById = new Map<string, number>();

  if (!rootId) return levelById;

  assignFromSeed(rootId, levelById, relationships);

  persons.forEach((person) => {
    if (!levelById.has(person.id)) {
      assignFromSeed(person.id, levelById, relationships);
    }
  });

  return levelById;
};
