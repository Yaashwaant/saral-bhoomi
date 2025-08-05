
import React, { useState } from 'react';
import { Search, Filter, Calendar, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { DateRange } from 'react-day-picker';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ParcelFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterType: string;
  setFilterType: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  dateRange?: DateRange;
  setDateRange?: (dateRange: DateRange | undefined) => void;
  areaRange?: [number, number];
  setAreaRange?: (range: [number, number]) => void;
}

const ParcelFilters = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterType,
  setFilterType,
  onSearch,
  dateRange,
  setDateRange,
  areaRange = [0, 50],
  setAreaRange
}: ParcelFiltersProps) => {
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [tempAreaRange, setTempAreaRange] = useState<[number, number]>(areaRange);

  const handleAreaRangeChange = (newValues: number[]) => {
    setTempAreaRange([newValues[0], newValues[1]]);
  };

  const applyAdvancedFilters = () => {
    if (setAreaRange) {
      setAreaRange(tempAreaRange);
    }
    setIsAdvancedFiltersOpen(false);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <form onSubmit={onSearch} className="flex">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Rechercher une parcelle..."
            className="pl-9 w-full md:w-48"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </form>
      
      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-[180px]">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="active">Parcelles actives</SelectItem>
          <SelectItem value="fallow">En jachère</SelectItem>
          <SelectItem value="planned">Planifiées</SelectItem>
          <SelectItem value="rented">Louées</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={filterType} onValueChange={setFilterType}>
        <SelectTrigger className="w-[180px]">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les types</SelectItem>
          <SelectItem value="field">Champs</SelectItem>
          <SelectItem value="greenhouse">Serres</SelectItem>
          <SelectItem value="orchard">Vergers</SelectItem>
          <SelectItem value="experimental">Expérimentales</SelectItem>
        </SelectContent>
      </Select>

      {dateRange && setDateRange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex gap-2">
              <Calendar className="h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
                  </>
                ) : (
                  format(dateRange.from, 'dd/MM/yyyy')
                )
              ) : (
                "Sélectionner des dates"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={fr}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      )}

      <Popover open={isAdvancedFiltersOpen} onOpenChange={setIsAdvancedFiltersOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filtres avancés
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-medium">Superficie (hectares)</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">{tempAreaRange[0]} ha</span>
                <span className="text-sm">{tempAreaRange[1]} ha</span>
              </div>
              <Slider
                defaultValue={tempAreaRange}
                min={0}
                max={50}
                step={1}
                onValueChange={handleAreaRangeChange}
              />
            </div>
            
            <div className="pt-2 flex justify-end">
              <Button 
                type="button" 
                onClick={applyAdvancedFilters}
                className="bg-agri-primary hover:bg-agri-primary-dark text-white"
              >
                Appliquer les filtres
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ParcelFilters;
