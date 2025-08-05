import React, { useState, useRef, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { 
  Package, 
  Plus, 
  ArrowUp, 
  ArrowDown,
  ChevronRight,
  X,
  Check,
  Save,
  FileUp,
  FileDown,
  BarChart2,
  Search,
  Filter,
  Trash2
} from 'lucide-react';
import { EditableTable, Column } from './ui/editable-table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { EditableField } from './ui/editable-field';
import ConfirmDialog from './inventory/ConfirmDialog';
import { 
  exportInventoryToCSV, 
  importInventoryFromCSV,
  exportInventoryToPDF,
  downloadInventoryTemplate,
  InventoryItem 
} from './inventory/ImportExportFunctions';
import InventoryFilters from './inventory/InventoryFilters';
import InventoryStats from './inventory/InventoryStats';
import InventoryAlerts from './inventory/InventoryAlerts';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ResponsiveContainer 
} from 'recharts';

const initialInventoryData = [
  { 
    id: 1, 
    name: 'Semences de blé', 
    category: 'Semences', 
    quantity: 500, 
    unit: 'kg', 
    minQuantity: 100, 
    price: 2.5,
    location: 'Hangar principal',
    lastUpdated: '2023-08-01'
  },
  { 
    id: 2, 
    name: 'Engrais NPK', 
    category: 'Engrais', 
    quantity: 800, 
    unit: 'kg', 
    minQuantity: 200, 
    price: 1.2,
    location: 'Hangar principal',
    lastUpdated: '2023-07-15'
  },
  { 
    id: 3, 
    name: 'Herbicide RoundUp', 
    category: 'Produits phytosanitaires', 
    quantity: 50, 
    unit: 'L', 
    minQuantity: 20, 
    price: 15,
    location: 'Local sécurisé',
    lastUpdated: '2023-08-10'
  },
  { 
    id: 4, 
    name: 'Carburant Diesel', 
    category: 'Carburants', 
    quantity: 350, 
    unit: 'L', 
    minQuantity: 100, 
    price: 1.8,
    location: 'Cuve extérieure',
    lastUpdated: '2023-08-18'
  },
  { 
    id: 5, 
    name: 'Semences de maïs', 
    category: 'Semences', 
    quantity: 80, 
    unit: 'kg', 
    minQuantity: 100, 
    price: 4.5,
    location: 'Hangar principal',
    lastUpdated: '2023-07-22'
  },
  { 
    id: 6, 
    name: 'Huile moteur', 
    category: 'Lubrifiants', 
    quantity: 25, 
    unit: 'L', 
    minQuantity: 10, 
    price: 5.2,
    location: 'Atelier',
    lastUpdated: '2023-06-30'
  },
  { 
    id: 7, 
    name: 'Ficelle pour bottes', 
    category: 'Consommables', 
    quantity: 15, 
    unit: 'rouleaux', 
    minQuantity: 5, 
    price: 25,
    location: 'Hangar matériel',
    lastUpdated: '2023-07-05'
  }
];

const initialTransactionHistory = [
  { id: 1, itemId: 1, type: 'out', quantity: 50, date: '2023-08-20', user: 'Jean Dupont', notes: 'Semis parcelle nord' },
  { id: 2, itemId: 2, type: 'out', quantity: 200, date: '2023-08-18', user: 'Jean Dupont', notes: 'Application parcelle est' },
  { id: 3, itemId: 4, type: 'in', quantity: 500, date: '2023-08-18', user: 'Marie Martin', notes: 'Livraison mensuelle' },
  { id: 4, itemId: 3, type: 'out', quantity: 5, date: '2023-08-15', user: 'Jean Dupont', notes: 'Application parcelle sud' },
  { id: 5, itemId: 1, type: 'in', quantity: 200, date: '2023-08-10', user: 'Marie Martin', notes: 'Achat supplémentaire' },
  { id: 6, itemId: 6, type: 'out', quantity: 5, date: '2023-08-05', user: 'Pierre Leroy', notes: 'Vidange tracteur' },
];

const initialCategoryStats = [
  { name: 'Semences', value: 580, fill: '#4CAF50' },
  { name: 'Engrais', value: 800, fill: '#8D6E63' },
  { name: 'Phytosanitaires', value: 50, fill: '#F44336' },
  { name: 'Carburants', value: 350, fill: '#2196F3' },
  { name: 'Lubrifiants', value: 25, fill: '#FFC107' },
  { name: 'Consommables', value: 15, fill: '#9C27B0' }
];

interface InventoryProps {
  dateRange?: DateRange;
  searchTerm?: string;
}

const Inventory: React.FC<InventoryProps> = ({ dateRange, searchTerm: externalSearchTerm }) => {
  const [inventoryData, setInventoryData] = useState(initialInventoryData);
  const [transactionHistory, setTransactionHistory] = useState(initialTransactionHistory);
  const [categoryStats, setCategoryStats] = useState(initialCategoryStats);
  
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm || '');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    quantity: 0,
    unit: '',
    minQuantity: 0,
    price: 0,
    location: '',
    notes: ''
  });
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [view, setView] = useState<'list' | 'detail' | 'stats'>('list');
  const [showTransactionForm, setShowTransactionForm] = useState<'in' | 'out' | null>(null);
  const [newTransaction, setNewTransaction] = useState({
    quantity: 0,
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null);
  const [transactionDeleteConfirmOpen, setTransactionDeleteConfirmOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (externalSearchTerm !== undefined) {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm]);
  
  const generateAlerts = () => {
    return inventoryData
      .filter(item => item.quantity <= item.minQuantity)
      .map(item => ({
        id: item.id,
        name: item.name,
        current: item.quantity,
        min: item.minQuantity,
        status: item.quantity < item.minQuantity * 0.5 ? 'critical' as const : 'warning' as const
      }));
  };
  
  const alerts = generateAlerts();
  
  const filteredItems = inventoryData
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (categoryFilter === 'all') return matchesSearch;
      return matchesSearch && item.category === categoryFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'quantity') {
        return sortOrder === 'asc' 
          ? a.quantity - b.quantity
          : b.quantity - a.quantity;
      } else if (sortBy === 'price') {
        return sortOrder === 'asc' 
          ? a.price - b.price
          : b.price - a.price;
      } else if (sortBy === 'lastUpdated') {
        return sortOrder === 'asc'
          ? new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
          : new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      }
      return 0;
    });
  
  const categories = ['all', ...new Set(inventoryData.map(item => item.category))];
  
  const handleExportData = () => {
    if (view === 'list') {
      exportInventoryToCSV(inventoryData);
    } else if (view === 'stats') {
      exportInventoryToPDF(inventoryData);
    }
  };
  
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    importInventoryFromCSV(file, (importedData) => {
      const existingIds = new Set(inventoryData.map(item => item.id));
      const newItems = importedData.filter(item => !existingIds.has(item.id));
      const updatedItems = importedData.filter(item => existingIds.has(item.id));
      
      const updatedInventory = inventoryData.map(item => {
        const updatedItem = updatedItems.find(update => update.id === item.id);
        return updatedItem || item;
      });
      
      setInventoryData([...updatedInventory, ...newItems]);
      
      updateCategoryStats([...updatedInventory, ...newItems]);
    }, {
      onProgress: (progress) => {
        if (progress === 100) {
          toast.success("Import terminé avec succès");
        }
      }
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const updateCategoryStats = (items: typeof inventoryData) => {
    const categories: Record<string, number> = {};
    const colors: Record<string, string> = {};
    
    categoryStats.forEach(stat => {
      colors[stat.name] = stat.fill;
    });
    
    items.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = 0;
        if (!colors[item.category]) {
          colors[item.category] = getRandomColor();
        }
      }
      categories[item.category] += item.quantity;
    });
    
    const newStats = Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      fill: colors[name]
    }));
    
    setCategoryStats(newStats);
  };
  
  const confirmDeleteItem = (id: number) => {
    setItemToDelete(id);
    setDeleteConfirmOpen(true);
  };
  
  const handleDeleteItem = () => {
    if (itemToDelete === null) return;
    
    const itemToDeleteObj = inventoryData.find(item => item.id === itemToDelete);
    if (!itemToDeleteObj) return;
    
    setInventoryData(inventoryData.filter(item => item.id !== itemToDelete));
    
    setCategoryStats(categoryStats.map(stat => 
      stat.name === itemToDeleteObj.category 
        ? { ...stat, value: Math.max(0, stat.value - itemToDeleteObj.quantity) }
        : stat
    ));
    
    if (selectedItem && selectedItem.id === itemToDelete) {
      setSelectedItem(null);
    }
    
    toast.success(`${itemToDeleteObj.name} a été supprimé de l'inventaire`);
    setItemToDelete(null);
    setDeleteConfirmOpen(false);
  };
  
  const confirmDeleteTransaction = (id: number) => {
    setTransactionToDelete(id);
    setTransactionDeleteConfirmOpen(true);
  };
  
  const handleDeleteTransaction = () => {
    if (transactionToDelete === null || !selectedItem) return;
    
    const transaction = transactionHistory.find(t => t.id === transactionToDelete);
    if (!transaction) return;
    
    const updatedTransactions = transactionHistory.filter(t => t.id !== transactionToDelete);
    setTransactionHistory(updatedTransactions);
    
    const quantityChange = transaction.type === 'in' 
      ? -transaction.quantity 
      : transaction.quantity;
    
    handleUpdateItem(
      selectedItem.id, 
      'quantity', 
      Math.max(0, selectedItem.quantity + quantityChange)
    );
    
    toast.success("Transaction supprimée et stock ajusté");
    setTransactionToDelete(null);
    setTransactionDeleteConfirmOpen(false);
  };
  
  const handleAddItem = () => {
    if (!newItem.name || !newItem.category || !newItem.unit) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    const newId = Math.max(...inventoryData.map(item => item.id), 0) + 1;
    const itemToAdd = {
      ...newItem,
      id: newId,
      lastUpdated: new Date().toISOString().split('T')[0],
      quantity: Number(newItem.quantity),
      minQuantity: Number(newItem.minQuantity),
      price: Number(newItem.price)
    };
    
    setInventoryData([...inventoryData, itemToAdd]);
    
    const existingCategoryStat = categoryStats.find(stat => stat.name === newItem.category);
    if (existingCategoryStat) {
      setCategoryStats(categoryStats.map(stat => 
        stat.name === newItem.category 
          ? { ...stat, value: stat.value + Number(newItem.quantity) }
          : stat
      ));
    } else {
      setCategoryStats([...categoryStats, { 
        name: newItem.category, 
        value: Number(newItem.quantity),
        fill: getRandomColor()
      }]);
    }
    
    setShowAddForm(false);
    setNewItem({
      name: '',
      category: '',
      quantity: 0,
      unit: '',
      minQuantity: 0,
      price: 0,
      location: '',
      notes: ''
    });
    
    toast.success(`${newItem.name} a été ajouté à l'inventaire`);
  };
  
  const getRandomColor = () => {
    const colors = ['#4CAF50', '#8D6E63', '#F44336', '#2196F3', '#FFC107', '#9C27B0', '#FF5722', '#3F51B5'];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  const handleUpdateItem = (id: number, field: string, value: any) => {
    setInventoryData(inventoryData.map(item => {
      if (item.id !== id) return item;
      
      const updatedItem = { 
        ...item, 
        [field]: value,
        lastUpdated: new Date().toISOString().split('T')[0] 
      };
      
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem(updatedItem);
      }
      
      return updatedItem;
    }));
    
    if (field === 'quantity') {
      const item = inventoryData.find(item => item.id === id);
      if (item) {
        const oldQuantity = item.quantity;
        const newQuantity = value;
        const diff = newQuantity - oldQuantity;
        
        setCategoryStats(categoryStats.map(stat => 
          stat.name === item.category 
            ? { ...stat, value: stat.value + diff }
            : stat
        ));
      }
    }
  };
  
  const handleAddTransaction = (type: 'in' | 'out') => {
    setShowTransactionForm(type);
  };
  
  const handleSubmitTransaction = () => {
    if (!selectedItem || !showTransactionForm || newTransaction.quantity <= 0) {
      toast.error("Veuillez spécifier une quantité valide");
      return;
    }
    
    const newId = Math.max(...transactionHistory.map(t => t.id), 0) + 1;
    const transaction = {
      id: newId,
      itemId: selectedItem.id,
      type: showTransactionForm,
      quantity: newTransaction.quantity,
      date: newTransaction.date,
      user: 'Utilisateur actuel',
      notes: newTransaction.notes
    };
    
    setTransactionHistory([transaction, ...transactionHistory]);
    
    const updatedQuantity = showTransactionForm === 'in' 
      ? selectedItem.quantity + newTransaction.quantity 
      : Math.max(0, selectedItem.quantity - newTransaction.quantity);
    
    handleUpdateItem(selectedItem.id, 'quantity', updatedQuantity);
    
    setShowTransactionForm(null);
    setNewTransaction({
      quantity: 0,
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    
    toast.success(`${newTransaction.quantity} ${selectedItem.unit} ${showTransactionForm === 'in' ? 'ajoutés' : 'retirés'} de l'inventaire`);
  };
  
  const itemTransactions = selectedItem 
    ? transactionHistory.filter(t => t.itemId === selectedItem.id).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    : [];

  const inventoryColumns: Column[] = [
    { id: 'name', header: 'Article', accessorKey: 'name', isEditable: true },
    { id: 'category', header: 'Catégorie', accessorKey: 'category', isEditable: true },
    { id: 'quantity', header: 'Quantité', accessorKey: 'quantity', type: 'number', isEditable: true },
    { id: 'price', header: 'Prix unitaire', accessorKey: 'price', type: 'number', isEditable: true },
    { id: 'value', header: 'Valeur totale', accessorKey: 'value', type: 'text', isEditable: false },
    { id: 'status', header: 'Statut', accessorKey: 'status', type: 'text', isEditable: false },
  ];

  const tableData = filteredItems.map(item => ({
    ...item,
    value: `${(item.quantity * item.price).toFixed(2)} €`,
    status: item.quantity <= item.minQuantity 
      ? item.quantity < item.minQuantity * 0.5 ? 'critical' : 'warning'
      : 'normal'
  }));

  const handleTableUpdate = (rowIndex: number, columnId: string, value: any) => {
    const item = filteredItems[rowIndex];
    if (!item) return;
    
    handleUpdateItem(item.id, columnId, value);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent, action: Function) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="animate-enter">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Gestion des Stocks</h1>
          <p className="text-muted-foreground">Gérez votre inventaire et suivez les niveaux de stock</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => setView('list')}
            className="px-4 py-2"
          >
            Liste
          </Button>
          <Button 
            variant={view === 'stats' ? 'default' : 'outline'}
            onClick={() => setView('stats')}
            className="px-4 py-2"
          >
            <BarChart2 className="mr-2 h-4 w-4" />
            Statistiques
          </Button>
          <Button 
            variant="outline"
            onClick={handleExportData}
            className="px-4 py-2"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <div className="relative">
            <Button 
              variant="outline"
              onClick={handleImportClick}
              className="px-4 py-2"
            >
              <FileUp className="mr-2 h-4 w-4" />
              Importer
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".csv"
              className="hidden" 
            />
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="ml-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un article
          </Button>
        </div>
      </header>

      <InventoryAlerts 
        alerts={alerts} 
        onQuantityChange={handleUpdateItem} 
      />

      {view === 'list' ? (
        selectedItem ? (
          <div className="border rounded-xl overflow-hidden">
            <div className="bg-agri-primary text-white p-4 flex justify-between items-center">
              <div className="flex items-center">
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="mr-3 hover:bg-white/10 p-1 rounded"
                  aria-label="Retour à la liste"
                >
                  <ChevronRight className="h-5 w-5 transform rotate-180" />
                </button>
                <EditableField 
                  value={selectedItem.name}
                  onSave={(value) => handleUpdateItem(selectedItem.id, 'name', value)}
                  className="text-xl font-semibold"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => handleAddTransaction('in')}
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-none"
                >
                  <ArrowDown className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Entrée</span>
                </Button>
                <Button 
                  onClick={() => handleAddTransaction('out')}
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-none"
                >
                  <ArrowUp className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Sortie</span>
                </Button>
                <Button 
                  onClick={() => confirmDeleteItem(selectedItem.id)}
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-none"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Supprimer</span>
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-medium mb-3">Détails de l'article</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Catégorie:</span>
                      <EditableField
                        value={selectedItem.category}
                        onSave={(value) => handleUpdateItem(selectedItem.id, 'category', value)}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Quantité:</span>
                      <div className="flex items-center">
                        <EditableField
                          value={selectedItem.quantity}
                          type="number"
                          onSave={(value) => handleUpdateItem(selectedItem.id, 'quantity', Number(value))}
                          className="font-medium"
                        />
                        <EditableField
                          value={selectedItem.unit}
                          onSave={(value) => handleUpdateItem(selectedItem.id, 'unit', value)}
                          className="ml-1"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Seuil minimal:</span>
                      <div className="flex items-center">
                        <EditableField
                          value={selectedItem.minQuantity}
                          type="number"
                          onSave={(value) => handleUpdateItem(selectedItem.id, 'minQuantity', Number(value))}
                        />
                        <span className="ml-1">{selectedItem.unit}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Prix unitaire:</span>
                      <div className="flex items-center">
                        <EditableField
                          value={selectedItem.price}
                          type="number"
                          onSave={(value) => handleUpdateItem(selectedItem.id, 'price', Number(value))}
                        />
                        <span className="ml-1">€/{selectedItem.unit}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Valeur totale:</span>
                      <span className="font-medium">{(selectedItem.quantity * selectedItem.price).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Emplacement:</span>
                      <EditableField
                        value={selectedItem.location}
                        onSave={(value) => handleUpdateItem(selectedItem.id, 'location', value)}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Dernière mise à jour:</span>
                      <span>{new Date(selectedItem.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-medium mb-3">Statistiques</h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Stock actuel', value: selectedItem.quantity },
                          { name: 'Seuil minimal', value: selectedItem.minQuantity }
                        ]}
                        margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} ${selectedItem.unit}`, '']} />
                        <Bar 
                          dataKey="value" 
                          fill="#4CAF50" 
                          radius={[4, 4, 0, 0]}
                          fillOpacity={1}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {showTransactionForm && (
                <div className="mb-6 p-4 border rounded-lg bg-muted/10">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">
                      {showTransactionForm === 'in' ? 'Nouvelle entrée' : 'Nouvelle sortie'}
                    </h3>
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowTransactionForm(null)}
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantité</Label>
                      <div className="flex items-center mt-1">
                        <Input
                          id="quantity"
                          type="number"
                          value={newTransaction.quantity}
                          onChange={(e) => setNewTransaction({
                            ...newTransaction,
                            quantity: parseInt(e.target.value) || 0
                          })}
                          min={0}
                        />
                        <span className="ml-2">{selectedItem.unit}</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newTransaction.date}
                        onChange={(e) => setNewTransaction({
                          ...newTransaction,
                          date: e.target.value
                        })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Input
                        id="notes"
                        value={newTransaction.notes}
                        onChange={(e) => setNewTransaction({
                          ...newTransaction,
                          notes: e.target.value
                        })}
                        placeholder="Commentaire..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowTransactionForm(null)}
                      className="mr-2"
                    >
                      Annuler
                    </Button>
                    <Button onClick={handleSubmitTransaction}>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Historique des transactions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-left">Quantité</th>
                        <th className="px-4 py-2 text-left">Utilisateur</th>
                        <th className="px-4 py-2 text-left">Notes</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemTransactions.map((transaction) => (
                        <tr key={transaction.id} className="border-t">
                          <td className="px-4 py-3">{new Date(transaction.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              transaction.type === 'in' 
                                ? 'bg-agri-success/10 text-agri-success' 
                                : 'bg-agri-warning/10 text-agri-warning'
                            }`}>
                              {transaction.type === 'in' ? (
                                <>
                                  <ArrowDown className="h-3 w-3 mr-1" />
                                  Entrée
                                </>
                              ) : (
                                <>
                                  <ArrowUp className="h-3 w-3 mr-1" />
                                  Sortie
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3">{transaction.quantity} {selectedItem.unit}</td>
                          <td className="px-4 py-3">{transaction.user}</td>
                          <td className="px-4 py-3">
                            <EditableField
                              value={transaction.notes}
                              onSave={(value) => {
                                const updatedTransactions = [...transactionHistory];
                                const index = updatedTransactions.findIndex(t => t.id === transaction.id);
                                if (index !== -1) {
                                  updatedTransactions[index] = {
                                    ...updatedTransactions[index],
                                    notes: value.toString()
                                  };
                                  setTransactionHistory(updatedTransactions);
                                }
                              }}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => confirmDeleteTransaction(transaction.id)}
                              className="p-1.5 hover:bg-agri-danger/10 text-agri-danger rounded"
                              title="Supprimer la transaction"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {itemTransactions.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 text-center text-muted-foreground">
                            Aucune transaction enregistrée
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <InventoryFilters 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                categories={categories}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder as (order: 'asc' | 'desc') => void}
              />
            </div>
            
            <EditableTable
              data={tableData}
              columns={inventoryColumns}
              onUpdate={handleTableUpdate}
              onDelete={(rowIndex) => confirmDeleteItem(filteredItems[rowIndex].id)}
              actions={[
                { 
                  icon: <ChevronRight className="h-4 w-4" />,
                  label: "Voir détails",
                  onClick: (rowIndex) => setSelectedItem(filteredItems[rowIndex])
                }
              ]}
              className="mb-6"
              sortable={true}
            />
            
            {showAddForm && (
              <div className="border rounded-xl p-6 bg-muted/5 animate-enter">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Ajouter un nouvel article</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAddForm(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="name">Nom de l'article*</Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      className="mt-1"
                      placeholder="Ex: Semences de blé"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Catégorie*</Label>
                    <Input
                      id="category"
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="mt-1"
                      list="categories-list"
                      placeholder="Ex: Semences"
                    />
                    <datalist id="categories-list">
                      {categories
                        .filter(cat => cat !== 'all')
                        .map((category) => (
                          <option key={category} value={category} />
                        ))}
                    </datalist>
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantité initiale*</Label>
                    <div className="flex mt-1">
                      <Input
                        id="quantity"
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                        min={0}
                      />
                      <Input
                        className="w-24 ml-2"
                        placeholder="Unité"
                        value={newItem.unit}
                        onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="minQuantity">Seuil minimal d'alerte</Label>
                    <Input
                      id="minQuantity"
                      type="number"
                      value={newItem.minQuantity}
                      onChange={(e) => setNewItem({ ...newItem, minQuantity: Number(e.target.value) })}
                      className="mt-1"
                      min={0}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Prix unitaire (€)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                      className="mt-1"
                      min={0}
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Emplacement</Label>
                    <Input
                      id="location"
                      value={newItem.location}
                      onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                      className="mt-1"
                      placeholder="Ex: Hangar principal"
                    />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label htmlFor="notes">Notes additionnelles</Label>
                    <Textarea
                      id="notes"
                      value={newItem.notes || ''}
                      onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                      className="mt-1"
                      placeholder="Informations complémentaires sur l'article..."
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)} 
                    className="mr-2"
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleAddItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter l'article
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        <InventoryStats 
          inventoryData={inventoryData} 
          categoryStats={categoryStats} 
        />
      )}

      <ConfirmDialog 
        open={deleteConfirmOpen} 
        title="Supprimer l'article" 
        description="Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleDeleteItem}
        onOpenChange={() => setDeleteConfirmOpen(false)}
      />

      <ConfirmDialog 
        open={transactionDeleteConfirmOpen} 
        title="Supprimer la transaction" 
        description="Êtes-vous sûr de vouloir supprimer cette transaction ? Le stock sera ajusté en conséquence."
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleDeleteTransaction}
        onOpenChange={() => setTransactionDeleteConfirmOpen(false)}
      />
    </div>
  );
};

export default Inventory;
