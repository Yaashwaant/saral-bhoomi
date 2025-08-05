
import React, { useState } from 'react';
import PageLayout from '../components/layout/PageLayout';
import GuadeloupeHarvestTracking from '../components/GuadeloupeHarvestTracking';
import GuadeloupeSpecificCrops from '../components/GuadeloupeSpecificCrops';
import CropPlanning from '../components/CropPlanning';
import TabContainer, { TabItem } from '../components/layout/TabContainer';
import { Button } from '@/components/ui/button';
import { Download, Plus, Upload, Filter, RefreshCw, CalendarRange, Eye, Printer } from 'lucide-react';
import { StatisticsProvider } from '../contexts/StatisticsContext';
import { CRMProvider } from '../contexts/CRMContext';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PreviewPrintButton from '@/components/common/PreviewPrintButton';
import { useCRM } from '@/contexts/CRMContext';

const CropsPage = () => {
  const [activeTab, setActiveTab] = useState<string>('harvest');
  const { getModuleData } = useCRM();
  
  // Get harvest data for preview/print
  const harvestData = getModuleData('cultures').items || [];
  
  // Print columns for different tabs
  const printColumns = {
    harvest: [
      { key: "nom", header: "Culture" },
      { key: "rendement", header: "Rendement (t/ha)" },
      { key: "surface", header: "Surface (ha)" },
      { key: "date", header: "Date de récolte" }
    ],
    specific: [
      { key: "nom", header: "Nom" },
      { key: "variete", header: "Variété" },
      { key: "dateDebut", header: "Date de début" },
      { key: "dateFin", header: "Date de fin" }
    ],
    planning: [
      { key: "nom", header: "Culture" },
      { key: "activite", header: "Activité" },
      { key: "dateDebut", header: "Date de début" },
      { key: "dateFin", header: "Date de fin" },
      { key: "statut", header: "Statut" }
    ]
  };

  // Actions based on the active tab
  const getTabActions = () => {
    switch (activeTab) {
      case 'harvest':
        return (
          <div className="flex flex-wrap gap-2">
            <PreviewPrintButton 
              data={harvestData}
              moduleName="harvest"
              title="Suivi des Récoltes"
              columns={printColumns.harvest}
              variant="outline"
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 transition-colors">
                  <Download className="h-4 w-4" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border shadow-lg">
                <DropdownMenuItem 
                  onClick={() => console.log("Export CSV des données de récolte")}
                  className="cursor-pointer"
                >
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => console.log("Export Excel des données de récolte")}
                  className="cursor-pointer"
                >
                  Export Excel
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => console.log("Export PDF des données de récolte")}
                  className="cursor-pointer"
                >
                  Export PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2 transition-colors"
              onClick={() => {
                console.log("Synchronisation des données de récolte");
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Synchroniser
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 transition-colors"
              onClick={() => {
                console.log("Filtres appliqués aux données de récolte");
              }}
            >
              <Filter className="h-4 w-4" />
              Filtrer
            </Button>
          </div>
        );
      case 'specific':
        return (
          <div className="flex flex-wrap gap-2">
            <PreviewPrintButton 
              data={getModuleData('cultures').items || []}
              moduleName="cultures"
              title="Cultures Spécifiques"
              columns={printColumns.specific}
              variant="outline"
            />
            
            <Button 
              className="flex items-center gap-2 bg-agri-primary hover:bg-agri-primary-dark transition-colors"
              onClick={() => {
                console.log("Ajout de nouvelle culture");
              }}
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 transition-colors"
              onClick={() => {
                console.log("Export des données des cultures");
              }}
            >
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>
        );
      case 'planning':
        return (
          <div className="flex flex-wrap gap-2">
            <PreviewPrintButton 
              data={[]}
              moduleName="planning"
              title="Planification des Cultures"
              columns={printColumns.planning}
              variant="outline"
            />
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2 transition-colors"
              onClick={() => {
                console.log("Planification du calendrier des cultures");
              }}
            >
              <CalendarRange className="h-4 w-4" />
              Planifier
            </Button>
            <Button 
              className="flex items-center gap-2 transition-colors"
              onClick={() => {
                console.log("Ajout de nouvelle tâche culturale");
              }}
            >
              <Plus className="h-4 w-4" />
              Nouvelle tâche
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    const tabLabels = {
      harvest: 'Suivi des Récoltes',
      specific: 'Cultures Spécifiques',
      planning: 'Planification'
    };
    
    const label = tabLabels[value as keyof typeof tabLabels] || value;
    console.log(`${label} activé - Affichage des données correspondantes`);
  };

  const tabs: TabItem[] = [
    {
      value: 'harvest',
      label: 'Suivi des Récoltes',
      content: <GuadeloupeHarvestTracking />
    },
    {
      value: 'specific',
      label: 'Cultures Spécifiques',
      content: <GuadeloupeSpecificCrops />
    },
    {
      value: 'planning',
      label: 'Planification',
      content: <CropPlanning />
    }
  ];

  return (
    <CRMProvider>
      <StatisticsProvider>
        <PageLayout>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-6 animate-enter"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold">Gestion des Cultures</h1>
                <p className="text-muted-foreground">
                  Gérez vos cultures tropicales et suivez leur rendement
                </p>
              </div>
              {getTabActions()}
            </div>
            
            <TabContainer 
              tabs={tabs}
              defaultValue={activeTab}
              onValueChange={handleTabChange}
            />
          </motion.div>
        </PageLayout>
      </StatisticsProvider>
    </CRMProvider>
  );
};

export default CropsPage;
