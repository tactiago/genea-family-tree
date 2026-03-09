import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Person, Relationship, FamilyState } from '@/types/family';

interface FamilyContextType extends FamilyState {
  addPerson: (person: Omit<Person, 'id' | 'createdAt'>) => Person;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  getPerson: (id: string) => Person | undefined;
  addRelationship: (rel: Omit<Relationship, 'id'>) => void;
  removeRelationship: (id: string) => void;
  getRelationshipsForPerson: (personId: string) => Relationship[];
}

const FamilyContext = createContext<FamilyContextType | null>(null);

const STORAGE_KEY = 'genea-family-data';

const loadState = (): FamilyState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { persons: [], relationships: [] };
};

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FamilyState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addPerson = useCallback((data: Omit<Person, 'id' | 'createdAt'>): Person => {
    const person: Person = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setState(s => ({ ...s, persons: [...s.persons, person] }));
    return person;
  }, []);

  const updatePerson = useCallback((id: string, updates: Partial<Person>) => {
    setState(s => ({
      ...s,
      persons: s.persons.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, []);

  const deletePerson = useCallback((id: string) => {
    setState(s => ({
      persons: s.persons.filter(p => p.id !== id),
      relationships: s.relationships.filter(r => r.personId !== id && r.relatedPersonId !== id),
    }));
  }, []);

  const getPerson = useCallback((id: string) => state.persons.find(p => p.id === id), [state.persons]);

  const addRelationship = useCallback((rel: Omit<Relationship, 'id'>) => {
    const relationship: Relationship = { ...rel, id: crypto.randomUUID() };
    setState(s => ({ ...s, relationships: [...s.relationships, relationship] }));
  }, []);

  const removeRelationship = useCallback((id: string) => {
    setState(s => ({ ...s, relationships: s.relationships.filter(r => r.id !== id) }));
  }, []);

  const getRelationshipsForPerson = useCallback(
    (personId: string) => state.relationships.filter(r => r.personId === personId || r.relatedPersonId === personId),
    [state.relationships]
  );

  return (
    <FamilyContext.Provider value={{
      ...state,
      addPerson, updatePerson, deletePerson, getPerson,
      addRelationship, removeRelationship, getRelationshipsForPerson,
    }}>
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider');
  return ctx;
};
