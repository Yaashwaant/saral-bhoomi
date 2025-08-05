
import { useState } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { generatePreviewHTML } from '@/utils/preview-generator';
import { toast } from 'sonner';

interface UsePreviewActionsProps {
  data: any[];
  moduleName: string;
  columns?: { key: string, header: string }[];
  title?: string;
}

export const usePreviewActions = ({ 
  data, 
  moduleName, 
  columns, 
  title 
}: UsePreviewActionsProps) => {
  const { printModuleData, exportModuleData } = useCRM();
  const { settings } = useAppSettings();
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHTML, setPreviewHTML] = useState<string>('');

  const handlePrint = async () => {
    if (!data || data.length === 0) {
      toast.error("Aucune donnée à imprimer", {
        description: "Veuillez vérifier vos filtres ou sélectionner une autre période."
      });
      return;
    }

    setIsActionInProgress(true);
    
    try {
      await printModuleData(moduleName, {
        columns: columns,
        title: title || `Aperçu - ${moduleName}`
      });
      toast.success("Document envoyé à l'impression", {
        description: "Votre document a été envoyé à l'imprimante."
      });
    } catch (error) {
      console.error("Erreur lors de l'impression:", error);
      toast.error("Erreur d'impression", {
        description: "Une erreur s'est produite lors de l'impression du document."
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleShowPreview = () => {
    if (!data || data.length === 0) {
      toast.error("Aucune donnée à afficher", {
        description: "Veuillez vérifier vos filtres ou sélectionner une autre période."
      });
      return;
    }
    
    const html = generatePreviewHTML(data, moduleName, title, columns, settings.locale);
    setPreviewHTML(html);
    setPreviewOpen(true);
  };

  const handleExportPDF = async () => {
    if (!data || data.length === 0) {
      toast.error("Aucune donnée à exporter", {
        description: "Veuillez vérifier vos filtres ou sélectionner une autre période."
      });
      return;
    }

    setIsActionInProgress(true);
    
    try {
      await exportModuleData(moduleName, 'pdf', data);
      toast.success("PDF généré avec succès", {
        description: "Le document a été téléchargé."
      });
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      toast.error("Erreur d'exportation", {
        description: "Une erreur s'est produite lors de la génération du PDF."
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  return {
    isActionInProgress,
    previewOpen,
    setPreviewOpen,
    previewHTML,
    handlePrint,
    handleShowPreview,
    handleExportPDF
  };
};
