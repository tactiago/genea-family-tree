import React, { useState } from 'react';
import { Person, Gender, getFullName } from '@/types/family';
import { useFamily } from '@/contexts/FamilyContext';
import { Heart, MapPin, Briefcase, Calendar, Mail, Phone, ChevronDown, ChevronUp, User, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PersonCardProps {
  person: Person;
  compact?: boolean;
  onEdit?: (person: Person) => void;
  onDelete?: (id: string) => void;
  showDetails?: boolean;
}

const genderColors: Record<string, string> = {
  male: 'bg-blue-50 border-blue-200 text-blue-700',
  female: 'bg-pink-50 border-pink-200 text-pink-700',
  other: 'bg-purple-50 border-purple-200 text-purple-700',
};

const genderLabels: Record<string, string> = {
  male: 'Masculino',
  female: 'Feminino',
  other: 'Outro',
};

const PersonCard: React.FC<PersonCardProps> = ({ person, compact = false, onEdit, onDelete, showDetails: initialShow = false }) => {
  const [showDetails, setShowDetails] = useState(initialShow);
  const { relationships, getPerson } = useFamily();

  const spouseRels = relationships.filter(
    r => r.type === 'spouse' && (r.personId === person.id || r.relatedPersonId === person.id)
  );

  const age = person.birthDate ? (() => {
    const birth = new Date(person.birthDate);
    const end = person.deathDate ? new Date(person.deathDate) : new Date();
    return Math.floor((end.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  })() : null;

  const hasContactInfo = person.email || person.phone || person.address;
  const hasBioInfo = person.birthPlace || person.profession || person.interests || person.notes;

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-card p-3 card-shadow border border-border/50">
        <div className="h-10 w-10 rounded-full bg-green-light flex items-center justify-center overflow-hidden flex-shrink-0">
          {person.photoUrl ? (
            <img src={person.photoUrl} alt={person.firstName} className="h-full w-full object-cover" />
          ) : (
            <User className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{getFullName(person)}</p>
          {person.birthDate && (
            <p className="text-xs text-muted-foreground">{new Date(person.birthDate).getFullYear()}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card card-shadow border border-border/50 overflow-hidden transition-shadow hover:card-shadow-hover"
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 rounded-xl bg-green-light flex items-center justify-center overflow-hidden flex-shrink-0">
            {person.photoUrl ? (
              <img src={person.photoUrl} alt={person.firstName} className="h-full w-full object-cover" />
            ) : (
              <User className="h-7 w-7 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                {person.title && (
                  <span className="text-xs text-muted-foreground">{person.title}</span>
                )}
                <h3 className="font-display font-semibold text-lg text-foreground leading-tight">
                  {getFullName(person)}
                </h3>
                {person.nickname && (
                  <p className="text-sm text-muted-foreground italic">"{person.nickname}"</p>
                )}
              </div>
              <div className="flex gap-1">
                {onEdit && (
                  <button onClick={() => onEdit(person)} className="p-1.5 rounded-md hover:bg-muted transition-colors">
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(person.id)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {person.gender && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${genderColors[person.gender] || 'bg-muted'}`}>
                  {genderLabels[person.gender] || person.gender}
                </span>
              )}
              {age !== null && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {person.deathDate ? `${age} anos (†)` : `${age} anos`}
                </span>
              )}
              {person.profession && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {person.profession}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Spouse badge */}
        {spouseRels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {spouseRels.map(r => {
              const spouseId = r.personId === person.id ? r.relatedPersonId : r.personId;
              const spouse = getPerson(spouseId);
              if (!spouse) return null;
              return (
                <span key={r.id} className="text-xs bg-gold-light text-foreground px-2 py-1 rounded-full flex items-center gap-1">
                  <Heart className="h-3 w-3 text-gold" />
                  {getFullName(spouse)}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Toggle details */}
      {(hasContactInfo || hasBioInfo) && (
        <>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-center gap-1 py-2 text-xs text-muted-foreground hover:text-foreground border-t border-border/50 transition-colors"
          >
            {showDetails ? 'Menos detalhes' : 'Mais detalhes'}
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  {hasContactInfo && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</p>
                      {person.email && (
                        <p className="text-sm text-foreground flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {person.email}
                        </p>
                      )}
                      {person.phone && (
                        <p className="text-sm text-foreground flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {person.phone}
                        </p>
                      )}
                      {person.address && (
                        <p className="text-sm text-foreground flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {person.address}
                        </p>
                      )}
                    </div>
                  )}
                  {hasBioInfo && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Biografia</p>
                      {person.birthPlace && (
                        <p className="text-sm text-foreground">
                          📍 Nascimento: {person.birthPlace}
                        </p>
                      )}
                      {person.interests && (
                        <p className="text-sm text-foreground">
                          ✨ Interesses: {person.interests}
                        </p>
                      )}
                      {person.notes && (
                        <p className="text-sm text-muted-foreground italic">{person.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};

export default PersonCard;
