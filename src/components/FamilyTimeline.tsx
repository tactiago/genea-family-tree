import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Briefcase, User } from 'lucide-react';
import { useFamily } from '@/contexts/FamilyContext';
import { Person, getFullName } from '@/types/family';

interface FamilyTimelineProps {
  onSelectPerson: (person: Person) => void;
}

type TimelineEventType = 'birth' | 'death' | 'created';

interface TimelineEvent {
  id: string;
  person: Person;
  type: TimelineEventType;
  dateLabel: string;
  description: string;
  location?: string;
  accentColor: string;
  sortKey: number;
}

const MONTHS_PT_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const;

const parseDateToSortKey = (raw: string): number => {
  if (!raw) return Number.POSITIVE_INFINITY;
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d.getTime();

  const [year, month, day] = raw.split('-').map(Number);
  if (!year) return Number.POSITIVE_INFINITY;
  const safeMonth = month && month >= 1 && month <= 12 ? month - 1 : 0;
  const safeDay = day && day >= 1 && day <= 31 ? day : 1;
  return new Date(year, safeMonth, safeDay).getTime();
};

const formatDateLabel = (raw: string): string => {
  if (!raw) return '';
  const [year, month, day] = raw.split('-');
  if (!year) return raw;
  const monthIndex = Number(month || '1') - 1;
  const monthLabel = MONTHS_PT_SHORT[monthIndex] ?? month ?? '';
  return day ? `${Number(day)} ${monthLabel} ${year}` : `${monthLabel} ${year}`;
};

const FamilyTimeline: React.FC<FamilyTimelineProps> = ({ onSelectPerson }) => {
  const { persons } = useFamily();

  const events = useMemo<TimelineEvent[]>(() => {
    const result: TimelineEvent[] = [];

    persons.forEach((person) => {
      if (person.birthDate) {
        result.push({
          id: `${person.id}-birth`,
          person,
          type: 'birth',
          dateLabel: formatDateLabel(person.birthDate),
          description: `Nascimento de ${getFullName(person)}`,
          location: person.birthPlace || undefined,
          accentColor: 'from-emerald-400/90 to-emerald-500/70',
          sortKey: parseDateToSortKey(person.birthDate),
        });
      }

      if (person.deathDate) {
        result.push({
          id: `${person.id}-death`,
          person,
          type: 'death',
          dateLabel: formatDateLabel(person.deathDate),
          description: `Falecimento de ${getFullName(person)}`,
          location: person.deathPlace || undefined,
          accentColor: 'from-rose-400/90 to-rose-500/70',
          sortKey: parseDateToSortKey(person.deathDate),
        });
      }

      // Se não houver data de nascimento nem de falecimento, não incluímos na linha do tempo
    });

    return result
      .filter((e) => Number.isFinite(e.sortKey))
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [persons]);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-220px)] min-h-[420px] rounded-xl border border-border bg-card/70 px-6">
        <div className="relative mb-6">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center shadow-inner" />
          <Clock className="h-9 w-9 text-primary absolute inset-0 m-auto" />
        </div>
        <h2 className="font-display text-2xl font-semibold text-foreground mb-3 text-center">
          Linha do tempo vazia
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Preencha as datas de nascimento e falecimento das pessoas da sua família para ver a história ganhar forma
          nesta linha do tempo visual.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-220px)] min-h-[420px] rounded-xl border border-border bg-gradient-to-b from-background via-background/90 to-background overflow-hidden">
      <div className="h-full overflow-y-auto px-3 sm:px-6 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Header da timeline */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Linha do tempo
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground mt-1">
                História da família em ordem cronológica
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Veja momentos marcantes distribuídos ao longo do tempo. Clique em qualquer evento para abrir os detalhes
                da pessoa.
              </p>
            </div>
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          <div className="relative">
            <div className="relative">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  className="relative grid grid-cols-[minmax(0,0.5fr)_auto_minmax(0,2fr)] items-stretch gap-3 sm:gap-4"
                >
                  {/* Data à esquerda */}
                  <div className="flex items-center justify-end pr-2">
                    <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground text-right">
                      {event.dateLabel}
                    </p>
                  </div>

                  {/* Linha central entre data e card */}
                  <div className="flex items-stretch">
                    <div className="mx-auto h-full w-px bg-border" />
                  </div>

                  {/* Card do acontecimento à direita */}
                  <div className="flex py-2">
                    <button
                      type="button"
                      onClick={() => onSelectPerson(event.person)}
                      className="group w-full text-left"
                    >
                      <div className="relative rounded-2xl border border-border/70 bg-card/95 backdrop-blur-sm px-4 py-3 sm:px-5 sm:py-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                        <div
                          className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${
                            event.type === 'death'
                              ? 'from-rose-500/6 via-transparent to-transparent'
                              : 'from-emerald-500/6 via-transparent to-transparent'
                          } opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                        />

                        <div className="relative flex gap-3 sm:gap-4">
                          {(event.type === 'birth' || event.type === 'death') && (
                            <div className="mt-1">
                              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-muted overflow-hidden flex items-center justify-center shadow-inner">
                                {event.person.photoUrl ? (
                                  <img
                                    src={event.person.photoUrl}
                                    alt={event.person.firstName}
                                    className={`h-full w-full object-cover${
                                      event.type === 'death' ? ' filter grayscale' : ''
                                    }`}
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                    <User className="h-5 w-5 sm:h-6 sm:w-6" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="space-y-1 flex-1">
                            <p className="font-display text-sm sm:text-base font-semibold text-foreground">
                              {event.description}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
                              {event.location && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </span>
                              )}
                              {event.person.profession && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                                  <Briefcase className="h-3 w-3" />
                                  {event.person.profession}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyTimeline;

