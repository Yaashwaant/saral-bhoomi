
import React from 'react';
import { 
  ScatterChart,
  Scatter,
  XAxis, 
  YAxis, 
  ZAxis,
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { useStatistics } from '../../contexts/StatisticsContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FinancialCharts = () => {
  const { financialData } = useStatistics();
  const { profitabilityByParcel, costAnalysis, revenueByMonth } = financialData;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rentabilité par parcelle (€/ha)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="size" 
                  name="Taille" 
                  unit=" ha" 
                  label={{ value: 'Taille (ha)', position: 'insideBottomRight', offset: -10 }} 
                />
                <YAxis 
                  type="number" 
                  dataKey="profitability" 
                  name="Rentabilité" 
                  unit=" €/ha" 
                  label={{ value: 'Rentabilité (€/ha)', angle: -90, position: 'insideLeft' }} 
                />
                <ZAxis 
                  type="category" 
                  dataKey="crop" 
                  name="Culture" 
                  range={[100, 1000]} 
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  formatter={(value, name, props) => {
                    if (name === 'Rentabilité') return [`${value} €/ha`, name];
                    if (name === 'Taille') return [`${value} ha`, name];
                    return [value, name];
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 border rounded shadow-sm">
                          <p className="font-medium">{payload[2]?.payload.name}</p>
                          <p>Culture: {payload[2]?.value}</p>
                          <p>Taille: {payload[0]?.value} ha</p>
                          <p>Rentabilité: {payload[1]?.value} €/ha</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter 
                  name="Parcelles" 
                  data={profitabilityByParcel} 
                  fill="#4CAF50" 
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Analyse des coûts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={costAnalysis}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 80, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontSize: 12 }} 
                    width={80} 
                  />
                  <Tooltip formatter={(value) => [`${value.toLocaleString()} €`, 'Montant']} />
                  <Bar 
                    dataKey="value" 
                    fill="#8D6E63" 
                    radius={[0, 4, 4, 0]} 
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Revenus et dépenses mensuels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={revenueByMonth}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value.toLocaleString()} €`, '']} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Revenus" stroke="#4CAF50" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="expenses" name="Dépenses" stroke="#F44336" />
                  <Line type="monotone" dataKey="profit" name="Profit" stroke="#2196F3" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Indicateurs financiers clés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">EBE (EBITDA)</p>
              <p className="text-2xl font-semibold">42,500 €</p>
              <p className="text-xs text-green-600">32% du chiffre d'affaires</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Rentabilité</p>
              <p className="text-2xl font-semibold">18%</p>
              <p className="text-xs text-green-600">+2.5% vs année précédente</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">ROI</p>
              <p className="text-2xl font-semibold">22%</p>
              <p className="text-xs text-muted-foreground">Sur les investissements</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialCharts;
