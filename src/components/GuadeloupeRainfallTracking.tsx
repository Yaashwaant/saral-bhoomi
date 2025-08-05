
import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { EditableField } from './ui/editable-field';
import { EditableTable, Column } from './ui/editable-table';
import { CloudRain, Droplets, Filter, Calendar, Download, PlusCircle, LineChart as LineChartIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface RainfallData {
  id: number;
  month: string;
  year: number;
  amount: number;
  location: string;
  impact: 'Positive' | 'Neutral' | 'Negative';
  notes?: string;
}

const formSchema = z.object({
  month: z.string().min(1, { message: "Le mois est requis" }),
  year: z.coerce.number().min(2000, { message: "Année invalide" }).max(2100),
  amount: z.coerce.number().min(0, { message: "Valeur invalide" }),
  location: z.string().min(1, { message: "La région est requise" }),
  impact: z.enum(['Positive', 'Neutral', 'Negative']),
  notes: z.string().optional(),
});

const GuadeloupeRainfallTracking = () => {
  const { toast } = useToast();
  const [title, setTitle] = useState('Suivi des Précipitations en Guadeloupe');
  const [description, setDescription] = useState('Visualisation des données pluviométriques pour optimiser la gestion des cultures');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [chartType, setChartType] = useState('bar');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      month: "Janvier",
      year: new Date().getFullYear(),
      amount: 0,
      location: "Basse-Terre",
      impact: "Neutral",
      notes: "",
    },
  });
  
  const [rainfallData, setRainfallData] = useState<RainfallData[]>([
    { id: 1, month: 'Janvier', year: 2023, amount: 210, location: 'Basse-Terre', impact: 'Positive', notes: 'Bon démarrage pour les cultures' },
    { id: 2, month: 'Février', year: 2023, amount: 180, location: 'Basse-Terre', impact: 'Positive' },
    { id: 3, month: 'Mars', year: 2023, amount: 150, location: 'Basse-Terre', impact: 'Neutral' },
    { id: 4, month: 'Avril', year: 2023, amount: 120, location: 'Basse-Terre', impact: 'Neutral' },
    { id: 5, month: 'Mai', year: 2023, amount: 90, location: 'Basse-Terre', impact: 'Negative', notes: 'Début de sécheresse' },
    { id: 6, month: 'Juin', year: 2023, amount: 60, location: 'Basse-Terre', impact: 'Negative' },
    { id: 7, month: 'Juillet', year: 2023, amount: 45, location: 'Basse-Terre', impact: 'Negative' },
    { id: 8, month: 'Août', year: 2023, amount: 70, location: 'Basse-Terre', impact: 'Neutral' },
    { id: 9, month: 'Septembre', year: 2023, amount: 90, location: 'Basse-Terre', impact: 'Neutral' },
    { id: 10, month: 'Octobre', year: 2023, amount: 140, location: 'Basse-Terre', impact: 'Positive' },
    { id: 11, month: 'Novembre', year: 2023, amount: 190, location: 'Basse-Terre', impact: 'Positive' },
    { id: 12, month: 'Décembre', year: 2023, amount: 230, location: 'Basse-Terre', impact: 'Positive' },
    { id: 13, month: 'Janvier', year: 2023, amount: 90, location: 'Grande-Terre', impact: 'Neutral' },
    { id: 14, month: 'Février', year: 2023, amount: 85, location: 'Grande-Terre', impact: 'Neutral' },
    { id: 15, month: 'Mars', year: 2023, amount: 75, location: 'Grande-Terre', impact: 'Neutral' },
    { id: 16, month: 'Avril', year: 2023, amount: 65, location: 'Grande-Terre', impact: 'Negative' },
    { id: 17, month: 'Mai', year: 2023, amount: 50, location: 'Grande-Terre', impact: 'Negative' },
    { id: 18, month: 'Juin', year: 2023, amount: 40, location: 'Grande-Terre', impact: 'Negative' },
    { id: 19, month: 'Juillet', year: 2023, amount: 30, location: 'Grande-Terre', impact: 'Negative', notes: 'Sécheresse sévère' },
    { id: 20, month: 'Août', year: 2023, amount: 45, location: 'Grande-Terre', impact: 'Negative' },
    { id: 21, month: 'Septembre', year: 2023, amount: 60, location: 'Grande-Terre', impact: 'Neutral' },
    { id: 22, month: 'Octobre', year: 2023, amount: 80, location: 'Grande-Terre', impact: 'Neutral' },
    { id: 23, month: 'Novembre', year: 2023, amount: 95, location: 'Grande-Terre', impact: 'Positive' },
    { id: 24, month: 'Décembre', year: 2023, amount: 110, location: 'Grande-Terre', impact: 'Positive' },
    { id: 25, month: 'Janvier', year: 2024, amount: 215, location: 'Basse-Terre', impact: 'Positive' },
    { id: 26, month: 'Février', year: 2024, amount: 185, location: 'Basse-Terre', impact: 'Positive' },
    { id: 27, month: 'Mars', year: 2024, amount: 160, location: 'Basse-Terre', impact: 'Positive' },
    { id: 28, month: 'Janvier', year: 2024, amount: 95, location: 'Grande-Terre', impact: 'Neutral' },
    { id: 29, month: 'Février', year: 2024, amount: 90, location: 'Grande-Terre', impact: 'Neutral' },
    { id: 30, month: 'Mars', year: 2024, amount: 80, location: 'Grande-Terre', impact: 'Neutral' },
  ]);
  
  // Colonnes pour le tableau éditable
  const columns: Column[] = [
    { id: 'month', header: 'Mois', accessorKey: 'month', isEditable: true },
    { id: 'year', header: 'Année', accessorKey: 'year', type: 'number', isEditable: true },
    { id: 'amount', header: 'Précipitations (mm)', accessorKey: 'amount', type: 'number', isEditable: true },
    { id: 'location', header: 'Région', accessorKey: 'location', isEditable: true },
    { id: 'impact', header: 'Impact', accessorKey: 'impact', isEditable: true, options: ['Positive', 'Neutral', 'Negative'] },
    { id: 'notes', header: 'Notes', accessorKey: 'notes', isEditable: true }
  ];
  
  // Handlers
  const handleTitleChange = (value: string | number) => {
    setTitle(String(value));
    toast({
      title: "Titre mis à jour",
      description: "Le titre du module a été modifié avec succès"
    });
  };
  
  const handleDescriptionChange = (value: string | number) => {
    setDescription(String(value));
    toast({
      title: "Description mise à jour",
      description: "La description du module a été modifiée avec succès"
    });
  };
  
  // Filtrer les données
  const filteredData = rainfallData.filter(item => {
    const matchesSearch = 
      item.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesYear = filterYear === 'all' || item.year === Number(filterYear);
    const matchesLocation = filterLocation === 'all' || item.location === filterLocation;
    
    return matchesSearch && matchesYear && matchesLocation;
  });
  
  // Préparer les données pour le graphique
  const uniqueMonths = Array.from(new Set(filteredData.map(item => item.month)));
  const uniqueLocations = Array.from(new Set(filteredData.map(item => item.location)));
  
  // Créer les données agrégées par mois pour le graphique
  const chartData = uniqueMonths.map(month => {
    const dataPoint: any = { month };
    
    uniqueLocations.forEach(location => {
      const matchingData = filteredData.find(item => item.month === month && item.location === location);
      dataPoint[location] = matchingData ? matchingData.amount : 0;
    });
    
    return dataPoint;
  });
  
  // Gérer les mises à jour du tableau
  const handleTableUpdate = (rowIndex: number, columnId: string, value: any) => {
    const newData = [...rainfallData];
    const itemId = filteredData[rowIndex].id;
    const dataIndex = newData.findIndex(item => item.id === itemId);
    
    if (dataIndex !== -1) {
      const updatedItem = { ...newData[dataIndex] };
      
      if (columnId === 'year' || columnId === 'amount') {
        updatedItem[columnId] = Number(value);
      } else {
        updatedItem[columnId] = value;
      }
      
      newData[dataIndex] = updatedItem;
      setRainfallData(newData);
      
      toast({
        title: "Données mises à jour",
        description: `Enregistrement des précipitations pour ${updatedItem.month} ${updatedItem.year} mis à jour`
      });
    }
  };
  
  // Gestion de suppression
  const handleDeleteRow = (rowIndex: number) => {
    const itemId = filteredData[rowIndex].id;
    const newData = rainfallData.filter(item => item.id !== itemId);
    setRainfallData(newData);
    
    toast({
      title: "Données supprimées",
      description: "Enregistrement supprimé avec succès"
    });
  };
  
  // Ajouter une nouvelle ligne
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const newId = Math.max(0, ...rainfallData.map(item => item.id)) + 1;
    
    const newRow: RainfallData = {
      id: newId,
      month: data.month,
      year: data.year,
      amount: data.amount,
      location: data.location,
      impact: data.impact,
      notes: data.notes
    };
    
    setRainfallData([...rainfallData, newRow]);
    setDialogOpen(false);
    form.reset();
    
    toast({
      title: "Données ajoutées",
      description: `Nouvel enregistrement ajouté pour ${newRow.month} ${newRow.year}`
    });
  };
  
  // Télécharger les données
  const handleDownloadData = () => {
    // Créer un contenu CSV
    const headers = columns.map(col => col.header).join(',');
    const rows = rainfallData.map(item => {
      return `${item.month},${item.year},${item.amount},${item.location},${item.impact},${item.notes || ''}`;
    }).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Créer un lien et cliquer dessus pour télécharger
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `precipitations_guadeloupe_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Téléchargement terminé",
      description: "Exportation des données de précipitations au format CSV réussie"
    });
  };
  
  // Importer des données CSV
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target?.result as string;
      const lines = contents.split('\n');
      
      // Ignorer l'en-tête
      const dataLines = lines.slice(1);
      
      const importedData: RainfallData[] = [];
      let lastId = Math.max(0, ...rainfallData.map(item => item.id));
      
      dataLines.forEach(line => {
        if (!line.trim()) return;
        
        const values = line.split(',');
        if (values.length >= 5) {
          lastId++;
          importedData.push({
            id: lastId,
            month: values[0],
            year: parseInt(values[1], 10),
            amount: parseFloat(values[2]),
            location: values[3],
            impact: values[4] as 'Positive' | 'Neutral' | 'Negative',
            notes: values[5]
          });
        }
      });
      
      if (importedData.length > 0) {
        setRainfallData([...rainfallData, ...importedData]);
        toast({
          title: "Import réussi",
          description: `${importedData.length} enregistrements ont été importés avec succès`
        });
      } else {
        toast({
          title: "Aucune donnée importée",
          description: "Le fichier ne contient pas de données valides"
        });
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Réinitialiser l'input
  };
  
  // Calculer les statistiques
  const calculateStatistics = () => {
    if (filteredData.length === 0) return { avg: 0, max: 0, min: 0, total: 0 };
    
    const amounts = filteredData.map(item => item.amount);
    const sum = amounts.reduce((acc, val) => acc + val, 0);
    
    return {
      avg: Math.round(sum / amounts.length),
      max: Math.max(...amounts),
      min: Math.min(...amounts),
      total: sum
    };
  };
  
  const stats = calculateStatistics();
  
  // Années uniques pour le filtre
  const uniqueYears = Array.from(new Set(rainfallData.map(item => item.year))).sort((a, b) => b - a);
  
  // Obtenir la classe CSS pour l'impact
  const getImpactClass = (impact: string) => {
    switch (impact) {
      case 'Positive': return 'text-agri-success';
      case 'Negative': return 'text-agri-danger';
      default: return 'text-muted-foreground';
    }
  };

  // Couleurs pour le graphique
  const locationColors: {[key: string]: string} = {
    'Basse-Terre': '#4CAF50',
    'Grande-Terre': '#2196F3',
    'Marie-Galante': '#FFC107',
    'Les Saintes': '#9C27B0'
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold flex items-center">
            <CloudRain className="h-6 w-6 mr-2 text-blue-500" />
            <EditableField
              value={title}
              onSave={handleTitleChange}
              className="inline-block"
            />
          </h2>
          <p className="text-muted-foreground">
            <EditableField
              value={description}
              onSave={handleDescriptionChange}
              className="inline-block"
            />
          </p>
        </div>
        
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-muted/30 rounded-lg p-4 border flex items-center space-x-3 hover:border-blue-200 transition-all">
            <Droplets className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-sm text-muted-foreground">Moyenne</div>
              <div className="text-2xl font-bold">{stats.avg} mm</div>
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 border flex items-center space-x-3 hover:border-green-200 transition-all">
            <Droplets className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-sm text-muted-foreground">Maximum</div>
              <div className="text-2xl font-bold">{stats.max} mm</div>
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 border flex items-center space-x-3 hover:border-red-200 transition-all">
            <Droplets className="h-8 w-8 text-red-500" />
            <div>
              <div className="text-sm text-muted-foreground">Minimum</div>
              <div className="text-2xl font-bold">{stats.min} mm</div>
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 border flex items-center space-x-3 hover:border-purple-200 transition-all">
            <Droplets className="h-8 w-8 text-purple-500" />
            <div>
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">{stats.total} mm</div>
            </div>
          </div>
        </div>
        
        {/* Filtres et recherche */}
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <div className="relative flex-grow max-w-sm">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="pl-10"
            />
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les années</SelectItem>
              {uniqueYears.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-[180px]">
              <CloudRain className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Région" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les régions</SelectItem>
              {uniqueLocations.map(location => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex space-x-2 ml-auto">
            <input
              type="file"
              id="csv-import"
              accept=".csv"
              className="hidden"
              onChange={handleImportData}
            />
            <label htmlFor="csv-import">
              <Button variant="outline" size="sm" asChild>
                <span className="cursor-pointer">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Importer CSV
                </span>
              </Button>
            </label>
            
            <Button variant="outline" size="sm" onClick={handleDownloadData}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un nouvel enregistrement</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="month"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mois</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un mois" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 
                                  'Septembre', 'Octobre', 'Novembre', 'Décembre'].map(month => (
                                  <SelectItem key={month} value={month}>{month}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Année</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Précipitations (mm)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Région</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner une région" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {uniqueLocations.map(location => (
                                  <SelectItem key={location} value={location}>{location}</SelectItem>
                                ))}
                                <SelectItem value="Marie-Galante">Marie-Galante</SelectItem>
                                <SelectItem value="Les Saintes">Les Saintes</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="impact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Impact</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un impact" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Positive">Positif</SelectItem>
                              <SelectItem value="Neutral">Neutre</SelectItem>
                              <SelectItem value="Negative">Négatif</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit">Enregistrer</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Type de graphique */}
        <Tabs value={chartType} onValueChange={setChartType} className="mb-6">
          <TabsList>
            <TabsTrigger value="bar">
              <BarChart className="h-4 w-4 mr-2" />
              Histogramme
            </TabsTrigger>
            <TabsTrigger value="line">
              <LineChartIcon className="h-4 w-4 mr-2" />
              Courbes
            </TabsTrigger>
            <TabsTrigger value="area">
              <CloudRain className="h-4 w-4 mr-2" />
              Aires
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Graphiques */}
        <div className="h-80 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} mm`, '']} />
                <Legend />
                {uniqueLocations.map(location => (
                  <Bar 
                    key={location} 
                    dataKey={location} 
                    name={location} 
                    fill={locationColors[location] || '#8884d8'} 
                  />
                ))}
              </BarChart>
            ) : chartType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} mm`, '']} />
                <Legend />
                {uniqueLocations.map(location => (
                  <Line 
                    key={location} 
                    type="monotone" 
                    dataKey={location} 
                    name={location} 
                    stroke={locationColors[location] || '#8884d8'} 
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                ))}
              </LineChart>
            ) : (
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} mm`, '']} />
                <Legend />
                {uniqueLocations.map(location => (
                  <Area 
                    key={location} 
                    type="monotone" 
                    dataKey={location} 
                    name={location} 
                    fill={locationColors[location] || '#8884d8'} 
                    stroke={locationColors[location] || '#8884d8'} 
                    fillOpacity={0.6}
                  />
                ))}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Tableau de données */}
        <EditableTable
          data={filteredData}
          columns={columns}
          onUpdate={handleTableUpdate}
          onDelete={handleDeleteRow}
          sortable={true}
        />
      </div>
    </div>
  );
};

export default GuadeloupeRainfallTracking;
