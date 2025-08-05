
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, RefreshCw, X } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

interface FinancialDataFilterProps {
  timeFrame: string;
  setTimeFrame: (value: string) => void;
  categoryFilter?: string;
  setCategoryFilter?: (value: string) => void;
  categories?: string[];
  dateRange?: DateRange;
  setDateRange?: (range: DateRange | undefined) => void;
  onRefresh?: () => void;
  onClearFilters?: () => void;
  className?: string;
}

const FinancialDataFilter: React.FC<FinancialDataFilterProps> = ({
  timeFrame,
  setTimeFrame,
  categoryFilter,
  setCategoryFilter,
  categories = [],
  dateRange,
  setDateRange,
  onRefresh,
  onClearFilters,
  className = ''
}) => {
  const isMobile = useIsMobile();
  
  // Count active filters
  const activeFilters = [
    timeFrame !== 'all' ? 1 : 0,
    categoryFilter && categoryFilter !== 'all' ? 1 : 0,
    dateRange?.from ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const hasActiveFilters = activeFilters > 0;

  return (
    <div className={`p-3 md:p-4 bg-muted/30 rounded-lg ${className}`}>
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 md:gap-4 mb-3 md:mb-4">
        <h3 className="text-sm md:text-base font-medium flex items-center gap-1 md:gap-2">
          <Filter className="h-3.5 w-3.5 md:h-4 md:w-4" />
          Filtres
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 md:ml-2 text-xs">
              {activeFilters} actif{activeFilters > 1 ? 's' : ''}
            </Badge>
          )}
        </h3>
        
        <div className="flex gap-1 md:gap-2">
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              className="text-xs h-7 md:h-8"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              {!isMobile && "Actualiser"}
            </Button>
          )}
          
          {hasActiveFilters && onClearFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearFilters}
              className="text-xs text-muted-foreground hover:text-foreground h-7 md:h-8"
            >
              <X className="h-3 w-3 mr-1" />
              {!isMobile && "Effacer"}
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">Période</label>
          <Select value={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les périodes</SelectItem>
              <SelectItem value="month">Mois en cours</SelectItem>
              <SelectItem value="quarter">Trimestre en cours</SelectItem>
              <SelectItem value="year">Année en cours</SelectItem>
              <SelectItem value="custom">Période personnalisée</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {categories.length > 0 && setCategoryFilter && (
          <div className="space-y-1">
            <label className="text-xs font-medium">Catégorie</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'Toutes catégories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {timeFrame === 'custom' && setDateRange && (
          <div className="space-y-1 col-span-full md:col-span-1">
            <label className="text-xs font-medium">Dates</label>
            <DatePickerWithRange 
              date={dateRange} 
              setDate={setDateRange} 
              className="w-full h-8 md:h-10"
            />
          </div>
        )}
      </div>
      
      {dateRange?.from && dateRange.to && (
        <div className="mt-2 md:mt-3 text-xs md:text-sm flex items-center">
          <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
          <span className="text-muted-foreground">
            {format(dateRange.from, 'dd/MM/yyyy', { locale: fr })} 
            {" au "} 
            {format(dateRange.to, 'dd/MM/yyyy', { locale: fr })}
          </span>
        </div>
      )}
    </div>
  );
};

export default FinancialDataFilter;
