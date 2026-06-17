import { describe, it, expect } from 'vitest';
import {
  computeOrganogramHighlight,
  getFamilyCluster,
} from './organogram-highlight';
import type { OrganogramConnectorPath } from './organogram-highlight';

const connectors: OrganogramConnectorPath[] = [
  {
    id: 'spouse-a:b',
    d: '',
    kind: 'spouse',
    personIds: ['a', 'b'],
  },
  {
    id: 'bus-p1:p2',
    d: 'M 0 0',
    kind: 'bus',
    personIds: ['p1', 'p2', 'c1', 'c2'],
  },
];

describe('getFamilyCluster', () => {
  const relationships = [
    { id: '1', personId: 'c1', relatedPersonId: 'p1', type: 'parent' as const },
    { id: '2', personId: 'c1', relatedPersonId: 'p2', type: 'parent' as const },
    { id: '3', personId: 'c1', relatedPersonId: 's1', type: 'spouse' as const },
    { id: '4', personId: 'c2', relatedPersonId: 'p1', type: 'parent' as const },
  ];
  const visible = new Set(['c1', 'p1', 'p2', 's1', 'c2']);

  it('includes spouse, parents and children', () => {
    const cluster = getFamilyCluster('c1', relationships, visible);
    expect(cluster.has('c1')).toBe(true);
    expect(cluster.has('p1')).toBe(true);
    expect(cluster.has('p2')).toBe(true);
    expect(cluster.has('s1')).toBe(true);
    expect(cluster.has('c2')).toBe(false);
  });
});

describe('computeOrganogramHighlight', () => {
  it('returns null sets when nothing is hovered', () => {
    const result = computeOrganogramHighlight({ type: 'none' }, connectors);
    expect(result.highlightedPeople).toBeNull();
    expect(result.highlightedConnectors).toBeNull();
  });

  it('highlights connector and related people on line hover', () => {
    const result = computeOrganogramHighlight(
      { type: 'connector', connectorId: 'bus-p1:p2' },
      connectors,
    );
    expect(result.highlightedConnectors?.has('bus-p1:p2')).toBe(true);
    expect(result.highlightedPeople?.has('c1')).toBe(true);
    expect(result.highlightedPeople?.has('a')).toBe(false);
  });

  it('highlights family connectors on person hover', () => {
    const result = computeOrganogramHighlight({ type: 'person', personId: 'a' }, connectors);
    expect(result.highlightedConnectors?.has('spouse-a:b')).toBe(true);
    expect(result.highlightedPeople?.has('b')).toBe(true);
  });
});
