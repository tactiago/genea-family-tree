import React from 'react';
import { Person, getFullName, getChildren, getSpouses } from '@/types/family';
import { useFamily } from '@/contexts/FamilyContext';
import { User, Heart } from 'lucide-react';

interface TreeNodeProps {
  person: Person;
  onSelect: (person: Person) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ person, onSelect }) => {
  const { persons, relationships, getPerson } = useFamily();
  const children = getChildren(person.id, relationships)
    .map(id => getPerson(id))
    .filter(Boolean) as Person[];
  const spouses = getSpouses(person.id, relationships)
    .map(id => getPerson(id))
    .filter(Boolean) as Person[];

  const genderBorder = person.gender === 'male'
    ? 'border-blue-300'
    : person.gender === 'female'
    ? 'border-pink-300'
    : 'border-border';

  return (
    <div className="flex flex-col items-center">
      {/* Person + Spouse row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSelect(person)}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card card-shadow border-2 ${genderBorder} hover:card-shadow-hover transition-all active:scale-95 min-w-[100px] max-w-[140px]`}
        >
          <div className="h-12 w-12 rounded-full bg-green-light flex items-center justify-center overflow-hidden">
            {person.photoUrl ? (
              <img src={person.photoUrl} alt={person.firstName} className="h-full w-full object-cover" />
            ) : (
              <User className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-foreground leading-tight truncate max-w-[120px]">
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

        {spouses.map(spouse => (
          <React.Fragment key={spouse.id}>
            <Heart className="h-4 w-4 text-gold flex-shrink-0" />
            <button
              onClick={() => onSelect(spouse)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card card-shadow border-2 ${
                spouse.gender === 'male' ? 'border-blue-300' : spouse.gender === 'female' ? 'border-pink-300' : 'border-border'
              } hover:card-shadow-hover transition-all active:scale-95 min-w-[100px] max-w-[140px]`}
            >
              <div className="h-12 w-12 rounded-full bg-green-light flex items-center justify-center overflow-hidden">
                {spouse.photoUrl ? (
                  <img src={spouse.photoUrl} alt={spouse.firstName} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-primary" />
                )}
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-foreground leading-tight truncate max-w-[120px]">
                  {getFullName(spouse)}
                </p>
                {spouse.birthDate && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(spouse.birthDate).getFullYear()}
                    {spouse.deathDate && ` – ${new Date(spouse.deathDate).getFullYear()}`}
                  </p>
                )}
              </div>
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Children connector */}
      {children.length > 0 && (
        <>
          <div className="w-0.5 h-6 tree-line" />
          <div className="relative flex items-start">
            {children.length > 1 && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 tree-line" 
                   style={{ width: `calc(100% - 100px)` }} />
            )}
            <div className="flex gap-4 sm:gap-8">
              {children.map(child => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className="w-0.5 h-6 tree-line" />
                  <TreeNode person={child} onSelect={onSelect} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TreeNode;
