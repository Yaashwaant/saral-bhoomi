import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit,
  Sprout,
  ArrowRight,
  Check,
  X,
  Save
} from 'lucide-react';
import { EditableField } from './ui/editable-field';
import { EditableTable, Column } from './ui/editable-table';
import { toast } from 'sonner';

// Define the string literal types first to ensure type safety
type CropStatus = 'growing' | 'harvested' | 'planned';
type TaskPriority = 'high' | 'medium' | 'low';

// Mock data for crop planning - Adapté à l'agriculture en Guadeloupe
const initialCropsData = [
  { 
    id: 1, 
    name: 'Canne à Sucre', 
    variety: 'R579', 
    parcel: 'Grande-Terre Nord', 
    plantingDate: '2023-02-15', 
    harvestDate: '2024-02-15', 
    status: 'growing' as CropStatus,
    area: 15.5 
  },
  { 
    id: 2, 
    name: 'Banane', 
    variety: 'Poyo', 
    parcel: 'Basse-Terre Sud', 
    plantingDate: '2023-04-10', 
    harvestDate: '2023-12-10', 
    status: 'growing' as CropStatus,
    area: 8.3
  },
  { 
    id: 3, 
    name: 'Ananas', 
    variety: 'Bouteille', 
    parcel: 'Capesterre', 
    plantingDate: '2023-05-20', 
    harvestDate: '2024-01-20', 
    status: 'growing' as CropStatus,
    area: 4.7 
  },
  { 
    id: 4, 
    name: 'Igname', 
    variety: 'Pacala', 
    parcel: 'Nord Grande-Terre', 
    plantingDate: '2023-09-15', 
    harvestDate: '2024-03-15', 
    status: 'planned' as CropStatus,
    area: 5.2 
  },
  { 
    id: 5, 
    name: 'Madère', 
    variety: 'Blanche', 
    parcel: 'Marie-Galante', 
    plantingDate: '2023-04-01', 
    harvestDate: '2023-11-01', 
    status: 'growing' as CropStatus,
    area: 3.8 
  }
];

// Tasks related to crops - Adapté au contexte guadeloupéen
const initialCropTasks = [
  { id: 1, cropId: 1, title: 'Fertilisation de la canne', date: '2023-09-25', completed: false, priority: 'high' as TaskPriority },
  { id: 2, cropId: 2, title: 'Traitement contre la cercosporiose', date: '2023-09-28', completed: false, priority: 'medium' as TaskPriority },
  { id: 3, cropId: 3, title: 'Inspection croissance ananas', date: '2023-09-30', completed: false, priority: 'low' as TaskPriority },
  { id: 4, cropId: 5, title: 'Désherbage parcelle madère', date: '2023-10-05', completed: false, priority: 'medium' as TaskPriority },
  { id: 5, cropId: 1, title: 'Préparation coupe canne', date: '2024-01-10', completed: false, priority: 'high' as TaskPriority }
];

// Monthly calendar view mock data - Adapté à l'agriculture guadeloupéenne
const monthlyEvents = [
  { date: '2023-09-25', events: [{ id: 1, title: 'Fertilisation de la canne', crop: 'Canne à Sucre', priority: 'high' }] },
  { date: '2023-09-28', events: [{ id: 2, title: 'Traitement contre la cercosporiose', crop: 'Banane', priority: 'medium' }] },
  { date: '2023-09-30', events: [{ id: 3, title: 'Inspection croissance ananas', crop: 'Ananas', priority: 'low' }] },
  { date: '2023-10-05', events: [{ id: 4, title: 'Désherbage parcelle madère', crop: 'Madère', priority: 'medium' }] },
  { date: '2024-01-10', events: [{ id: 5, title: 'Préparation coupe canne', crop: 'Canne à Sucre', priority: 'high' }] },
  { date: '2023-12-10', events: [{ id: 6, title: 'Récolte', crop: 'Banane', priority: 'high' }] },
  { date: '2024-01-20', events: [{ id: 7, title: 'Récolte', crop: 'Ananas', priority: 'high' }] },
  { date: '2023-11-01', events: [{ id: 8, title: 'Récolte', crop: 'Madère', priority: 'medium' }] },
  { date: '2024-02-15', events: [{ id: 9, title: 'Coupe canne', crop: 'Canne à Sucre', priority: 'high' }] }
];

interface CropData {
  id: number;
  name: string;
  variety: string;
  parcel: string;
  plantingDate: string;
  harvestDate: string;
  status: CropStatus;
  area: number;
}

interface CropTask {
  id: number;
  cropId: number;
  title: string;
  date: string;
  completed: boolean;
  priority: TaskPriority;
}

const CropCard = ({ 
  crop, 
  onEdit, 
  onDelete 
}: { 
  crop: CropData; 
  onEdit: (crop: CropData) => void;
  onDelete: (id: number) => void;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'growing': return 'bg-agri-success';
      case 'harvested': return 'bg-agri-primary';
      case 'planned': return 'bg-agri-warning';
      default: return 'bg-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'growing': return 'En croissance';
      case 'harvested': return 'Récolté';
      case 'planned': return 'Planté';
      default: return 'Inconnu';
    }
  };

  const daysRemaining = () => {
    const today = new Date();
    const harvest = new Date(crop.harvestDate);
    const diffTime = Math.abs(harvest.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="border rounded-xl p-4 bg-white hover:shadow-md transition-shadow card-hover">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium">{crop.name}</h3>
          <p className="text-xs text-muted-foreground">{crop.variety}</p>
        </div>
        <div className={`flex items-center px-2 py-0.5 rounded-full text-xs ${getStatusColor(crop.status)} bg-opacity-10 text-foreground`}>
          <span className={`w-2 h-2 rounded-full ${getStatusColor(crop.status)} mr-1.5`}></span>
          {getStatusLabel(crop.status)}
        </div>
      </div>
      
      <div className="bg-muted rounded-lg p-3 mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span>Parcelle:</span>
          <span className="font-medium">{crop.parcel}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span>Superficie:</span>
          <span className="font-medium">{crop.area} ha</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Jours avant récolte:</span>
          <span className="font-medium">{daysRemaining()}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex flex-col items-center p-2 bg-agri-primary/5 rounded-md">
          <span className="text-muted-foreground">Semis</span>
          <span className="font-medium">{new Date(crop.plantingDate).toLocaleDateString()}</span>
        </div>
        <div className="flex flex-col items-center p-2 bg-agri-accent/5 rounded-md">
          <span className="text-muted-foreground">Récolte</span>
          <span className="font-medium">{new Date(crop.harvestDate).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="flex justify-between mt-3 pt-3 border-t border-border">
        <button 
          className="p-1.5 hover:bg-gray-100 rounded"
          onClick={() => onEdit(crop)}
        >
          <Edit className="h-4 w-4 text-muted-foreground" />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button 
          className="p-1.5 hover:bg-gray-100 rounded text-agri-danger"
          onClick={() => onDelete(crop.id)}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const CropPlanning = () => {
  const [cropsData, setCropsData] = useState<CropData[]>(initialCropsData);
  const [cropTasks, setCropTasks] = useState<CropTask[]>(initialCropTasks);
  const [currentView, setCurrentView] = useState<'list' | 'calendar'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showCropForm, setShowCropForm] = useState(false);
  const [editingCrop, setEditingCrop] = useState<CropData | null>(null);
  const [newTask, setNewTask] = useState<Partial<CropTask>>({
    title: '',
    cropId: 0,
    date: new Date().toISOString().split('T')[0],
    priority: 'medium',
    completed: false
  });
  const [newCrop, setNewCrop] = useState<Partial<CropData>>({
    name: '',
    variety: '',
    parcel: '',
    plantingDate: new Date().toISOString().split('T')[0],
    harvestDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
    status: 'planned',
    area: 0
  });
  
  const filteredCrops = cropsData.filter(crop => 
    crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crop.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crop.parcel.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: '', date: null, events: [] });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day).toISOString().split('T')[0];
      const dayEvents = monthlyEvents.find(event => event.date === date)?.events || [];
      days.push({ day, date, events: dayEvents });
    }
    
    return days;
  };
  
  const calendarDays = generateCalendarDays();
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const formatMonth = () => {
    return currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const handleEditCrop = (crop: CropData) => {
    setEditingCrop({...crop});
    setShowCropForm(true);
  };

  const handleAddCrop = () => {
    setEditingCrop(null);
    setNewCrop({
      name: '',
      variety: '',
      parcel: '',
      plantingDate: new Date().toISOString().split('T')[0],
      harvestDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
      status: 'planned',
      area: 0
    });
    setShowCropForm(true);
  };

  const handleDeleteCrop = (id: number) => {
    setCropsData(cropsData.filter(crop => crop.id !== id));
    setCropTasks(cropTasks.filter(task => task.cropId !== id));
    toast.success('Culture supprimée avec succès');
  };

  const handleSaveCrop = () => {
    if (editingCrop) {
      setCropsData(cropsData.map(crop => 
        crop.id === editingCrop.id ? editingCrop : crop
      ));
      toast.success('Culture mise à jour avec succès');
    } else if (newCrop.name && newCrop.parcel) {
      const newId = Math.max(0, ...cropsData.map(c => c.id)) + 1;
      setCropsData([...cropsData, { 
        id: newId,
        name: newCrop.name || '',
        variety: newCrop.variety || '',
        parcel: newCrop.parcel || '',
        plantingDate: newCrop.plantingDate || new Date().toISOString().split('T')[0],
        harvestDate: newCrop.harvestDate || new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
        status: newCrop.status as CropStatus || 'planned',
        area: newCrop.area || 0
      } as CropData]);
      toast.success('Nouvelle culture ajoutée');
    } else {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setShowCropForm(false);
  };

  const handleSaveTask = () => {
    if (!newTask.title || !newTask.cropId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const newId = Math.max(0, ...cropTasks.map(t => t.id)) + 1;
    const taskToAdd = {
      id: newId,
      cropId: Number(newTask.cropId),
      title: newTask.title,
      date: newTask.date || new Date().toISOString().split('T')[0],
      completed: false,
      priority: newTask.priority as TaskPriority || 'medium'
    } as CropTask;

    setCropTasks([...cropTasks, taskToAdd]);
    setShowTaskForm(false);
    toast.success('Nouvelle tâche ajoutée');
  };

  const handleTaskUpdate = (index: number, field: string, value: any) => {
    const updatedTasks = [...cropTasks];
    (updatedTasks[index] as any)[field] = value;
    setCropTasks(updatedTasks);
  };

  const handleTaskDelete = (index: number) => {
    const updatedTasks = [...cropTasks];
    updatedTasks.splice(index, 1);
    setCropTasks(updatedTasks);
    toast.success('Tâche supprimée');
  };

  const taskColumns: Column[] = [
    { id: 'title', header: 'Tâche', accessorKey: 'title', isEditable: true },
    { 
      id: 'crop', 
      header: 'Culture', 
      accessorKey: 'cropId', 
      isEditable: false,
    },
    { id: 'date', header: 'Date', accessorKey: 'date', isEditable: true },
    { 
      id: 'priority', 
      header: 'Priorité', 
      accessorKey: 'priority',
      isEditable: true,
      type: 'select',
      options: ['high', 'medium', 'low']
    },
  ];

  const tasksTableData = cropTasks.map(task => {
    const relatedCrop = cropsData.find(crop => crop.id === task.cropId);
    return {
      ...task,
      cropName: relatedCrop?.name || 'Inconnu'
    };
  });
  
  return (
    <div className="p-6 animate-enter">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Planification des Cultures Guadeloupéennes</h1>
          <p className="text-muted-foreground">Gérez les cultures locales et planifiez vos activités agricoles</p>
        </div>
        <div className="flex space-x-2">
          <button 
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'list' 
                ? 'bg-agri-primary text-white' 
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
            onClick={() => setCurrentView('list')}
          >
            Liste
          </button>
          <button 
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'calendar' 
                ? 'bg-agri-primary text-white' 
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
            onClick={() => setCurrentView('calendar')}
          >
            Calendrier
          </button>
          <button 
            className="inline-flex items-center justify-center px-4 py-2 bg-agri-primary text-white rounded-lg hover:bg-agri-primary-dark transition-colors whitespace-nowrap ml-2"
            onClick={() => setShowTaskForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle tâche
          </button>
        </div>
      </header>

      {currentView === 'list' ? (
        <>
          <div className="flex gap-3 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Rechercher une culture..." 
                className="pl-10 pr-4 py-2 w-full border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              className="inline-flex items-center justify-center px-4 py-2 bg-agri-primary text-white rounded-lg hover:bg-agri-primary-dark transition-colors whitespace-nowrap"
              onClick={handleAddCrop}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une culture
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCrops.map(crop => (
              <CropCard 
                key={crop.id} 
                crop={crop}
                onEdit={handleEditCrop}
                onDelete={handleDeleteCrop}
              />
            ))}
          </div>

          <div className="mt-8 border rounded-xl p-6 bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tâches à venir</h2>
              <button 
                className="text-sm text-agri-primary hover:underline"
                onClick={() => setShowTaskForm(true)}
              >
                Ajouter une tâche
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Tâche</th>
                    <th className="px-4 py-2 text-left">Culture</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Priorité</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cropTasks.map((task, index) => {
                    const relatedCrop = cropsData.find(crop => crop.id === task.cropId);
                    
                    return (
                      <tr key={task.id} className="border-t">
                        <td className="px-4 py-3">
                          <EditableField
                            value={task.title}
                            onSave={(value) => handleTaskUpdate(index, 'title', value)}
                          />
                        </td>
                        <td className="px-4 py-3">{relatedCrop?.name}</td>
                        <td className="px-4 py-3">
                          <EditableField
                            type="text"
                            value={task.date}
                            onSave={(value) => handleTaskUpdate(index, 'date', value)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span 
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              task.priority === 'high' 
                                ? 'bg-agri-danger/10 text-agri-danger' 
                                : task.priority === 'medium' 
                                  ? 'bg-agri-warning/10 text-agri-warning' 
                                  : 'bg-agri-success/10 text-agri-success'
                            }`}
                          >
                            <select
                              value={task.priority}
                              onChange={(e) => handleTaskUpdate(index, 'priority', e.target.value)}
                              className="bg-transparent border-none focus:outline-none p-0 m-0"
                            >
                              <option value="high">Haute</option>
                              <option value="medium">Moyenne</option>
                              <option value="low">Basse</option>
                            </select>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button 
                              className="p-1 hover:bg-gray-100 rounded-full"
                              onClick={() => {
                                handleTaskUpdate(index, 'completed', !task.completed);
                                toast.success(task.completed ? 'Tâche marquée comme non-terminée' : 'Tâche terminée !');
                              }}
                            >
                              <Check className={`h-4 w-4 ${task.completed ? 'text-agri-success' : 'text-gray-400'}`} />
                            </button>
                            <button 
                              className="p-1 hover:bg-gray-100 rounded-full"
                              onClick={() => handleTaskDelete(index)}
                            >
                              <Trash2 className="h-4 w-4 text-agri-danger" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="border rounded-xl p-6 bg-white">
          <div className="flex justify-between items-center mb-6">
            <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold capitalize">{formatMonth()}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-full">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
              <div key={day} className="text-center font-medium text-sm py-2 text-muted-foreground">
                {day}
              </div>
            ))}
            
            {calendarDays.map((day, i) => (
              <div 
                key={i} 
                className={`min-h-[100px] p-1 border ${
                  day.day ? 'bg-white' : 'bg-muted/30'
                } rounded-md`}
              >
                {day.day && (
                  <>
                    <div className="text-right text-sm p-1">{day.day}</div>
                    <div className="space-y-1">
                      {day.events.map(event => (
                        <div 
                          key={event.id} 
                          className={`text-xs p-1 rounded truncate ${
                            event.priority === 'high' 
                              ? 'bg-agri-danger/10 text-agri-danger' 
                              : event.priority === 'medium' 
                                ? 'bg-agri-warning/10 text-agri-warning' 
                                : 'bg-agri-success/10 text-agri-success'
                          }`}
                          title={`${event.title} - ${event.crop}`}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Ajouter une tâche</h2>
              <button 
                onClick={() => setShowTaskForm(false)}
                className="p-1 hover:bg-muted rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-input rounded-md"
                  placeholder="Nom de la tâche"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Culture</label>
                <select 
                  className="w-full px-3 py-2 border border-input rounded-md"
                  value={newTask.cropId || ''}
                  onChange={(e) => setNewTask({...newTask, cropId: Number(e.target.value)})}
                >
                  <option value="">Sélectionner une culture</option>
                  {cropsData.map(crop => (
                    <option key={crop.id} value={crop.id}>
                      {crop.name} - {crop.parcel}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-input rounded-md"
                  value={newTask.date}
                  onChange={(e) => setNewTask({...newTask, date: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Priorité</label>
                <select 
                  className="w-full px-3 py-2 border border-input rounded-md"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value as 'high' | 'medium' | 'low'})}
                >
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea 
                  className="w-full px-3 py-2 border border-input rounded-md"
                  rows={3}
                  placeholder="Détails supplémentaires..."
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="px-4 py-2 text-sm text-foreground bg-muted rounded-md hover:bg-muted/80"
                >
                  Annuler
                </button>
                <button 
                  type="button"
                  onClick={handleSaveTask}
                  className="px-4 py-2 text-sm text-white bg-agri-primary rounded-md hover:bg-agri-primary-dark"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCropForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingCrop ? 'Modifier une culture' : 'Ajouter une culture'}
              </h2>
              <button 
                onClick={() => setShowCropForm(false)}
                className="p-1 hover:bg-muted rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom*</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-input rounded-md"
                  placeholder="Nom de la culture"
                  value={editingCrop ? editingCrop.name : newCrop.name}
                  onChange={(e) => {
                    if (editingCrop) {
                      setEditingCrop({...editingCrop, name: e.target.value});
                    } else {
                      setNewCrop({...newCrop, name: e.target.value});
                    }
                  }}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Variété</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-input rounded-md"
                  placeholder="Variété"
                  value={editingCrop ? editingCrop.variety : newCrop.variety}
                  onChange={(e) => {
                    if (editingCrop) {
                      setEditingCrop({...editingCrop, variety: e.target.value});
                    } else {
                      setNewCrop({...newCrop, variety: e.target.value});
                    }
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Parcelle*</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-input rounded-md"
                  placeholder="Nom de la parcelle"
                  value={editingCrop ? editingCrop.parcel : newCrop.parcel}
                  onChange={(e) => {
                    if (editingCrop) {
                      setEditingCrop({...editingCrop, parcel: e.target.value});
                    } else {
                      setNewCrop({...newCrop, parcel: e.target.value});
                    }
                  }}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date de plantation</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-input rounded-md"
                    value={editingCrop ? editingCrop.plantingDate : newCrop.plantingDate}
                    onChange={(e) => {
                      if (editingCrop) {
                        setEditingCrop({...editingCrop, plantingDate: e.target.value});
                      } else {
                        setNewCrop({...newCrop, plantingDate: e.target.value});
                      }
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Date de récolte</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-input rounded-md"
                    value={editingCrop ? editingCrop.harvestDate : newCrop.harvestDate}
                    onChange={(e) => {
                      if (editingCrop) {
                        setEditingCrop({...editingCrop, harvestDate: e.target.value});
                      } else {
                        setNewCrop({...newCrop, harvestDate: e.target.value});
                      }
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Superficie (ha)</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-input rounded-md"
                  placeholder="Surface en hectares"
                  value={editingCrop ? editingCrop.area : newCrop.area}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (editingCrop) {
                      setEditingCrop({...editingCrop, area: isNaN(value) ? 0 : value});
                    } else {
                      setNewCrop({...newCrop, area: isNaN(value) ? 0 : value});
                    }
                  }}
                  step="0.1"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Statut</label>
                <select 
                  className="w-full px-3 py-2 border border-input rounded-md"
                  value={editingCrop ? editingCrop.status : newCrop.status}
                  onChange={(e) => {
                    const status = e.target.value as 'growing' | 'harvested' | 'planned';
                    if (editingCrop) {
                      setEditingCrop({...editingCrop, status});
                    } else {
                      setNewCrop({...newCrop, status});
                    }
                  }}
                >
                  <option value="planned">Planté</option>
                  <option value="growing">En croissance</option>
                  <option value="harvested">Récolté</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowCropForm(false)}
                  className="px-4 py-2 text-sm text-foreground bg-muted rounded-md hover:bg-muted/80"
                >
                  Annuler
                </button>
                <button 
                  type="button"
                  onClick={handleSaveCrop}
                  className="px-4 py-2 text-sm text-white bg-agri-primary rounded-md hover:bg-agri-primary-dark"
                >
                  {editingCrop ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropPlanning;

