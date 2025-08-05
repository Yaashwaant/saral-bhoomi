
import React, { useState } from 'react';
import { 
  MapPin, 
  Layers, 
  Calendar, 
  Filter,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertCircle,
  Save,
  X,
  Download,
  Upload,
  ChevronDown
} from 'lucide-react';
import { EditableField } from './ui/editable-field';
import { useToast } from "@/hooks/use-toast";
import { toast } from 'sonner';
import { EditableTable, Column } from './ui/editable-table';
import ParcelMap from './ParcelMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types for parcels
interface ParcelData {
  id: number;
  name: string;
  area: number;
  crop: string;
  status: 'active' | 'inactive' | 'planned';
  lastActivity: string;
  soilType: string;
  coordinates: { lat: number; lng: number };
  notes?: string;
  ph?: number;
  organicMatter?: number;
}

interface CropHistoryEntry {
  year: string;
  crop: string;
  yield: string;
  notes: string;
}

// Initial data for parcels
const initialParcelData: ParcelData[] = [
  { 
    id: 1, 
    name: 'Parcelle Nord', 
    area: 12.5, 
    crop: 'Blé', 
    status: 'active', 
    lastActivity: '2023-08-15', 
    soilType: 'Argileux', 
    coordinates: { lat: 45.4397, lng: 4.3872 },
    ph: 6.8,
    organicMatter: 3.2
  },
  { 
    id: 2, 
    name: 'Parcelle Est', 
    area: 8.3, 
    crop: 'Maïs', 
    status: 'active', 
    lastActivity: '2023-08-10', 
    soilType: 'Limoneux', 
    coordinates: { lat: 45.4412, lng: 4.3901 }
  },
  { 
    id: 3, 
    name: 'Parcelle Sud', 
    area: 15.7, 
    crop: 'Tournesol', 
    status: 'active', 
    lastActivity: '2023-08-05', 
    soilType: 'Sableux', 
    coordinates: { lat: 45.4380, lng: 4.3855 }
  },
  { 
    id: 4, 
    name: 'Parcelle Ouest', 
    area: 10.2, 
    crop: 'Orge', 
    status: 'inactive', 
    lastActivity: '2023-07-20', 
    soilType: 'Argileux-Limoneux', 
    coordinates: { lat: 45.4405, lng: 4.3840 }
  },
  { 
    id: 5, 
    name: 'Parcelle Centrale', 
    area: 6.8, 
    crop: 'Luzerne', 
    status: 'planned', 
    lastActivity: '2023-08-01', 
    soilType: 'Limoneux', 
    coordinates: { lat: 45.4390, lng: 4.3885 }
  },
];

// Initial crop history data
const initialCropHistory: CropHistoryEntry[] = [
  { year: '2022', crop: 'Maïs', yield: '8.2 t/ha', notes: 'Été sec' },
  { year: '2021', crop: 'Blé', yield: '7.5 t/ha', notes: '-' },
  { year: '2020', crop: 'Colza', yield: '3.8 t/ha', notes: 'Problèmes d\'insectes' }
];

// Component for the visual representation of a parcel
const ParcelCard = ({ 
  parcel, 
  onSelect, 
  onEdit,
  onDelete
}: { 
  parcel: ParcelData, 
  onSelect: (parcel: ParcelData) => void,
  onEdit: (parcel: ParcelData) => void,
  onDelete: (id: number) => void
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-agri-success';
      case 'inactive': return 'bg-agri-danger';
      case 'planned': return 'bg-agri-warning';
      default: return 'bg-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'planned': return 'Planifiée';
      default: return 'Inconnu';
    }
  };

  return (
    <div 
      className="border rounded-xl p-4 bg-white hover:shadow-md transition-shadow cursor-pointer card-hover"
      onClick={() => onSelect(parcel)}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium">{parcel.name}</h3>
        <div className={`flex items-center px-2 py-0.5 rounded-full text-xs ${getStatusColor(parcel.status)} bg-opacity-10 text-foreground`}>
          <span className={`w-2 h-2 rounded-full ${getStatusColor(parcel.status)} mr-1.5`}></span>
          {getStatusLabel(parcel.status)}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground mb-3">
        <div className="flex items-center">
          <Layers className="h-4 w-4 mr-1.5" />
          <span>{parcel.area} ha</span>
        </div>
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1.5" />
          <span>{new Date(parcel.lastActivity).toLocaleDateString()}</span>
        </div>
        <div className="col-span-2 mt-1 py-1 px-2 bg-agri-primary/5 rounded-md text-center">
          <span className="text-agri-primary font-medium">{parcel.crop}</span>
        </div>
      </div>
      
      <div className="flex justify-between mt-2 pt-2 border-t border-border">
        <button 
          className="p-1.5 hover:bg-gray-100 rounded"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(parcel);
          }}
        >
          <Edit className="h-4 w-4 text-muted-foreground" />
        </button>
        <button 
          className="p-1.5 hover:bg-gray-100 rounded"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(parcel);
          }}
        >
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </button>
        <button 
          className="p-1.5 hover:bg-gray-100 rounded text-agri-danger"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(parcel.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const ParcelManagement = () => {
  const [parcels, setParcels] = useState<ParcelData[]>(initialParcelData);
  const [selectedParcel, setSelectedParcel] = useState<ParcelData | null>(null);
  const [editingParcel, setEditingParcel] = useState<ParcelData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isEditing, setIsEditing] = useState(false);
  const [cropHistory, setCropHistory] = useState<CropHistoryEntry[]>(initialCropHistory);
  const [showAddParcelForm, setShowAddParcelForm] = useState(false);
  const [newParcel, setNewParcel] = useState<Partial<ParcelData>>({
    name: '',
    area: 0,
    crop: '',
    status: 'planned',
    lastActivity: new Date().toISOString().split('T')[0],
    soilType: '',
    coordinates: { lat: 45.4390, lng: 4.3885 }
  });
  const [parcelNotes, setParcelNotes] = useState<string>('');
  
  // Filter parcels based on search term and filter
  const filteredParcels = parcels.filter(parcel => {
    const matchesSearch = parcel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         parcel.crop.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         parcel.soilType.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    return matchesSearch && parcel.status === filter;
  });

  // Sort parcels
  const sortedParcels = [...filteredParcels].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'area':
        comparison = a.area - b.area;
        break;
      case 'crop':
        comparison = a.crop.localeCompare(b.crop);
        break;
      case 'date':
        comparison = new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime();
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSelectParcel = (parcel: ParcelData) => {
    setSelectedParcel(parcel);
    setIsEditing(false);
    // Set notes from the parcel
    setParcelNotes(parcel.notes || '');
  };

  const handleEditParcel = (parcel: ParcelData) => {
    setEditingParcel({...parcel});
    setSelectedParcel(parcel);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editingParcel) {
      // Include notes in the update
      const updatedParcel = {
        ...editingParcel,
        notes: parcelNotes
      };
      
      setParcels(parcels.map(p => p.id === updatedParcel.id ? updatedParcel : p));
      setSelectedParcel(updatedParcel);
      setIsEditing(false);
      toast.success('Parcelle mise à jour');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingParcel(null);
    // Reset notes to the original value
    if (selectedParcel) {
      setParcelNotes(selectedParcel.notes || '');
    }
  };

  const handleInputChange = (field: keyof ParcelData, value: string | number) => {
    if (editingParcel) {
      setEditingParcel(prev => {
        if (!prev) return null;
        
        if (field === 'area' || field === 'ph' || field === 'organicMatter') {
          return { ...prev, [field]: Number(value) };
        }
        
        return { ...prev, [field]: value };
      });
    }
  };

  const handleCoordinatesChange = (coordinates: { lat: number; lng: number }) => {
    if (editingParcel) {
      setEditingParcel({...editingParcel, coordinates});
    }
  };

  const handleStatusChange = (status: 'active' | 'inactive' | 'planned') => {
    if (editingParcel) {
      setEditingParcel({...editingParcel, status});
    }
  };

  const handleDeleteParcel = (id: number) => {
    setParcels(parcels.filter(p => p.id !== id));
    if (selectedParcel?.id === id) {
      setSelectedParcel(null);
    }
    toast.success('Parcelle supprimée');
  };

  const handleAddParcel = () => {
    setShowAddParcelForm(true);
  };

  const handleSaveNewParcel = () => {
    const newId = Math.max(0, ...parcels.map(p => p.id)) + 1;
    const createdParcel: ParcelData = {
      id: newId,
      name: newParcel.name || `Nouvelle Parcelle ${newId}`,
      area: newParcel.area || 0,
      crop: newParcel.crop || '',
      status: newParcel.status as ParcelData['status'] || 'planned',
      lastActivity: newParcel.lastActivity || new Date().toISOString().split('T')[0],
      soilType: newParcel.soilType || '',
      coordinates: newParcel.coordinates || { lat: 45.4390, lng: 4.3885 },
    };
    
    setParcels([...parcels, createdParcel]);
    setNewParcel({
      name: '',
      area: 0,
      crop: '',
      status: 'planned',
      lastActivity: new Date().toISOString().split('T')[0],
      soilType: '',
      coordinates: { lat: 45.4390, lng: 4.3885 }
    });
    setShowAddParcelForm(false);
    toast.success('Nouvelle parcelle créée');
  };

  const handleNewParcelInputChange = (field: keyof ParcelData, value: string | number) => {
    setNewParcel(prev => {
      if (field === 'area') {
        return { ...prev, [field]: Number(value) };
      }
      
      return { ...prev, [field]: value };
    });
  };

  const handleNewParcelCoordinatesChange = (coordinates: { lat: number; lng: number }) => {
    setNewParcel({...newParcel, coordinates});
  };

  const handleNewParcelStatusChange = (status: 'active' | 'inactive' | 'planned') => {
    setNewParcel({...newParcel, status});
  };

  // Crop history table columns
  const cropHistoryColumns: Column[] = [
    { id: 'year', header: 'Année', accessorKey: 'year', isEditable: true, width: '100px' },
    { id: 'crop', header: 'Culture', accessorKey: 'crop', isEditable: true },
    { id: 'yield', header: 'Rendement', accessorKey: 'yield', isEditable: true, width: '120px' },
    { id: 'notes', header: 'Remarques', accessorKey: 'notes', isEditable: true }
  ];

  const handleCropHistoryUpdate = (rowIndex: number, columnId: string, value: any) => {
    const updatedHistory = [...cropHistory];
    updatedHistory[rowIndex] = {
      ...updatedHistory[rowIndex],
      [columnId]: value
    };
    setCropHistory(updatedHistory);
    toast.success('Historique mis à jour');
  };

  const handleAddCropHistory = (newRow: Record<string, any>) => {
    setCropHistory([...cropHistory, {
      year: newRow.year || new Date().getFullYear().toString(),
      crop: newRow.crop || '',
      yield: newRow.yield || '',
      notes: newRow.notes || ''
    }]);
    toast.success('Entrée d\'historique ajoutée');
  };

  const handleDeleteCropHistory = (rowIndex: number) => {
    const updatedHistory = [...cropHistory];
    updatedHistory.splice(rowIndex, 1);
    setCropHistory(updatedHistory);
    toast.success('Entrée d\'historique supprimée');
  };
  
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };
  
  const handleBulkExport = () => {
    toast.success('Export des parcelles au format CSV lancé');
  };
  
  const handleBulkImport = () => {
    toast.success('Import de parcelles depuis CSV lancé');
  };
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setParcelNotes(e.target.value);
  };

  return (
    <div className="space-y-6">
      {showAddParcelForm && (
        <div className="mb-6 border rounded-xl p-4 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Ajouter une nouvelle parcelle</h2>
            <button 
              className="p-1.5 hover:bg-gray-100 rounded"
              onClick={() => setShowAddParcelForm(false)}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Nom</label>
                  <input 
                    type="text" 
                    value={newParcel.name || ''} 
                    onChange={(e) => handleNewParcelInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md"
                    placeholder="Nom de la parcelle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Surface (ha)</label>
                  <input 
                    type="number" 
                    value={newParcel.area || ''} 
                    onChange={(e) => handleNewParcelInputChange('area', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md"
                    placeholder="Surface en hectares"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Culture</label>
                  <input 
                    type="text" 
                    value={newParcel.crop || ''} 
                    onChange={(e) => handleNewParcelInputChange('crop', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md"
                    placeholder="Culture principale"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Type de sol</label>
                  <input 
                    type="text" 
                    value={newParcel.soilType || ''} 
                    onChange={(e) => handleNewParcelInputChange('soilType', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md"
                    placeholder="Type de sol"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Dernière activité</label>
                  <input 
                    type="date" 
                    value={newParcel.lastActivity || ''} 
                    onChange={(e) => handleNewParcelInputChange('lastActivity', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Statut</label>
                  <div className="flex space-x-2 mt-1">
                    <button 
                      className={`px-3 py-1.5 text-xs rounded-md ${newParcel.status === 'active' ? 'bg-agri-success text-white' : 'bg-muted'}`}
                      onClick={() => handleNewParcelStatusChange('active')}
                    >
                      Active
                    </button>
                    <button 
                      className={`px-3 py-1.5 text-xs rounded-md ${newParcel.status === 'planned' ? 'bg-agri-warning text-white' : 'bg-muted'}`}
                      onClick={() => handleNewParcelStatusChange('planned')}
                    >
                      Planifiée
                    </button>
                    <button 
                      className={`px-3 py-1.5 text-xs rounded-md ${newParcel.status === 'inactive' ? 'bg-agri-danger text-white' : 'bg-muted'}`}
                      onClick={() => handleNewParcelStatusChange('inactive')}
                    >
                      Inactive
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Position sur la carte</label>
              <ParcelMap 
                coordinates={newParcel.coordinates || { lat: 45.4390, lng: 4.3885 }}
                parcelName={newParcel.name || "Nouvelle parcelle"}
                isEditing={true}
                onCoordinatesChange={handleNewParcelCoordinatesChange}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button 
              className="mr-2 px-4 py-2 border rounded-lg hover:bg-muted"
              onClick={() => setShowAddParcelForm(false)}
            >
              Annuler
            </button>
            <button 
              className="px-4 py-2 bg-agri-primary text-white rounded-lg hover:bg-agri-primary-dark"
              onClick={handleSaveNewParcel}
            >
              Créer
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Parcel List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Liste des parcelles</h2>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleBulkExport}>
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkImport}>
                <Upload className="h-4 w-4 mr-1" />
                CSV
              </Button>
            </div>
          </div>
          
          <div className="flex gap-3 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-10 pr-4 py-2 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[120px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="planned">Planifiée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Sorting options */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={sortBy === 'name' ? 'bg-muted' : ''}
              onClick={() => handleSort('name')}
            >
              Nom
              {sortBy === 'name' && (
                <ChevronDown className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className={sortBy === 'area' ? 'bg-muted' : ''}
              onClick={() => handleSort('area')}
            >
              Surface
              {sortBy === 'area' && (
                <ChevronDown className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className={sortBy === 'crop' ? 'bg-muted' : ''}
              onClick={() => handleSort('crop')}
            >
              Culture
              {sortBy === 'crop' && (
                <ChevronDown className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className={sortBy === 'date' ? 'bg-muted' : ''}
              onClick={() => handleSort('date')}
            >
              Date
              {sortBy === 'date' && (
                <ChevronDown className={`h-4 w-4 ml-1 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
              )}
            </Button>
          </div>

          <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-2 custom-scrollbar">
            {sortedParcels.length > 0 ? (
              sortedParcels.map(parcel => (
                <ParcelCard 
                  key={parcel.id} 
                  parcel={parcel} 
                  onSelect={handleSelectParcel}
                  onEdit={handleEditParcel}
                  onDelete={handleDeleteParcel}
                />
              ))
            ) : (
              <div className="text-center py-8 px-4 border border-dashed rounded-lg">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Aucune parcelle trouvée avec ces critères</p>
              </div>
            )}
          </div>
          
          <Button 
            className="w-full mt-4" 
            onClick={handleAddParcel}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une parcelle
          </Button>
        </div>

        {/* Right Column - Map and Details */}
        <div className="lg:col-span-2">
          {selectedParcel ? (
            <div className="border rounded-xl overflow-hidden h-full">
              <div className="bg-agri-primary text-white p-4 flex justify-between items-center">
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editingParcel?.name || ''} 
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="px-2 py-1 bg-white/10 border border-white/30 rounded text-white text-xl w-full"
                  />
                ) : (
                  <h2 className="text-xl font-semibold">{selectedParcel.name}</h2>
                )}
                
                {isEditing ? (
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleSaveEdit}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full"
                    >
                      <Save className="h-5 w-5 text-white" />
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full"
                    >
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleEditParcel(selectedParcel)}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full"
                  >
                    <Edit className="h-5 w-5 text-white" />
                  </button>
                )}
              </div>
              
              <div className="p-4">
                <ParcelMap 
                  coordinates={isEditing ? (editingParcel?.coordinates || selectedParcel.coordinates) : selectedParcel.coordinates}
                  parcelName={isEditing ? (editingParcel?.name || '') : selectedParcel.name}
                  isEditing={isEditing}
                  onCoordinatesChange={handleCoordinatesChange}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Culture actuelle
                    </h3>
                    
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-muted-foreground">Culture</label>
                          <input 
                            type="text" 
                            value={editingParcel?.crop || ''} 
                            onChange={(e) => handleInputChange('crop', e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-md mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Statut</label>
                          <div className="flex space-x-2 mt-1">
                            <button 
                              className={`px-3 py-1.5 text-xs rounded-md ${editingParcel?.status === 'active' ? 'bg-agri-success text-white' : 'bg-muted'}`}
                              onClick={() => handleStatusChange('active')}
                            >
                              Active
                            </button>
                            <button 
                              className={`px-3 py-1.5 text-xs rounded-md ${editingParcel?.status === 'planned' ? 'bg-agri-warning text-white' : 'bg-muted'}`}
                              onClick={() => handleStatusChange('planned')}
                            >
                              Planifiée
                            </button>
                            <button 
                              className={`px-3 py-1.5 text-xs rounded-md ${editingParcel?.status === 'inactive' ? 'bg-agri-danger text-white' : 'bg-muted'}`}
                              onClick={() => handleStatusChange('inactive')}
                            >
                              Inactive
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Dernière activité</label>
                          <input 
                            type="date" 
                            value={editingParcel?.lastActivity || ''} 
                            onChange={(e) => handleInputChange('lastActivity', e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-md mt-1"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-agri-primary/10 rounded-lg p-3 text-center">
                        <span className="font-semibold text-agri-primary">{selectedParcel.crop}</span>
                        <p className="text-sm mt-1">Dernière activité: {new Date(selectedParcel.lastActivity).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3 flex items-center">
                      <Layers className="h-4 w-4 mr-2" />
                      Caractéristiques du sol
                    </h3>
                    
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-muted-foreground">Type de sol</label>
                          <input 
                            type="text" 
                            value={editingParcel?.soilType || ''} 
                            onChange={(e) => handleInputChange('soilType', e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-md mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">pH</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={editingParcel?.ph || ''} 
                            onChange={(e) => handleInputChange('ph', e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-md mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Matière organique (%)</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={editingParcel?.organicMatter || ''} 
                            onChange={(e) => handleInputChange('organicMatter', e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-md mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Surface (ha)</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={editingParcel?.area || ''} 
                            onChange={(e) => handleInputChange('area', e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-md mt-1"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Type:</span>
                          <span className="text-sm font-medium">{selectedParcel.soilType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">pH:</span>
                          <span className="text-sm font-medium">{selectedParcel.ph || 'Non spécifié'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Matière organique:</span>
                          <span className="text-sm font-medium">{selectedParcel.organicMatter ? `${selectedParcel.organicMatter}%` : 'Non spécifié'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Surface:</span>
                          <span className="text-sm font-medium">{selectedParcel.area} ha</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Notes section */}
                  <div className="border rounded-lg p-4 md:col-span-2">
                    <h3 className="font-medium mb-3">Notes</h3>
                    <textarea
                      className="w-full h-24 px-3 py-2 border border-input rounded-md"
                      placeholder="Ajouter des notes sur cette parcelle..."
                      value={parcelNotes}
                      onChange={handleNotesChange}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div className="border rounded-lg p-4 md:col-span-2">
                    <h3 className="font-medium mb-3">Historique des cultures</h3>
                    <EditableTable
                      data={cropHistory}
                      columns={cropHistoryColumns}
                      onUpdate={handleCropHistoryUpdate}
                      onDelete={handleDeleteCropHistory}
                      onAdd={handleAddCropHistory}
                      className="border-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border rounded-xl bg-muted h-full flex flex-col items-center justify-center p-6">
              <MapPin className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">Sélectionnez une parcelle</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Cliquez sur une parcelle dans la liste à gauche pour afficher ses détails et accéder à la carte
              </p>
              <Button 
                className="mt-6" 
                onClick={handleAddParcel}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une nouvelle parcelle
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParcelManagement;
