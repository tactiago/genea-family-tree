import React, { useState, useRef, ChangeEvent, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFamily } from '@/contexts/FamilyContext';
import { Person, getFullName, FamilyState } from '@/types/family';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EmptyStateLanding from '@/components/EmptyStateLanding';
import FamilyTree from '@/components/FamilyTree';
import PersonCard from '@/components/PersonCard';
import PersonForm from '@/components/PersonForm';
import FamilyTimeline from '@/components/FamilyTimeline';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutGrid, Clock, TreePine } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type View = 'tree' | 'list' | 'timeline';

type RelationshipKind = 'father' | 'mother' | 'child' | 'spouse';

type LocationState = { action?: 'add' | 'import' | 'example' };

const TreePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { persons, relationships, deletePerson, addRelationship, importState } = useFamily();
  const [showForm, setShowForm] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | undefined>();
  const [view, setView] = useState<View>('tree');
  const [selectedPerson, setSelectedPerson] = useState<Person | undefined>();
  const [linkAsParentOfId, setLinkAsParentOfId] = useState<string | undefined>();
  const [linkAsChildOfId, setLinkAsChildOfId] = useState<string | undefined>();
  const [linkAsSpouseOfId, setLinkAsSpouseOfId] = useState<string | undefined>();
  const [relationshipKind, setRelationshipKind] = useState<RelationshipKind | null>(null);
  const [relationshipTarget, setRelationshipTarget] = useState<Person | undefined>();
  const [existingPersonId, setExistingPersonId] = useState<string | undefined>();
  const [showStartFreshDialog, setShowStartFreshDialog] = useState(false);
  const [showViewExampleDialog, setShowViewExampleDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadExampleTree = useCallback(async () => {
    try {
      const res = await fetch('/potters-family-tree.json');
      if (!res.ok) throw new Error('Falha ao carregar o exemplo');
      const parsed = await res.json();
      const importedPersons = Array.isArray(parsed.persons) ? parsed.persons : [];
      const importedRelationships = Array.isArray(parsed.relationships) ? parsed.relationships : [];

      if (!importedPersons.length && !importedRelationships.length) {
        alert('O arquivo de exemplo está vazio.');
        return;
      }

      importState({
        persons: importedPersons,
        relationships: importedRelationships,
      });
    } catch (error) {
      console.error('Erro ao carregar exemplo:', error);
      alert('Não foi possível carregar o exemplo. Tente novamente.');
    }
  }, [importState]);

  // Executa ação vinda da landing page
  useEffect(() => {
    const state = location.state as LocationState | null;
    const action = state?.action;
    if (action === 'add') {
      navigate(location.pathname, { replace: true, state: {} });
      setShowForm(true);
    } else if (action === 'import') {
      navigate(location.pathname, { replace: true, state: {} });
      fileInputRef.current?.click();
    } else if (action === 'example') {
      navigate(location.pathname, { replace: true, state: {} }); // Limpa state para não re-executar quando persons mudar
      if (persons.length > 0) {
        setShowViewExampleDialog(true);
      } else {
        loadExampleTree();
      }
    }
  }, [location.state, location.pathname, persons.length, loadExampleTree, navigate]);

  const handleViewExample = () => {
    if (persons.length > 0) {
      setShowViewExampleDialog(true);
    } else {
      loadExampleTree();
    }
  };

  const handleConfirmViewExample = () => {
    setShowViewExampleDialog(false);
    loadExampleTree();
  };

  const handleExportJson = () => {
    const data: FamilyState & { exportedAt: string; version: number } = {
      persons,
      relationships,
      exportedAt: new Date().toISOString(),
      version: 1,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'genea-family-tree.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleTriggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleImportJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const importedPersons = Array.isArray(parsed.persons) ? parsed.persons : [];
      const importedRelationships = Array.isArray(parsed.relationships) ? parsed.relationships : [];

      if (!importedPersons.length && !importedRelationships.length) {
        alert('Arquivo JSON inválido ou vazio.');
        return;
      }

      importState({
        persons: importedPersons,
        relationships: importedRelationships,
      });

      alert('Árvore genealógica importada com sucesso!');
    } catch (error) {
      console.error('Erro ao importar JSON da árvore:', error);
      alert('Não foi possível importar o arquivo JSON. Verifique se o arquivo é válido.');
    } finally {
      event.target.value = '';
    }
  };

  const handleAddPerson = () => {
    setEditPerson(undefined);
    setLinkAsParentOfId(undefined);
    setLinkAsChildOfId(undefined);
    setLinkAsSpouseOfId(undefined);
    setShowForm(true);
  };

  const handleEditPerson = (person: Person) => {
    setEditPerson(person);
    setLinkAsParentOfId(undefined);
    setLinkAsChildOfId(undefined);
    setLinkAsSpouseOfId(undefined);
    setShowForm(true);
  };

  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person);
  };

  const handleAddFather = (child: Person) => {
    setRelationshipKind('father');
    setRelationshipTarget(child);
    setExistingPersonId(undefined);
  };

  const handleAddMother = (child: Person) => {
    setRelationshipKind('mother');
    setRelationshipTarget(child);
    setExistingPersonId(undefined);
  };

  const handleAddChild = (parent: Person) => {
    setRelationshipKind('child');
    setRelationshipTarget(parent);
    setExistingPersonId(undefined);
  };

  const handleAddSpouse = (person: Person) => {
    setRelationshipKind('spouse');
    setRelationshipTarget(person);
    setExistingPersonId(undefined);
  };

  const closeRelationshipChooser = () => {
    setRelationshipKind(null);
    setRelationshipTarget(undefined);
    setExistingPersonId(undefined);
  };

  const handleCreateNewFromRelationship = () => {
    if (!relationshipKind || !relationshipTarget) return;

    setSelectedPerson(undefined);
    setEditPerson(undefined);
    setLinkAsParentOfId(undefined);
    setLinkAsChildOfId(undefined);
    setLinkAsSpouseOfId(undefined);

    if (relationshipKind === 'father' || relationshipKind === 'mother') {
      setLinkAsParentOfId(relationshipTarget.id);
    } else if (relationshipKind === 'child') {
      setLinkAsChildOfId(relationshipTarget.id);
    } else if (relationshipKind === 'spouse') {
      setLinkAsSpouseOfId(relationshipTarget.id);
    }

    closeRelationshipChooser();
    setShowForm(true);
  };

  const handleLinkExistingFromRelationship = () => {
    if (!relationshipKind || !relationshipTarget || !existingPersonId) return;

    if (relationshipKind === 'father' || relationshipKind === 'mother') {
      addRelationship({
        personId: relationshipTarget.id,
        relatedPersonId: existingPersonId,
        type: 'parent',
      });
    } else if (relationshipKind === 'child') {
      addRelationship({
        personId: existingPersonId,
        relatedPersonId: relationshipTarget.id,
        type: 'parent',
      });
    } else if (relationshipKind === 'spouse') {
      addRelationship({
        personId: existingPersonId,
        relatedPersonId: relationshipTarget.id,
        type: 'spouse',
      });
    }

    closeRelationshipChooser();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta pessoa?')) {
      deletePerson(id);
      if (selectedPerson?.id === id) setSelectedPerson(undefined);
    }
  };

  const handleStartFresh = () => {
    setShowStartFreshDialog(true);
  };

  const handleConfirmStartFresh = () => {
    importState({ persons: [], relationships: [] });
    setSelectedPerson(undefined);
    setShowStartFreshDialog(false);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header
        onAddPerson={handleAddPerson}
        personCount={persons.length}
        onExport={handleExportJson}
        onImport={handleTriggerImport}
        onStartFresh={handleStartFresh}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportJson}
      />

      {/* View toggle - fixo entre header e conteúdo */}
      {persons.length > 0 && (
        <div className="container py-4 shrink-0">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-full sm:w-fit">
            <button
              onClick={() => setView('tree')}
              className={`flex items-center justify-center w-full h-full sm:w-fit gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'tree'
                  ? 'bg-card text-foreground card-shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TreePine className="h-4 w-4" />
              Árvore
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center justify-center w-full h-full sm:w-fit gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'list'
                  ? 'bg-card text-foreground card-shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Lista
            </button>
            <button
              onClick={() => setView('timeline')}
              className={`flex items-center justify-center w-full h-full sm:w-fit gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'timeline'
                  ? 'bg-card text-foreground card-shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock className="h-4 w-4" />
              Linha do tempo
            </button>
          </div>
        </div>
      )}

      {/* Área rolável - apenas o conteúdo (tree/list/timeline), tabs ficam visíveis */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-14 sm:pb-20">
      {/* Content */}
      <main className={`${persons.length === 0 ? '' : 'container'}`}>
        {persons.length === 0 ? (
          <EmptyStateLanding
            onAddPerson={handleAddPerson}
            onImport={handleTriggerImport}
            onViewExample={handleViewExample}
          />
        ) : (
          <>
            {view === 'tree' && <FamilyTree onSelectPerson={handleSelectPerson} />}
            {view === 'list' && (
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
            {view === 'timeline' && <FamilyTimeline onSelectPerson={handleSelectPerson} />}
          </>
        )}
      </main>
      </div>

      <Footer />

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
                onAddFather={handleAddFather}
                onAddMother={handleAddMother}
                onAddChild={handleAddChild}
                onAddSpouse={handleAddSpouse}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Relationship chooser */}
      <AnimatePresence>
        {relationshipKind && relationshipTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm"
            onClick={closeRelationshipChooser}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full sm:max-w-md max-h-[80vh] bg-card rounded-t-2xl sm:rounded-2xl overflow-hidden card-shadow flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Escolher pessoa
                  </p>
                  <h2 className="font-display font-semibold text-base text-foreground mt-1">
                    {relationshipKind === 'father' && `Adicionar pai de ${getFullName(relationshipTarget)}`}
                    {relationshipKind === 'mother' && `Adicionar mãe de ${getFullName(relationshipTarget)}`}
                    {relationshipKind === 'child' && `Adicionar filho(a) de ${getFullName(relationshipTarget)}`}
                    {relationshipKind === 'spouse' && `Adicionar cônjuge de ${getFullName(relationshipTarget)}`}
                  </h2>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(() => {
                  const targetId = relationshipTarget.id;

                  const existingParentIds = relationships
                    .filter(r => r.type === 'parent' && r.personId === targetId)
                    .map(r => r.relatedPersonId);
                  const existingChildIds = relationships
                    .filter(r => r.type === 'parent' && r.relatedPersonId === targetId)
                    .map(r => r.personId);
                  const existingSpouseIds = relationships
                    .filter(
                      r =>
                        r.type === 'spouse' &&
                        (r.personId === targetId || r.relatedPersonId === targetId),
                    )
                    .map(r => (r.personId === targetId ? r.relatedPersonId : r.personId));

                  let available: Person[] = persons.filter(p => p.id !== targetId);

                  if (relationshipKind === 'father' || relationshipKind === 'mother') {
                    available = available.filter(p => !existingParentIds.includes(p.id));
                  } else if (relationshipKind === 'child') {
                    available = available.filter(p => !existingChildIds.includes(p.id));
                  } else if (relationshipKind === 'spouse') {
                    available = available.filter(p => !existingSpouseIds.includes(p.id));
                  }

                  available = available.slice().sort((a, b) =>
                    getFullName(a).localeCompare(getFullName(b), 'pt-BR', { sensitivity: 'base' }),
                  );

                  if (available.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground">
                        Não há outras pessoas disponíveis para selecionar. Você pode criar uma nova pessoa.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-1.5">
                      {available.map(p => {
                        const selected = existingPersonId === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setExistingPersonId(p.id)}
                            className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                              selected
                                ? 'border-primary bg-primary/5 text-foreground'
                                : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                            }`}
                          >
                            <div className="h-8 w-8 rounded-full bg-green-light flex items-center justify-center overflow-hidden flex-shrink-0">
                              {p.photoUrl ? (
                                <img
                                  src={p.photoUrl}
                                  alt={p.firstName}
                                  className="h-full w-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span className="text-xs font-semibold text-primary">
                                  {p.firstName.charAt(0) || '?'}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-xs text-foreground truncate">
                                {getFullName(p)}
                              </p>
                              {p.birthDate && (
                                <p className="text-[11px] text-muted-foreground truncate">
                                  Nasc. {p.birthDate.split('-')[0]}
                                </p>
                              )}
                            </div>
                            <div
                              className={`h-3 w-3 rounded-full border ${
                                selected ? 'border-primary bg-primary' : 'border-border'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div className="p-4 border-t border-border flex gap-3">
                <button
                  type="button"
                  onClick={closeRelationshipChooser}
                  className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewFromRelationship}
                  className="flex-1 py-2.5 rounded-lg border border-primary text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                >
                  Criar nova pessoa
                </button>
                <button
                  type="button"
                  onClick={handleLinkExistingFromRelationship}
                  disabled={!existingPersonId}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Usar selecionada
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <PersonForm
            person={editPerson}
            onClose={() => {
              setShowForm(false);
              setLinkAsParentOfId(undefined);
              setLinkAsChildOfId(undefined);
              setLinkAsSpouseOfId(undefined);
            }}
            onSave={() => {
              setShowForm(false);
              setLinkAsParentOfId(undefined);
              setLinkAsChildOfId(undefined);
              setLinkAsSpouseOfId(undefined);
            }}
            linkAsParentOfId={editPerson ? undefined : linkAsParentOfId}
            linkAsChildOfId={editPerson ? undefined : linkAsChildOfId}
            linkAsSpouseOfId={editPerson ? undefined : linkAsSpouseOfId}
          />
        )}
      </AnimatePresence>

      {/* Começar do zero - confirmação */}
      <AlertDialog open={showStartFreshDialog} onOpenChange={setShowStartFreshDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Começar uma nova árvore?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os dados atuais serão apagados permanentemente. Recomendamos exportar sua árvore
              em JSON antes de continuar, para não perder nenhuma informação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <button
              type="button"
              onClick={() => {
                handleExportJson();
              }}
              className="inline-flex h-10 items-center justify-center rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              Exportar antes
            </button>
            <AlertDialogAction
              onClick={handleConfirmStartFresh}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, começar do zero
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ver exemplo com árvore existente - confirmação */}
      <AlertDialog open={showViewExampleDialog} onOpenChange={setShowViewExampleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Carregar exemplo da família Potter?</AlertDialogTitle>
            <AlertDialogDescription>
              Você já tem uma árvore salva. Os dados atuais serão substituídos pelo exemplo.
              Recomendamos exportar sua árvore em JSON antes de continuar, para não perder nenhuma informação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <button
              type="button"
              onClick={() => {
                handleExportJson();
              }}
              className="inline-flex h-10 items-center justify-center rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              Exportar antes
            </button>
            <AlertDialogAction
              onClick={handleConfirmViewExample}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, carregar exemplo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TreePage;
