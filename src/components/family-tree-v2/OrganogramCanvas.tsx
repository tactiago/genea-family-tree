import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Person, Relationship } from '@/types/family';
import OrganogramNode from './OrganogramNode';
import { layoutPedigree } from '@/lib/family-tree/pedigree-layout';
import {
  computeOrganogramVisibleIds,
  getOrganogramNodeActions,
  type OrganogramExpansionState,
} from '@/lib/family-tree/organogram-visibility';
import {
  getOrganogramLayoutConstants,
  NODE_WIDTH,
} from '@/lib/family-tree/organogram-constants';
import {
  buildOrganogramSiblingGroups,
  buildOrganogramSiblingBusPaths,
  buildOrganogramCoupleDropPaths,
  buildOrganogramSpouseSegment,
  type OrganogramConnectorPath,
} from '@/lib/family-tree/organogram-connectors';
import {
  getPersonFieldLines,
  formatOrganogramDate,
  type OrganogramFieldId,
} from '@/lib/family-tree/organogram-fields';
import {
  computeOrganogramHighlight,
  DIMMED_OPACITY,
  type OrganogramHoverState,
} from '@/lib/family-tree/organogram-highlight';

interface OrganogramCanvasProps {
  persons: Person[];
  relationships: Relationship[];
  rootPersonId: string;
  expansion: OrganogramExpansionState;
  visibleFields: Set<OrganogramFieldId>;
  onSelectPerson: (person: Person) => void;
  onToggleExpandUp: (personId: string) => void;
  onToggleExpandDown: (personId: string) => void;
  onToggleExpandSiblings: (personId: string) => void;
}

interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}

const ConnectorPathLayer: React.FC<{
  path: OrganogramConnectorPath;
  stroke: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  dimmed: boolean;
  onHoverStart: (connectorId: string) => void;
}> = ({ path, stroke, strokeWidth = 2, strokeDasharray, dimmed, onHoverStart }) => (
  <g className="transition-opacity duration-200" style={{ opacity: dimmed ? DIMMED_OPACITY : 1 }}>
    <path
      d={path.d}
      fill="none"
      stroke="transparent"
      strokeWidth={14}
      style={{ cursor: 'pointer' }}
      onMouseEnter={() => onHoverStart(path.id)}
    />
    <path
      d={path.d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      pointerEvents="none"
    />
  </g>
);

const OrganogramCanvas: React.FC<OrganogramCanvasProps> = ({
  persons,
  relationships,
  rootPersonId,
  expansion,
  visibleFields,
  onSelectPerson,
  onToggleExpandUp,
  onToggleExpandDown,
  onToggleExpandSiblings,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<ViewTransform>({ x: 48, y: 48, scale: 1 });
  const [hover, setHover] = useState<OrganogramHoverState>({ type: 'none' });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );
  const prevRootPersonIdRef = useRef(rootPersonId);

  const visibleIds = useMemo(
    () => computeOrganogramVisibleIds(rootPersonId, expansion, relationships),
    [rootPersonId, expansion, relationships],
  );

  const maxFieldCount = visibleFields.size;

  const layout = useMemo(
    () =>
      layoutPedigree(persons, relationships, visibleIds, {
        rootId: rootPersonId,
        metrics: getOrganogramLayoutConstants(maxFieldCount),
      }),
    [persons, relationships, visibleIds, rootPersonId, maxFieldCount],
  );

  const personById = useMemo(() => new Map(persons.map((p) => [p.id, p])), [persons]);

  const { siblingBusPaths, coupleDropPaths, allConnectors } = useMemo(() => {
    const groups = buildOrganogramSiblingGroups(visibleIds, relationships);
    const busPaths = buildOrganogramSiblingBusPaths(groups, layout.positions, layout.spouseLinks);
    const dropPaths = buildOrganogramCoupleDropPaths(layout.spouseLinks, layout.positions, groups);
    const spousePaths: OrganogramConnectorPath[] = layout.spouseLinks.map((link) => ({
      id: `spouse-${link.id}`,
      d: '',
      kind: 'spouse',
      personIds: [link.personAId, link.personBId],
    }));

    return {
      siblingBusPaths: busPaths,
      coupleDropPaths: dropPaths,
      allConnectors: [...dropPaths, ...busPaths, ...spousePaths],
    };
  }, [visibleIds, relationships, layout.positions, layout.spouseLinks]);

  const { highlightedPeople, highlightedConnectors } = useMemo(
    () => computeOrganogramHighlight(hover, allConnectors),
    [hover, allConnectors],
  );

  const isHighlighting = highlightedPeople !== null;

  const fitToView = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const padding = 48;
    const availW = el.clientWidth - padding * 2;
    const availH = el.clientHeight - padding * 2;
    const scale = Math.min(availW / layout.bounds.width, availH / layout.bounds.height, 1.2);
    const clampedScale = Math.max(0.25, Math.min(scale, 1.5));

    setTransform({
      scale: clampedScale,
      x: (el.clientWidth - layout.bounds.width * clampedScale) / 2,
      y: padding,
    });
  }, [layout.bounds.width, layout.bounds.height]);

  useEffect(() => {
    const rootChanged = prevRootPersonIdRef.current !== rootPersonId;
    prevRootPersonIdRef.current = rootPersonId;

    if (rootChanged) {
      fitToView();
      setHover({ type: 'none' });
    }
  }, [fitToView, rootPersonId]);

  useEffect(() => {
    fitToView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.2, Math.min(2.5, prev.scale * delta)),
    }));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: transform.x,
        originY: transform.y,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [transform.x, transform.y],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    setTransform((prev) => ({
      ...prev,
      x: drag.originX + (e.clientX - drag.startX),
      y: drag.originY + (e.clientY - drag.startY),
    }));
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
  }, []);

  const handleConnectorHover = useCallback((connectorId: string) => {
    setHover({ type: 'connector', connectorId });
  }, []);

  const handlePersonHover = useCallback((personId: string) => {
    setHover({ type: 'person', personId });
  }, []);

  const handleHoverEnd = useCallback(() => {
    setHover({ type: 'none' });
  }, []);

  const isConnectorDimmed = useCallback(
    (connectorId: string) => isHighlighting && !highlightedConnectors!.has(connectorId),
    [isHighlighting, highlightedConnectors],
  );

  const isPersonDimmed = useCallback(
    (personId: string) => isHighlighting && !highlightedPeople!.has(personId),
    [isHighlighting, highlightedPeople],
  );

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
        <button
          type="button"
          onClick={() => setTransform((p) => ({ ...p, scale: Math.min(2.5, p.scale * 1.15) }))}
          className="p-2 rounded-md bg-card border border-border shadow-sm hover:bg-muted"
          aria-label="Aumentar zoom"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setTransform((p) => ({ ...p, scale: Math.max(0.2, p.scale * 0.85) }))}
          className="p-2 rounded-md bg-card border border-border shadow-sm hover:bg-muted"
          aria-label="Diminuir zoom"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={fitToView}
          className="p-2 rounded-md bg-card border border-border shadow-sm hover:bg-muted"
          aria-label="Centralizar árvore"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing bg-[radial-gradient(circle,hsl(var(--border))_1px,transparent_1px)] [background-size:20px_20px]"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            width: layout.bounds.width,
            height: layout.bounds.height,
            position: 'relative',
          }}
          onMouseLeave={handleHoverEnd}
        >
          <svg
            className="absolute inset-0"
            width={layout.bounds.width}
            height={layout.bounds.height}
          >
            {coupleDropPaths.map((path) => (
              <ConnectorPathLayer
                key={path.id}
                path={path}
                stroke="hsl(var(--tree-line))"
                dimmed={isConnectorDimmed(path.id)}
                onHoverStart={handleConnectorHover}
              />
            ))}
            {siblingBusPaths.map((path) => (
              <ConnectorPathLayer
                key={path.id}
                path={path}
                stroke="hsl(var(--tree-line))"
                dimmed={isConnectorDimmed(path.id)}
                onHoverStart={handleConnectorHover}
              />
            ))}
            {layout.spouseLinks.map((link) => {
              const posA = layout.positions.get(link.personAId);
              const posB = layout.positions.get(link.personBId);
              if (!posA || !posB) return null;

              const connectorId = `spouse-${link.id}`;
              const { x1, y, x2 } = buildOrganogramSpouseSegment(posA, posB);
              const midX = (x1 + x2) / 2;
              const dimmed = isConnectorDimmed(connectorId);

              return (
                <g
                  key={link.id}
                  className="transition-opacity duration-200"
                  style={{ opacity: dimmed ? DIMMED_OPACITY : 1, cursor: 'pointer' }}
                  onMouseEnter={() => handleConnectorHover(connectorId)}
                >
                  <line
                    x1={x1}
                    y1={y}
                    x2={x2}
                    y2={y}
                    stroke="transparent"
                    strokeWidth={14}
                  />
                  <line
                    x1={x1}
                    y1={y}
                    x2={x2}
                    y2={y}
                    stroke="hsl(var(--gold))"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    pointerEvents="none"
                  />
                  <circle cx={midX} cy={y} r={10} fill="hsl(var(--card))" pointerEvents="none" />
                  <text
                    x={midX}
                    y={y + 3}
                    textAnchor="middle"
                    fontSize={10}
                    fill="hsl(var(--gold))"
                    pointerEvents="none"
                  >
                    ♥
                  </text>
                  {link.marriageDate && (
                    <text
                      x={midX}
                      y={y + 18}
                      textAnchor="middle"
                      fontSize={9}
                      fill="hsl(var(--muted-foreground))"
                      pointerEvents="none"
                    >
                      {formatOrganogramDate(link.marriageDate)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {Array.from(layout.positions.values()).map((pos) => {
            const person = personById.get(pos.id);
            if (!person) return null;

            const actions = getOrganogramNodeActions(
              pos.id,
              rootPersonId,
              visibleIds,
              expansion,
              relationships,
            );
            const fieldLines = getPersonFieldLines(person, visibleFields);
            const dimmed = isPersonDimmed(pos.id);

            return (
              <div
                key={pos.id}
                className="absolute z-[1] transition-opacity duration-200"
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: NODE_WIDTH,
                  opacity: dimmed ? DIMMED_OPACITY : 1,
                }}
                onMouseEnter={() => handlePersonHover(pos.id)}
              >
                <OrganogramNode
                  person={person}
                  fieldLines={fieldLines}
                  actions={actions}
                  nodeHeight={pos.height}
                  infoSlotCount={maxFieldCount}
                  onSelect={onSelectPerson}
                  onToggleUp={() => onToggleExpandUp(pos.id)}
                  onToggleDown={() => onToggleExpandDown(pos.id)}
                  onToggleSiblings={() => onToggleExpandSiblings(pos.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrganogramCanvas;
