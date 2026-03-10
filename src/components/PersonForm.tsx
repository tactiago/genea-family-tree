import React, { useState } from 'react';
import { createEmptyPerson, Person, Gender } from '@/types/family';
import { useFamily } from '@/contexts/FamilyContext';
import { X, User, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PersonFormProps {
  person?: Person;
  onClose: () => void;
  onSave: () => void;
  linkAsParentOfId?: string;
  linkAsChildOfId?: string;
  linkAsSpouseOfId?: string;
}

type Tab = 'basic' | 'contact' | 'bio' | 'relations';

const tabs: { id: Tab; label: string }[] = [
  { id: 'basic', label: 'Básico' },
  { id: 'contact', label: 'Contato' },
  { id: 'bio', label: 'Biografia' },
  { id: 'relations', label: 'Relações' },
];

const PersonForm: React.FC<PersonFormProps> = ({
  person,
  onClose,
  onSave,
  linkAsParentOfId,
  linkAsChildOfId,
  linkAsSpouseOfId,
}) => {
  const { addPerson, updatePerson, persons, addRelationship, relationships, removeRelationship } = useFamily();
  const [tab, setTab] = useState<Tab>('basic');
  const [data, setData] = useState(person ? { ...person } : { ...createEmptyPerson() } as any);
  const [parentIds, setParentIds] = useState<string[]>(() => {
    if (!person) return [];
    return relationships
      .filter(r => r.type === 'parent' && r.personId === person.id)
      .map(r => r.relatedPersonId);
  });
  const [spouseIds, setSpouseIds] = useState<string[]>(() => {
    if (!person) return [];
    return relationships
      .filter(r => r.type === 'spouse' && (r.personId === person.id || r.relatedPersonId === person.id))
      .map(r => r.personId === person.id ? r.relatedPersonId : r.personId);
  });

  const set = (key: string, value: any) => setData((d: any) => ({ ...d, [key]: value }));

  const handleSave = () => {
    if (!data.firstName.trim()) return;
    
    let savedPerson: Person;
    if (person) {
      updatePerson(person.id, data);
      savedPerson = { ...person, ...data };
      // Update relationships - remove old, add new
      const oldRels = relationships.filter(
        r => (r.type === 'parent' && r.personId === person.id) ||
             (r.type === 'spouse' && (r.personId === person.id || r.relatedPersonId === person.id))
      );
      oldRels.forEach(r => removeRelationship(r.id));
    } else {
      savedPerson = addPerson(data);
    }

    parentIds.forEach(pid => {
      addRelationship({ personId: savedPerson.id, relatedPersonId: pid, type: 'parent' });
    });
    spouseIds.forEach(sid => {
      addRelationship({ personId: savedPerson.id, relatedPersonId: sid, type: 'spouse' });
    });

    // Linkagem rápida quando o formulário é aberto a partir dos atalhos
    // de "Adicionar pai/mãe/filho/cônjuge" na ficha de detalhes.
    if (!person) {
      if (linkAsParentOfId) {
        // Nova pessoa será pai/mãe de linkAsParentOfId
        addRelationship({
          personId: linkAsParentOfId,
          relatedPersonId: savedPerson.id,
          type: 'parent',
        });
      }
      if (linkAsChildOfId) {
        // Nova pessoa será filho(a) de linkAsChildOfId
        addRelationship({
          personId: savedPerson.id,
          relatedPersonId: linkAsChildOfId,
          type: 'parent',
        });
      }
      if (linkAsSpouseOfId) {
        addRelationship({
          personId: savedPerson.id,
          relatedPersonId: linkAsSpouseOfId,
          type: 'spouse',
        });
      }
    }

    onSave();
  };

  const otherPersons = persons.filter(p => p.id !== person?.id);

  const toggleInList = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, id: string) => {
    setList(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSingleInList = (setList: React.Dispatch<React.SetStateAction<string[]>>, id: string) => {
    setList(prev => (prev.includes(id) ? [] : [id]));
  };

  const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[90vh] bg-card rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col card-shadow"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display font-semibold text-lg text-foreground">
            {person ? `Editar ${data.firstName}` : 'Nova Pessoa'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-4 gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2.5 text-sm font-medium transition-colors relative ${
                tab === t.id
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {tab === t.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tab === 'basic' && (
            <>
              <div>
                <label className={labelClass}>Nome *</label>
                <input
                  className={inputClass}
                  placeholder="Primeiro nome"
                  value={data.firstName}
                  onChange={e => set('firstName', e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Sobrenome(s) de nascimento</label>
                  <input className={inputClass} placeholder="Sobrenome" value={data.birthLastNames} onChange={e => set('birthLastNames', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Sobrenome(s) atuais</label>
                  <input className={inputClass} placeholder="Sobrenome atual" value={data.currentLastNames} onChange={e => set('currentLastNames', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Gênero</label>
                <div className="flex gap-2">
                  {(['male', 'female'] as Gender[]).map(g => (
                    <button
                      key={g}
                      onClick={() => set('gender', data.gender === g ? '' : g)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                        data.gender === g
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {g === 'male' ? '♂ Masc.' : '♀ Fem.'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Data de nascimento</label>
                  <input type="date" className={inputClass} value={data.birthDate} onChange={e => set('birthDate', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Data de falecimento</label>
                  <input type="date" className={inputClass} value={data.deathDate} onChange={e => set('deathDate', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Apelido</label>
                  <input className={inputClass} placeholder="Apelido" value={data.nickname} onChange={e => set('nickname', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Título</label>
                  <input className={inputClass} placeholder="Dr., Prof., etc." value={data.title} onChange={e => set('title', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Tipo sanguíneo</label>
                <select
                  className={inputClass}
                  value={data.bloodType}
                  onChange={e => set('bloodType', e.target.value)}
                >
                  <option value="">Selecione...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Foto (URL)</label>
                <input className={inputClass} placeholder="https://..." value={data.photoUrl} onChange={e => set('photoUrl', e.target.value)} />
              </div>
            </>
          )}

          {tab === 'contact' && (
            <>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" className={inputClass} placeholder="email@exemplo.com" value={data.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Telefone</label>
                <input className={inputClass} placeholder="+55 11 99999-9999" value={data.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Endereço</label>
                <textarea className={inputClass + ' resize-none'} rows={3} placeholder="Endereço completo" value={data.address} onChange={e => set('address', e.target.value)} />
              </div>
            </>
          )}

          {tab === 'bio' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Local de nascimento</label>
                  <input className={inputClass} placeholder="Cidade, País" value={data.birthPlace} onChange={e => set('birthPlace', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Local de falecimento</label>
                  <input className={inputClass} placeholder="Cidade, País" value={data.deathPlace} onChange={e => set('deathPlace', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Causa da morte</label>
                <input className={inputClass} placeholder="Opcional" value={data.causeOfDeath} onChange={e => set('causeOfDeath', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Profissão</label>
                <input className={inputClass} placeholder="Profissão" value={data.profession} onChange={e => set('profession', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Interesses</label>
                <input className={inputClass} placeholder="Hobbies, atividades..." value={data.interests} onChange={e => set('interests', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Notas gerais</label>
                <textarea className={inputClass + ' resize-none'} rows={4} placeholder="Anotações sobre esta pessoa..." value={data.notes} onChange={e => set('notes', e.target.value)} />
              </div>
            </>
          )}

          {tab === 'relations' && (
            <>
              {otherPersons.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Adicione mais pessoas para criar relações.</p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Pais/Mães</p>
                    <div className="space-y-1.5">
                      {otherPersons.map(p => (
                        <button
                          key={p.id}
                          onClick={() => toggleInList(parentIds, setParentIds, p.id)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left text-sm transition-all border ${
                            parentIds.includes(p.id)
                              ? 'bg-primary/10 border-primary/30 text-foreground'
                              : 'bg-background border-border text-muted-foreground hover:border-primary/20'
                          }`}
                        >
                          <div className="h-8 w-8 rounded-full bg-green-light flex items-center justify-center flex-shrink-0">
                            {p.photoUrl ? (
                              <img src={p.photoUrl} alt="" className="h-full w-full rounded-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <span className="flex-1">{p.firstName} {p.currentLastNames || p.birthLastNames}</span>
                          {parentIds.includes(p.id) && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Pai/Mãe</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Cônjuge(s)</p>
                    <div className="space-y-1.5">
                      {otherPersons.map(p => (
                        <button
                          key={p.id}
                          onClick={() => toggleSingleInList(setSpouseIds, p.id)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left text-sm transition-all border ${
                            spouseIds.includes(p.id)
                              ? 'bg-gold-light border-gold/30 text-foreground'
                              : 'bg-background border-border text-muted-foreground hover:border-gold/20'
                          }`}
                        >
                          <div className="h-8 w-8 rounded-full bg-gold-light flex items-center justify-center flex-shrink-0">
                            {p.photoUrl ? (
                              <img src={p.photoUrl} alt="" className="h-full w-full rounded-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User className="h-4 w-4 text-gold" />
                            )}
                          </div>
                          <span className="flex-1">{p.firstName} {p.currentLastNames || p.birthLastNames}</span>
                          {spouseIds.includes(p.id) && <span className="text-xs bg-gold text-foreground px-2 py-0.5 rounded-full">Cônjuge</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!data.firstName.trim()}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {person ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PersonForm;
