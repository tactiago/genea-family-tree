export type Gender = 'male' | 'female' | '';

export type RelationshipType = 
  | 'parent' 
  | 'spouse' 
  | 'godparent' 
  | 'tutor' 
  | 'sibling' 
  | 'other';

export interface Person {
  id: string;
  // Basic
  firstName: string;
  birthLastNames: string;
  currentLastNames: string;
  nickname: string;
  title: string;
  birthDate: string;
  deathDate: string;
  gender: Gender;
  bloodType: string;
  photoUrl: string;
  // Contact
  email: string;
  phone: string;
  address: string;
  // Bio
  birthPlace: string;
  deathPlace: string;
  causeOfDeath: string;
  profession: string;
  interests: string;
  notes: string;
  // Meta
  createdAt: string;
}

export interface Relationship {
  id: string;
  personId: string;
  relatedPersonId: string;
  type: RelationshipType;
  label?: string; // for 'other' type
}

export interface FamilyState {
  persons: Person[];
  relationships: Relationship[];
}

export const createEmptyPerson = (): Omit<Person, 'id' | 'createdAt'> => ({
  firstName: '',
  birthLastNames: '',
  currentLastNames: '',
  nickname: '',
  title: '',
  birthDate: '',
  deathDate: '',
  gender: '',
  bloodType: '',
  photoUrl: '',
  email: '',
  phone: '',
  address: '',
  birthPlace: '',
  deathPlace: '',
  causeOfDeath: '',
  profession: '',
  interests: '',
  notes: '',
});

export const getFullName = (person: Person): string => {
  const parts = [person.firstName, person.currentLastNames || person.birthLastNames].filter(Boolean);
  return parts.join(' ') || 'Sem nome';
};

export const getDisplayName = (person: Person): string => {
  if (person.nickname) return person.nickname;
  return person.firstName || 'Sem nome';
};

export const getParents = (personId: string, relationships: Relationship[]): string[] => {
  return relationships
    .filter(r => r.type === 'parent' && r.personId === personId)
    .map(r => r.relatedPersonId);
};

export const getChildren = (personId: string, relationships: Relationship[]): string[] => {
  return relationships
    .filter(r => r.type === 'parent' && r.relatedPersonId === personId)
    .map(r => r.personId);
};

export const getSpouses = (personId: string, relationships: Relationship[]): string[] => {
  return relationships
    .filter(r => r.type === 'spouse' && (r.personId === personId || r.relatedPersonId === personId))
    .map(r => r.personId === personId ? r.relatedPersonId : r.personId);
};

export const getRootPersons = (persons: Person[], relationships: Relationship[]): Person[] => {
  return persons.filter(p => {
    const parents = getParents(p.id, relationships);
    return parents.length === 0;
  });
};
