import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { TreesIcon } from 'lucide-react';
import { useFamily } from '@/contexts/FamilyContext';
import { Person } from '@/types/family';
import OrganogramCanvas from './OrganogramCanvas';
import OrganogramToolbar from './OrganogramToolbar';
import TreeErrorBoundary from './TreeErrorBoundary';
import {
  createEmptyExpansion,
  type OrganogramExpansionState,
} from '@/lib/family-tree/organogram-visibility';
import {
  loadVisibleFields,
  saveVisibleFields,
  loadRootPersonId,
  saveRootPersonId,
  type OrganogramFieldId,
} from '@/lib/family-tree/organogram-fields';

interface FamilyTreeV2Props {
  onSelectPerson: (person: Person) => void;
}

const toggleSetItem = (set: Set<string>, id: string): Set<string> => {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

const FamilyTreeV2: React.FC<FamilyTreeV2Props> = ({ onSelectPerson }) => {
  const { persons, relationships } = useFamily();

  const [rootPersonId, setRootPersonId] = useState<string | null>(() => loadRootPersonId());
  const [visibleFields, setVisibleFields] = useState<Set<OrganogramFieldId>>(() => loadVisibleFields());
  const [expansion, setExpansion] = useState<OrganogramExpansionState>(() => createEmptyExpansion());

  const resolvedRootId = useMemo(() => {
    if (rootPersonId && persons.some((p) => p.id === rootPersonId)) return rootPersonId;
    return persons[0]?.id ?? null;
  }, [rootPersonId, persons]);

  useEffect(() => {
    if (!resolvedRootId) return;
    if (resolvedRootId !== rootPersonId) {
      setRootPersonId(resolvedRootId);
    }
  }, [resolvedRootId, rootPersonId]);

  useEffect(() => {
    const personIds = new Set(persons.map((p) => p.id));
    setExpansion((prev) => {
      const filter = (set: Set<string>) => new Set([...set].filter((id) => personIds.has(id)));
      const nextUp = filter(prev.expandedUp);
      const nextDown = filter(prev.expandedDown);
      const nextSiblings = filter(prev.expandedParentSiblings);
      if (
        nextUp.size === prev.expandedUp.size &&
        nextDown.size === prev.expandedDown.size &&
        nextSiblings.size === prev.expandedParentSiblings.size
      ) {
        return prev;
      }
      return {
        expandedUp: nextUp,
        expandedDown: nextDown,
        expandedParentSiblings: nextSiblings,
      };
    });
  }, [persons]);

  const handleRootChange = useCallback((personId: string) => {
    setRootPersonId(personId);
    saveRootPersonId(personId);
    setExpansion(createEmptyExpansion());
  }, []);

  const handleToggleField = useCallback((fieldId: OrganogramFieldId) => {
    setVisibleFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      saveVisibleFields(next);
      return next;
    });
  }, []);

  const handleToggleExpandUp = useCallback((personId: string) => {
    setExpansion((prev) => ({
      ...prev,
      expandedUp: toggleSetItem(prev.expandedUp, personId),
    }));
  }, []);

  const handleToggleExpandDown = useCallback((personId: string) => {
    setExpansion((prev) => ({
      ...prev,
      expandedDown: toggleSetItem(prev.expandedDown, personId),
    }));
  }, []);

  const handleToggleExpandSiblings = useCallback((personId: string) => {
    setExpansion((prev) => ({
      ...prev,
      expandedParentSiblings: toggleSetItem(prev.expandedParentSiblings, personId),
    }));
  }, []);

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

  return (
    <div className="w-full h-full min-h-0 rounded-xl overflow-hidden border border-border bg-card flex flex-col">
      <OrganogramToolbar
        persons={persons}
        rootPersonId={resolvedRootId}
        onRootChange={handleRootChange}
        visibleFields={visibleFields}
        onToggleField={handleToggleField}
      />
      <div className="flex-1 min-h-0">
        <TreeErrorBoundary>
          {resolvedRootId ? (
            <OrganogramCanvas
              persons={persons}
              relationships={relationships}
              rootPersonId={resolvedRootId}
              expansion={expansion}
              visibleFields={visibleFields}
              onSelectPerson={onSelectPerson}
              onToggleExpandUp={handleToggleExpandUp}
              onToggleExpandDown={handleToggleExpandDown}
              onToggleExpandSiblings={handleToggleExpandSiblings}
            />
          ) : null}
        </TreeErrorBoundary>
      </div>
    </div>
  );
};

export default FamilyTreeV2;
