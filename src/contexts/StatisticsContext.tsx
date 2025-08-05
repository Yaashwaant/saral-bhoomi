
import React, { createContext, useContext, useState, useEffect } from 'react';

// Types pour les différentes données statistiques
export interface YieldData {
  name: string;
  current: number;
  previous: number;
  unit: string;
}

export interface FinancialData {
  name: string;
  profitability: number;
  size: number;
  crop: string;
}

export interface CostData {
  name: string;
  value: number;
  color: string;
}

export interface EnvironmentalData {
  indicator: string;
  current: number;
  target: number;
  trend: string;
  status: 'Atteint' | 'En progrès' | 'En retard';
}

interface StatisticsContextType {
  // Données de rendement
  yieldData: YieldData[];
  setYieldData: React.Dispatch<React.SetStateAction<YieldData[]>>;
  
  // Données financières
  financialData: {
    profitabilityByParcel: FinancialData[];
    costAnalysis: CostData[];
    revenueByMonth: any[];
  };
  setFinancialData: React.Dispatch<React.SetStateAction<{
    profitabilityByParcel: FinancialData[];
    costAnalysis: CostData[];
    revenueByMonth: any[];
  }>>;
  
  // Données environnementales
  environmentalData: {
    indicators: EnvironmentalData[];
    carbonFootprint: number;
    waterUsage: number;
    biodiversity: number;
  };
  setEnvironmentalData: React.Dispatch<React.SetStateAction<{
    indicators: EnvironmentalData[];
    carbonFootprint: number;
    waterUsage: number;
    biodiversity: number;
  }>>;
  
  // Données de prévision
  forecastData: any[];
  setForecastData: React.Dispatch<React.SetStateAction<any[]>>;
  
  // Période et filtres
  period: 'day' | 'week' | 'month' | 'year';
  setPeriod: React.Dispatch<React.SetStateAction<'day' | 'week' | 'month' | 'year'>>;
  cropFilter: string;
  setCropFilter: React.Dispatch<React.SetStateAction<string>>;
  
  // Fonction pour mettre à jour les données en fonction des filtres
  updateDataWithFilters: (period: string, crop: string) => void;
}

const StatisticsContext = createContext<StatisticsContextType | undefined>(undefined);

export const useStatistics = () => {
  const context = useContext(StatisticsContext);
  if (context === undefined) {
    throw new Error('useStatistics must be used within a StatisticsProvider');
  }
  return context;
};

// Données initiales
const initialYieldData: YieldData[] = [
  { name: 'Canne à Sucre', current: 85, previous: 75, unit: 't/ha' },
  { name: 'Banane', current: 32, previous: 30, unit: 't/ha' },
  { name: 'Ananas', current: 45, previous: 48, unit: 't/ha' },
  { name: 'Igname', current: 18, previous: 15, unit: 't/ha' },
  { name: 'Madère', current: 22, previous: 20, unit: 't/ha' }
];

const initialProfitabilityData: FinancialData[] = [
  { name: 'Parcelle Nord', profitability: 1250, size: 12.5, crop: 'Canne à Sucre' },
  { name: 'Parcelle Est', profitability: 980, size: 8.3, crop: 'Banane' },
  { name: 'Parcelle Sud', profitability: 1580, size: 15.7, crop: 'Ananas' },
  { name: 'Parcelle Ouest', profitability: 850, size: 10.2, crop: 'Igname' },
  { name: 'Parcelle Centrale', profitability: 920, size: 6.8, crop: 'Madère' }
];

const initialCostData: CostData[] = [
  { name: 'Semences', value: 1800, color: '#4CAF50' },
  { name: 'Fertilisants', value: 2200, color: '#8D6E63' },
  { name: 'Phyto', value: 1500, color: '#FFC107' },
  { name: 'Carburant', value: 1200, color: '#2196F3' },
  { name: 'Main d\'œuvre', value: 3500, color: '#673AB7' },
  { name: 'Mécanisation', value: 2800, color: '#E91E63' },
  { name: 'Divers', value: 900, color: '#9E9E9E' }
];

const initialRevenueData = [
  { month: 'Jan', revenue: 28500, expenses: 20100, profit: 8400 },
  { month: 'Fév', revenue: 30200, expenses: 21800, profit: 8400 },
  { month: 'Mar', revenue: 32800, expenses: 22400, profit: 10400 },
  { month: 'Avr', revenue: 35500, expenses: 23100, profit: 12400 },
  { month: 'Mai', revenue: 38200, expenses: 23500, profit: 14700 },
  { month: 'Juin', revenue: 37800, expenses: 22900, profit: 14900 },
  { month: 'Juil', revenue: 42500, expenses: 24200, profit: 18300 },
  { month: 'Août', revenue: 44800, expenses: 25300, profit: 19500 },
  { month: 'Sep', revenue: 40200, expenses: 24800, profit: 15400 },
  { month: 'Oct', revenue: 38200, expenses: 23100, profit: 15100 },
  { month: 'Nov', revenue: 36500, expenses: 22500, profit: 14000 },
  { month: 'Déc', revenue: 41200, expenses: 25800, profit: 15400 }
];

const initialEnvironmentalIndicators: EnvironmentalData[] = [
  { indicator: 'Émissions CO2 (t/ha)', current: 2.8, target: 2.5, trend: '-5%', status: 'En progrès' },
  { indicator: 'Consommation d\'eau (m³/ha)', current: 350, target: 320, trend: '-8%', status: 'Atteint' },
  { indicator: 'Utilisation d\'intrants (kg/ha)', current: 180, target: 150, trend: '-12%', status: 'En progrès' },
  { indicator: 'Surface en agriculture bio (%)', current: 15, target: 25, trend: '+5%', status: 'En progrès' },
  { indicator: 'Biodiversité (espèces/ha)', current: 12, target: 15, trend: '+12%', status: 'Atteint' }
];

export const StatisticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [yieldData, setYieldData] = useState<YieldData[]>(initialYieldData);
  const [financialData, setFinancialData] = useState({
    profitabilityByParcel: initialProfitabilityData,
    costAnalysis: initialCostData,
    revenueByMonth: initialRevenueData
  });
  const [environmentalData, setEnvironmentalData] = useState({
    indicators: initialEnvironmentalIndicators,
    carbonFootprint: -15,
    waterUsage: -8,
    biodiversity: 12
  });
  const [forecastData, setForecastData] = useState(initialRevenueData);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('year');
  const [cropFilter, setCropFilter] = useState('all');
  
  // Fonction pour mettre à jour les données en fonction des filtres
  const updateDataWithFilters = (period: string, crop: string) => {
    // Filtrer les données de rendement par culture si nécessaire
    if (crop !== 'all') {
      const filteredYieldData = initialYieldData.filter(item => item.name === crop);
      setYieldData(filteredYieldData);
      
      // Filtrer également les données financières par culture
      const filteredProfitabilityData = initialProfitabilityData.filter(item => item.crop === crop);
      setFinancialData(prev => ({
        ...prev,
        profitabilityByParcel: filteredProfitabilityData
      }));
    } else {
      setYieldData(initialYieldData);
      setFinancialData(prev => ({
        ...prev,
        profitabilityByParcel: initialProfitabilityData
      }));
    }
    
    // Vous pourriez également ajuster les autres données en fonction de la période
  };
  
  // Mettre à jour les données lorsque les filtres changent
  useEffect(() => {
    updateDataWithFilters(period, cropFilter);
  }, [period, cropFilter]);
  
  return (
    <StatisticsContext.Provider 
      value={{ 
        yieldData, 
        setYieldData,
        financialData,
        setFinancialData,
        environmentalData,
        setEnvironmentalData,
        forecastData,
        setForecastData,
        period,
        setPeriod,
        cropFilter,
        setCropFilter,
        updateDataWithFilters
      }}
    >
      {children}
    </StatisticsContext.Provider>
  );
};
