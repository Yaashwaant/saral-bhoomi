
import React, { createContext, useContext, ReactNode } from 'react';
import useCRMContext from '../hooks/use-crm-context';

// Création du contexte avec les types appropriés
interface CRMContextType {
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

const CRMContext = createContext<CRMContextType | undefined>(undefined);

// Props pour le provider
interface CRMProviderProps {
  children: ReactNode;
}

// Provider qui va envelopper notre application
export const CRMProvider: React.FC<CRMProviderProps> = ({ children }) => {
  const crmContext = useCRMContext();
  
  return (
    <CRMContext.Provider value={crmContext}>
      {children}
    </CRMContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useCRM = () => {
  const context = useContext(CRMContext);
  
  if (context === undefined) {
    throw new Error('useCRM doit être utilisé à l\'intérieur d\'un CRMProvider');
  }
  
  return context;
};

export default CRMContext;
