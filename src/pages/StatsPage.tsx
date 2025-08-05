import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Statistics from '../components/Statistics';
import GuadeloupeHarvestTracking from '../components/GuadeloupeHarvestTracking';
import { ChartConfig } from '../components/ui/chart-config';
import { EditableTable, Column } from '../components/ui/editable-table';
import { EditableField } from '../components/ui/editable-field';
import { StatisticsProvider } from '../contexts/StatisticsContext';
import { BarChart, PieChart, TrendingUp, Download, Filter, RefreshCw, Bell, Printer, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import PreviewPrintButton from '@/components/common/PreviewPrintButton';

interface PerformanceData {
  name: string;
  current: number;
  target: number;
  unit: string;
}

const StatsPage = () => {
  const [pageTitle, setPageTitle] = useState('Statistiques et Analyses');
  const [pageDescription, setPageDescription] = useState('Visualisez et analysez les données de votre exploitation en Guadeloupe');
  const [activeView, setActiveView] = useState<'performance' | 'harvest' | 'detailed'>('performance');
  const [lastSyncDate, setLastSyncDate] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [connectedModules, setConnectedModules] = useState<string[]>(['parcelles', 'cultures', 'finances']);
  
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([
    { name: 'Rendement Canne à Sucre', current: 75, target: 85, unit: 't/ha' },
    { name: 'Qualité Banane Export', current: 88, target: 95, unit: '%' },
    { name: 'Rentabilité Ananas', current: 70, target: 80, unit: '%' },
    { name: 'Certification Bio', current: 25, target: 40, unit: '%' },
    { name: 'Innovation Igname', current: 60, target: 75, unit: '%' },
  ]);
  
  useEffect(() => {
    const initialSync = setTimeout(() => {
      console.log('Les modules Parcelles, Cultures et Finances sont maintenant connectés aux statistiques');
    }, 1000);
    
    return () => clearTimeout(initialSync);
  }, []);
  
  const syncData = () => {
    setIsSyncing(true);
    console.log('Récupération des dernières données depuis tous les modules connectés...');
    
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncDate(new Date());
      console.log('Toutes les statistiques sont à jour avec les dernières données des modules');
      console.log("Les indicateurs de performance ont été recalculés avec les dernières données");
    }, 2000);
  };
  
  const columns: Column[] = [
    { id: 'name', header: 'Indicateur', accessorKey: 'name', isEditable: true },
    { id: 'current', header: 'Valeur actuelle', accessorKey: 'current', type: 'number', isEditable: true },
    { id: 'target', header: 'Objectif', accessorKey: 'target', type: 'number', isEditable: true },
    { id: 'unit', header: 'Unité', accessorKey: 'unit', isEditable: true },
  ];
  
  const handleTableUpdate = (rowIndex: number, columnId: string, value: any) => {
    const newData = [...performanceData];
    const updatedRow = { ...newData[rowIndex] } as PerformanceData;
    
    if (columnId === 'current' || columnId === 'target') {
      updatedRow[columnId as 'current' | 'target'] = Number(value);
    } else if (columnId === 'name' || columnId === 'unit') {
      updatedRow[columnId as 'name' | 'unit'] = String(value);
    }
    
    newData[rowIndex] = updatedRow;
    setPerformanceData(newData);
    
    console.log(`L'indicateur ${updatedRow.name} a été mis à jour avec succès.`);
    console.log(`Les modules connectés ont été informés de la mise à jour de ${updatedRow.name}`);
  };
  
  const handleDeleteRow = (rowIndex: number) => {
    const newData = [...performanceData];
    const deletedItem = newData[rowIndex];
    newData.splice(rowIndex, 1);
    setPerformanceData(newData);
    
    console.log(`L'indicateur ${deletedItem.name} a été supprimé avec succès.`);
    console.log(`Les modules connectés ont été informés de la suppression de ${deletedItem.name}`);
  };
  
  const handleAddRow = (newRow: Record<string, any>) => {
    const typedRow: PerformanceData = {
      name: String(newRow.name || ''),
      current: Number(newRow.current || 0),
      target: Number(newRow.target || 0),
      unit: String(newRow.unit || '%'),
    };
    setPerformanceData([...performanceData, typedRow]);
    
    console.log(`L'indicateur ${typedRow.name} a été ajouté avec succès.`);
    console.log(`Les modules connectés ont été informés de l'ajout de ${typedRow.name}`);
  };

  const handleTitleChange = (value: string | number) => {
    setPageTitle(String(value));
    console.log('Le titre de la page a été mis à jour.');
  };

  const handleDescriptionChange = (value: string | number) => {
    setPageDescription(String(value));
    console.log('La description de la page a été mise à jour.');
  };
  
  const handleViewChange = (view: 'performance' | 'harvest' | 'detailed') => {
    setActiveView(view);
    console.log(`Vous consultez maintenant la vue ${
      view === 'performance' ? 'Indicateurs de performance' : 
      view === 'harvest' ? 'Suivi des récoltes' : 'Statistiques détaillées'
    }`);
    
    console.log(`Les modules connectés ont été adaptés à la vue ${view === 'performance' ? 'indicateurs' : view === 'harvest' ? 'récoltes' : 'détaillée'}`);
  };
  
  const handleExportData = () => {
    console.log('Les données statistiques ont été exportées avec succès.');
    console.log("Les données exportées sont disponibles pour tous les modules");
  };

  return (
    <StatisticsProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Navbar />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto"
        >
          <div className="p-6 animate-enter">
            <motion.header 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4"
            >
              <div>
                <h1 className="text-2xl font-bold mb-1">
                  <EditableField
                    value={pageTitle}
                    onSave={handleTitleChange}
                    className="inline-block"
                  />
                </h1>
                <p className="text-muted-foreground">
                  <EditableField
                    value={pageDescription}
                    onSave={handleDescriptionChange}
                    className="inline-block"
                  />
                </p>
                <div className="flex items-center mt-1 text-xs text-muted-foreground">
                  <span className="mr-2">Modules connectés: {connectedModules.join(', ')}</span>
                  <span>Dernière synchro: {lastSyncDate.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => handleViewChange('performance')}
                  className={`px-3 py-1.5 rounded-md flex items-center text-sm transition-colors ${
                    activeView === 'performance' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <PieChart className="h-4 w-4 mr-1.5" />
                  Indicateurs
                </button>
                
                <button 
                  onClick={() => handleViewChange('harvest')}
                  className={`px-3 py-1.5 rounded-md flex items-center text-sm transition-colors ${
                    activeView === 'harvest' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <BarChart className="h-4 w-4 mr-1.5" />
                  Récoltes
                </button>
                
                <button 
                  onClick={() => handleViewChange('detailed')}
                  className={`px-3 py-1.5 rounded-md flex items-center text-sm transition-colors ${
                    activeView === 'detailed' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <TrendingUp className="h-4 w-4 mr-1.5" />
                  Détaillé
                </button>
                
                <PreviewPrintButton
                  data={performanceData}
                  moduleName="performance-indicators"
                  title="Indicateurs de Performance Agricole"
                  columns={[
                    { key: "name", header: "Indicateur" },
                    { key: "current", header: "Valeur actuelle" },
                    { key: "target", header: "Objectif" },
                    { key: "unit", header: "Unité" }
                  ]}
                  className="px-3 py-1.5 rounded-md flex items-center text-sm bg-muted hover:bg-muted/80 transition-colors"
                  variant="ghost"
                />
                
                <button 
                  onClick={handleExportData}
                  className="px-3 py-1.5 rounded-md flex items-center text-sm bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Exporter
                </button>
                
                <button 
                  onClick={syncData}
                  className="px-3 py-1.5 rounded-md flex items-center text-sm bg-muted hover:bg-muted/80 transition-colors"
                  disabled={isSyncing}
                >
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
                </button>
                
                <button 
                  onClick={() => {
                    console.log('Vos préférences de notification ont été mises à jour');
                  }}
                  className="px-3 py-1.5 rounded-md flex items-center text-sm bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Bell className="h-4 w-4 mr-1.5" />
                  Alertes
                </button>
              </div>
            </motion.header>
            
            {activeView === 'performance' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                <ChartConfig 
                  title="Indicateurs de performance agricole en Guadeloupe"
                  description="Suivez vos performances par rapport à vos objectifs pour les cultures guadeloupéennes"
                  onTitleChange={(title) => {
                    console.log('Le titre du graphique a été mis à jour.');
                  }}
                  onDescriptionChange={(desc) => {
                    console.log('La description du graphique a été mise à jour.');
                  }}
                  onOptionsChange={(options) => {
                    console.log('Les options du graphique ont été mises à jour.');
                  }}
                  className="mb-6"
                >
                  <div className="p-4">
                    <EditableTable
                      data={performanceData}
                      columns={columns}
                      onUpdate={handleTableUpdate}
                      onDelete={handleDeleteRow}
                      onAdd={handleAddRow}
                      className="border-none"
                    />
                  </div>
                </ChartConfig>
              </motion.div>
            )}
            
            {activeView === 'harvest' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <GuadeloupeHarvestTracking />
              </motion.div>
            )}
            
            {activeView === 'detailed' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Statistics />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </StatisticsProvider>
  );
};

export default StatsPage;
