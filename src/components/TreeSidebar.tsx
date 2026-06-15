import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TreeViewTabs, { type TreeView } from '@/components/TreeViewTabs';

interface TreeSidebarProps {
  personCount: number;
  view: TreeView;
  onViewChange: (view: TreeView) => void;
  onAddPerson: () => void;
  onExport: () => void;
  onImport: () => void;
  onStartFresh?: () => void;
  onViewSelect?: () => void;
  className?: string;
}

const TreeSidebar: React.FC<TreeSidebarProps> = ({
  personCount,
  view,
  onViewChange,
  onAddPerson,
  onExport,
  onImport,
  onStartFresh,
  onViewSelect,
  className = '',
}) => {
  return (
    <div className={`flex flex-col h-full bg-card ${className}`}>
      <Header
        variant="sidebar"
        onAddPerson={onAddPerson}
        personCount={personCount}
        onExport={onExport}
        onImport={onImport}
        onStartFresh={onStartFresh}
      />

      {personCount > 0 && (
        <nav className="flex-1 min-h-0 overflow-y-auto border-b border-border">
          <TreeViewTabs
            view={view}
            onViewChange={onViewChange}
            orientation="vertical"
            onSelect={onViewSelect}
          />
        </nav>
      )}

      <Footer variant="sidebar" className={personCount === 0 ? 'mt-auto' : ''} />
    </div>
  );
};

export default TreeSidebar;
