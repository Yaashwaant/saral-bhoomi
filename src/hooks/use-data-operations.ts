
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { enhancedExport, enhancedImport, searchInData, filterByDateRange, generateUniqueId } from '../utils/crm-operations';
import { DateRange } from 'react-day-picker';

interface UseDataOperationsProps<T> {
  initialData?: T[];
  idField?: string;
  dateField?: string;
  requiredFields?: string[];
  searchFields?: string[];
}

export function useDataOperations<T extends Record<string, any>>({
  initialData = [],
  idField = 'id',
  dateField = 'date',
  requiredFields = [],
  searchFields = []
}: UseDataOperationsProps<T> = {}) {
  const [data, setData] = useState<T[]>(initialData);
  const [filteredData, setFilteredData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // CRUD operations
  const addItem = useCallback((item: Omit<T, typeof idField>) => {
    const newItem = {
      ...item,
      [idField]: generateUniqueId(),
    } as T;
    
    setData(prev => [...prev, newItem]);
    setFilteredData(prev => [...prev, newItem]);
    toast.success("Élément ajouté avec succès");
    
    return newItem;
  }, [idField]);

  const updateItem = useCallback((id: number | string, updates: Partial<T>) => {
    setData(prev => 
      prev.map(item => 
        item[idField] === id ? { ...item, ...updates } : item
      )
    );
    
    setFilteredData(prev => 
      prev.map(item => 
        item[idField] === id ? { ...item, ...updates } : item
      )
    );
    
    toast.success("Élément mis à jour avec succès");
  }, [idField]);

  const deleteItem = useCallback((id: number | string) => {
    setData(prev => prev.filter(item => item[idField] !== id));
    setFilteredData(prev => prev.filter(item => item[idField] !== id));
    toast.success("Élément supprimé avec succès");
  }, [idField]);

  const bulkDelete = useCallback((ids: (number | string)[]) => {
    setData(prev => prev.filter(item => !ids.includes(item[idField])));
    setFilteredData(prev => prev.filter(item => !ids.includes(item[idField])));
    toast.success(`${ids.length} élément(s) supprimé(s) avec succès`);
  }, [idField]);

  // Search and filter operations
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    
    let filtered = data;
    
    // Apply search filter if term is provided
    if (term) {
      filtered = searchInData(filtered, term, searchFields);
    }
    
    // Apply date filter if date range is set
    if (dateRange?.from || dateRange?.to) {
      filtered = filterByDateRange(
        filtered, 
        dateRange.from ?? null, 
        dateRange.to ?? null, 
        dateField
      );
    }
    
    setFilteredData(filtered);
  }, [data, searchFields, dateRange, dateField]);

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    
    let filtered = data;
    
    // Apply search filter if term is provided
    if (searchTerm) {
      filtered = searchInData(filtered, searchTerm, searchFields);
    }
    
    // Apply date filter if date range is set
    if (range?.from || range?.to) {
      filtered = filterByDateRange(
        filtered, 
        range.from ?? null, 
        range.to ?? null, 
        dateField
      );
    } else {
      // If no date range, just apply search
      filtered = searchTerm ? searchInData(data, searchTerm, searchFields) : data;
    }
    
    setFilteredData(filtered);
  }, [data, searchTerm, searchFields, dateField]);

  // Import/Export operations
  const handleExport = useCallback(async (
    format: 'csv' | 'excel' | 'pdf',
    fileName: string,
    customData?: T[],
    options = {}
  ) => {
    const dataToExport = customData || filteredData;
    return enhancedExport(dataToExport, format, fileName, options);
  }, [filteredData]);

  const handleImport = useCallback((
    file: File,
    customValidation?: (row: any) => boolean
  ) => {
    setIsLoading(true);
    
    return enhancedImport(
      file,
      (importedData) => {
        setData(prev => [...prev, ...importedData as T[]]);
        setFilteredData(prev => [...prev, ...importedData as T[]]);
        setIsLoading(false);
      },
      requiredFields,
      customValidation
    ).catch(() => {
      setIsLoading(false);
      return false;
    });
  }, [requiredFields]);

  // Bulk operations
  const bulkUpdate = useCallback((ids: (number | string)[], updates: Partial<T>) => {
    setData(prev => 
      prev.map(item => 
        ids.includes(item[idField]) ? { ...item, ...updates } : item
      )
    );
    
    setFilteredData(prev => 
      prev.map(item => 
        ids.includes(item[idField]) ? { ...item, ...updates } : item
      )
    );
    
    toast.success(`${ids.length} élément(s) mis à jour avec succès`);
  }, [idField]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setDateRange(undefined);
    setFilteredData(data);
  }, [data]);

  // Set all data at once (useful for init or reset)
  const setAllData = useCallback((newData: T[]) => {
    setData(newData);
    setFilteredData(newData);
  }, []);

  return {
    data,
    filteredData,
    isLoading,
    searchTerm,
    dateRange,
    addItem,
    updateItem,
    deleteItem,
    bulkDelete,
    bulkUpdate,
    handleSearch,
    handleDateRangeChange,
    handleExport,
    handleImport,
    resetFilters,
    setAllData
  };
}

export default useDataOperations;
