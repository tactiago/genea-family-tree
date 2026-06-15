import type { Node, Edge } from '@xyflow/react';
import { Person, Relationship, getParents } from '@/types/family';

export interface TreeGraphInput {
  persons: Person[];
  relationships: Relationship[];
  onSelect: (person: Person) => void;
}

export interface TreeGraphResult {
  nodes: Node[];
  displayEdges: Edge[];
  layoutEdges: Edge[];
}

export const buildTreeGraph = ({ persons, relationships, onSelect }: TreeGraphInput): TreeGraphResult => {
  const nodes: Node[] = persons.map((person) => ({
    id: person.id,
    type: 'familyNode',
    position: { x: 0, y: 0 },
    data: {
      person,
      onSelect,
      hasAncestors: getParents(person.id, relationships).length > 0,
      ancestorsCollapsed: false,
    },
  }));

  const displayEdges: Edge[] = [];
  const layoutEdges: Edge[] = [];
  const addedEdges = new Set<string>();

  relationships.forEach((rel) => {
    const edgeId = `${rel.personId}-${rel.relatedPersonId}-${rel.type}`;
    if (addedEdges.has(edgeId)) return;
    addedEdges.add(edgeId);

    if (rel.type === 'parent') {
      layoutEdges.push({
        id: edgeId,
        source: rel.relatedPersonId,
        target: rel.personId,
      });

      displayEdges.push({
        id: edgeId,
        source: rel.personId,
        sourceHandle: 'parent-bottom',
        target: rel.relatedPersonId,
        targetHandle: 'parent-top',
        type: 'smoothstep',
        style: { stroke: 'hsl(var(--tree-line))', strokeWidth: 2 },
        animated: false,
      });
    } else if (rel.type === 'spouse') {
      displayEdges.push({
        id: edgeId,
        source: rel.personId,
        sourceHandle: 'spouse-right',
        target: rel.relatedPersonId,
        targetHandle: 'spouse-left',
        type: 'spouse',
        data: { marriageDate: rel.marriageDate },
      });
    }
  });

  return { nodes, displayEdges, layoutEdges };
};
