import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Person, Relationship, getParents } from '@/types/family';
import PersonTreeCard from './PersonTreeCard';
import {
  layoutPedigree,
  type PedigreeLayoutResult,
  type PersonLayoutPosition,
} from '@/lib/family-tree/pedigree-layout';
import { buildSiblingGroups, buildSiblingBusPaths, buildCoupleDropPaths } from '@/lib/family-tree/connectors';
const MONTHS_PT_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const;

const formatMarriageDate = (raw: string): string => {
  const [year, month, day] = raw.split('-');
  if (!year) return raw;
  const monthIndex = Number(month || '1') - 1;
  const monthLabel = MONTHS_PT_SHORT[monthIndex] ?? month ?? '';
  return day ? `${Number(day)} ${monthLabel} ${year}` : `${monthLabel} ${year}`;
};

interface GenealogyCanvasProps {
  persons: Person[];
  relationships: Relationship[];
  visibleIds: Set<string>;
  collapsedNodeIds: Set<string>;
  onSelectPerson: (person: Person) => void;
  onToggleCollapse: (personId: string) => void;
}

interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}

const SpouseEdgeSvg: React.FC<{
  posA: PersonLayoutPosition;
  posB: PersonLayoutPosition;
  marriageDate?: string;
}> = ({ posA, posB, marriageDate }) => {
  const left = posA.x < posB.x ? posA : posB;
  const right = posA.x < posB.x ? posB : posA;
  const y = left.y + left.height / 2;
  const x1 = left.x + left.width;
  const x2 = right.x;
  const midX = (x1 + x2) / 2;

  return (
    <g>
      <line
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        stroke="hsl(var(--gold))"
        strokeWidth={2}
        strokeDasharray="6 3"
      />
      <circle cx={midX} cy={y} r={10} fill="hsl(var(--card))" />
      <text x={midX} y={y + 3} textAnchor="middle" fontSize={10} fill="hsl(var(--gold))">
        ♥
      </text>
      {marriageDate && (
        <text
          x={midX}
          y={y + 18}
          textAnchor="middle"
          fontSize={9}
          fill="hsl(var(--muted-foreground))"
        >
          {formatMarriageDate(marriageDate)}
        </text>
      )}
    </g>
  );
};

const GenealogyCanvas: React.FC<GenealogyCanvasProps> = ({
  persons,
  relationships,
  visibleIds,
  collapsedNodeIds,
  onSelectPerson,
  onToggleCollapse,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<ViewTransform>({ x: 48, y: 48, scale: 1 });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );

  const layout: PedigreeLayoutResult = useMemo(
    () => layoutPedigree(persons, relationships, visibleIds),
    [persons, relationships, visibleIds],
  );

  const personById = useMemo(() => new Map(persons.map((p) => [p.id, p])), [persons]);

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
    fitToView();
  }, [fitToView, layout.bounds.width, layout.bounds.height, visibleIds.size]);

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

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    setTransform((prev) => ({
      ...prev,
      x: drag.originX + dx,
      y: drag.originY + dy,
    }));
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
  }, []);

  const { siblingBusPaths, coupleDropPaths } = useMemo(() => {
    const groups = buildSiblingGroups(visibleIds, relationships);
    return {
      siblingBusPaths: buildSiblingBusPaths(groups, layout.positions),
      coupleDropPaths: buildCoupleDropPaths(layout.spouseLinks, layout.positions, groups),
    };
  }, [visibleIds, relationships, layout.positions, layout.spouseLinks]);

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
        >
          <svg
            className="absolute inset-0 pointer-events-none"
            width={layout.bounds.width}
            height={layout.bounds.height}
          >
            {coupleDropPaths.map((path) => (
              <path
                key={path.id}
                d={path.d}
                fill="none"
                stroke="hsl(var(--tree-line))"
                strokeWidth={2}
              />
            ))}
            {siblingBusPaths.map((path) => (
              <path
                key={path.id}
                d={path.d}
                fill="none"
                stroke="hsl(var(--tree-line))"
                strokeWidth={2}
              />
            ))}
            {layout.spouseLinks.map((link) => {
              const posA = layout.positions.get(link.personAId);
              const posB = layout.positions.get(link.personBId);
              if (!posA || !posB) return null;
              return (
                <SpouseEdgeSvg
                  key={link.id}
                  posA={posA}
                  posB={posB}
                  marriageDate={link.marriageDate}
                />
              );
            })}
          </svg>

          {Array.from(layout.positions.values()).map((pos) => {
            const person = personById.get(pos.id);
            if (!person) return null;

            const hasAncestors = getParents(pos.id, relationships).length > 0;
            const ancestorsCollapsed = collapsedNodeIds.has(pos.id);

            return (
              <div
                key={pos.id}
                className="absolute"
                style={{ left: pos.x, top: pos.y - 20, width: pos.width }}
              >
                {hasAncestors && (
                  <button
                    type="button"
                    onClick={() => onToggleCollapse(pos.id)}
                    className="absolute left-1/2 z-20 -translate-x-1/2 top-0 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-[11px] font-medium leading-none text-foreground shadow-sm hover:bg-muted"
                    aria-label={ancestorsCollapsed ? 'Expandir ancestrais' : 'Colapsar ancestrais'}
                  >
                    {ancestorsCollapsed ? '+' : '−'}
                  </button>
                )}
                <div className="pt-5">
                  <PersonTreeCard person={person} onSelect={onSelectPerson} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GenealogyCanvas;
