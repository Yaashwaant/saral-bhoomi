import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Calendar
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
  AreaChart
} from 'recharts';

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
  project_id: string;
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface ProjectMapping {
  [key: string]: string;
}

const Dashboard2: React.FC = () => {
  const [records, setRecords] = useState<EnglishCompleteRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectMapping, setProjectMapping] = useState<ProjectMapping>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedTaluka, setSelectedTaluka] = useState<string>('all');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [filteredRecords, setFilteredRecords] = useState<EnglishCompleteRecord[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch project names and create mapping
  const fetchProjectMapping = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/projects');
      const data = await response.json();
      
      if (data.success) {
        const mapping: ProjectMapping = {};
        data.data.forEach((project: any) => {
          // Use the correct field name 'id' from the API response
          mapping[project.id] = project.projectName;
        });
        console.log('Project mapping created:', mapping);
        setProjectMapping(mapping);
      }
    } catch (error) {
      console.error('Error fetching project mapping:', error);
    }
  };

  // Fetch English complete records
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/landowners2-english/list');
      const data = await response.json();
      
      if (data.success) {
        setRecords(data.records);
        calculateStats(data.records);
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
    
    // Total land to be acquired = sum of all acquired_land_area
    const totalAreaToBeAcquired = activeRecords.reduce((sum, r) => sum + (parseFloat(r.acquired_land_area?.toString() || '0') || 0), 0);
    
    // Total area acquired = sum of acquired_land_area where compensation is paid
    // Handle the actual database values: PAID, UNPAID (case-insensitive)
    const totalAcquiredArea = activeRecords
      .filter(r => {
        const status = (r.compensation_distribution_status || '').toLowerCase();
        return status === 'paid';
      })
      .reduce((sum, r) => sum + (parseFloat(r.acquired_land_area?.toString() || '0') || 0), 0);
    
    const totalLandArea = activeRecords.reduce((sum, r) => sum + (parseFloat(r.land_area_as_per_7_12?.toString() || '0') || 0), 0);
    const totalCompensation = activeRecords.reduce((sum, r) => sum + (parseFloat(r.final_payable_compensation?.toString() || '0') || 0), 0);
    
    // Calculate paid compensation based on compensation_distribution_status
    // Handle the actual database values: PAID, UNPAID (case-insensitive)
    const totalCompensationPaid = activeRecords
      .filter(r => {
        const status = (r.compensation_distribution_status || '').toLowerCase();
        return status === 'paid';
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
    
    records.filter(r => r.is_active).forEach(record => {
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
    
    records.filter(r => r.is_active).forEach(record => {
      // Handle project_id which might be an object with an id field
      let projectId: string;
      if (typeof record.project_id === 'object' && record.project_id && 'id' in record.project_id) {
        projectId = (record.project_id as any).id;
      } else {
        projectId = String(record.project_id || 'Unknown');
      }
      
      const requiredArea = parseFloat(record.land_area_as_per_7_12?.toString() || '0') || 0;
      const acquiredArea = parseFloat(record.acquired_land_area?.toString() || '0') || 0;
      
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
    
    records.filter(r => r.is_active).forEach(record => {
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
    
    return [
      {
        name: 'Acquired',
        value: stats.totalAcquiredArea
      },
      {
        name: 'To Acquire',
        value: stats.totalAreaToBeAcquired
      }
    ];
  };

  // Filter records based on search and location filters
  useEffect(() => {
    let filtered = records.filter(r => r.is_active);

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.serial_number?.toString().includes(searchTerm) ||
        r.new_survey_number?.toString().includes(searchTerm) ||
        r.old_survey_number?.toString().includes(searchTerm)
      );
    }

    // Apply location filters
    if (selectedDistrict !== 'all') {
      filtered = filtered.filter(r => r.district === selectedDistrict);
    }
    if (selectedTaluka !== 'all') {
      filtered = filtered.filter(r => r.taluka === selectedTaluka);
    }
    if (selectedVillage !== 'all') {
      filtered = filtered.filter(r => r.village === selectedVillage);
    }

    setFilteredRecords(filtered);
    setPage(1); // Reset to first page when filters change
  }, [records, searchTerm, selectedDistrict, selectedTaluka, selectedVillage]);

  // Get unique values for filter dropdowns
  const getUniqueValues = (field: keyof EnglishCompleteRecord) => {
    return Array.from(new Set(records.map(r => r[field]).filter(Boolean))).sort();
  };

  // Prepare chart data
  const getDistrictWiseData = (): ChartData[] => {
    const districtData = records.reduce((acc, record) => {
      if (!record.district || !record.is_active) return acc;
      
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
    const landTypeData = records.reduce((acc, record) => {
      if (!record.land_type || !record.is_active) return acc;
      
      acc[record.land_type] = (acc[record.land_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(landTypeData).map(([type, count]) => ({
      name: type,
      value: count
    }));
  };

  const getCompensationDistribution = (): ChartData[] => {
    const ranges = [
      { label: '0-1L', min: 0, max: 100000 },
      { label: '1L-5L', min: 100000, max: 500000 },
      { label: '5L-10L', min: 500000, max: 1000000 },
      { label: '10L-25L', min: 1000000, max: 2500000 },
      { label: '25L+', min: 2500000, max: Infinity }
    ];

    return ranges.map(range => ({
      name: range.label,
      value: records.filter(r => {
        if (!r.is_active) return false;
        const compensation = parseFloat(r.final_payable_compensation?.toString() || '0') || 0;
        return compensation >= range.min && compensation < range.max;
      }).length
    }));
  };

  useEffect(() => {
    fetchProjectMapping();
    fetchRecords();
  }, []);

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
          <h1 className="text-3xl font-bold">Dashboard2 - English Complete Records</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics for English complete landowner records
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchRecords} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Area to be Acquired</CardTitle>
              <MapPin className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAreaToBeAcquired.toFixed(2)} Ha</div>
              <p className="text-xs text-muted-foreground">
                Total hectares needed for projects
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Acquired Area</CardTitle>
              <MapPin className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAcquiredArea.toFixed(2)} Ha</div>
              <p className="text-xs text-muted-foreground">
                Hectares acquired for projects
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Compensation Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(stats.totalCompensationPaid / 10000000).toFixed(1)}Cr</div>
              <p className="text-xs text-muted-foreground">
                Compensation paid till now
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Compensation</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(stats.totalCompensation / 10000000).toFixed(1)}Cr</div>
              <p className="text-xs text-muted-foreground">
                Total allocated compensation
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="angrezi-vishleshan">अंग्रेजी विश्लेषण</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
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
                    <Bar dataKey="allocated" fill="#8884d8" name="allocated" />
                    <Bar dataKey="spent" fill="#82ca9d" name="spent" />
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
                    <Bar dataKey="required" fill="#ff7300" name="required" />
                    <Bar dataKey="acquired" fill="#00C49F" name="acquired" />
                    <Bar dataKey="toAcquire" fill="#FFBB28" name="toAcquire" />
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
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getPaymentStatusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
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
                      label={({ name, percent, value }) => `${name} ${value.toFixed(1)} Ha (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getOverallLandAcquisitionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value.toFixed(2)} Ha`, 'Area']} />
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
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getLandTypeData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>


        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compensation Distribution Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getCompensationDistribution()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
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
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, serial, survey..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
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
                      <th className="text-left p-2">Compensation</th>
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

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Data Coverage</h4>
                  <p className="text-sm text-blue-700">
                    English complete records cover {stats?.uniqueVillages} villages across {stats?.uniqueDistricts} districts, 
                    representing comprehensive land acquisition data.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900">Compensation Analysis</h4>
                  <p className="text-sm text-green-700">
                    Average compensation per hectare is ₹{(stats?.averageCompensationPerHectare || 0).toFixed(0)}, 
                    with total compensation of ₹{((stats?.totalCompensation || 0) / 10000000).toFixed(1)} crores.
                  </p>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold text-yellow-900">Asset Distribution</h4>
                  <p className="text-sm text-yellow-700">
                    {((stats?.recordsWithStructures || 0) / (stats?.totalRecords || 1) * 100).toFixed(1)}% of records have structures, 
                    {((stats?.recordsWithTrees || 0) / (stats?.totalRecords || 1) * 100).toFixed(1)}% have trees, and 
                    {((stats?.recordsWithWells || 0) / (stats?.totalRecords || 1) * 100).toFixed(1)}% have wells.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Records with Complete Data</span>
                  <Badge variant="default">
                    {records.filter(r => r.owner_name && r.village && r.final_payable_compensation).length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Records with Remarks</span>
                  <Badge variant="secondary">
                    {records.filter(r => r.remarks && r.remarks.trim()).length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Records</span>
                  <Badge variant="default">
                    {records.filter(r => r.is_active).length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Angrezi Vishleshan Tab */}
        <TabsContent value="angrezi-vishleshan" className="space-y-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">English Analytics content will be added here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard2;