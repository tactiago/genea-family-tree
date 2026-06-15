import { describe, it, expect } from 'vitest';
import { layoutPedigree } from './pedigree-layout';
import type { Person, Relationship } from '@/types/family';

const persons: Person[] = [
  { id: 'gp', firstName: 'Avô', birthLastNames: '', currentLastNames: '', nickname: '', title: '', birthDate: '', deathDate: '', gender: 'male', bloodType: '', documentNumber: '', photoUrl: '', email: '', phone: '', address: '', birthPlace: '', deathPlace: '', causeOfDeath: '', profession: '', interests: '', notes: '', createdAt: '' },
  { id: 'p1', firstName: 'Pai', birthLastNames: '', currentLastNames: '', nickname: '', title: '', birthDate: '', deathDate: '', gender: 'male', bloodType: '', documentNumber: '', photoUrl: '', email: '', phone: '', address: '', birthPlace: '', deathPlace: '', causeOfDeath: '', profession: '', interests: '', notes: '', createdAt: '' },
  { id: 'p2', firstName: 'Mãe', birthLastNames: '', currentLastNames: '', nickname: '', title: '', birthDate: '', deathDate: '', gender: 'female', bloodType: '', documentNumber: '', photoUrl: '', email: '', phone: '', address: '', birthPlace: '', deathPlace: '', causeOfDeath: '', profession: '', interests: '', notes: '', createdAt: '' },
  { id: 'c1', firstName: 'Filho', birthLastNames: '', currentLastNames: '', nickname: '', title: '', birthDate: '', deathDate: '', gender: 'male', bloodType: '', documentNumber: '', photoUrl: '', email: '', phone: '', address: '', birthPlace: '', deathPlace: '', causeOfDeath: '', profession: '', interests: '', notes: '', createdAt: '' },
];

const relationships: Relationship[] = [
  { id: 'r1', personId: 'p1', relatedPersonId: 'p2', type: 'spouse' },
  { id: 'r2', personId: 'c1', relatedPersonId: 'p1', type: 'parent' },
  { id: 'r3', personId: 'c1', relatedPersonId: 'p2', type: 'parent' },
  { id: 'r4', personId: 'p1', relatedPersonId: 'gp', type: 'parent' },
];

describe('layoutPedigree', () => {
  it('places parents above children', () => {
    const visible = new Set(persons.map((p) => p.id));
    const layout = layoutPedigree(persons, relationships, visible);

    const gp = layout.positions.get('gp')!;
    const p1 = layout.positions.get('p1')!;
    const c1 = layout.positions.get('c1')!;

    expect(gp.y).toBeLessThan(p1.y);
    expect(p1.y).toBeLessThan(c1.y);
  });

  it('keeps spouses on the same row', () => {
    const visible = new Set(persons.map((p) => p.id));
    const layout = layoutPedigree(persons, relationships, visible);

    const p1 = layout.positions.get('p1')!;
    const p2 = layout.positions.get('p2')!;

    expect(p1.y).toBe(p2.y);
    expect(Math.abs(p1.x - p2.x)).toBeGreaterThan(0);
  });

  it('centers parents above their child', () => {
    const visible = new Set(persons.map((p) => p.id));
    const layout = layoutPedigree(persons, relationships, visible);

    const p1 = layout.positions.get('p1')!;
    const p2 = layout.positions.get('p2')!;
    const c1 = layout.positions.get('c1')!;

    const parentsCenter = (p1.x + p1.width / 2 + p2.x + p2.width / 2) / 2;
    const childCenter = c1.x + c1.width / 2;

    expect(Math.abs(parentsCenter - childCenter)).toBeLessThan(20);
  });
});
