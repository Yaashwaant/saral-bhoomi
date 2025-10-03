import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { config } from '@/config';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MapPin, 
  DollarSign, 
  FileText, 
  Download,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Calendar,
  X,
  RotateCcw,
  ChevronDown,
  Building2,
  Home,
  TreePine,
  FolderOpen
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts';
import OfficerAIAssistant from '@/components/ai/OfficerAIAssistant';

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

interface ChartData {
  name: string;
  value: number;
  count?: number;
  allocated?: number;
  spent?: number;
  required?: number;
  acquired?: number;
  toAcquire?: number;
}

interface ProjectData {
  projectId: string;
  projectName: string;
  totalCompensation: number;
  paidCompensation: number;
  requiredArea: number;
  acquiredArea: number;
  toAcquireArea: number;
}

const COLORS = ['#64748b', '#10b981', '#f59e0b', '#8b5cf6', '#6b7280', '#059669'];

interface ProjectMapping {
  [key: string]: string;
}

// Helper functions to calculate compensation values
const calculateSolatiumAmount = (record: EnglishCompleteRecord): number => {
  // Solatium = Determined Compensation - Land Compensation (Section 26)
  const determined = parseFloat(record.determined_compensation_26?.toString() || '0') || 0;
  const landCompensation = parseFloat(record.land_compensation_as_per_section_26?.toString() || '0') || 0;
  return Math.max(0, determined - landCompensation);
};

const calculateEnhancedCompensation = (record: EnglishCompleteRecord): number => {
  // Enhanced Compensation 25% = Total Compensation (26-27) - Determined Compensation (26)
  const totalCompensation = parseFloat(record.total_compensation_26_27?.toString() || '0') || 0;
  const determined = parseFloat(record.determined_compensation_26?.toString() || '0') || 0;
  return Math.max(0, totalCompensation - determined);
};

const Dashboard2: React.FC = () => {
  const [records, setRecords] = useState<EnglishCompleteRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectMapping, setProjectMapping] = useState<ProjectMapping>({});
  const [allProjects, setAllProjects] = useState<Array<{id: string, projectName: string}>>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedTaluka, setSelectedTaluka] = useState<string>('all');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [filteredRecords, setFilteredRecords] = useState<EnglishCompleteRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Helper function to clear all filters
  const clearAllFilters = () => {
    setSelectedDistrict('all');
    setSelectedTaluka('all');
    setSelectedVillage('all');
    setSelectedProject('all');
    setSearchTerm('');
  };

  // Helper function to get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedDistrict !== 'all') count++;
    if (selectedTaluka !== 'all') count++;
    if (selectedVillage !== 'all') count++;
    if (selectedProject !== 'all') count++;
    if (searchTerm.trim()) count++;
    return count;
  };10;

  // Fetch project names and create mapping
  const fetchProjectMapping = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/projects`);
      const data = await response.json();
      
      if (data.success) {
        const mapping: ProjectMapping = {};
        const projects: Array<{id: string, projectName: string}> = [];
        data.data.forEach((project: any) => {
          // Use the correct field name 'id' from the API response
          mapping[project.id] = project.projectName;
          projects.push({ id: project.id, projectName: project.projectName });
        });
        setProjectMapping(mapping);
        setAllProjects(projects);
      }
    } catch (error) {
      console.error('Error fetching project mapping:', error);
    }
  };

  // Fetch English complete records
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/landowners2-english/list`);
      const data = await response.json();
      
      if (data.success) {
        setRecords(data.records);
        // Stats will be calculated in the useEffect when filteredRecords is updated
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
    // Handle the actual database values: PAID, UNPAID (case-insensitive)
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
    // Handle the actual database values: PAID, UNPAID (case-insensitive)
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

  // Get project-wise budget data (Allocated vs Spent)
  const getProjectBudgetData = (): ChartData[] => {
    const projectMap = new Map<string, { allocated: number; spent: number; name: string }>();
    
    filteredRecords.forEach(record => {
      // Handle project_id which might be an object with an id field
      let projectId: string;
      if (typeof record.project_id === 'object' && record.project_id && 'id' in record.project_id) {
        projectId = (record.project_id as any).id;
      } else {
        projectId = String(record.project_id || 'Unknown');
      }
      
      const compensation = parseFloat(record.final_payable_compensation?.toString() || '0') || 0;
      // Handle both uppercase and lowercase status values
      const status = (record.compensation_distribution_status || '').toLowerCase();
      const isPaid = status === 'paid';
      
      if (!projectMap.has(projectId)) {
        // Use actual project name from mapping or fallback to descriptive name
        const projectName = projectMapping[projectId] || 
                           (projectId === 'Unknown' ? 'Unknown Project' : 
                           projectId.length > 10 ? `Project ${projectId.slice(-8)}` : 
                           `Project ${projectId}`);
        projectMap.set(projectId, { 
          allocated: 0, 
          spent: 0, 
          name: projectName
        });
      }
      
      const project = projectMap.get(projectId)!;
      project.allocated += compensation;
      if (isPaid) {
        project.spent += compensation;
      }
    });
    
    return Array.from(projectMap.entries()).map(([id, data]) => ({
      name: data.name,
      allocated: data.allocated,
      spent: data.spent,
      value: data.allocated
    }));
  };

  // Get project-wise land data (Required vs Acquired vs To Acquire)
  const getProjectLandData = (): ChartData[] => {
    const projectMap = new Map<string, { required: number; acquired: number; name: string }>();
    
    filteredRecords.forEach(record => {
      // Handle project_id which might be an object with an id field
      let projectId: string;
      if (typeof record.project_id === 'object' && record.project_id && 'id' in record.project_id) {
        projectId = (record.project_id as any).id;
      } else {
        projectId = String(record.project_id || 'Unknown');
      }
      
      // Required land = sum of acquired_land_area of all land records in the db
      const requiredArea = parseFloat(record.acquired_land_area?.toString() || '0') || 0;
      
      // Only count land as acquired if compensation has been paid
      const compensationStatus = (record.compensation_distribution_status || '').toLowerCase();
      const isCompensationPaid = compensationStatus === 'paid' || compensationStatus === 'completed' || compensationStatus === 'distributed';
      const acquiredArea = isCompensationPaid ? parseFloat(record.acquired_land_area?.toString() || '0') || 0 : 0; // Land acquired = sum of land_acquired whose compensation status is paid
      
      if (!projectMap.has(projectId)) {
        // Use actual project name from mapping or fallback to descriptive name
        const projectName = projectMapping[projectId] || 
                           (projectId === 'Unknown' ? 'Unknown Project' : 
                           projectId.length > 10 ? `Project ${projectId.slice(-8)}` : 
                           `Project ${projectId}`);
        projectMap.set(projectId, { 
          required: 0, 
          acquired: 0, 
          name: projectName
        });
      }
      
      const project = projectMap.get(projectId)!;
      project.required += requiredArea;
      project.acquired += acquiredArea;
    });
    
    return Array.from(projectMap.entries()).map(([id, data]) => ({
      name: data.name,
      required: data.required,
      acquired: data.acquired,
      toAcquire: Math.max(0, data.required - data.acquired),
      value: data.required
    }));
  };

  // Get payment status distribution data
  const getPaymentStatusData = (): ChartData[] => {
    const statusMap = new Map<string, number>();
    
    filteredRecords.forEach(record => {
      const status = (record.compensation_distribution_status || 'unpaid').toLowerCase();
      // Map the actual database values to display values
      const normalizedStatus = status === 'paid' ? 'paid' : 'unpaid';
      statusMap.set(normalizedStatus, (statusMap.get(normalizedStatus) || 0) + 1);
    });
    
    return Array.from(statusMap.entries()).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    }));
  };

  // Get overall land acquisition data
  const getOverallLandAcquisitionData = (): ChartData[] => {
    if (!stats) return [];
    
    // Calculate remaining land to acquire = Total land to be acquired - Land already acquired
    const remainingToAcquire = Math.max(0, stats.totalAreaToBeAcquired - stats.totalAcquiredArea);
    
    return [
      {
        name: 'Acquired',
        value: stats.totalAcquiredArea
      },
      {
        name: 'To Acquire',
        value: remainingToAcquire
      }
    ];
  };

  // Get unique values for filter dropdowns
  const getUniqueValues = (field: keyof EnglishCompleteRecord) => {
    return Array.from(new Set(records.map(r => r[field]).filter(Boolean))).sort();
  };

  // Prepare chart data
  const getDistrictWiseData = (): ChartData[] => {
    const districtData = filteredRecords.reduce((acc, record) => {
      if (!record.district) return acc;
      
      if (!acc[record.district]) {
        acc[record.district] = {
          count: 0,
          totalCompensation: 0,
          totalArea: 0
        };
      }
      
      acc[record.district].count += 1;
      acc[record.district].totalCompensation += parseFloat(record.final_payable_compensation?.toString() || '0') || 0;
      acc[record.district].totalArea += parseFloat(record.acquired_land_area?.toString() || '0') || 0;
      
      return acc;
    }, {} as Record<string, { count: number; totalCompensation: number; totalArea: number }>);

    return Object.entries(districtData).map(([district, data]) => ({
      name: district,
      value: data.totalCompensation,
      count: data.count
    }));
  };

  const getLandTypeData = (): ChartData[] => {
    const landTypeData = filteredRecords.reduce((acc, record) => {
      if (!record.land_type) return acc;
      
      acc[record.land_type] = (acc[record.land_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(landTypeData).map(([type, count]) => ({
      name: type,
      value: count
    }));
  };



  // Get filtered records based on current filters
  const getFilteredRecords = (): EnglishCompleteRecord[] => {
    return filteredRecords; // Use the already filtered records from useEffect
  };

  // Get filtered compensation data by location
  // Filtered versions of project-wise data functions
  const getFilteredProjectBudgetData = (): ChartData[] => {
    const projectMap = new Map<string, { allocated: number; spent: number; name: string }>();
    
    getFilteredRecords().forEach(record => {
      // Handle project_id which might be an object with an id field
      let projectId: string;
      if (typeof record.project_id === 'object' && record.project_id && 'id' in record.project_id) {
        projectId = (record.project_id as any).id;
      } else {
        projectId = String(record.project_id || 'Unknown');
      }
      
      const compensation = parseFloat(record.final_payable_compensation?.toString() || '0') || 0;
      // Handle both uppercase and lowercase status values
      const status = (record.compensation_distribution_status || '').toLowerCase();
      const isPaid = status === 'paid';
      
      if (!projectMap.has(projectId)) {
        // Use actual project name from mapping or fallback to descriptive name
        const projectName = projectMapping[projectId] || 
                           (projectId === 'Unknown' ? 'Unknown Project' : 
                           projectId.length > 10 ? `Project ${projectId.slice(-8)}` : 
                           `Project ${projectId}`);
        projectMap.set(projectId, { 
          allocated: 0, 
          spent: 0, 
          name: projectName
        });
      }
      
      const project = projectMap.get(projectId)!;
      project.allocated += compensation;
      if (isPaid) {
        project.spent += compensation;
      }
    });
    
    return Array.from(projectMap.entries()).map(([id, data]) => ({
      name: data.name,
      allocated: data.allocated,
      spent: data.spent,
      value: data.allocated
    }));
  };

  const getFilteredProjectLandData = (): ChartData[] => {
    const projectMap = new Map<string, { required: number; acquired: number; name: string }>();
    
    getFilteredRecords().forEach(record => {
      // Handle project_id which might be an object with an id field
      let projectId: string;
      if (typeof record.project_id === 'object' && record.project_id && 'id' in record.project_id) {
        projectId = (record.project_id as any).id;
      } else {
        projectId = String(record.project_id || 'Unknown');
      }
      
      // Required land = sum of acquired_land_area of all land records in the db
      const requiredArea = parseFloat(record.acquired_land_area?.toString() || '0') || 0;
      
      // Only count land as acquired if compensation has been paid
      const compensationStatus = (record.compensation_distribution_status || '').toLowerCase();
      const isCompensationPaid = compensationStatus === 'paid' || compensationStatus === 'completed' || compensationStatus === 'distributed';
      const acquiredArea = isCompensationPaid ? parseFloat(record.acquired_land_area?.toString() || '0') || 0 : 0; // Land acquired = sum of land_acquired whose compensation status is paid
      
      if (!projectMap.has(projectId)) {
        // Use actual project name from mapping or fallback to descriptive name
        const projectName = projectMapping[projectId] || 
                           (projectId === 'Unknown' ? 'Unknown Project' : 
                           projectId.length > 10 ? `Project ${projectId.slice(-8)}` : 
                           `Project ${projectId}`);
        projectMap.set(projectId, { 
          required: 0, 
          acquired: 0, 
          name: projectName
        });
      }
      
      const project = projectMap.get(projectId)!;
      project.required += requiredArea;
      project.acquired += acquiredArea;
    });
    
    return Array.from(projectMap.entries()).map(([id, data]) => ({
      name: data.name,
      required: data.required,
      acquired: data.acquired,
      toAcquire: Math.max(0, data.required - data.acquired),
      value: data.required
    }));
  };

  const getFilteredPaymentStatusData = (): ChartData[] => {
    const statusMap = new Map<string, number>();
    
    getFilteredRecords().forEach(record => {
      const status = (record.compensation_distribution_status || 'unpaid').toLowerCase();
      // Map the actual database values to display values
      const normalizedStatus = status === 'paid' ? 'paid' : 'unpaid';
      statusMap.set(normalizedStatus, (statusMap.get(normalizedStatus) || 0) + 1);
    });
    
    return Array.from(statusMap.entries()).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    }));
  };

  const getFilteredOverallLandAcquisitionData = (): ChartData[] => {
    const filtered = getFilteredRecords();
    
    // Only count land as acquired if compensation has been paid
    const totalAcquiredArea = filtered.reduce((sum, r) => {
      const compensationStatus = (r.compensation_distribution_status || '').toLowerCase();
      const isCompensationPaid = compensationStatus === 'paid' || compensationStatus === 'completed' || compensationStatus === 'distributed';
      return sum + (isCompensationPaid ? parseFloat(r.acquired_land_area?.toString() || '0') || 0 : 0);
    }, 0);
    
    // Required land = sum of acquired_land_area of all land records in the db
    const totalRequiredArea = filtered.reduce((sum, r) => sum + (parseFloat(r.acquired_land_area?.toString() || '0') || 0), 0);
    const totalAreaToBeAcquired = Math.max(0, totalRequiredArea - totalAcquiredArea);
    
    return [
      {
        name: 'Acquired',
        value: totalAcquiredArea
      },
      {
        name: 'To Acquire',
        value: totalAreaToBeAcquired
      }
    ];
  };

  const getFilteredLandTypeData = (): ChartData[] => {
    const landTypeData = getFilteredRecords().reduce((acc, record) => {
      if (!record.land_type) return acc;
      
      acc[record.land_type] = (acc[record.land_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(landTypeData).map(([type, count]) => ({
      name: type,
      value: count
    }));
  };

  useEffect(() => {
    fetchProjectMapping();
    fetchRecords();
  }, []);

  // Update filtered records when filters change
  useEffect(() => {
    let filtered = records.filter(record => {
      if (!record.is_active) return false;
      
      // Apply search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          record.owner_name?.toLowerCase().includes(searchLower) ||
          record.serial_number?.toLowerCase().includes(searchLower) ||
          record.old_survey_number?.toLowerCase().includes(searchLower) ||
          record.new_survey_number?.toLowerCase().includes(searchLower) ||
          record.village?.toLowerCase().includes(searchLower) ||
          record.taluka?.toLowerCase().includes(searchLower) ||
          record.district?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }
      
      // Apply location filters
      if (selectedDistrict !== 'all' && record.district !== selectedDistrict) return false;
      if (selectedTaluka !== 'all' && record.taluka !== selectedTaluka) return false;
      if (selectedVillage !== 'all' && record.village !== selectedVillage) return false;
      
      // Apply project filter
      if (selectedProject !== 'all') {
        // Handle project_id as object with id property
        let recordProjectId = '';
        if (typeof record.project_id === 'object' && record.project_id?.id) {
          recordProjectId = record.project_id.id;
        } else {
          recordProjectId = String(record.project_id || '');
        }
        if (recordProjectId !== selectedProject) return false;
      }
      
      return true;
    });
    
    setFilteredRecords(filtered);
    setPage(1); // Reset to first page when filters change
  }, [records, searchTerm, selectedDistrict, selectedTaluka, selectedVillage, selectedProject]);

  // Calculate stats based on filtered records
  useEffect(() => {
    calculateStats(filteredRecords);
  }, [filteredRecords]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading English Complete Records Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchRecords} variant="outline" size="sm">
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      {stats && (
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
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* New Project-wise Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project-wise Budget: Allocated vs Spent */}
            <Card>
              <CardHeader>
                <CardTitle>Project-wise Budget: Allocated vs Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getProjectBudgetData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `₹${(value / 10000000).toFixed(1)}Cr`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `₹${(value / 10000000).toFixed(2)}Cr`, 
                        name === 'allocated' ? 'Allocated' : 'Spent'
                      ]}
                      labelFormatter={(label) => `Project: ${label}`}
                    />
                    <Bar dataKey="allocated" fill="#64748b" name="allocated" />
                    <Bar dataKey="spent" fill="#10b981" name="spent" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Project-wise Land: Required vs Acquired vs To Acquire */}
            <Card>
              <CardHeader>
                <CardTitle>Project-wise Land: Required vs Acquired vs To Acquire</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getProjectLandData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${value.toFixed(1)} Ha`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(2)} Ha`, 
                        name === 'required' ? 'Required' : name === 'acquired' ? 'Acquired' : 'To Acquire'
                      ]}
                      labelFormatter={(label) => `Project: ${label}`}
                    />
                    <Bar dataKey="required" fill="#f59e0b" name="required" />
                    <Bar dataKey="acquired" fill="#10b981" name="acquired" />
                    <Bar dataKey="toAcquire" fill="#64748b" name="toAcquire" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Payment Status and Land Acquisition Pie Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getPaymentStatusData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#64748b"
                      dataKey="value"
                    >
                      {getPaymentStatusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value} records`,
                        name === 'Paid' ? 'Compensation Distributed' : 'Compensation Pending'
                      ]}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => (
                        <span style={{ color: entry.color }}>
                          {value} - {value === 'Paid' ? 'Compensation Distributed' : 'Compensation Pending'}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Overall Land Acquisition */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Land Acquisition</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getOverallLandAcquisitionData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#64748b"
                      dataKey="value"
                    >
                      {getOverallLandAcquisitionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name) => [
                        `${value.toFixed(2)} Ha`, 
                        name === 'Acquired' ? 'Land Already Acquired' : 'Land Remaining to Acquire'
                      ]} 
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => (
                        <span style={{ color: entry.color }}>
                          {value} - {value === 'Acquired' ? 'Land Already Acquired' : 'Land Remaining to Acquire'}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Land Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Land Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getLandTypeData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#64748b"
                      dataKey="value"
                    >
                      {getLandTypeData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value} records`,
                        `Land Type: ${name}`
                      ]}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => (
                        <span style={{ color: entry.color }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>


        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Enhanced Filtered Analytics Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    Location-based Analytics
                  </div>
                  <div className="flex items-center gap-2">
                    {getActiveFilterCount() > 0 && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {getActiveFilterCount()} filter{getActiveFilterCount() > 1 ? 's' : ''} active
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFilters}
                      className="flex items-center gap-1 text-slate-600 hover:text-slate-800 border-slate-300"
                      disabled={getActiveFilterCount() === 0}
                    >
                      Reset All
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enhanced Location Filters */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* District Filter */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        District
                        {selectedDistrict !== 'all' && (
                          <Badge variant="outline" className="ml-auto bg-slate-100 text-slate-800 border-slate-300">
                            Selected
                          </Badge>
                        )}
                      </label>
                      <div className="relative">
                        <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                          <SelectTrigger className="bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-slate-500 transition-colors">
                            <SelectValue placeholder="Select District" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="font-medium">
                              All Districts
                            </SelectItem>
                            {Array.from(new Set(records.map(r => r.district).filter(Boolean))).sort().map(district => (
                              <SelectItem key={district} value={district}>
                                {district}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedDistrict !== 'all' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-red-100"
                            onClick={() => setSelectedDistrict('all')}
                          >
                            <X className="h-3 w-3 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Taluka Filter */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        Taluka
                        {selectedTaluka !== 'all' && (
                          <Badge variant="outline" className="ml-auto bg-emerald-100 text-emerald-800 border-emerald-300">
                            Selected
                          </Badge>
                        )}
                      </label>
                      <div className="relative">
                        <Select value={selectedTaluka} onValueChange={setSelectedTaluka}>
                          <SelectTrigger className="bg-white border-2 border-emerald-200 hover:border-emerald-300 focus:border-emerald-500 transition-colors">
                            <SelectValue placeholder="Select Taluka" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="font-medium">
                              All Talukas
                            </SelectItem>
                            {Array.from(new Set(
                              records
                                .filter(r => selectedDistrict === 'all' || r.district === selectedDistrict)
                                .map(r => r.taluka)
                                .filter(Boolean)
                            )).sort().map(taluka => (
                              <SelectItem key={taluka} value={taluka}>
                                {taluka}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedTaluka !== 'all' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-red-100"
                            onClick={() => setSelectedTaluka('all')}
                          >
                            <X className="h-3 w-3 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Village Filter */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        Village
                        {selectedVillage !== 'all' && (
                          <Badge variant="outline" className="ml-auto bg-emerald-100 text-emerald-800 border-emerald-300">
                            Selected
                          </Badge>
                        )}
                      </label>
                      <div className="relative">
                        <Select value={selectedVillage} onValueChange={setSelectedVillage}>
                          <SelectTrigger className="bg-white border-2 border-emerald-200 hover:border-emerald-300 focus:border-emerald-500 transition-colors">
                            <SelectValue placeholder="Select Village" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="font-medium">
                              All Villages
                            </SelectItem>
                            {Array.from(new Set(
                              records
                                .filter(r => 
                                  (selectedDistrict === 'all' || r.district === selectedDistrict) &&
                                  (selectedTaluka === 'all' || r.taluka === selectedTaluka)
                                )
                                .map(r => r.village)
                                .filter(Boolean)
                            )).sort().map(village => (
                              <SelectItem key={village} value={village}>
                                {village}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedVillage !== 'all' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-red-100"
                            onClick={() => setSelectedVillage('all')}
                          >
                            <X className="h-3 w-3 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Project Filter */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        Project
                        {selectedProject !== 'all' && (
                          <Badge variant="outline" className="ml-auto bg-indigo-100 text-indigo-800 border-indigo-300">
                            Selected
                          </Badge>
                        )}
                      </label>
                      <div className="relative">
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                          <SelectTrigger className="bg-white border-2 border-indigo-200 hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                            <SelectValue placeholder="Select Project" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="font-medium">
                              <div className="flex items-center gap-2">
                                All Projects
                              </div>
                            </SelectItem>
                            {allProjects.map(project => (
                              <SelectItem key={project.id} value={project.id}>
                                <div className="flex items-center gap-2">
                                  {project.projectName}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedProject !== 'all' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-red-100"
                            onClick={() => setSelectedProject('all')}
                          >
                            <X className="h-3 w-3 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Active Filters Display */}
                  {getActiveFilterCount() > 0 && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-600">Active Filters:</span>
                        {selectedDistrict !== 'all' && (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-800 flex items-center gap-1">
                            {selectedDistrict}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1 hover:bg-slate-200"
                              onClick={() => setSelectedDistrict('all')}
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          </Badge>
                        )}
                        {selectedTaluka !== 'all' && (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            {selectedTaluka}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1 hover:bg-emerald-200"
                              onClick={() => setSelectedTaluka('all')}
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          </Badge>
                        )}
                        {selectedVillage !== 'all' && (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            {selectedVillage}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1 hover:bg-emerald-200"
                              onClick={() => setSelectedVillage('all')}
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Filtered Quick Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-700">Total Area to be Acquired</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-slate-800">
                        {getFilteredRecords()
                          .reduce((sum, r) => sum + (parseFloat(r.acquired_land_area?.toString() || '0') || 0), 0).toFixed(2)} Ha
                      </div>
                      <p className="text-xs text-slate-600">
                        Total hectares needed for projects
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-emerald-700">Total Acquired Area</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-emerald-800">
                        {getFilteredRecords()
                          .filter(r => {
                            const status = (r.compensation_distribution_status || '').toLowerCase();
                            return status === 'paid' || status === 'completed' || status === 'distributed';
                          })
                          .reduce((sum, r) => sum + (parseFloat(r.acquired_land_area?.toString() || '0') || 0), 0).toFixed(2)} Ha
                      </div>
                      <p className="text-xs text-emerald-600">
                        Hectares acquired for projects
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-amber-700">Total Compensation Paid</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-800">
                        ₹{(getFilteredRecords()
                          .filter(r => {
                            const status = (r.compensation_distribution_status || '').toUpperCase();
                            return status === 'PAID';
                          })
                          .reduce((sum, r) => sum + (parseFloat(r.final_payable_compensation?.toString() || '0') || 0), 0) / 10000000).toFixed(1)}Cr
                      </div>
                      <p className="text-xs text-amber-600">
                        Compensation paid till now
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-violet-700">Total Compensation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-violet-800">
                        ₹{(getFilteredRecords().reduce((sum, r) => sum + (parseFloat(r.final_payable_compensation?.toString() || '0') || 0), 0) / 10000000).toFixed(1)}Cr
                      </div>
                      <p className="text-xs text-violet-600">
                        Total allocated compensation
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Filtered Project-wise Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Filtered Project-wise Budget: Allocated vs Spent */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Project-wise Budget: Allocated vs Spent (Filtered)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getFilteredProjectBudgetData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => `₹${(value / 10000000).toFixed(1)}Cr`} />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `₹${(value / 10000000).toFixed(2)}Cr`, 
                              name === 'allocated' ? 'Allocated' : 'Spent'
                            ]}
                            labelFormatter={(label) => `Project: ${label}`}
                          />
                          <Bar dataKey="allocated" fill="#64748b" name="allocated" />
                          <Bar dataKey="spent" fill="#10b981" name="spent" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Filtered Project-wise Land: Required vs Acquired vs To Acquire */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Project-wise Land: Required vs Acquired vs To Acquire (Filtered)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getFilteredProjectLandData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => `${value.toFixed(1)} Ha`} />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `${value.toFixed(2)} Ha`, 
                              name === 'required' ? 'Required' : name === 'acquired' ? 'Acquired' : 'To Acquire'
                            ]}
                            labelFormatter={(label) => `Project: ${label}`}
                          />
                          <Bar dataKey="required" fill="#f59e0b" name="required" />
                          <Bar dataKey="acquired" fill="#10b981" name="acquired" />
                          <Bar dataKey="toAcquire" fill="#64748b" name="toAcquire" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Filtered Payment Status and Land Acquisition Pie Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Filtered Payment Status Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Status Distribution (Filtered)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={getFilteredPaymentStatusData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                            outerRadius={60}
                            fill="#64748b"
                            dataKey="value"
                          >
                            {getFilteredPaymentStatusData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [
                              `${value} records`,
                              name === 'Paid' ? 'Compensation Distributed' : 'Compensation Pending'
                            ]}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            formatter={(value, entry) => (
                              <span style={{ color: entry.color }}>
                                {value} - {value === 'Paid' ? 'Compensation Distributed' : 'Compensation Pending'}
                              </span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Filtered Land Type Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Land Type Distribution (Filtered)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={getFilteredLandTypeData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                            outerRadius={60}
                            fill="#64748b"
                            dataKey="value"
                          >
                            {getFilteredLandTypeData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [
                              `${value} records`,
                              `Land Type: ${name}`
                            ]}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            formatter={(value, entry) => (
                              <span style={{ color: entry.color }}>
                                {value}
                              </span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Filtered Analytics Charts */}
                {/* Charts removed as requested */}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Records Tab */}
        <TabsContent value="records" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Input
                    placeholder="Search by name, serial, survey..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-3"
                  />
                </div>
                
                <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Districts</SelectItem>
                    {getUniqueValues('district').map(district => (
                      <SelectItem key={district} value={district}>{district}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedTaluka} onValueChange={setSelectedTaluka}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Taluka" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Talukas</SelectItem>
                    {getUniqueValues('taluka').map(taluka => (
                      <SelectItem key={taluka} value={taluka}>{taluka}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedVillage} onValueChange={setSelectedVillage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Village" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Villages</SelectItem>
                    {getUniqueValues('village').map(village => (
                      <SelectItem key={village} value={village}>{village}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>English Complete Records ({filteredRecords.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Serial No.</th>
                      <th className="text-left p-2">Owner Name</th>
                      <th className="text-left p-2">Survey No.</th>
                      <th className="text-left p-2">Village</th>
                      <th className="text-left p-2">Area (Ha)</th>
                      <th className="text-left p-2">Solatium Amount</th>
                      <th className="text-left p-2">Enhanced Compensation 25%</th>
                      <th className="text-left p-2">Total Compensation</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords
                      .slice((page - 1) * pageSize, page * pageSize)
                      .map((record) => (
                        <tr key={record._id} className="border-b hover:bg-muted/50">
                          <td className="p-2">{record.serial_number}</td>
                          <td className="p-2 font-medium">{record.owner_name}</td>
                          <td className="p-2">{record.new_survey_number || record.old_survey_number}</td>
                          <td className="p-2">{record.village}</td>
                          <td className="p-2">{parseFloat(record.acquired_land_area?.toString() || '0').toFixed(2)}</td>
                          <td className="p-2">₹{(calculateSolatiumAmount(record) / 100000).toFixed(1)}L</td>
                          <td className="p-2">₹{(calculateEnhancedCompensation(record) / 100000).toFixed(1)}L</td>
                          <td className="p-2">₹{(parseFloat(record.final_payable_compensation?.toString() || '0') / 100000).toFixed(1)}L</td>
                          <td className="p-2">
                            <Badge variant={record.compensation_distribution_status ? "default" : "secondary"}>
                              {record.compensation_distribution_status || 'Pending'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredRecords.length)} of {filteredRecords.length} records
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    disabled={page === 1} 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    disabled={(page * pageSize) >= filteredRecords.length} 
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
      {/* AI Assistant Launcher */}
      <OfficerAIAssistant />
    </div>
  );
};

export default Dashboard2;