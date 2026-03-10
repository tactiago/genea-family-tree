import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
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
import { Person, Relationship, getChildren, getSpouses, getRootPersons, getParents } from '@/types/family';
import FamilyTreeNode from './FamilyTreeNode';
import SpouseEdge from './SpouseEdge';
import { TreesIcon } from 'lucide-react';

class TreeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message?: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: undefined };
  }

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('[FamilyTree][ErrorBoundary] Render error', {
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-[calc(100vh-220px)] min-h-[400px] rounded-xl overflow-hidden border border-destructive bg-destructive/5 flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <h2 className="font-display text-lg font-semibold text-destructive mb-1">
              Ocorreu um erro ao desenhar a árvore
            </h2>
            <p className="text-xs text-muted-foreground">
              Tente recarregar a página. Caso o problema persista, tire um print desta tela e envie para suporte.
            </p>
            {this.state.message && (
              <p className="mt-2 text-[10px] text-muted-foreground/80 break-words">
                Detalhes: {this.state.message}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface FamilyTreeProps {
  onSelectPerson: (person: Person) => void;
}

const nodeTypes = { familyNode: FamilyTreeNode };
const edgeTypes = { spouse: SpouseEdge };

const NODE_WIDTH = 140;
const NODE_HEIGHT = 100;
const NODE_POSITIONS_STORAGE_KEY = 'familyTreeNodePositions';

// Coleta todos os ancestrais (pais, avós, etc.) de um nó
const collectAncestorIds = (rootId: string, relationships: Relationship[]): Set<string> => {
  const result = new Set<string>();
  const stack = [...getParents(rootId, relationships)];

  while (stack.length > 0) {
    const current = stack.pop() as string;
    if (result.has(current)) continue;
    result.add(current);

    const parents = getParents(current, relationships);
    parents.forEach((parentId) => {
      if (!result.has(parentId)) {
        stack.push(parentId);
      }
    });
  }

  return result;
};

// edgesForDisplay: edges que o React Flow irá renderizar
// edgesForLayout: edges usadas apenas para o cálculo hierárquico (Dagre)
// levelById (opcional): mapa id -> nível geracional relativo.
// A convenção adotada (pela regra do usuário) é:
// - Começamos com uma pessoa de nível 0;
// - Filhos ficam em nível (atual - 1);
// - Pais ficam em nível (atual + 1);
// - Cônjuges ficam no mesmo nível.
// edgesForLayout: source = pai, target = filho (pai → filho)
// Agrupa nós de uma linha em "unidades": cada par de cônjuges forma uma unidade
// indivisível (ficam lado a lado), pessoas sem cônjuge na linha são singletons.
const buildRowUnits = (
  row: Array<{ id: string; x: number; y: number }>,
  spousePairs: Array<[string, string]>,
): Array<Array<{ id: string; x: number; y: number }>> => {
  const inRow = new Set(row.map((n) => n.id));
  const used = new Set<string>();
  const units: Array<Array<{ id: string; x: number; y: number }>> = [];

  spousePairs.forEach(([a, b]) => {
    if (inRow.has(a) && inRow.has(b) && !used.has(a) && !used.has(b)) {
      const na = row.find((n) => n.id === a)!;
      const nb = row.find((n) => n.id === b)!;
      units.push([na, nb]);
      used.add(a);
      used.add(b);
    }
  });

  row.forEach((node) => {
    if (!used.has(node.id)) units.push([node]);
  });

  return units;
};

const getLayoutedElements = (
  nodes: Node[],
  edgesForDisplay: Edge[],
  edgesForLayout: Edge[],
  levelById?: Map<string, number>,
) => {
  const g = new dagre.graphlib.Graph();
  const spousePairs: Array<[string, string]> = [];

  g.setDefaultEdgeLabel(() => ({}));
  // rankdir "TB": pais (mais antigos) em cima, filhos embaixo
  // Usamos separações generosas para reduzir a chance de sobreposição vertical
  g.setGraph({
    rankdir: 'TB',
    ranksep: NODE_HEIGHT + 60,
    nodesep: NODE_WIDTH + 40,
  });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Pega pares de cônjuges a partir das edges que serão exibidas
  edgesForDisplay.forEach((edge) => {
    if (edge.type === 'spouse') {
      spousePairs.push([edge.source, edge.target]);
    }
  });

  // Apenas edges de hierarquia (pais → filhos) entram no layout
  edgesForLayout.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  // Primeiro coletamos as posições calculadas pelo Dagre
  const rawPositions = new Map<string, { x: number; y: number }>();
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const pos = g.node(node.id);
    if (!pos) return;
    rawPositions.set(node.id, { x: pos.x, y: pos.y });
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y);
  });

  const positions = new Map<string, { x: number; y: number }>();

  // Se tivermos informações explícitas de nível geracional,
  // usamos isso para definir o eixo vertical, garantindo:
  // - todas as pessoas do mesmo nível ficam exatamente na mesma "linha" (mesmo Y)
  // - níveis diferentes são mapeados para linhas diferentes em ordem coerente.
  //
  // Como pela regra adotada filhos têm nível menor (ex.: -1) e pais maior (ex.: +1),
  // ordenamos os níveis de forma crescente e usamos o índice dessa ordenação
  // para definir a linha visual: níveis mais negativos ficam VISUALMENTE mais acima.
  const VERTICAL_GAP = NODE_HEIGHT + 80;
  const levelToRow = new Map<number, number>();

  if (levelById && levelById.size > 0) {
    const uniqueLevels = Array.from(new Set(levelById.values())).sort((a, b) => a - b);
    uniqueLevels.forEach((level, index) => {
      levelToRow.set(level, index);
    });

    nodes.forEach((node) => {
      const base = rawPositions.get(node.id);
      if (!base) return;

      const level = levelById.get(node.id) ?? 0;
      const rowIndex = levelToRow.get(level) ?? 0;
      const y = rowIndex * VERTICAL_GAP;
      positions.set(node.id, { x: base.x, y });
    });
  } else {
    // Fallback: mantemos o comportamento anterior espelhando o eixo Y do Dagre.
    rawPositions.forEach((p, id) => {
      const flippedY = maxY - (p.y - minY);
      positions.set(id, { x: p.x, y: flippedY });
    });
  }

  // Espaçamento entre cônjuges (dentro do mesmo grupo) — mais compacto
  const SPOUSE_GAP = NODE_WIDTH + 8;
  // Espaçamento entre ramos diferentes da árvore (ex.: pais da Lilian vs pais do Tiago)
  const BRANCH_GAP = NODE_WIDTH + 24;

  spousePairs.forEach(([sourceId, targetId]) => {
    const sourcePos = positions.get(sourceId);
    const targetPos = positions.get(targetId);

    if (!sourcePos || !targetPos) return;

    const midX = (sourcePos.x + targetPos.x) / 2;
    const midY = (sourcePos.y + targetPos.y) / 2;
    const offset = SPOUSE_GAP / 2;

    positions.set(sourceId, { x: midX - offset, y: midY });
    positions.set(targetId, { x: midX + offset, y: midY });
  });

  // Pós-processamento para garantir que não haja sobreposição de cards na horizontal.
  // Agrupamos nós por "linha" (aproximada pelo eixo Y) e, dentro de cada linha,
  // garantimos um espaçamento mínimo entre os nós.
  //
  // Usamos uma tolerância menor que a separação vertical utilizada no Dagre
  // para que gerações diferentes (pais, avós, filhos) não sejam acidentalmente
  // agrupadas na mesma linha. Na prática, isso faz com que apenas pessoas que
  // pertencem ao mesmo "nível" de parentesco (ex.: cônjuges, irmãos) fiquem
  // realmente alinhadas na mesma linha.
  const ROW_TOLERANCE = NODE_HEIGHT / 2;

  const rows = new Map<number, Array<{ id: string; x: number; y: number }>>();

  positions.forEach((pos, id) => {
    // Quando temos levelById, usamos o índice da linha (derivado do nível geracional)
    // como chave de linha; assim garantimos que todas as pessoas do mesmo nível fiquem
    // exatamente na mesma faixa vertical (mesmo eixo Y), variando apenas a posição no eixo X.
    const rowKey =
      levelById && levelById.has(id) && levelToRow.has(levelById.get(id)!)
        ? levelToRow.get(levelById.get(id)!)!
        : Math.round(pos.y / ROW_TOLERANCE);
    const row = rows.get(rowKey) ?? [];
    row.push({ id, x: pos.x, y: pos.y });
    rows.set(rowKey, row);
  });

  // Mapa pai → filhos (edgesForLayout: source=pai, target=filho)
  const parentToChildren = new Map<string, string[]>();
  edgesForLayout.forEach((edge) => {
    const children = parentToChildren.get(edge.source) ?? [];
    children.push(edge.target);
    parentToChildren.set(edge.source, children);
  });

  // Processar linhas em ordem (topo → base). Cada par/grupo de pais é posicionado
  // centralizado sob seu(s) filho(s) na linha anterior, evitando deslocamento horizontal.
  const sortedRowKeys = Array.from(rows.keys()).sort((a, b) => a - b);

  sortedRowKeys.forEach((rowKey, rowIndex) => {
    const row = rows.get(rowKey)!;
    const prevRow = rowIndex > 0 ? rows.get(sortedRowKeys[rowIndex - 1]) : null;

    const prevRowXById = prevRow ? new Map(prevRow.map((n) => [n.id, n.x])) : null;
    const anchorX = (nodeInRow: { id: string; x: number }): number => {
      const children = parentToChildren.get(nodeInRow.id) ?? [];
      if (children.length === 0 || !prevRowXById) return nodeInRow.x;
      const childX = children
        .map((cid) => prevRowXById.get(cid))
        .filter((x): x is number => x !== undefined);
      if (childX.length === 0) return nodeInRow.x;
      return Math.min(...childX);
    };

    // Unidades: cada par de cônjuges fica indivisível (sempre lado a lado)
    const units = buildRowUnits(row, spousePairs);

    // Ordenar unidades pela âncora (posição do filho na linha anterior)
    const unitAnchor = (unit: typeof row): number =>
      Math.min(...unit.map((n) => anchorX(n)));
    units.sort((ua, ub) => unitAnchor(ua) - unitAnchor(ub));

    // Posicionar cada unidade: cônjuges colados (SPOUSE_GAP), ramos separados (BRANCH_GAP)
    let rightEdge = Number.NEGATIVE_INFINITY;
    units.forEach((unit) => {
      const n = unit.length;
      const targetCenter = unit.reduce((sum, node) => sum + anchorX(node), 0) / n;
      const unitWidth = n * NODE_WIDTH + (n - 1) * SPOUSE_GAP;
      let unitCenter = targetCenter;
      const unitLeft = unitCenter - unitWidth / 2;
      if (unitLeft < rightEdge + BRANCH_GAP) {
        unitCenter = rightEdge + BRANCH_GAP + unitWidth / 2;
      }
      rightEdge = unitCenter + unitWidth / 2;
      const startX = unitCenter - unitWidth / 2 + NODE_WIDTH / 2;
      unit.forEach((node, i) => {
        node.x = startX + i * (NODE_WIDTH + SPOUSE_GAP);
        positions.set(node.id, { x: node.x, y: node.y });
      });
    });
  });

  const layoutedNodes = nodes.map((node) => {
    const pos = positions.get(node.id);
    if (!pos) return node;

    return {
      ...node,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });

  return { nodes: layoutedNodes, edges: edgesForDisplay };
};

const FamilyTree: React.FC<FamilyTreeProps> = ({ onSelectPerson }) => {
  const { persons, relationships } = useFamily();

  const { initialNodes, initialEdges, autoNodes } = useMemo(() => {
    if (persons.length === 0) {
      return { initialNodes: [] as Node[], initialEdges: [] as Edge[], autoNodes: [] as Node[] };
    }

    // Mapa compartilhado de níveis geracionais para uso tanto no log quanto no layout.
    // Regra pedida:
    // - Começamos com uma pessoa em nível 0 (a primeira da lista);
    // - Filhos dessa pessoa (e de qualquer outra) têm nível (nível_atual - 1);
    // - Pais têm nível (nível_atual + 1);
    // - Cônjuges permanecem no mesmo nível.
    let levelById: Map<string, number> | undefined;

    // Debug: calcula os níveis geracionais seguindo a regra acima e loga o resultado.
    try {
      levelById = new Map<string, number>();

      const assignFromSeed = (seedId: string) => {
        if (levelById!.has(seedId)) return;
        levelById!.set(seedId, 0);

        const queue: string[] = [seedId];

        while (queue.length > 0) {
          const currentId = queue.shift() as string;
          const currentLevel = levelById!.get(currentId) ?? 0;

          // Filhos: nível atual - 1
          const children = getChildren(currentId, relationships);
          children.forEach((childId) => {
            if (!levelById!.has(childId)) {
              levelById!.set(childId, currentLevel - 1);
              queue.push(childId);
            }
          });

          // Pais: nível atual + 1
          const parents = getParents(currentId, relationships);
          parents.forEach((parentId) => {
            if (!levelById!.has(parentId)) {
              levelById!.set(parentId, currentLevel + 1);
              queue.push(parentId);
            }
          });

          // Cônjuges: mesmo nível
          const spouses = getSpouses(currentId, relationships);
          spouses.forEach((spouseId) => {
            if (!levelById!.has(spouseId)) {
              levelById!.set(spouseId, currentLevel);
              queue.push(spouseId);
            }
          });
        }
      };

      // Começamos pela primeira pessoa da lista, como descrito.
      if (persons.length > 0) {
        assignFromSeed(persons[0].id);
      }

      // Em seguida, garantimos que qualquer pessoa ainda sem nível (outros componentes)
      // também receba níveis relativos ao seu próprio "zero".
      persons.forEach((person) => {
        if (!levelById!.has(person.id)) {
          assignFromSeed(person.id);
        }
      });

    } catch (e) {
      console.warn('[FamilyTree] Erro ao calcular níveis geracionais:', e);
    }

    const nodes: Node[] = persons.map((person) => {
      // usamos "hasChildren" como um indicativo genérico de que o nó
      // possui relações ascendentes que podem ser colapsadas (pais, avós, etc.)
      const hasParents = getParents(person.id, relationships).length > 0;
      return {
        id: person.id,
        type: 'familyNode',
        position: { x: 0, y: 0 },
        data: {
          person,
          onSelect: onSelectPerson,
          hasChildren: hasParents,
          collapsed: false,
        },
      };
    });

    const displayEdges: Edge[] = [];
    const layoutEdges: Edge[] = [];
    const addedEdges = new Set<string>();

    relationships.forEach((rel) => {
      const edgeId = `${rel.personId}-${rel.relatedPersonId}-${rel.type}`;
      if (addedEdges.has(edgeId)) return;
      addedEdges.add(edgeId);

      if (rel.type === 'parent') {
        // Layout: pai (relatedPersonId) → filho (personId) para Dagre
        layoutEdges.push({
          id: edgeId,
          source: rel.relatedPersonId,
          target: rel.personId,
        });

        // Exibição: filho (source) → pai (target) com handles verticais
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
        });
      }
    });

    // Calcula layout automático, mas NÃO o aplica por padrão;
    // ficará disponível apenas para o botão "Auto ajustar".
    const { nodes: autoLayoutNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      displayEdges,
      layoutEdges,
      levelById,
    );

    // Posições iniciais dos nós:
    // - Usamos autoLayoutNodes como base (layout calculado pelo Dagre) para evitar
    //   que todos fiquem em (0,0) e se sobreponham (o que fazia "desaparecer" o resto
    //   ao adicionar uma nova pessoa).
    // - Se houver posições salvas no localStorage, sobrescrevemos para esses nós.
    let initialNodesLocal = autoLayoutNodes;
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(NODE_POSITIONS_STORAGE_KEY);
        if (raw) {
          const saved: Record<string, { x: number; y: number }> = JSON.parse(raw);
          initialNodesLocal = autoLayoutNodes.map((node) =>
            saved[node.id]
              ? {
                  ...node,
                  position: saved[node.id],
                }
              : node,
          );
        }
      } catch {
        // se der erro no parse, usamos o layout automático
      }
    }

    return {
      initialNodes: initialNodesLocal,
      initialEdges: layoutedEdges,
      autoNodes: autoLayoutNodes,
    };
  }, [persons, relationships, onSelectPerson]);

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[FamilyTree] render', {
      personsCount: persons.length,
      nodesCount: initialNodes.length,
    });
  }

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Ao mudar pessoas/relacionamentos:
  // - Mantemos as posições dos nós existentes
  // - Adicionamos apenas nós novos
  // - Removemos nós que não existem mais
  React.useEffect(() => {
    setNodes((prevNodes) => {
      const nextById = new Map(initialNodes.map((n) => [n.id, n]));

      // mantém posição atual para nós que já existiam; se estiverem em (0,0)
      // (nunca posicionados), usa a posição do layout para evitar sobreposição
      const merged: Node[] = prevNodes
        .filter((node) => nextById.has(node.id))
        .map((node) => {
          const base = nextById.get(node.id)!;
          const wasNeverPositioned =
            node.position.x === 0 && node.position.y === 0;
          const useLayoutPosition =
            wasNeverPositioned &&
            (base.position.x !== 0 || base.position.y !== 0);
          return {
            ...base,
            position: useLayoutPosition ? base.position : node.position,
          };
        });

      const existingIds = new Set(merged.map((n) => n.id));

      // adiciona novos nós com posição inicial calculada
      initialNodes.forEach((node) => {
        if (!existingIds.has(node.id)) {
          merged.push(node);
        }
      });

      return merged;
    });

    // edges podem ser substituídas diretamente, pois não afetam posições de nós
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const toggleCollapse = React.useCallback(
    (nodeId: string) => {
      const ancestors = collectAncestorIds(nodeId, relationships);

      setNodes((prevNodes) => {
        const targetNode = prevNodes.find((n) => n.id === nodeId);
        const targetData = targetNode?.data as { collapsed?: boolean } | undefined;
        const currentCollapsed = Boolean(targetData?.collapsed);
        const nextCollapsed = !currentCollapsed;

        setEdges((prevEdges) =>
          prevEdges.map((edge) => {
            if (ancestors.has(edge.source as string) || ancestors.has(edge.target as string)) {
              return { ...edge, hidden: nextCollapsed };
            }
            return edge;
          }),
        );

        return prevNodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                collapsed: nextCollapsed,
              },
            };
          }

          if (ancestors.has(node.id)) {
            return {
              ...node,
              hidden: nextCollapsed,
            };
          }

          return node;
        });
      });
    },
    [relationships, setNodes, setEdges],
  );

  const toggleCollapseRef = React.useRef(toggleCollapse);
  toggleCollapseRef.current = toggleCollapse;

  React.useEffect(() => {
    // injeta callbacks e flags de filhos nos dados dos nós existentes
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        const hasParents = getParents(node.id, relationships).length > 0;
        const data = node.data as {
          hasChildren?: boolean;
          onToggleExpand?: () => void;
        };
        return {
          ...node,
          data: {
            ...data,
            hasChildren: hasParents,
            onToggleExpand: () => toggleCollapseRef.current(node.id),
          },
        };
      }),
    );
  }, [relationships, setNodes]);

  const handleAutoLayout = React.useCallback(() => {
    setNodes(autoNodes);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(NODE_POSITIONS_STORAGE_KEY);
    }
  }, [autoNodes, setNodes]);

  const handleSavePositions = React.useCallback(() => {
    if (typeof window === 'undefined') return;

    const positions = nodes.reduce<Record<string, { x: number; y: number }>>((acc, node) => {
      acc[node.id] = node.position;
      return acc;
    }, {});

    window.localStorage.setItem(NODE_POSITIONS_STORAGE_KEY, JSON.stringify(positions));
  }, [nodes]);

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
    <div className="w-full h-[calc(100vh-220px)] min-h-[400px] rounded-xl overflow-hidden border border-border bg-card">
      <TreeErrorBoundary>
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
          snapToGrid={true}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border))" />
          <Controls
            showInteractive={false}
            className="!bg-card !border-border !shadow-md [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted"
          />
          <Panel position="top-right" className="space-x-2 m-2">
            <button
              type="button"
              onClick={handleAutoLayout}
              className="px-3 py-1.5 rounded-md bg-muted text-xs font-medium text-foreground hover:bg-muted/80 border border-border shadow-sm"
            >
              Auto ajustar
            </button>
            <button
              type="button"
              onClick={handleSavePositions}
              className="px-3 py-1.5 rounded-md bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              Salvar posições
            </button>
          </Panel>
        </ReactFlow>
      </TreeErrorBoundary>
    </div>
  );
};

export default FamilyTree;
