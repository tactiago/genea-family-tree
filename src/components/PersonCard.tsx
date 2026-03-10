import React, { useState } from 'react';
import { Person, Gender, getFullName, getParents, getChildren } from '@/types/family';
import { useFamily } from '@/contexts/FamilyContext';
import { Heart, MapPin, Briefcase, Calendar, Mail, Phone, ChevronDown, ChevronUp, User, Pencil, Trash2, Plus, Droplet, Mars, Venus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PersonCardProps {
  person: Person;
  compact?: boolean;
  onEdit?: (person: Person) => void;
  onDelete?: (id: string) => void;
  showDetails?: boolean;
  onAddFather?: (child: Person) => void;
  onAddMother?: (child: Person) => void;
  onAddChild?: (parent: Person) => void;
  onAddSpouse?: (person: Person) => void;
}

const genderColors: Record<string, string> = {
  male: 'bg-blue-50 border-blue-200 text-blue-700',
  female: 'bg-pink-50 border-pink-200 text-pink-700',
};

const parseYMD = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return { year, month, day };
};

const calculateAge = (birthDate: string, deathDate?: string | null): number | null => {
  const birth = parseYMD(birthDate);
  if (!birth) return null;

  let ref = deathDate ? parseYMD(deathDate) : null;
  if (!ref) {
    const now = new Date();
    ref = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  }
  if (!ref) return null;

  let age = ref.year - birth.year;
  const beforeBirthday = ref.month < birth.month || (ref.month === birth.month && ref.day < birth.day);
  if (beforeBirthday) age -= 1;
  return age;
};

const PersonCard: React.FC<PersonCardProps> = ({
  person,
  compact = false,
  onEdit,
  onDelete,
  showDetails: initialShow = false,
  onAddFather,
  onAddMother,
  onAddChild,
  onAddSpouse,
}) => {
  const [showDetails, setShowDetails] = useState(initialShow);
  const { relationships, getPerson } = useFamily();

  const spouseRels = relationships.filter(
    r => r.type === 'spouse' && (r.personId === person.id || r.relatedPersonId === person.id)
  );

  const parentIds = getParents(person.id, relationships);
  const parents = parentIds
    .map(pid => getPerson(pid))
    .filter((p): p is Person => Boolean(p));

  const father = parents.find(p => p.gender === 'male');
  const mother = parents.find(p => p.gender === 'female');
  const otherParents = parents.filter(
    p => p.id !== father?.id && p.id !== mother?.id,
  );

  const childrenIds = getChildren(person.id, relationships);
  const children = childrenIds
    .map(cid => getPerson(cid))
    .filter((p): p is Person => Boolean(p));

  const age = person.birthDate ? calculateAge(person.birthDate, person.deathDate || null) : null;

  const hasContactInfo = person.email || person.phone || person.address;
  const hasBioInfo = person.birthPlace || person.profession || person.interests || person.notes;

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-card p-3 card-shadow border border-border/50">
        <div className="h-10 w-10 rounded-full bg-green-light flex items-center justify-center overflow-hidden flex-shrink-0">
          {person.photoUrl ? (
            <img src={person.photoUrl} alt={person.firstName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <User className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{getFullName(person)}</p>
          {person.birthDate && (
            <p className="text-xs text-muted-foreground">{person.birthDate.split('-')[0]}</p>
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
              <img src={person.photoUrl} alt={person.firstName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="h-7 w-7 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-end gap-1">
                  {person.title && (
                    <span className="text-xs text-muted-foreground">{person.title}</span>
                  )}
                  <h3 className="font-display font-semibold text-lg text-foreground leading-tight">
                    {getFullName(person)}
                  </h3>
                </div>
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
                <span className={`inline-flex items-center justify-center p-1 rounded-full border text-base leading-none ${genderColors[person.gender] || 'bg-muted'}`} title={person.gender === 'male' ? 'Masculino' : 'Feminino'}>
                  {person.gender === 'male' ? <Mars className="h-3 w-3" /> : <Venus className="h-3 w-3" />}
                </span>
              )}
              {person.bloodType && (
                <span className="text-xs px-2 py-0.5 rounded-full border bg-red-50 border-red-200 text-red-700 inline-flex items-center gap-1">
                  <Droplet className="h-3 w-3 text-red-600" />
                  {person.bloodType}
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
        {(spouseRels.length > 0 || (onAddSpouse && spouseRels.length === 0)) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {spouseRels.map(r => {
              const spouseId = r.personId === person.id ? r.relatedPersonId : r.personId;
              const spouse = getPerson(spouseId);
              if (!spouse) return null;
              return (
                <span
                  key={r.id}
                  className="text-xs bg-gold-light text-foreground px-2 py-1 rounded-full flex items-center gap-1"
                >
                  <Heart className="h-3 w-3 text-gold" />
                  {getFullName(spouse)}
                </span>
              );
            })}

            {onAddSpouse && spouseRels.length === 0 && (
              <button
                type="button"
                onClick={() => onAddSpouse(person)}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-gold/60 bg-gold-light/40 px-2.5 py-1 text-[11px] text-foreground hover:border-gold hover:bg-gold-light/70 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Adicionar cônjuge
              </button>
            )}
          </div>
        )}

        {/* Parents and children */}
        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pais
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {father && (
                <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/40 px-3 py-2">
                  <div className="h-8 w-8 rounded-full bg-green-light flex items-center justify-center overflow-hidden flex-shrink-0">
                    {father.photoUrl ? (
                      <img src={father.photoUrl} alt={father.firstName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {getFullName(father)}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Pai
                    </p>
                  </div>
                </div>
              )}

              {mother && (
                <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/40 px-3 py-2">
                  <div className="h-8 w-8 rounded-full bg-green-light flex items-center justify-center overflow-hidden flex-shrink-0">
                    {mother.photoUrl ? (
                      <img src={mother.photoUrl} alt={mother.firstName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {getFullName(mother)}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Mãe
                    </p>
                  </div>
                </div>
              )}

              {!father && onAddFather && (
                <button
                  type="button"
                  onClick={() => onAddFather(person)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-background px-3 py-2 text-xs text-muted-foreground hover:border-primary/70 hover:text-foreground transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar pai
                </button>
              )}

              {!mother && onAddMother && (
                <button
                  type="button"
                  onClick={() => onAddMother(person)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-background px-3 py-2 text-xs text-muted-foreground hover:border-primary/70 hover:text-foreground transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar mãe
                </button>
              )}

              {otherParents.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2"
                >
                  <div className="h-8 w-8 rounded-full bg-green-light flex items-center justify-center overflow-hidden flex-shrink-0">
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt={p.firstName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {getFullName(p)}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Responsável
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Filhos
            </p>
            <div className="flex flex-wrap gap-2">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1"
                >
                  <div className="h-7 w-7 rounded-full bg-green-light flex items-center justify-center overflow-hidden flex-shrink-0">
                    {child.photoUrl ? (
                      <img src={child.photoUrl} alt={child.firstName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-primary" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-foreground max-w-[140px] truncate">
                    {getFullName(child)}
                  </span>
                </div>
              ))}

              {onAddChild && (
                <button
                  type="button"
                  onClick={() => onAddChild(person)}
                  className="inline-flex items-center gap-2 rounded-full border border-dashed border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground hover:border-primary/70 hover:text-foreground transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar filho
                </button>
              )}
            </div>
          </div>
        </div>
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
