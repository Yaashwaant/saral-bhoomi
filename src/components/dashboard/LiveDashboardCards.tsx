import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { config } from '@/config';
import { RefreshCw } from 'lucide-react';

interface EnglishCompleteRecord {
  _id: string;
  serial_number: string;
  owner_name: string;
  old_survey_number: string;
  new_survey_number: string;
  group_number: string;
  cts_number: string;
  village: string;
  taluka: string;
  district: string;
  land_area_as_per_7_12: number;
  acquired_land_area: number;
  land_type: string;
  land_classification: string;
  approved_rate_per_hectare: number;
  market_value_as_per_acquired_area: number;
  factor_as_per_section_26_2: number;
  land_compensation_as_per_section_26: number;
  structures: number;
  forest_trees: number;
  fruit_trees: number;
  wells_borewells: number;
  total_structures_amount: number;
  total_amount_14_23: number;
  solatium_amount: number;
  determined_compensation_26: number;
  enhanced_compensation_25_percent: number;
  total_compensation_26_27: number;
  deduction_amount: number;
  final_payable_compensation: number;
  remarks: string;
  compensation_distribution_status: string;
  project_id: string | { id: string };
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface DashboardStats {
  totalRecords: number;
  totalLandArea: number;
  totalAcquiredArea: number;
  totalAreaToBeAcquired: number;
  totalCompensation: number;
  totalCompensationPaid: number;
  averageCompensationPerHectare: number;
  uniqueVillages: number;
  uniqueTalukas: number;
  uniqueDistricts: number;
  recordsWithStructures: number;
  recordsWithTrees: number;
  recordsWithWells: number;
}

const LiveDashboardCards: React.FC = () => {
  const [records, setRecords] = useState<EnglishCompleteRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch English complete records
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/landowners2-english/list`);
      const data = await response.json();
      
      if (data.success) {
        setRecords(data.records);
      }
    } catch (error) {
      console.error('Error fetching English complete records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate dashboard statistics
  const calculateStats = (recordsData: EnglishCompleteRecord[]) => {
    const activeRecords = recordsData.filter(r => r.is_active);
    
    // Total area acquired = sum of acquired_land_area where compensation is paid
    const totalAcquiredArea = activeRecords
      .filter(r => {
        const status = (r.compensation_distribution_status || '').toUpperCase();
        return status === 'PAID';
      })
      .reduce((sum, r) => sum + (parseFloat(r.acquired_land_area?.toString() || '0') || 0), 0);
    
    // Total area to be acquired = sum of ALL acquired_land_area from all active records
    const totalAreaToBeAcquired = activeRecords
      .reduce((sum, r) => sum + (parseFloat(r.acquired_land_area?.toString() || '0') || 0), 0);
    
    const totalLandArea = activeRecords.reduce((sum, r) => sum + (parseFloat(r.land_area_as_per_7_12?.toString() || '0') || 0), 0);
    const totalCompensation = activeRecords.reduce((sum, r) => sum + (parseFloat(r.final_payable_compensation?.toString() || '0') || 0), 0);
    
    // Calculate paid compensation based on compensation_distribution_status
    const totalCompensationPaid = activeRecords
      .filter(r => {
        const status = (r.compensation_distribution_status || '').toUpperCase();
        return status === 'PAID';
      })
      .reduce((sum, r) => sum + (parseFloat(r.final_payable_compensation?.toString() || '0') || 0), 0);
    
    const stats: DashboardStats = {
      totalRecords: activeRecords.length,
      totalLandArea: totalLandArea,
      totalAcquiredArea: totalAcquiredArea,
      totalAreaToBeAcquired: totalAreaToBeAcquired,
      totalCompensation: totalCompensation,
      totalCompensationPaid: totalCompensationPaid,
      averageCompensationPerHectare: 0,
      uniqueVillages: new Set(activeRecords.map(r => r.village).filter(Boolean)).size,
      uniqueTalukas: new Set(activeRecords.map(r => r.taluka).filter(Boolean)).size,
      uniqueDistricts: new Set(activeRecords.map(r => r.district).filter(Boolean)).size,
      recordsWithStructures: activeRecords.filter(r => parseFloat(r.structures?.toString() || '0') > 0).length,
      recordsWithTrees: activeRecords.filter(r => 
        (parseFloat(r.forest_trees?.toString() || '0') > 0) || 
        (parseFloat(r.fruit_trees?.toString() || '0') > 0)
      ).length,
      recordsWithWells: activeRecords.filter(r => parseFloat(r.wells_borewells?.toString() || '0') > 0).length,
    };

    // Calculate average compensation per hectare
    if (stats.totalAcquiredArea > 0) {
      stats.averageCompensationPerHectare = stats.totalCompensation / stats.totalAcquiredArea;
    }

    setStats(stats);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    if (records.length > 0) {
      calculateStats(records);
    }
  }, [records]);

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-text-dark-blue mb-12">Live Dashboard Snapshot</h2>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading live data...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!stats) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-text-dark-blue mb-12">Live Dashboard Snapshot</h2>
          <div className="text-center py-8">
            <p>No data available</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-extrabold text-text-dark-blue mb-12">Live Dashboard Snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Total Area to be Acquired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{stats.totalAreaToBeAcquired.toFixed(2)} Ha</div>
              <p className="text-xs text-slate-500">
                Total hectares needed for projects
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700">Total Acquired Area</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-800">{stats.totalAcquiredArea.toFixed(2)} Ha</div>
              <p className="text-xs text-emerald-600">
                Hectares acquired for projects
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">Total Compensation Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-800">₹{(stats.totalCompensationPaid / 10000000).toFixed(1)}Cr</div>
              <p className="text-xs text-amber-600">
                Compensation paid till now
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-700">Total Compensation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-800">₹{(stats.totalCompensation / 10000000).toFixed(1)}Cr</div>
              <p className="text-xs text-indigo-600">
                Total allocated compensation
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default LiveDashboardCards;