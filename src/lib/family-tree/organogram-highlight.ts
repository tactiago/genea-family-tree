import { Relationship, getChildren, getParents, getSpouses } from '@/types/family';

export type OrganogramConnectorKind = 'bus' | 'couple-drop' | 'spouse';

export interface OrganogramConnectorPath {
  id: string;
  d: string;
  kind: OrganogramConnectorKind;
  personIds: string[];
}

export type OrganogramHoverState =
  | { type: 'none' }
  | { type: 'person'; personId: string }
  | { type: 'connector'; connectorId: string };

export const DIMMED_OPACITY = 0.2;

export const getFamilyCluster = (
  personId: string,
  relationships: Relationship[],
  visibleIds: Set<string>,
): Set<string> => {
  const cluster = new Set<string>([personId]);

  const addVisible = (id: string) => {
    if (visibleIds.has(id)) cluster.add(id);
  };

  getSpouses(personId, relationships).forEach(addVisible);
  getParents(personId, relationships).forEach(addVisible);
  getChildren(personId, relationships).forEach(addVisible);

  return cluster;
};

export const computeOrganogramHighlight = (
  hover: OrganogramHoverState,
  connectors: OrganogramConnectorPath[],
): { highlightedPeople: Set<string> | null; highlightedConnectors: Set<string> | null } => {
  if (hover.type === 'none') {
    return { highlightedPeople: null, highlightedConnectors: null };
  }

  const highlightedPeople = new Set<string>();
  const highlightedConnectors = new Set<string>();

  if (hover.type === 'person') {
    connectors.forEach((connector) => {
      if (connector.personIds.includes(hover.personId)) {
        highlightedConnectors.add(connector.id);
        connector.personIds.forEach((id) => highlightedPeople.add(id));
      }
    });
    highlightedPeople.add(hover.personId);
    return { highlightedPeople, highlightedConnectors };
  }

  const connector = connectors.find((c) => c.id === hover.connectorId);
  if (!connector) {
    return { highlightedPeople: null, highlightedConnectors: null };
  }

  highlightedConnectors.add(connector.id);
  connector.personIds.forEach((id) => highlightedPeople.add(id));

  return { highlightedPeople, highlightedConnectors };
};
