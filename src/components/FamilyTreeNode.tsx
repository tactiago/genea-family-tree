import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Person, getFullName } from '@/types/family';
import { User } from 'lucide-react';

export type FamilyNodeData = {
  person: Person;
  onSelect: (person: Person) => void;
  hasChildren?: boolean;
  collapsed?: boolean;
  onToggleExpand?: () => void;
};

const MONTHS_PT_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const;

const formatDateLabel = (date: string): string => {
  if (!date) return '';
  const [year, month, day] = date.split('-');
  if (!year || !month || !day) return date;
  const monthIndex = Number(month) - 1;
  const monthLabel = MONTHS_PT_SHORT[monthIndex] ?? month;
  return `${Number(day)} ${monthLabel} ${year}`;
};

const FamilyTreeNode: React.FC<NodeProps> = ({ data }) => {
  const { person, onSelect, hasChildren, collapsed, onToggleExpand } = data as unknown as FamilyNodeData;

  const genderBorder = person.gender === 'male'
    ? 'border-blue-300'
    : person.gender === 'female'
    ? 'border-pink-300'
    : 'border-border';

  return (
    <>
      {/* Handles para relações pai/filho (verticais) */}
      <Handle
        id="parent-top"
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-none !w-0 !h-0"
      />
      <button
        onClick={() => onSelect(person)}
        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card card-shadow border-2 ${genderBorder} hover:card-shadow-hover transition-all active:scale-95 min-w-[150px] max-w-[150px] cursor-pointer`}
      >
        {hasChildren && onToggleExpand && (
          <>
            {/* Controle de colapso/expansão como div para evitar botão dentro de botão */}
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleExpand();
                }
              }}
              className="absolute right-1 bottom-1 h-4 w-4 rounded-full bg-muted text-[9px] leading-none flex items-center justify-center text-foreground/80 hover:bg-muted/80"
            >
              {collapsed ? '+' : '−'}
            </div>
          </>
        )}
        <div className="h-12 w-12 rounded-full bg-green-light flex items-center justify-center overflow-hidden">
          {person.photoUrl ? (
            <img src={person.photoUrl} alt={person.firstName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <User className="h-6 w-6 text-primary" />
          )}
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-foreground leading-tight truncate max-w-[130px]">
            {getFullName(person)}
          </p>
          {person.birthDate && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {formatDateLabel(person.birthDate)}
              {person.deathDate && ` – ${formatDateLabel(person.deathDate)}`}
            </p>
          )}
        </div>
      </button>
      <Handle
        id="parent-bottom"
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-none !w-0 !h-0"
      />

      {/* Handles laterais exclusivos para relações de cônjuge */}
      <Handle
        id="spouse-left"
        type="target"
        position={Position.Left}
        className="!bg-transparent !border-none !w-0 !h-0"
      />
      <Handle
        id="spouse-right"
        type="source"
        position={Position.Right}
        className="!bg-transparent !border-none !w-0 !h-0"
      />
    </>
  );
};

export default memo(FamilyTreeNode);
