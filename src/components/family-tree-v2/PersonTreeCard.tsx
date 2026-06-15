import React, { memo } from 'react';
import { Person, getFullName } from '@/types/family';
import { User } from 'lucide-react';

const MONTHS_PT_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const;

const formatDateLabel = (date: string): string => {
  if (!date) return '';
  const [year, month, day] = date.split('-');
  if (!year || !month || !day) return date;
  const monthIndex = Number(month) - 1;
  const monthLabel = MONTHS_PT_SHORT[monthIndex] ?? month;
  return `${Number(day)} ${monthLabel} ${year}`;
};

export interface PersonTreeCardProps {
  person: Person;
  onSelect: (person: Person) => void;
}

const PersonTreeCard: React.FC<PersonTreeCardProps> = ({
  person,
  onSelect,
}) => {
  const genderBorder =
    person.gender === 'male'
      ? 'border-blue-300'
      : person.gender === 'female'
        ? 'border-pink-300'
        : 'border-border';

  return (
    <button
      type="button"
      onClick={() => onSelect(person)}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card card-shadow border-2 ${genderBorder} hover:card-shadow-hover transition-all active:scale-95 w-[150px] cursor-pointer`}
    >
      <div className="h-12 w-12 rounded-full bg-green-light flex items-center justify-center overflow-hidden">
        {person.photoUrl ? (
          <img
            src={person.photoUrl}
            alt={person.firstName}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <User className="h-6 w-6 text-primary" />
        )}
      </div>
      <div className="text-center w-full">
        <p className="text-xs font-semibold text-foreground leading-tight truncate px-1">
          {getFullName(person)}
        </p>
        {person.birthDate && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate px-1">
            {formatDateLabel(person.birthDate)}
            {person.deathDate && ` – ${formatDateLabel(person.deathDate)}`}
          </p>
        )}
      </div>
    </button>
  );
};

export default memo(PersonTreeCard);
