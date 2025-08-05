import { useState, useEffect, useCallback } from 'react';
import { exportToCSV, exportToExcel, exportToPDF, importFromCSV, printData } from '../utils/crm-data-operations';

// Types pour le contexte CRM global
interface CRMContextState {
  lastSync: Date;
  isRefreshing: boolean;
  companyName: string;
  activeModules: string[];
  syncDataAcrossCRM: () => void;
  updateModuleData: (moduleName: string, data: any) => void;
  getModuleData: (moduleName: string) => any;
  exportModuleData: (moduleName: string, format: 'csv' | 'excel' | 'pdf', customData?: any[]) => Promise<boolean>;
  importModuleData: (moduleName: string, file: File) => Promise<boolean>;
  printModuleData: (moduleName: string, options?: any) => Promise<boolean>;
}

// Hook personnalisé pour gérer le contexte global du CRM
export const useCRMContext = (): CRMContextState => {
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [moduleData, setModuleData] = useState<Record<string, any>>({
    parcelles: {
      items: [
        { id: 1, nom: "Parcelle Nord", surface: 12.5, culture: "Canne à Sucre", statut: "En culture" },
        { id: 2, nom: "Parcelle Sud", surface: 8.3, culture: "Banane", statut: "En récolte" },
        { id: 3, nom: "Parcelle Est", surface: 5.2, culture: "Ananas", statut: "En préparation" }
      ],
      columns: [
        { key: "id", header: "ID" },
        { key: "nom", header: "Nom" },
        { key: "surface", header: "Surface (ha)" },
        { key: "culture", header: "Culture" },
        { key: "statut", header: "Statut" }
      ]
    },
    cultures: {
      items: [
        { id: 1, nom: "Canne à Sucre", variete: "R579", dateDebut: "2023-03-15", dateFin: "2024-03-15" },
        { id: 2, nom: "Banane", variete: "Grande Naine", dateDebut: "2023-02-10", dateFin: "2023-12-10" },
        { id: 3, nom: "Ananas", variete: "MD-2", dateDebut: "2023-05-05", dateFin: "2024-06-01" }
      ],
      columns: [
        { key: "id", header: "ID" },
        { key: "nom", header: "Culture" },
        { key: "variete", header: "Variété" },
        { key: "dateDebut", header: "Date de début" },
        { key: "dateFin", header: "Date de fin" }
      ]
    },
    finances: {
      items: [
        { id: 1, type: "revenu", montant: 15000, description: "Vente récolte canne", date: "2023-06-15" },
        { id: 2, type: "depense", montant: 5000, description: "Achat fertilisants", date: "2023-05-10" },
        { id: 3, type: "revenu", montant: 8500, description: "Vente bananes", date: "2023-07-20" }
      ],
      columns: [
        { key: "id", header: "ID" },
        { key: "date", header: "Date" },
        { key: "type", header: "Type" },
        { key: "description", header: "Description" },
        { key: "montant", header: "Montant (€)" }
      ]
    },
    statistiques: {
      items: [
        { periode: "2023-T1", cultureId: 1, rendement: 8.2, revenus: 12500, couts: 4200 },
        { periode: "2023-T2", cultureId: 1, rendement: 8.5, revenus: 13000, couts: 4100 },
        { periode: "2023-T1", cultureId: 2, rendement: 15.3, revenus: 7800, couts: 2100 }
      ],
      columns: [
        { key: "periode", header: "Période" },
        { key: "cultureId", header: "Culture ID" },
        { key: "rendement", header: "Rendement (t/ha)" },
        { key: "revenus", header: "Revenus (€)" },
        { key: "couts", header: "Coûts (€)" }
      ]
    },
    inventaire: {
      items: [
        { id: 1, nom: "Engrais NPK", categorie: "Intrants", quantite: 500, unite: "kg", prix: 2.5 },
        { id: 2, nom: "Pesticide Bio", categorie: "Intrants", quantite: 50, unite: "L", prix: 18.75 },
        { id: 3, nom: "Tracteur", categorie: "Matériel", quantite: 2, unite: "unités", prix: 25000 }
      ],
      columns: [
        { key: "id", header: "ID" },
        { key: "nom", header: "Nom" },
        { key: "categorie", header: "Catégorie" },
        { key: "quantite", header: "Quantité" },
        { key: "unite", header: "Unité" },
        { key: "prix", header: "Prix unitaire (€)" }
      ]
    }
  });
  const [activeModules, setActiveModules] = useState<string[]>([
    'parcelles',
    'cultures',
    'finances',
    'statistiques',
    'inventaire'
  ]);
  
  // Nom de l'entreprise
  const companyName = 'Agri Dom';

  // Synchronisation des données à travers tous les modules du CRM
  const syncDataAcrossCRM = useCallback(() => {
    setIsRefreshing(true);
    
    // Simuler un temps de synchronisation
    setTimeout(() => {
      setLastSync(new Date());
      setIsRefreshing(false);
    }, 1500);
  }, []);

  // Mettre à jour les données d'un module spécifique
  const updateModuleData = useCallback((moduleName: string, data: any) => {
    setModuleData(prevData => ({
      ...prevData,
      [moduleName]: {
        ...prevData[moduleName],
        ...data
      }
    }));
    
    // Mettre à jour la date de dernière synchronisation
    setLastSync(new Date());
  }, []);

  // Récupérer les données d'un module spécifique
  const getModuleData = useCallback((moduleName: string) => {
    return moduleData[moduleName] || {};
  }, [moduleData]);

  // Export module data to specified format
  const exportModuleData = useCallback(async (
    moduleName: string, 
    format: 'csv' | 'excel' | 'pdf',
    customData?: any[]
  ): Promise<boolean> => {
    // Use custom data if provided, otherwise get from module
    const data = customData || getModuleData(moduleName)?.items;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return false;
    }
    
    try {
      let success = false;
      
      // Handle special cases like technical sheets and guides
      if (moduleName === 'fiche_technique') {
        return await exportToPDF(data, `${companyName}_fiche_technique`, {
          title: `${companyName} - Fiche Technique`,
          landscape: false,
          template: 'technical_sheet'
        });
      } else if (moduleName === 'guide_cultures') {
        return true;
      }
      
      // Standard formats
      switch (format) {
        case 'csv':
          success = exportToCSV(data, `${companyName}_${moduleName}`);
          break;
        case 'excel':
          success = exportToExcel(data, `${companyName}_${moduleName}`);
          break;
        case 'pdf':
          success = await exportToPDF(data, `${companyName}_${moduleName}`);
          break;
        default:
          return false;
      }
      
      return success;
    } catch (error) {
      console.error(`Error exporting ${moduleName} data:`, error);
      return false;
    }
  }, [getModuleData, companyName]);

  // Import module data
  const importModuleData = useCallback(async (moduleName: string, file: File): Promise<boolean> => {
    try {
      const importedData = await importFromCSV(file);
      
      if (importedData && importedData.length > 0) {
        updateModuleData(moduleName, {
          items: importedData
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error importing ${moduleName} data:`, error);
      return false;
    }
  }, [updateModuleData]);

  // Print module data
  const printModuleData = useCallback(async (moduleName: string, options?: any): Promise<boolean> => {
    const data = getModuleData(moduleName);
    
    if (!data || !data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return false;
    }
    
    const moduleNames: Record<string, string> = {
      parcelles: "Parcelles",
      cultures: "Cultures",
      finances: "Finances",
      statistiques: "Statistiques",
      inventaire: "Inventaire",
      fiche_technique: "Fiche Technique"
    };
    
    const title = `${companyName} - ${moduleNames[moduleName] || moduleName}`;
    
    try {
      return await printData(
        data.items,
        title,
        data.columns || Object.keys(data.items[0]).map(key => ({ key, header: key })),
        options
      );
    } catch (error) {
      console.error(`Error printing ${moduleName} data:`, error);
      return false;
    }
  }, [getModuleData, companyName]);

  // Synchronisation initiale au chargement
  useEffect(() => {
    const initialSync = setTimeout(() => {
      syncDataAcrossCRM();
    }, 1000);
    
    return () => clearTimeout(initialSync);
  }, [syncDataAcrossCRM]);

  return {
    lastSync,
    isRefreshing,
    companyName,
    activeModules,
    syncDataAcrossCRM,
    updateModuleData,
    getModuleData,
    exportModuleData,
    importModuleData,
    printModuleData
  };
};

export default useCRMContext;
