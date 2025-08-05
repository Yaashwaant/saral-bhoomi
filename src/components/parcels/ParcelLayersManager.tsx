
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Layers, Eye, EyeOff, Info } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Layer {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'base' | 'overlay';
  source: 'local' | 'remote';
}

interface ParcelLayersManagerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const ParcelLayersManager = ({ isOpen, onOpenChange }: ParcelLayersManagerProps) => {
  const [layers, setLayers] = useState<Layer[]>([
    { 
      id: 'satellite', 
      name: 'Image satellite', 
      description: 'Vue aérienne satellite de haute résolution',
      enabled: false, 
      type: 'base',
      source: 'remote'
    },
    { 
      id: 'terrain', 
      name: 'Carte topographique', 
      description: 'Courbes de niveau et relief du terrain',
      enabled: true, 
      type: 'base',
      source: 'remote'
    },
    { 
      id: 'parcels', 
      name: 'Limites parcellaires', 
      description: 'Contour géographique des parcelles',
      enabled: true, 
      type: 'overlay',
      source: 'local'
    },
    { 
      id: 'crops', 
      name: 'Cultures actuelles', 
      description: 'Types de cultures par parcelle',
      enabled: true, 
      type: 'overlay',
      source: 'local'
    },
    { 
      id: 'soil', 
      name: 'Types de sol', 
      description: 'Classification des sols par type',
      enabled: false, 
      type: 'overlay',
      source: 'local'
    },
    { 
      id: 'irrigation', 
      name: 'Réseau d\'irrigation', 
      description: 'Systèmes d\'irrigation installés',
      enabled: false, 
      type: 'overlay',
      source: 'local'
    },
    { 
      id: 'ndvi', 
      name: 'NDVI', 
      description: 'Indice de végétation par différence normalisée',
      enabled: false, 
      type: 'overlay',
      source: 'remote'
    },
    { 
      id: 'rainfall', 
      name: 'Pluviométrie', 
      description: 'Données de précipitations sur 30 jours',
      enabled: false, 
      type: 'overlay',
      source: 'remote'
    },
  ]);

  const handleLayerChange = (layerId: string, enabled: boolean) => {
    setLayers(layers.map(layer => 
      layer.id === layerId ? { ...layer, enabled } : layer
    ));
    
    // Si c'est une couche de base qui est activée, désactiver les autres couches de base
    if (enabled) {
      const layer = layers.find(l => l.id === layerId);
      if (layer?.type === 'base') {
        setLayers(layers.map(l => 
          l.type === 'base' ? { ...l, enabled: l.id === layerId } : l
        ));
      }
    }

    toast.success("Couche modifiée", {
      description: `La couche "${layers.find(l => l.id === layerId)?.name}" a été ${enabled ? 'activée' : 'désactivée'}`
    });
  };

  const handleSaveLayers = () => {
    toast.success("Configuration enregistrée", {
      description: "La configuration des couches a été enregistrée"
    });
    onOpenChange(false);
  };

  const handleResetLayers = () => {
    setLayers(layers.map(layer => ({
      ...layer,
      enabled: layer.id === 'terrain' || layer.id === 'parcels'
    })));
    
    toast.info("Configuration réinitialisée", {
      description: "La configuration des couches a été remise à l'état par défaut"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Layers className="h-5 w-5 mr-2" />
            Gestionnaire de couches
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Configurez les couches visibles sur la carte pour personnaliser votre vue des parcelles.
          </p>
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Couches de base</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {layers.filter(l => l.type === 'base').map(layer => (
                <div 
                  key={layer.id} 
                  className={`p-3 border rounded-lg ${layer.enabled ? 'border-agri-primary bg-agri-primary/5' : 'border-input'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox 
                        id={`layer-${layer.id}`} 
                        checked={layer.enabled}
                        onCheckedChange={(checked) => handleLayerChange(layer.id, checked === true)}
                        className="mr-2"
                      />
                      <label 
                        htmlFor={`layer-${layer.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {layer.name}
                      </label>
                    </div>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-muted-foreground cursor-help">
                            <Info className="h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{layer.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2 pl-6">
                    Source: {layer.source === 'local' ? 'Locale' : 'Service externe'}
                  </p>
                </div>
              ))}
            </div>
            
            <h3 className="text-sm font-medium mt-6">Couches thématiques</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {layers.filter(l => l.type === 'overlay').map(layer => (
                <div 
                  key={layer.id} 
                  className={`p-3 border rounded-lg ${layer.enabled ? 'border-agri-primary bg-agri-primary/5' : 'border-input'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox 
                        id={`layer-${layer.id}`} 
                        checked={layer.enabled}
                        onCheckedChange={(checked) => handleLayerChange(layer.id, checked === true)}
                        className="mr-2"
                      />
                      <label 
                        htmlFor={`layer-${layer.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {layer.name}
                      </label>
                    </div>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-muted-foreground cursor-help">
                            <Info className="h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{layer.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2 pl-6">
                    Source: {layer.source === 'local' ? 'Locale' : 'Service externe'}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleResetLayers}>
              Réinitialiser
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveLayers}>
                Enregistrer la configuration
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ParcelLayersManager;
