import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Person, getFullName } from '@/types/family';
import { User } from 'lucide-react';

export type FamilyNodeData = {
  person: Person;
  onSelect: (person: Person) => void;
};

const FamilyTreeNode: React.FC<NodeProps> = ({ data }) => {
  const { person, onSelect } = data as unknown as FamilyNodeData;

  const genderBorder = person.gender === 'male'
    ? 'border-blue-300'
    : person.gender === 'female'
    ? 'border-pink-300'
    : 'border-border';

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-none !w-0 !h-0" />
      <button
        onClick={() => onSelect(person)}
        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card card-shadow border-2 ${genderBorder} hover:card-shadow-hover transition-all active:scale-95 min-w-[110px] max-w-[150px] cursor-pointer`}
      >
        <div className="h-12 w-12 rounded-full bg-green-light flex items-center justify-center overflow-hidden">
          {person.photoUrl ? (
            <img src={person.photoUrl} alt={person.firstName} className="h-full w-full object-cover" />
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
              {new Date(person.birthDate).getFullYear()}
              {person.deathDate && ` – ${new Date(person.deathDate).getFullYear()}`}
            </p>
          )}
        </div>
      </button>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-none !w-0 !h-0" />
    </>
  );
};

export default memo(FamilyTreeNode);
