
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { EditableField } from '../ui/editable-field';

interface InventoryAlert {
  id: number;
  name: string;
  current: number;
  min: number;
  status: 'critical' | 'warning';
}

interface InventoryAlertsProps {
  alerts: InventoryAlert[];
  onQuantityChange: (id: number, field: string, value: any) => void;
}

const InventoryAlerts: React.FC<InventoryAlertsProps> = ({ alerts, onQuantityChange }) => {
  if (alerts.length === 0) return null;
  
  return (
    <div className="mb-6 border border-agri-warning/30 bg-agri-warning/5 rounded-xl p-4 animate-enter">
      <div className="flex items-center mb-3">
        <AlertTriangle className="h-5 w-5 text-agri-warning mr-2" />
        <h3 className="font-medium">Alertes de stock bas</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {alerts.map(alert => (
          <div 
            key={alert.id} 
            className={`p-3 rounded-lg border ${
              alert.status === 'critical' 
                ? 'border-agri-danger/30 bg-agri-danger/5' 
                : 'border-agri-warning/30 bg-agri-warning/5'
            }`}
          >
            <div className="flex justify-between items-center">
              <p className="font-medium">{alert.name}</p>
              <span 
                className={`text-xs px-2 py-0.5 rounded-full ${
                  alert.status === 'critical' 
                    ? 'bg-agri-danger/10 text-agri-danger' 
                    : 'bg-agri-warning/10 text-agri-warning'
                }`}
              >
                {alert.status === 'critical' ? 'Critique' : 'Attention'}
              </span>
            </div>
            <div className="mt-2 text-sm">
              <span>Stock actuel: </span>
              <EditableField
                value={alert.current}
                type="number"
                onSave={(value) => onQuantityChange(alert.id, 'quantity', Number(value))}
                className="inline-block"
              />
              <span className="mx-1">|</span>
              <span>Minimum: </span>
              <EditableField
                value={alert.min}
                type="number"
                onSave={(value) => onQuantityChange(alert.id, 'minQuantity', Number(value))}
                className="inline-block"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryAlerts;
