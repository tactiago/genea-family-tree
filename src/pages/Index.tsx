import React, { useState } from 'react';
import { useFamily } from '@/contexts/FamilyContext';
import { Person } from '@/types/family';
import Header from '@/components/Header';
import FamilyTree from '@/components/FamilyTree';
import PersonCard from '@/components/PersonCard';
import PersonForm from '@/components/PersonForm';
import { AnimatePresence, motion } from 'framer-motion';
import { TreesIcon, Users, LayoutGrid } from 'lucide-react';

type View = 'tree' | 'list';

const Index = () => {
  const { persons, deletePerson } = useFamily();
  const [showForm, setShowForm] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | undefined>();
  const [view, setView] = useState<View>('tree');
  const [selectedPerson, setSelectedPerson] = useState<Person | undefined>();

  const handleAddPerson = () => {
    setEditPerson(undefined);
    setShowForm(true);
  };

  const handleEditPerson = (person: Person) => {
    setEditPerson(person);
    setShowForm(true);
  };

  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta pessoa?')) {
      deletePerson(id);
      if (selectedPerson?.id === id) setSelectedPerson(undefined);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onAddPerson={handleAddPerson} personCount={persons.length} />

      {/* View toggle */}
      {persons.length > 0 && (
        <div className="container py-4">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
            <button
              onClick={() => setView('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'tree'
                  ? 'bg-card text-foreground card-shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TreesIcon className="h-4 w-4" />
              Árvore
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'list'
                  ? 'bg-card text-foreground card-shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Cards
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="container pb-8">
        {view === 'tree' ? (
          <FamilyTree onSelectPerson={handleSelectPerson} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {persons.map(person => (
              <PersonCard
                key={person.id}
                person={person}
                onEdit={handleEditPerson}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Selected person detail drawer */}
      <AnimatePresence>
        {selectedPerson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm"
            onClick={() => setSelectedPerson(undefined)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full sm:max-w-md max-h-[80vh] overflow-y-auto"
            >
              <PersonCard
                person={selectedPerson}
                showDetails
                onEdit={(p) => { setSelectedPerson(undefined); handleEditPerson(p); }}
                onDelete={(id) => { setSelectedPerson(undefined); handleDelete(id); }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <PersonForm
            person={editPerson}
            onClose={() => setShowForm(false)}
            onSave={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
