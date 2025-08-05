
import React from 'react';
import { InventoryItem } from './ImportExportFunctions';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InventoryStatsProps {
  inventoryData: InventoryItem[];
  categoryStats: Array<{name: string; value: number; fill: string}>;
}

const InventoryStats: React.FC<InventoryStatsProps> = ({ 
  inventoryData,
  categoryStats
}) => {
  const getTotalInventoryValue = () => {
    return inventoryData.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2);
  };

  const getLowStockItems = () => {
    return inventoryData.filter(item => item.quantity <= item.minQuantity).length;
  };

  const getInventoryHealthStatus = () => {
    const lowStockItems = getLowStockItems();
    const totalItems = inventoryData.length;
    
    if (lowStockItems === 0) return { label: 'Excellent', color: 'text-green-500' };
    if (lowStockItems / totalItems < 0.1) return { label: 'Bon', color: 'text-lime-500' };
    if (lowStockItems / totalItems < 0.25) return { label: 'Moyen', color: 'text-amber-500' };
    return { label: 'Attention', color: 'text-red-500' };
  };

  const healthStatus = getInventoryHealthStatus();

  return (
    <div className="space-y-6 animate-enter">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white rounded-xl border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Valeur totale</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{getTotalInventoryValue()} €</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white rounded-xl border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <p className="text-3xl font-bold">{inventoryData.length}</p>
              <p className="text-muted-foreground">
                {getLowStockItems()} à réapprovisionner
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white rounded-xl border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">État du stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${healthStatus.color}`}>{healthStatus.label}</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-white rounded-xl border">
        <CardHeader>
          <CardTitle>Répartition par catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryStats}
                margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end"
                  tick={{ fontSize: 12 }}
                  height={70}
                />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="value" 
                  fill="#4CAF50" 
                  radius={[4, 4, 0, 0]} 
                  fillOpacity={1} 
                  name="Quantité"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryStats;
