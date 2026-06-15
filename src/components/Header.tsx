import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Download, Upload, RotateCcw } from 'lucide-react';
import geneaLogo from '@/assets/genea-logo.webp';

interface HeaderProps {
  onAddPerson: () => void;
  personCount: number;
  onExport: () => void;
  onImport: () => void;
  onStartFresh?: () => void;
  variant?: 'default' | 'sidebar';
}

const Header: React.FC<HeaderProps> = ({
  onAddPerson,
  personCount,
  onExport,
  onImport,
  onStartFresh,
  variant = 'default',
}) => {
  const isEmpty = personCount === 0;
  const isSidebar = variant === 'sidebar';

  if (isSidebar) {
    return (
      <header className="shrink-0 border-b border-border p-4 space-y-4">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img
            src={geneaLogo}
            alt="Genea - Árvore genealógica online"
            className="h-10 w-10 rounded-lg"
          />
          <h1 className="text-lg leading-tight font-display font-bold text-foreground">Genea</h1>
        </Link>

        <div className="flex flex-col gap-2">
          <button
            onClick={onAddPerson}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-95 w-full"
          >
            <Plus className="h-4 w-4" />
            <span>{isEmpty ? 'Começar' : 'Adicionar pessoa'}</span>
          </button>

          {!isEmpty && (
            <>
              <button
                onClick={onExport}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all w-full"
              >
                <Download className="h-4 w-4" />
                <span>Exportar JSON</span>
              </button>
              <button
                onClick={onImport}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all w-full"
              >
                <Upload className="h-4 w-4" />
                <span>Importar JSON</span>
              </button>
              {onStartFresh && (
                <button
                  onClick={onStartFresh}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all w-full"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Começar do zero</span>
                </button>
              )}
            </>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img src={geneaLogo} alt="Genea - Árvore genealógica online" className="h-10 w-10 sm:w-12 sm:h-12 rounded-lg" />
          <div>
            <h1 className="text-lg sm:text-xl leading-tight font-display font-bold text-foreground">Genea</h1>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {!isEmpty && (
            <>
              <button
                    onClick={onExport}
                    className="hidden sm:flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-all"
                  >
                    <Download className="h-4 w-4" />
                    <span>Exportar JSON</span>
                  </button>
                  <button
                    onClick={onImport}
                    className="hidden sm:flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-all"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Importar JSON</span>
                  </button>
                  {onStartFresh && (
                    <button
                      onClick={onStartFresh}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span className="hidden sm:inline">Começar do zero</span>
                    </button>
                  )}
            </>
          )}
          <button
                onClick={onAddPerson}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{isEmpty ? 'Começar' : 'Adicionar'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
