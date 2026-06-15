import { Person } from '@/types/family';

export type OrganogramFieldId =
  | 'birthDate'
  | 'deathDate'
  | 'age'
  | 'profession'
  | 'nickname'
  | 'birthPlace'
  | 'deathPlace'
  | 'causeOfDeath';

export interface OrganogramFieldDef {
  id: OrganogramFieldId;
  label: string;
  getValue: (person: Person, age: number | null) => string | null;
}

const MONTHS_PT_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const;

export const formatOrganogramDate = (raw: string): string => {
  if (!raw) return '';
  const [year, month, day] = raw.split('-');
  if (!year) return raw;
  const monthIndex = Number(month || '1') - 1;
  const monthLabel = MONTHS_PT_SHORT[monthIndex] ?? month ?? '';
  return day ? `${Number(day)} ${monthLabel} ${year}` : `${monthLabel} ${year}`;
};

const parseYMD = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
};

export const calculateAge = (birthDate: string, deathDate?: string | null): number | null => {
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

export const ORGANOGRAM_FIELDS: OrganogramFieldDef[] = [
  {
    id: 'birthDate',
    label: 'Data de nascimento',
    getValue: (p) => (p.birthDate ? formatOrganogramDate(p.birthDate) : null),
  },
  {
    id: 'deathDate',
    label: 'Data de falecimento',
    getValue: (p) => (p.deathDate ? formatOrganogramDate(p.deathDate) : null),
  },
  {
    id: 'age',
    label: 'Idade',
    getValue: (p, age) => {
      if (age === null) return null;
      return p.deathDate ? `${age} anos (†)` : `${age} anos`;
    },
  },
  {
    id: 'profession',
    label: 'Profissão',
    getValue: (p) => p.profession || null,
  },
  {
    id: 'nickname',
    label: 'Apelido',
    getValue: (p) => p.nickname || null,
  },
  {
    id: 'birthPlace',
    label: 'Local de nascimento',
    getValue: (p) => p.birthPlace || null,
  },
  {
    id: 'deathPlace',
    label: 'Local de falecimento',
    getValue: (p) => p.deathPlace || null,
  },
  {
    id: 'causeOfDeath',
    label: 'Causa da morte',
    getValue: (p) => p.causeOfDeath || null,
  },
];

export const ORGANOGRAM_FIELD_STORAGE_KEY = 'organogramVisibleFields';
export const ORGANOGRAM_ROOT_STORAGE_KEY = 'organogramRootPersonId';

export const DEFAULT_VISIBLE_FIELDS: OrganogramFieldId[] = [];

export const loadVisibleFields = (): Set<OrganogramFieldId> => {
  if (typeof window === 'undefined') return new Set(DEFAULT_VISIBLE_FIELDS);
  try {
    const raw = window.localStorage.getItem(ORGANOGRAM_FIELD_STORAGE_KEY);
    if (!raw) return new Set(DEFAULT_VISIBLE_FIELDS);
    const parsed = JSON.parse(raw) as OrganogramFieldId[];
    return new Set(parsed.filter((id) => ORGANOGRAM_FIELDS.some((f) => f.id === id)));
  } catch {
    return new Set(DEFAULT_VISIBLE_FIELDS);
  }
};

export const saveVisibleFields = (fields: Set<OrganogramFieldId>) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ORGANOGRAM_FIELD_STORAGE_KEY, JSON.stringify([...fields]));
};

export const loadRootPersonId = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(ORGANOGRAM_ROOT_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const saveRootPersonId = (personId: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ORGANOGRAM_ROOT_STORAGE_KEY, personId);
};

export const getPersonFieldLines = (
  person: Person,
  visibleFields: Set<OrganogramFieldId>,
): Array<{ label: string; value: string }> => {
  const age = person.birthDate ? calculateAge(person.birthDate, person.deathDate || null) : null;

  return ORGANOGRAM_FIELDS.filter((f) => visibleFields.has(f.id))
    .map((f) => {
      const value = f.getValue(person, age);
      return value ? { label: f.label, value } : null;
    })
    .filter((line): line is { label: string; value: string } => Boolean(line));
};
