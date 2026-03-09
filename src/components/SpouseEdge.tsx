import React from 'react';
import { BaseEdge, type EdgeProps, getStraightPath } from '@xyflow/react';
import { Heart } from 'lucide-react';

const SpouseEdge: React.FC<EdgeProps> = (props) => {
  const { sourceX, sourceY, targetX, targetY } = props;
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  return (
    <>
      <BaseEdge {...props} path={edgePath} style={{ stroke: 'hsl(var(--gold))', strokeWidth: 2, strokeDasharray: '6 3' }} />
      <foreignObject x={midX - 10} y={midY - 10} width={20} height={20} className="pointer-events-none">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-card">
          <Heart className="h-3 w-3 text-gold" />
        </div>
      </foreignObject>
    </>
  );
};

export default SpouseEdge;
