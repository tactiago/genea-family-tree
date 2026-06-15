import React, { memo } from 'react';
import { Person, getFullName } from '@/types/family';
import { User, ChevronUp, ChevronDown, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AVATAR_SIZE,
  NODE_WIDTH,
  EXPAND_BUTTON_SIZE,
  TOP_CHROME,
  BOTTOM_CHROME,
  getCoreHeight,
  getInfoPanelHeight,
} from '@/lib/family-tree/organogram-constants';
import type { OrganogramNodeActions } from '@/lib/family-tree/organogram-visibility';

interface OrganogramNodeProps {
  person: Person;
  fieldLines: Array<{ label: string; value: string }>;
  actions: OrganogramNodeActions;
  nodeHeight: number;
  infoSlotCount: number;
  onSelect: (person: Person) => void;
  onToggleUp?: () => void;
  onToggleDown?: () => void;
  onToggleSiblings?: () => void;
}

const genderRing: Record<string, string> = {
  male: 'ring-sky-300',
  female: 'ring-pink-300',
};

const ExpandTooltip: React.FC<{
  label: string;
  side: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactElement;
}> = ({ label, side, children }) => (
  <Tooltip delayDuration={250}>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side={side} className="text-xs font-medium">
      {label}
    </TooltipContent>
  </Tooltip>
);

const OrganogramNode: React.FC<OrganogramNodeProps> = ({
  person,
  fieldLines,
  actions,
  nodeHeight,
  infoSlotCount,
  onSelect,
  onToggleUp,
  onToggleDown,
  onToggleSiblings,
}) => {
  const ringClass = person.gender ? genderRing[person.gender] : 'ring-border';
  const infoPanelHeight = getInfoPanelHeight(infoSlotCount);
  const coreHeight = getCoreHeight();
  const showUp = (actions.canExpandUp || actions.canCollapseUp) && onToggleUp;
  const showDown = (actions.canExpandDown || actions.canCollapseDown) && onToggleDown;
  const showSiblings = (actions.canExpandSiblings || actions.canCollapseSiblings) && onToggleSiblings;

  return (
    <div
      className="flex flex-col items-center"
      style={{ width: NODE_WIDTH, height: nodeHeight }}
    >
      {/* Core: avatar + ribbon — connector anchor zone */}
      <div className="flex w-full shrink-0 flex-col items-center" style={{ height: coreHeight }}>
        <div
          className="flex w-full items-end justify-center"
          style={{ height: TOP_CHROME }}
        >
          {showUp && (
            <ExpandTooltip
              side="top"
              label={actions.canCollapseUp ? 'Ocultar pais e avós' : 'Mostrar pais e avós'}
            >
              <button
                type="button"
                onClick={onToggleUp}
                className={`flex items-center justify-center rounded-full border shadow-sm ${
                  actions.canCollapseUp
                    ? 'border-muted-foreground/30 bg-muted text-muted-foreground hover:bg-muted/80'
                    : 'border-primary/30 bg-card text-primary hover:bg-primary/10'
                }`}
                style={{ width: EXPAND_BUTTON_SIZE, height: EXPAND_BUTTON_SIZE }}
                aria-label={actions.canCollapseUp ? 'Ocultar ancestrais' : 'Mostrar ancestrais'}
              >
                <ChevronUp className={`h-3.5 w-3.5 ${actions.canCollapseUp ? 'rotate-180' : ''}`} />
              </button>
            </ExpandTooltip>
          )}
        </div>

        <div className="relative flex flex-col items-center">
          {showSiblings && (
            <ExpandTooltip
              side="left"
              label={actions.canCollapseSiblings ? 'Ocultar irmãos' : 'Mostrar irmãos'}
            >
              <button
                type="button"
                onClick={onToggleSiblings}
                className={`absolute -left-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full border shadow-sm ${
                  actions.canCollapseSiblings
                    ? 'border-amber-500 bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'border-amber-400/50 bg-card text-amber-600 hover:bg-amber-50'
                }`}
                style={{ width: EXPAND_BUTTON_SIZE, height: EXPAND_BUTTON_SIZE }}
                aria-label={actions.canCollapseSiblings ? 'Ocultar irmãos' : 'Mostrar irmãos'}
              >
                <Users className="h-3 w-3" />
              </button>
            </ExpandTooltip>
          )}

          <button
            type="button"
            onClick={() => onSelect(person)}
            className={`group relative flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-full ${
              actions.isRoot ? 'ring-4 ring-primary/25 rounded-full' : ''
            }`}
          >
            <div
              className={`rounded-full ring-4 ${ringClass} shadow-md overflow-hidden bg-green-light transition-transform group-hover:scale-[1.03]`}
              style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
            >
              {person.photoUrl ? (
                <img
                  src={person.photoUrl}
                  alt={person.firstName}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-9 w-9 text-primary/70" />
                </div>
              )}
            </div>

            <div className="relative -mt-3 w-full flex justify-center px-1">
              <div
                className="relative max-w-[124px] rounded-md px-3 py-1 text-center shadow-sm"
                style={{
                  background: 'linear-gradient(180deg, #f5d565 0%, #e8b84a 100%)',
                  borderBottom: '2px solid #c99a2e',
                }}
              >
                <p className="text-[11px] font-bold leading-tight text-amber-950 truncate">
                  {getFullName(person)}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Info panel — below connector zone, does not affect line anchors */}
      <div
        className="flex w-full shrink-0 items-start justify-center px-1"
        style={{ height: infoPanelHeight }}
      >
        {fieldLines.length > 0 && (
          <div className="w-full max-w-[124px] rounded-lg border border-border/50 bg-card/90 px-2 py-1.5 shadow-sm">
            <div className="space-y-0.5">
              {fieldLines.map((line, index) => (
                <p
                  key={line.label}
                  className={`text-[9.5px] leading-tight text-muted-foreground truncate ${
                    index > 0 ? 'border-t border-border/40 pt-0.5' : ''
                  }`}
                  title={`${line.label}: ${line.value}`}
                >
                  {line.value}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className="flex w-full shrink-0 items-start justify-center"
        style={{ height: BOTTOM_CHROME }}
      >
        {showDown && (
          <ExpandTooltip
            side="bottom"
            label={
              actions.canCollapseDown
                ? 'Ocultar filhos e descendentes'
                : 'Mostrar filhos e descendentes'
            }
          >
            <button
              type="button"
              onClick={onToggleDown}
              className={`flex items-center justify-center rounded-full border shadow-sm ${
                actions.canCollapseDown
                  ? 'border-muted-foreground/30 bg-muted text-muted-foreground hover:bg-muted/80'
                  : 'border-primary/30 bg-card text-primary hover:bg-primary/10'
              }`}
              style={{ width: EXPAND_BUTTON_SIZE, height: EXPAND_BUTTON_SIZE }}
              aria-label={actions.canCollapseDown ? 'Ocultar descendentes' : 'Mostrar filhos'}
            >
              <ChevronDown className={`h-3.5 w-3.5 ${actions.canCollapseDown ? 'rotate-180' : ''}`} />
            </button>
          </ExpandTooltip>
        )}
      </div>
    </div>
  );
};

export default memo(OrganogramNode);
