
import React, { useState } from 'react';
import { CultureDetailTable } from './CultureDetailTable';
import { Button } from './ui/button';
import { Plus, Download, Upload, Filter, Search, FileUp, Eye, Printer } from 'lucide-react';
import { Input } from './ui/input';
import { useCRM } from '../contexts/CRMContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from 'framer-motion';
import PreviewPrintButton from './common/PreviewPrintButton';

const GuadeloupeSpecificCrops = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { exportModuleData, importModuleData, getModuleData } = useCRM();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Get cultures data for preview/print
  const culturesData = getModuleData('cultures').items || [];

  const handleAddCulture = () => {
    setShowAddForm(true);
    console.log("Ouverture du formulaire d'ajout de culture");
  };

  const handleExportData = async (format: 'csv' | 'pdf' = 'csv') => {
    console.log(`Export en cours au format ${format}...`);
    const success = await exportModuleData('cultures', format);
    
    if (success) {
      console.log(`Les données des cultures ont été exportées en ${format.toUpperCase()}`);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log(`Import ${file.name} en cours...`);
      const success = await importModuleData('cultures', file);
      
      if (success) {
        console.log("Import réussi - Les données des cultures ont été mises à jour");
      }
    }
  };

  const filterOptions = [
    { value: 'all', label: 'Toutes les cultures' },
    { value: 'fruits', label: 'Fruits' },
    { value: 'vegetables', label: 'Légumes' },
    { value: 'tubers', label: 'Tubercules' },
    { value: 'cash', label: 'Cultures de rente' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Cultures Spécifiques de Guadeloupe</h2>
          <p className="text-muted-foreground">Gérez les informations sur vos cultures locales</p>
        </div>
        <div className="flex space-x-2">
          <PreviewPrintButton 
            data={culturesData}
            moduleName="cultures"
            title="Cultures Spécifiques de Guadeloupe"
            columns={[
              { key: "nom", header: "Nom" },
              { key: "variete", header: "Variété" },
              { key: "dateDebut", header: "Date de début" },
              { key: "dateFin", header: "Date de fin" }
            ]}
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="transition-colors hover:bg-gray-100">
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border shadow-lg">
              <DropdownMenuItem onClick={() => handleExportData('csv')} className="cursor-pointer">
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportData('pdf')} className="cursor-pointer">
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="transition-colors hover:bg-gray-100">
                <Upload className="mr-2 h-4 w-4" />
                Importer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border shadow-lg">
              <DropdownMenuItem onClick={handleImportClick} className="cursor-pointer">
                <FileUp className="mr-2 h-4 w-4" />
                Sélectionner un fichier
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            accept=".csv,.xlsx"
            onChange={handleFileChange}
          />
          
          <Button 
            onClick={handleAddCulture} 
            className="transition-colors hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une culture
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Rechercher une culture..." 
            className="pl-10 transition-all focus:border-green-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <select 
            className={cn(
              "h-10 appearance-none pl-3 pr-10 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-white transition-all"
            )}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {filterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border p-6 mb-6 shadow-sm"
      >
        <CultureDetailTable 
          showAddForm={showAddForm} 
          setShowAddForm={setShowAddForm} 
          searchTerm={searchTerm}
          filterType={filterType}
        />
      </motion.div>
    </motion.div>
  );
};

export default GuadeloupeSpecificCrops;
