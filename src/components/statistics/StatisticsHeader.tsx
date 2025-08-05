
import React, { useState } from 'react';
import { Download, Printer, Share2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCRM } from '../../contexts/CRMContext';
import ReportGenerationButton from '../common/ReportGenerationButton';
import { useIsMobile } from '@/hooks/use-mobile';
import PreviewPrintButton from '../common/PreviewPrintButton';
import { useStatistics } from '@/contexts/StatisticsContext';

const StatisticsHeader = () => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { exportModuleData, printModuleData, getModuleData } = useCRM();
  const { yieldData, financialData, environmentalData } = useStatistics();
  const isMobile = useIsMobile();
  
  // Combine all statistics data for preview/print
  const statisticsData = [
    ...(yieldData || []).map(item => ({ ...item, type: 'rendement' })),
    ...(financialData.profitabilityByParcel || []).map(item => ({ ...item, type: 'financier' })),
    ...(environmentalData.indicators || []).map(item => ({ ...item, type: 'environnement' }))
  ];

  const handleExport = async () => {
    try {
      console.log("Exportation des statistiques au format CSV...");
      await exportModuleData('statistiques', 'csv');
      console.log("Exportation réussie!");
    } catch (error) {
      console.error("Error exporting statistics:", error);
    }
  };

  const handlePrint = async () => {
    try {
      console.log("Préparation de l'impression des statistiques...");
      await printModuleData('statistiques');
      console.log("Document envoyé à l'impression");
    } catch (error) {
      console.error("Error printing statistics:", error);
    }
  };

  const handleShare = () => {
    setShareDialogOpen(true);
    console.log("Ouverture de la boîte de dialogue de partage");
  };
  
  const handleShareByEmail = () => {
    console.log("Préparation du partage par email...");
    setShareDialogOpen(false);
    console.log("Email de partage préparé");
  };
  
  const handleShareByPDF = async () => {
    try {
      console.log("Génération du PDF pour partage...");
      await exportModuleData('statistiques', 'pdf');
      setShareDialogOpen(false);
      console.log("PDF généré avec succès pour partage");
    } catch (error) {
      console.error("Error generating PDF:", error);
      setShareDialogOpen(false);
    }
  };

  return (
    <header className="flex flex-col mb-6 gap-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold mb-1 text-gray-800">Statistiques et Analyses</h1>
        <p className="text-sm md:text-base text-gray-500">Visualisez et analysez les données de votre exploitation</p>
      </div>
      <div className="flex flex-wrap gap-2 md:gap-3 justify-start md:justify-end">
        <ReportGenerationButton 
          moduleName="statistiques" 
          className="bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2"
          withAnimation={false}
        />
        
        {!isMobile ? (
          <>
            <PreviewPrintButton 
              data={statisticsData}
              moduleName="statistiques"
              title="Statistiques et Analyses"
              className="bg-white border-gray-200 hover:bg-gray-50 text-xs md:text-sm h-auto py-1.5 md:py-2"
              variant="outline"
              columns={[
                { key: "type", header: "Type" },
                { key: "name", header: "Nom" },
                { key: "current", header: "Valeur actuelle" },
                { key: "previous", header: "Valeur précédente" },
                { key: "unit", header: "Unité" }
              ]}
            />
            
            <Button 
              variant="outline" 
              onClick={handleExport}
              className="bg-white border-gray-200 hover:bg-gray-50 text-xs md:text-sm h-auto py-1.5 md:py-2"
              size={isMobile ? "sm" : "default"}
            >
              <Download className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 text-gray-600" />
              {isMobile ? "CSV" : "Exporter CSV"}
            </Button>
          </>
        ) : null}
        <Button 
          variant="outline" 
          onClick={handleShare}
          className="bg-white border-gray-200 hover:bg-gray-50 text-xs md:text-sm h-auto py-1.5 md:py-2"
          size={isMobile ? "sm" : "default"}
        >
          <Share2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 text-gray-600" />
          {isMobile ? "Partager" : "Partager"}
        </Button>
      </div>
      
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md max-w-[90%]">
          <DialogHeader>
            <DialogTitle>Partager les statistiques</DialogTitle>
            <DialogDescription>
              Choisissez comment vous souhaitez partager ces statistiques
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={handleShareByEmail} variant="outline">
                Envoyer par email
              </Button>
              <Button onClick={handleShareByPDF} className="bg-green-600 hover:bg-green-700">
                Générer un PDF
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default StatisticsHeader;
