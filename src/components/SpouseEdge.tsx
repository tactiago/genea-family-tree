import React from 'react';
import { BaseEdge, type EdgeProps, getStraightPath } from '@xyflow/react';
import { Heart } from 'lucide-react';

const MONTHS_PT_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const;

const formatMarriageDate = (raw: string): string => {
  const [year, month, day] = raw.split('-');
  if (!year) return raw;
  const monthIndex = Number(month || '1') - 1;
  const monthLabel = MONTHS_PT_SHORT[monthIndex] ?? month ?? '';
  return day ? `${Number(day)} ${monthLabel} ${year}` : `${monthLabel} ${year}`;
};

type SpouseEdgeData = {
  marriageDate?: string;
};

const SpouseEdge: React.FC<EdgeProps> = (props) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    markerStart,
    markerEnd,
    style,
    data,
  } = props;
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  const marriageDate = (data as SpouseEdgeData | undefined)?.marriageDate;
  const dateLabel = marriageDate ? formatMarriageDate(marriageDate) : '';
  const foWidth = dateLabel ? 80 : 20;
  const foHeight = dateLabel ? 38 : 20;

  return (
    <>
      <BaseEdge
        id={id}
        markerStart={markerStart}
        markerEnd={markerEnd}
        path={edgePath}
        style={{
          ...style,
          stroke: 'hsl(var(--gold))',
          strokeWidth: 2,
          strokeDasharray: '6 3',
        }}
      />
      <foreignObject
        x={midX - foWidth / 2}
        y={midY - foHeight / 2}
        width={foWidth}
        height={foHeight}
        className="pointer-events-none overflow-visible"
      >
        <div className="flex flex-col items-center justify-center h-full gap-0.5">
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-card shadow-sm">
            <Heart className="h-3 w-3 text-gold" />
          </div>
          {dateLabel && (
            <span className="text-[9px] leading-none font-medium text-muted-foreground whitespace-nowrap bg-card/95 px-1 py-0.5 rounded">
              {dateLabel}
            </span>
          )}
        </div>
      </foreignObject>
    </>
  );
};

export default SpouseEdge;
