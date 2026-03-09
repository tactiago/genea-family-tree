import React from 'react';
import { TreesIcon, Plus } from 'lucide-react';
import geneaLogo from '@/assets/genea-logo.png';

interface HeaderProps {
  onAddPerson: () => void;
  personCount: number;
}

const Header: React.FC<HeaderProps> = ({ onAddPerson, personCount }) => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={geneaLogo} alt="Genea" className="h-9 w-9 rounded-lg" />
          <div>
            <h1 className="text-xl leading-tight font-display font-bold text-foreground">Genea</h1>
            <p className="text-xs text-muted-foreground font-body">
              {personCount} {personCount === 1 ? 'pessoa' : 'pessoas'}
            </p>
          </div>
        </div>
        <button
          onClick={onAddPerson}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
