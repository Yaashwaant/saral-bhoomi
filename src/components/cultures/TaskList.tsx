
import React, { useState } from 'react';
import { Check, Trash2, ChevronDown, Plus, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Task {
  id: number;
  task: string;
  culture: string;
  date: string;
  priority: 'Haute' | 'Moyenne' | 'Basse';
}

const initialTasks: Task[] = [
  { id: 1, task: 'Fertilisation de la canne', culture: 'Canne à Sucre', date: '2023-09-25', priority: 'Haute' },
  { id: 2, task: 'Traitement contre la cercosporiose', culture: 'Banane', date: '2023-09-28', priority: 'Moyenne' },
  { id: 3, task: 'Inspection croissance ananas', culture: 'Ananas', date: '2023-09-30', priority: 'Basse' },
  { id: 4, task: 'Désherbage parcelle madère', culture: 'Madère', date: '2023-10-05', priority: 'Moyenne' },
  { id: 5, task: 'Préparation coupe canne', culture: 'Canne à Sucre', date: '2024-01-10', priority: 'Haute' },
];

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    task: '',
    culture: '',
    date: '',
    priority: 'Moyenne'
  });

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'Haute':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Moyenne':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Basse':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleTaskComplete = (id: number) => {
    console.log('Tâche marquée comme terminée');
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleTaskDelete = (id: number) => {
    console.log('Tâche supprimée avec succès');
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handlePriorityChange = (id: number, priority: Task['priority']) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, priority } : task
    ));
    console.log(`Priorité modifiée en "${priority}"`);
  };

  const handleAddTask = () => {
    if (!newTask.task || !newTask.culture || !newTask.date) {
      console.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const taskToAdd: Task = {
      id: Math.max(0, ...tasks.map(t => t.id)) + 1,
      task: newTask.task,
      culture: newTask.culture,
      date: newTask.date,
      priority: newTask.priority as Task['priority'] || 'Moyenne'
    };

    setTasks([...tasks, taskToAdd]);
    setNewTask({
      task: '',
      culture: '',
      date: '',
      priority: 'Moyenne'
    });
    setShowAddTask(false);
    console.log('Nouvelle tâche ajoutée avec succès');
  };

  return (
    <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
      <div className="p-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-agri-primary" />
          <h2 className="text-xl font-semibold">Tâches à venir</h2>
        </div>
        <Button 
          onClick={() => setShowAddTask(!showAddTask)}
          className="bg-green-500 hover:bg-green-600 text-white transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une tâche
        </Button>
      </div>

      {showAddTask && (
        <div className="p-4 bg-muted/20 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Tâche</label>
              <input
                type="text"
                value={newTask.task}
                onChange={(e) => setNewTask({...newTask, task: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-agri-primary focus:border-agri-primary"
                placeholder="Description de la tâche"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Culture</label>
              <select
                value={newTask.culture}
                onChange={(e) => setNewTask({...newTask, culture: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-agri-primary focus:border-agri-primary"
              >
                <option value="">Sélectionner une culture</option>
                <option value="Canne à Sucre">Canne à Sucre</option>
                <option value="Banane">Banane</option>
                <option value="Ananas">Ananas</option>
                <option value="Madère">Madère</option>
                <option value="Igname">Igname</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Date</label>
              <input
                type="date"
                value={newTask.date}
                onChange={(e) => setNewTask({...newTask, date: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-agri-primary focus:border-agri-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Priorité</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({...newTask, priority: e.target.value as Task['priority']})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-agri-primary focus:border-agri-primary"
              >
                <option value="Haute">Haute</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Basse">Basse</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <Button variant="outline" onClick={() => setShowAddTask(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddTask}>
              Ajouter
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">TÂCHE</TableHead>
              <TableHead className="w-[20%]">CULTURE</TableHead>
              <TableHead className="w-[15%]">DATE</TableHead>
              <TableHead className="w-[15%]">PRIORITÉ</TableHead>
              <TableHead className="w-[10%]">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id} className="hover:bg-muted/20 transition-colors">
                <TableCell className="font-medium">{task.task}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Tag className="h-3 w-3 mr-1.5 text-agri-primary" />
                    {task.culture}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(task.date).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge className={`cursor-pointer ${getPriorityStyle(task.priority)}`}>
                        {task.priority} <ChevronDown className="ml-1 h-3 w-3 inline" />
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handlePriorityChange(task.id, 'Haute')}>
                        Haute
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePriorityChange(task.id, 'Moyenne')}>
                        Moyenne
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePriorityChange(task.id, 'Basse')}>
                        Basse
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleTaskComplete(task.id)}
                      className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                      title="Marquer comme terminée"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTaskDelete(task.id)}
                      className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  Aucune tâche à afficher
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TaskList;
