import React from 'react';
import { LayoutGrid, Clock, TreePine, GitBranch } from 'lucide-react';

export type TreeView = 'tree' | 'treeV2' | 'list' | 'timeline';

interface TreeViewTabsProps {
  view: TreeView;
  onViewChange: (view: TreeView) => void;
  orientation?: 'horizontal' | 'vertical';
  onSelect?: () => void;
}

const tabs: { id: TreeView; label: string; icon: React.ElementType }[] = [
  { id: 'tree', label: 'Árvore', icon: TreePine },
  { id: 'treeV2', label: 'Nova árvore', icon: GitBranch },
  { id: 'list', label: 'Lista', icon: LayoutGrid },
  { id: 'timeline', label: 'Linha do tempo', icon: Clock },
];

const TreeViewTabs: React.FC<TreeViewTabsProps> = ({
  view,
  onViewChange,
  orientation = 'horizontal',
  onSelect,
}) => {
  const isVertical = orientation === 'vertical';

  return (
    <div
      className={
        isVertical
          ? 'flex flex-col gap-1 p-3'
          : 'flex items-center gap-1 bg-muted p-1 rounded-lg w-full'
      }
      role="tablist"
      aria-label="Visualizações"
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = view === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            onClick={() => {
              onViewChange(id);
              onSelect?.();
            }}
            className={
              isVertical
                ? `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full text-left ${
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`
                : `flex items-center justify-center flex-1 gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    active
                      ? 'bg-card text-foreground card-shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default TreeViewTabs;
