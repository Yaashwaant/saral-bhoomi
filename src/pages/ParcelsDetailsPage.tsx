
import React from 'react';
import PageLayout from '../components/layout/PageLayout';
import PageHeader from '../components/layout/PageHeader';
import GuadeloupeParcelDetail from '../components/GuadeloupeParcelDetail';
import usePageMetadata from '../hooks/use-page-metadata';

const ParcelsDetailsPage = () => {
  const { 
    title, 
    description, 
    handleTitleChange, 
    handleDescriptionChange 
  } = usePageMetadata({
    defaultTitle: 'Gestion des Parcelles en Guadeloupe',
    defaultDescription: 'Gérez, surveillez et optimisez vos parcelles agricoles à travers tout l\'archipel'
  });

  return (
    <PageLayout>
      <div className="p-6 animate-enter">
        <PageHeader 
          title={title}
          description={description}
          onTitleChange={handleTitleChange}
          onDescriptionChange={handleDescriptionChange}
        />

        <GuadeloupeParcelDetail />
      </div>
    </PageLayout>
  );
};

export default ParcelsDetailsPage;
