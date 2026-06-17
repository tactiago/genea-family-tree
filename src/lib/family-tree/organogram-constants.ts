import type { OrganogramFieldId } from './organogram-fields';

export const AVATAR_SIZE = 88;
export const AVATAR_RING = 4;
export const NODE_WIDTH = 132;
export const RIBBON_HEIGHT = 52;
export const RIBBON_OVERLAP = 12;
export const INFO_LINE_HEIGHT = 14;
export const NODE_PADDING_BOTTOM = 6;
export const EXPAND_BUTTON_SIZE = 22;

export const TOP_CHROME = EXPAND_BUTTON_SIZE + 4;
export const BOTTOM_CHROME = EXPAND_BUTTON_SIZE + 4;

export const getInfoPanelHeight = (visibleFieldCount: number): number => {
  if (visibleFieldCount <= 0) return 0;
  return visibleFieldCount * INFO_LINE_HEIGHT + 20;
};

export const getCoreHeight = (): number =>
  TOP_CHROME + AVATAR_SIZE - RIBBON_OVERLAP + RIBBON_HEIGHT;

export const getOrganogramNodeHeight = (visibleFieldCount: number): number =>
  getCoreHeight() + getInfoPanelHeight(visibleFieldCount) + BOTTOM_CHROME + NODE_PADDING_BOTTOM;

/** Top of the visible avatar ring — where child connector lines end. */
export const getAvatarTopY = (posY: number): number => posY + TOP_CHROME - AVATAR_RING;

/** Vertical center of the avatar — spouse connector height. */
export const getAvatarCenterY = (posY: number): number => posY + TOP_CHROME + AVATAR_SIZE / 2;

/** Bottom of the name ribbon — where parent connector lines start. */
export const getRibbonBottomY = (posY: number): number =>
  posY + TOP_CHROME + AVATAR_SIZE - RIBBON_OVERLAP + RIBBON_HEIGHT;

/** @deprecated use getAvatarCenterY */
export const getOrganogramAvatarCenterY = getAvatarCenterY;

/** @deprecated use getAvatarTopY */
export const getOrganogramNodeTopY = getAvatarTopY;

export const getOrganogramLayoutConstants = (maxVisibleFields: number) => ({
  CARD_WIDTH: NODE_WIDTH,
  CARD_HEIGHT: getOrganogramNodeHeight(maxVisibleFields),
  SPOUSE_GAP: 20,
  BRANCH_GAP: 64,
  ROW_GAP: 48,
});
