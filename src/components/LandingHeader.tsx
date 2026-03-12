import React from 'react';
import { Link } from 'react-router-dom';
import { TreeDeciduous } from 'lucide-react';
import geneaLogo from '@/assets/genea-logo.webp';

interface LandingHeaderProps {
  hasSavedTree: boolean;
}

const LandingHeader: React.FC<LandingHeaderProps> = ({ hasSavedTree }) => (
  <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
    <div className="container flex h-16 items-center justify-between">
      <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
        <img src={geneaLogo} alt="Genea - Árvore genealógica online" className="h-10 w-10 sm:w-12 sm:h-12 rounded-lg" />
        <h1 className="text-lg sm:text-xl leading-tight font-display font-bold text-foreground">
          Genea
        </h1>
      </Link>
      {hasSavedTree && (
        <Link
          to="/arvore"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-95"
        >
          <TreeDeciduous className="h-4 w-4" />
          <span>Ir para minha árvore</span>
        </Link>
      )}
    </div>
  </header>
);

export default LandingHeader;
