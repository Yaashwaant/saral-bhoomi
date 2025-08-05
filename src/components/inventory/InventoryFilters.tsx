
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface InventoryFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  categories: string[];
  sortBy: string;
  setSortBy: (field: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  className?: string;
}

const InventoryFilters = ({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  categories,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  className = ''
}: InventoryFiltersProps) => {
  
  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  return (
    <div className={`flex flex-col md:flex-row gap-3 ${className}`}>
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          type="text" 
          placeholder="Rechercher un article..." 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex gap-3">
        <div className="relative">
          <select 
            className="h-10 appearance-none pl-3 pr-8 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-white"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filtrer par catégorie"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'Toutes catégories' : category}
              </option>
            ))}
          </select>
          <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <span>Trier</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toggleSort('name')} className="flex justify-between">
              <span>Nom</span>
              {sortBy === 'name' && (
                <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleSort('quantity')} className="flex justify-between">
              <span>Quantité</span>
              {sortBy === 'quantity' && (
                <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleSort('price')} className="flex justify-between">
              <span>Prix</span>
              {sortBy === 'price' && (
                <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleSort('lastUpdated')} className="flex justify-between">
              <span>Date de mise à jour</span>
              {sortBy === 'lastUpdated' && (
                <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default InventoryFilters;
