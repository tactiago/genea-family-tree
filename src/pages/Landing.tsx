import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '@/contexts/FamilyContext';
import LandingHeader from '@/components/LandingHeader';
import Footer from '@/components/Footer';
import EmptyStateLanding from '@/components/EmptyStateLanding';

const Landing = () => {
  const navigate = useNavigate();
  const { persons } = useFamily();
  const hasSavedTree = persons.length > 0;

  const handleAddPerson = () => {
    navigate('/arvore', { state: { action: 'add' } });
  };

  const handleImport = () => {
    navigate('/arvore', { state: { action: 'import' } });
  };

  const handleViewExample = () => {
    navigate('/arvore', { state: { action: 'example' } });
  };

  const handleGoToTree = () => {
    navigate('/arvore');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-14 sm:pb-20">
      <LandingHeader hasSavedTree={hasSavedTree} />
      <EmptyStateLanding
        onAddPerson={handleAddPerson}
        onImport={handleImport}
        onViewExample={handleViewExample}
        onGoToTree={hasSavedTree ? handleGoToTree : undefined}
      />
      <Footer />
    </div>
  );
};

export default Landing;
