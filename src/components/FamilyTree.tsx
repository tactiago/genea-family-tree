import React from 'react';
import { useFamily } from '@/contexts/FamilyContext';
import { getRootPersons, Person } from '@/types/family';
import TreeNode from './TreeNode';
import { TreesIcon } from 'lucide-react';

interface FamilyTreeProps {
  onSelectPerson: (person: Person) => void;
}

const FamilyTree: React.FC<FamilyTreeProps> = ({ onSelectPerson }) => {
  const { persons, relationships } = useFamily();

  if (persons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="h-20 w-20 rounded-2xl bg-green-light flex items-center justify-center mb-6">
          <TreesIcon className="h-10 w-10 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">Sua árvore está vazia</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Comece adicionando a primeira pessoa da sua família para construir sua árvore genealógica.
        </p>
      </div>
    );
  }

  const roots = getRootPersons(persons, relationships);
  
  // Persons that are spouses but not roots (they're shown alongside their spouse)
  const spouseIds = new Set<string>();
  relationships.filter(r => r.type === 'spouse').forEach(r => {
    const p1IsRoot = roots.some(p => p.id === r.personId);
    const p2IsRoot = roots.some(p => p.id === r.relatedPersonId);
    if (p1IsRoot && p2IsRoot) {
      // Both are roots, remove one
      spouseIds.add(r.relatedPersonId);
    }
  });

  const displayRoots = roots.filter(p => !spouseIds.has(p.id));

  return (
    <div className="overflow-x-auto pb-8">
      <div className="inline-flex flex-col items-center gap-8 min-w-full px-4 py-6">
        {displayRoots.map(root => (
          <TreeNode key={root.id} person={root} onSelect={onSelectPerson} />
        ))}
      </div>
    </div>
  );
};

export default FamilyTree;
