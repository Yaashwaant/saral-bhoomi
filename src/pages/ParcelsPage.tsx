
import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays, subDays } from 'date-fns';
import PageLayout from '../components/layout/PageLayout';
import ParcelManagement from '../components/ParcelManagement';
import PageHeader from '../components/layout/PageHeader';
import usePageMetadata from '../hooks/use-page-metadata';
import ParcelFilters from '../components/parcels/ParcelFilters';
import ParcelActionButtons from '../components/parcels/ParcelActionButtons';
import ParcelMapDialog from '../components/parcels/ParcelMapDialog';
import ParcelImportDialog from '../components/parcels/ParcelImportDialog';
import GuadeloupeParcelManagement from '../components/GuadeloupeParcelManagement';
import { useCRM } from '../contexts/CRMContext';
import { FileSpreadsheet, FileBarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ParcelsPage = () => {
  const { 
    title, 
    description, 
    handleTitleChange, 
    handleDescriptionChange 
  } = usePageMetadata({
    defaultTitle: 'Gestion des Parcelles',
    defaultDescription: 'Gérez, organisez et optimisez toutes vos parcelles agricoles'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [mapPreviewOpen, setMapPreviewOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [layersDialogOpen, setLayersDialogOpen] = useState(false);
  const [weatherAlertsOpen, setWeatherAlertsOpen] = useState(false);
  const [showGuadeloupeView, setShowGuadeloupeView] = useState(true);
  const [lastSyncDate, setLastSyncDate] = useState<Date>(new Date());
  const { syncDataAcrossCRM } = useCRM();
  const [areaRange, setAreaRange] = useState<[number, number]>([0, 50]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  const [activeParcelAlerts, setActiveParcelAlerts] = useState([
    { id: 1, parcel: 'Parcelle A12', type: 'Pluie intense', severity: 'Haute' },
    { id: 2, parcel: 'Parcelle B05', type: 'Sécheresse', severity: 'Moyenne' }
  ]);

  // Simuler la synchronisation des données avec les autres modules
  useEffect(() => {
    const syncWithOtherModules = () => {
      console.log("Synchronisation des données avec les modules de cultures et de statistiques");
      
      // Simule un délai de synchronisation
      const timer = setTimeout(() => {
        setLastSyncDate(new Date());
        syncDataAcrossCRM();
        console.log("Les données des parcelles sont maintenant synchronisées avec tous les modules");
      }, 1500);
      
      return () => clearTimeout(timer);
    };
    
    syncWithOtherModules();
  }, [syncDataAcrossCRM]);

  const handleExportData = () => {
    console.log("L'export de toutes les données des parcelles a démarré");
    console.log("Les données exportées sont maintenant disponibles dans le module Statistiques");
  };

  const handleImportData = () => {
    setImportDialogOpen(true);
  };
  
  const handleImportConfirm = (importType: string) => {
    setImportDialogOpen(false);
    console.log(`Les données ${importType} ont été importées avec succès`);
    console.log("Les modules Cultures et Statistiques ont été mis à jour avec les nouvelles données");
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) {
      console.log(`Recherche effectuée pour "${searchTerm}"`);
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Basse':
        return 'bg-green-100 text-green-800';
      case 'Moyenne':
        return 'bg-yellow-100 text-yellow-800';
      case 'Haute':
        return 'bg-orange-100 text-orange-800';
      case 'Extrême':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleView = () => {
    setShowGuadeloupeView(!showGuadeloupeView);
    console.log(`Vue ${showGuadeloupeView ? 'Standard' : 'Guadeloupe'} activée`);
    console.log(`Les données affichées dans les modules Cultures et Finances ont été adaptées`);
  };

  const handleGenerateStatistics = () => {
    setStatsDialogOpen(true);
    console.log("Les statistiques de vos parcelles ont été générées");
  };

  const handleOpenLayerManager = () => {
    setLayersDialogOpen(true);
    console.log("Gestionnaire de couches ouvert");
  };

  const handleAddParcel = () => {
    console.log("Formulaire de création de parcelle ouvert");
  };

  return (
    <PageLayout>
      <div className="p-6 animate-enter">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <PageHeader 
              title={title}
              description={description}
              onTitleChange={handleTitleChange}
              onDescriptionChange={handleDescriptionChange}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Dernière synchronisation avec les autres modules: {lastSyncDate.toLocaleString()}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <ParcelFilters 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filterType={filterType}
              setFilterType={setFilterType}
              onSearch={handleSearch}
              dateRange={dateRange}
              setDateRange={setDateRange}
              areaRange={areaRange}
              setAreaRange={setAreaRange}
            />
            
            <ParcelActionButtons 
              onExportData={handleExportData}
              onImportData={handleImportData}
              onOpenMap={() => setMapPreviewOpen(true)}
              onAddParcel={handleAddParcel}
              onGenerateStatistics={handleGenerateStatistics}
              onOpenLayerManager={handleOpenLayerManager}
              activeParcelAlerts={activeParcelAlerts}
              weatherAlertsOpen={weatherAlertsOpen}
              setWeatherAlertsOpen={setWeatherAlertsOpen}
              getSeverityColor={getSeverityColor}
            />
            
            <button 
              className="inline-flex items-center px-4 py-2 border border-input bg-white rounded-lg hover:bg-muted/30 transition-colors"
              onClick={toggleView}
            >
              {showGuadeloupeView ? 'Vue Standard' : 'Vue Guadeloupe'}
            </button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 p-4 bg-white rounded-xl border border-muted"
        >
          <div className="flex items-center mb-2">
            <FileSpreadsheet className="h-5 w-5 mr-2 text-agri-primary" />
            <h2 className="text-lg font-medium">Aperçu des statistiques parcellaires</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
              <p className="text-sm text-muted-foreground">Surface totale</p>
              <p className="text-2xl font-semibold">128.5 ha</p>
            </div>
            <div className="p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
              <p className="text-sm text-muted-foreground">Parcelles actives</p>
              <p className="text-2xl font-semibold">42</p>
            </div>
            <div className="p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
              <p className="text-sm text-muted-foreground">Rendement moyen</p>
              <p className="text-2xl font-semibold">7.2 t/ha</p>
            </div>
            <div className="p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
              <p className="text-sm text-muted-foreground">Cultures principales</p>
              <p className="text-xl font-semibold">Maïs, Blé, Colza</p>
            </div>
          </div>
        </motion.div>

        {showGuadeloupeView ? (
          <GuadeloupeParcelManagement />
        ) : (
          <ParcelManagement />
        )}
        
        <ParcelMapDialog 
          isOpen={mapPreviewOpen} 
          onOpenChange={setMapPreviewOpen} 
        />
        
        <ParcelImportDialog 
          isOpen={importDialogOpen} 
          onOpenChange={setImportDialogOpen}
          onImportConfirm={handleImportConfirm}
        />
      </div>
    </PageLayout>
  );
};

export default ParcelsPage;
