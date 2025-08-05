import { toast } from 'sonner';
import { exportToCSV, exportToExcel, exportToPDF, importFromCSV } from './crm-data-operations';

/**
 * Format date to localized string
 */
export const formatDate = (date: Date | string): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format currency with euro symbol
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Calculate percentage change between two values
 */
export const calculatePercentChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Format percentage with symbol
 */
export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Calculate total from array of objects
 */
export const calculateTotal = (items: any[], field: string): number => {
  return items.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
};

/**
 * General search function for filtering data
 */
export const searchInData = (data: any[], searchTerm: string, fields: string[] = []): any[] => {
  if (!searchTerm || searchTerm.trim() === '') return data;
  
  const term = searchTerm.toLowerCase().trim();
  return data.filter(item => {
    // If specific fields are provided, search only in those fields
    if (fields.length > 0) {
      return fields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(term);
      });
    }
    
    // Otherwise search in all fields
    return Object.values(item).some(value => 
      value && String(value).toLowerCase().includes(term)
    );
  });
};

/**
 * Filter data by date range
 */
export const filterByDateRange = (
  data: any[], 
  startDate?: Date | null, 
  endDate?: Date | null, 
  dateField: string = 'date'
): any[] => {
  if (!startDate && !endDate) return data;
  
  return data.filter(item => {
    if (!item[dateField]) return false;
    
    const itemDate = new Date(item[dateField]);
    if (startDate && endDate) {
      return itemDate >= startDate && itemDate <= endDate;
    } else if (startDate) {
      return itemDate >= startDate;
    } else if (endDate) {
      return itemDate <= endDate;
    }
    
    return true;
  });
};

/**
 * Generate unique ID for new items
 */
export const generateUniqueId = (): number => {
  return Math.floor(Date.now() + Math.random() * 1000);
};

/**
 * Group data by field
 */
export const groupByField = (data: any[], field: string): Record<string, any[]> => {
  return data.reduce((groups, item) => {
    const key = item[field] || 'undefined';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
};

/**
 * Get status color based on status value
 */
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-gray-100 text-gray-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-blue-100 text-blue-800',
    'cancelled': 'bg-red-100 text-red-800',
    'En culture': 'bg-green-100 text-green-800',
    'En récolte': 'bg-blue-100 text-blue-800',
    'En préparation': 'bg-yellow-100 text-yellow-800',
    'Atteint': 'bg-green-100 text-green-800',
    'En progrès': 'bg-blue-100 text-blue-800',
    'En retard': 'bg-red-100 text-red-800'
  };
  
  return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Format phone number for French format
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format as XX XX XX XX XX (French format)
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  
  return phoneNumber;
};

/**
 * Enhanced data export with feedback
 */
export const enhancedExport = async (
  data: any[], 
  format: 'csv' | 'excel' | 'pdf',
  fileName: string,
  options = {}
): Promise<boolean> => {
  if (!data || data.length === 0) {
    toast.error("Aucune donnée à exporter");
    return false;
  }
  
  toast.info(`Préparation de l'export au format ${format.toUpperCase()}...`);
  
  try {
    let success = false;
    
    switch (format) {
      case 'csv':
        success = exportToCSV(data, fileName);
        break;
      case 'excel':
        success = exportToExcel(data, fileName);
        break;
      case 'pdf':
        success = await exportToPDF(data, fileName, options);
        break;
    }
    
    if (success) {
      toast.success(`Export ${format.toUpperCase()} réussi`);
    }
    
    return success;
  } catch (error) {
    console.error(`Error exporting data:`, error);
    toast.error(`Erreur lors de l'export au format ${format.toUpperCase()}`);
    return false;
  }
};

/**
 * Enhanced data import with validation
 */
export const enhancedImport = async (
  file: File,
  onComplete: (data: any[]) => void,
  requiredFields: string[] = [],
  validateRow?: (row: any) => boolean
): Promise<boolean> => {
  if (!file) {
    toast.error("Aucun fichier sélectionné");
    return false;
  }
  
  toast.info("Importation en cours...");
  
  try {
    const data = await importFromCSV(file);
    
    if (!data || data.length === 0) {
      toast.error("Aucune donnée valide trouvée dans le fichier");
      return false;
    }
    
    // Validate required fields
    if (requiredFields.length > 0) {
      const invalidRows = data.filter(row => 
        !requiredFields.every(field => row[field] !== undefined && row[field] !== null && row[field] !== '')
      );
      
      if (invalidRows.length > 0) {
        toast.warning(`${invalidRows.length} ligne(s) ignorée(s) car des champs obligatoires sont manquants`);
      }
    }
    
    // Apply custom validation
    let validData = data;
    if (validateRow) {
      validData = data.filter(validateRow);
      if (validData.length < data.length) {
        toast.warning(`${data.length - validData.length} ligne(s) ignorée(s) suite à la validation personnalisée`);
      }
    }
    
    if (validData.length === 0) {
      toast.error("Aucune donnée valide après validation");
      return false;
    }
    
    onComplete(validData);
    toast.success(`${validData.length} enregistrement(s) importé(s) avec succès`);
    return true;
  } catch (error) {
    console.error("Import error:", error);
    toast.error("Erreur lors de l'importation des données");
    return false;
  }
};

/**
 * Debounce function for search inputs
 */
export const debounce = <F extends (...args: any[]) => any>(
  fn: F,
  delay: number
): ((...args: Parameters<F>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<F>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};
