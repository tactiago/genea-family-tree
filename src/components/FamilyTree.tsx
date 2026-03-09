import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  ConnectionLineType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { useFamily } from '@/contexts/FamilyContext';
import { Person, getChildren, getSpouses, getRootPersons } from '@/types/family';
import FamilyTreeNode from './FamilyTreeNode';
import SpouseEdge from './SpouseEdge';
import { TreesIcon } from 'lucide-react';

interface FamilyTreeProps {
  onSelectPerson: (person: Person) => void;
}

const nodeTypes = { familyNode: FamilyTreeNode };
const edgeTypes = { spouse: SpouseEdge };

const NODE_WIDTH = 140;
const NODE_HEIGHT = 100;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 40 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Only use parent edges for hierarchy layout
  edges.filter(e => e.type !== 'spouse').forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const FamilyTree: React.FC<FamilyTreeProps> = ({ onSelectPerson }) => {
  const { persons, relationships } = useFamily();

  const { initialNodes, initialEdges } = useMemo(() => {
    if (persons.length === 0) return { initialNodes: [], initialEdges: [] };

    const nodes: Node[] = persons.map((person) => ({
      id: person.id,
      type: 'familyNode',
      position: { x: 0, y: 0 },
      data: { person, onSelect: onSelectPerson },
    }));

    const edges: Edge[] = [];
    const addedEdges = new Set<string>();

    relationships.forEach((rel) => {
      const edgeId = `${rel.personId}-${rel.relatedPersonId}-${rel.type}`;
      if (addedEdges.has(edgeId)) return;
      addedEdges.add(edgeId);

      if (rel.type === 'parent') {
        // parent → child: relatedPersonId is the parent, personId is the child
        edges.push({
          id: edgeId,
          source: rel.relatedPersonId,
          target: rel.personId,
          type: 'smoothstep',
          style: { stroke: 'hsl(var(--tree-line))', strokeWidth: 2 },
          animated: false,
        });
      } else if (rel.type === 'spouse') {
        edges.push({
          id: edgeId,
          source: rel.personId,
          target: rel.relatedPersonId,
          type: 'spouse',
        });
      }
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    return { initialNodes: layoutedNodes, initialEdges: layoutedEdges };
  }, [persons, relationships, onSelectPerson]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when data changes
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

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
    <div className="w-full h-[calc(100vh-180px)] min-h-[400px] rounded-xl overflow-hidden border border-border bg-card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border))" />
        <Controls
          showInteractive={false}
          className="!bg-card !border-border !shadow-md [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted"
        />
      </ReactFlow>
    </div>
  );
};

export default FamilyTree;
