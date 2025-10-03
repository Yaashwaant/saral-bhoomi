import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Database, RefreshCw, Download, Upload, Edit, CheckCircle, XCircle, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { config } from '../../../config';
import { LandRecord2 } from '../../models';

// Utility function to safely convert string values to numeric data types
const safeNumericConversion = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return '0';
  }
  
  // If it's already a number, return it as string with proper formatting
  if (typeof value === 'number') {
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  // If it's a string, try to parse it as a number
  if (typeof value === 'string') {
    // Remove any non-numeric characters except decimal point and negative sign
    const cleanedValue = value.replace(/[^\d.-]/g, '');
    const numericValue = parseFloat(cleanedValue);
    
    // Check if the conversion resulted in a valid number
    if (!isNaN(numericValue)) {
      return numericValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }
  
  // If conversion fails, return the original value as string
  return String(value);
};

const LandRecordsManager2: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useSaral();
  
  // State management - remove project dependency
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [landRecords, setLandRecords] = useState<LandRecord2[]>([]);
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('form');
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LandRecord2>>({});
  const [dynamicColumns, setDynamicColumns] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Land record form state
  const [landRecordForm, setLandRecordForm] = useState<Partial<LandRecord2>>({
    अ_क्र: '',
    खातेदाराचे_नांव: '',
    जुना_स_नं: '',
    नविन_स_नं: '',
    गट_नंबर: '',
    सी_टी_एस_नं: '',
    Village: '',
    Taluka: '',
    District: '',
    गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर: 0,
    संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर: 0,
    जमिनीचा_प्रकार: '',
    जमिनीचा_प्रकार_शेती_बिनशेती_धारणाधिकार: '',
    मंजुर_केलेला_दर_प्रति_हेक्टर_रक्कम_रुपये: 0,
    संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य_र_रू: 0,
    कलम_26_नुसार_जमिनीचा_मोबदला_9X10: 0,
    एकुण_रक्कम_14_23: 0,
    सोलेशियम_दिलासा_रक्कम: 0,
    निर्धारित_मोबदला_26: 0,
    एकूण_रक्कमेवर_25_वाढीव_मोबदला: 0,
    एकुण_मोबदला_26_27: 0,
    हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम_रुपये: 0,
    मोबदला_वाटप_तपशिल: '',
    project_id: ''
  });

  // Load land records function
  const loadLandRecords = async () => {
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    setLoading(true);
    try {
      const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
      const response = await fetch(`${config.API_BASE_URL}/landowners2-english/${selectedProject}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLandRecords(data.data || []);
      
      // Only show the 30 core fields specified for Land Records Management (serial_number removed for dynamic generation)
      const coreFields = [
        'id', 'owner_name', 'old_survey_number', 'new_survey_number',
        'group_number', 'cts_number', 'village', 'taluka', 'district',
        'land_area_as_per_7_12', 'acquired_land_area', 'land_type', 'land_classification',
        'approved_rate_per_hectare', 'market_value_as_per_acquired_area',
        'factor_as_per_section_26_2', 'land_compensation_as_per_section_26',
        'structures', 'forest_trees', 'fruit_trees', 'wells_borewells',
        'total_structures_amount', 'total_amount_14_23', 'determined_compensation_26',
        'total_compensation_26_27', 'deduction_amount', 'final_payable_compensation',
        'remarks', 'compensation_distribution_status', 'project_id'
      ];
      setDynamicColumns(coreFields);
      
      toast.success(`Loaded ${data.data?.length || 0} land records`);
    } catch (error) {
      console.error('Error loading land records:', error);
      toast.error('Failed to load land records');
    } finally {
      setLoading(false);
    }
  };

  // Set default project and load records when projects are available
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects, selectedProject]);

  // Load records when project changes
  useEffect(() => {
    if (selectedProject) {
      setLandRecordForm(prev => ({ ...prev, project_id: selectedProject }));
      loadLandRecords();
    }
  }, [selectedProject]);

  // Filter land records based on search term
  const filteredLandRecords = landRecords.filter(record => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      record.खातेदाराचे_नांव?.toLowerCase().includes(searchLower) ||
      record.Village?.toLowerCase().includes(searchLower) ||
      record.Taluka?.toLowerCase().includes(searchLower) ||
      record.District?.toLowerCase().includes(searchLower) ||
      record.अ_क्र?.toLowerCase().includes(searchLower) ||
      record.जुना_स_नं?.toLowerCase().includes(searchLower) ||
      record.नविन_स_नं?.toLowerCase().includes(searchLower)
    );
  });
  const handleEdit = (record: LandRecord2) => {
    setEditingRecord(record.id || record._id?.toString()!);
    setEditForm(record);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord || !editForm) return;
    
    setLoading(true);
    try {
      const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      
      if (authToken === 'demo-jwt-token') {
        headers['x-demo-role'] = 'officer';
      }
      
      // Ensure project_id is sent as a string, not an object
      const sanitizedEditForm = { ...editForm };
      if (sanitizedEditForm.project_id && typeof sanitizedEditForm.project_id === 'object') {
        sanitizedEditForm.project_id = (sanitizedEditForm.project_id as any).id || sanitizedEditForm.project_id;
      }
      
      const response = await fetch(`${config.API_BASE_URL}/landowners2-english/${editingRecord}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(sanitizedEditForm)
      });

      if (response.ok) {
        toast.success('Land record updated successfully');
        setEditingRecord(null);
        setEditForm({});
        loadLandRecords();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update land record');
      }
    } catch (error) {
      console.error('Error updating land record:', error);
      toast.error('Error updating land record');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditForm({});
  };

  const handleInputChange = (field: keyof LandRecord2, value: any) => {
    setLandRecordForm(prev => ({ ...prev, [field]: value, project_id: selectedProject }));
  };

  const handleEditInputChange = (field: keyof LandRecord2, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      
      if (authToken === 'demo-jwt-token') {
        headers['x-demo-role'] = 'officer';
      }
      
      const response = await fetch(`${config.API_BASE_URL}/landowners2-english`, {
        method: 'POST',
        headers,
        body: JSON.stringify(landRecordForm),
      });

      if (response.ok) {
        toast.success('Land record created successfully');
        setLandRecordForm({
          अ_क्र: '',
          खातेदाराचे_नांव: '',
          जुना_स_नं: '',
          नविन_स_नं: '',
          गट_नंबर: '',
          सी_टी_एस_नं: '',
          Village: '',
          Taluka: '',
          District: '',
          गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर: 0,
          संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर: 0,
          जमिनीचा_प्रकार: '',
          जमिनीचा_प्रकार_शेती_बिनशेती_धारणाधिकार: '',
          मंजुर_केलेला_दर_प्रति_हेक्टर_रक्कम_रुपये: 0,
          संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य_र_रू: 0,
          कलम_26_2_नुसार_गावास_लागु_असलेले_गणक_Factor_अ_क्र_5_X_8: 1,
          कलम_26_नुसार_जमिनीचा_मोबदला_9X10: 0,
          बांधकामे: 0,
          वनझाडे: 0,
          फळझाडे: 0,
          विहिरी_बोअरवेल: 0,
          एकुण_रक्कम_रुपये_16_18_20_22: 0,
          एकुण_रक्कम_14_23: 0,
          सोलेशियम_दिलासा_रक्कम: 0,
          निर्धारित_मोबदला_26: 0,
          एकूण_रक्कमेवर_25_वाढीव_मोबदला: 0,
          एकुण_मोबदला_26_27: 0,
          वजावट_रक्कम_रुपये: 0,
          हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम_रुपये: 0,
          शेरा: '',
          मोबदला_वाटप_तपशिल: '',
          project_id: '68da6edf579af093415f639e'
        });
        loadLandRecords();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to create land record');
      }
    } catch (error) {
      console.error('Error creating land record:', error);
      toast.error('Error creating land record');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!csvFile || !selectedProject) {
      toast.error('Please select a CSV file and project');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('projectId', selectedProject);

    try {
      const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${authToken}`
      };
      
      if (authToken === 'demo-jwt-token') {
        headers['x-demo-role'] = 'officer';
      }
      
      const response = await fetch(`${config.API_BASE_URL}/landowners2-english/upload-csv`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`CSV uploaded successfully! ${result.inserted} records created.`);
        setCsvFile(null);
        loadLandRecords();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to upload CSV');
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast.error('Error uploading CSV');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (filteredLandRecords.length === 0) {
      toast.error('No records to export');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(filteredLandRecords);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Land Records');
    
    const filename = `land_records_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    XLSX.writeFile(workbook, filename);
    toast.success(`Exported ${filteredLandRecords.length} records to ${filename}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <Badge className="bg-green-500">{status}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">{status}</Badge>;
      case 'rejected':
      case 'failed':
        return <Badge className="bg-red-500">{status}</Badge>;
      case 'initiated':
        return <Badge className="bg-blue-500">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Land Record Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="project-select">Select Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="search-input">Search Records</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search-input"
                  type="text"
                  placeholder="Search by name, village, survey number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-end gap-2">
              <Button onClick={loadLandRecords} disabled={loading || !selectedProject}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={exportToExcel} disabled={filteredLandRecords.length === 0} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Showing {filteredLandRecords.length} of {landRecords.length} records
              {searchTerm && ` (filtered by "${searchTerm}")`}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="form">Create Record</TabsTrigger>
              <TabsTrigger value="upload">Upload CSV</TabsTrigger>
              <TabsTrigger value="list">View Records</TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="अ_क्र">अ.क्र</Label>
                    <Input
                      id="अ_क्र"
                      value={landRecordForm.अ_क्र}
                      onChange={(e) => handleInputChange('अ_क्र', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="खातेदाराचे_नांव">खातेदाराचे नांव</Label>
                    <Input
                      id="खातेदाराचे_नांव"
                      value={landRecordForm.खातेदाराचे_नांव}
                      onChange={(e) => handleInputChange('खातेदाराचे_नांव', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="जुना_स_नं">जुना स.नं.</Label>
                    <Input
                      id="जुना_स_नं"
                      value={landRecordForm.जुना_स_नं || ''}
                      onChange={(e) => handleInputChange('जुना_स_नं', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="नविन_स_नं">नविन स.नं.</Label>
                    <Input
                      id="नविन_स_नं"
                      value={landRecordForm.नविन_स_नं || ''}
                      onChange={(e) => handleInputChange('नविन_स_नं', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="गट_नंबर">गट नंबर</Label>
                    <Input
                      id="गट_नंबर"
                      value={landRecordForm.गट_नंबर || ''}
                      onChange={(e) => handleInputChange('गट_नंबर', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="सी_टी_एस_नंबर">सी.टी.एस. नंबर</Label>
                    <Input
                      id="सी_टी_एस_नं"
                      value={landRecordForm.सी_टी_एस_नं || ''}
                      onChange={(e) => handleInputChange('सी_टी_एस_नं', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="Village">Village</Label>
                    <Input
                      id="Village"
                      value={landRecordForm.Village}
                      onChange={(e) => handleInputChange('Village', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="Taluka">Taluka</Label>
                    <Input
                      id="Taluka"
                      value={landRecordForm.Taluka}
                      onChange={(e) => handleInputChange('Taluka', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="District">District</Label>
                    <Input
                      id="District"
                      value={landRecordForm.District}
                      onChange={(e) => handleInputChange('District', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर">गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)</Label>
                    <Input
                      id="गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर"
                      type="number"
                      step="0.0001"
                      value={landRecordForm.गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर}
                      onChange={(e) => handleInputChange('गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर">संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)</Label>
                    <Input
                      id="संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर"
                      type="number"
                      step="0.0001"
                      value={landRecordForm.संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर}
                      onChange={(e) => handleInputChange('संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="जमिनीचा_प्रकार">जमिनीचा प्रकार</Label>
                    <Input
                      id="जमिनीचा_प्रकार"
                      value={landRecordForm.जमिनीचा_प्रकार || ''}
                      onChange={(e) => handleInputChange('जमिनीचा_प्रकार', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="जमिनीचा_प्रकार_शेती_बिनशेती_धारणाधिकार">जमिनीचा प्रकार शेती/ बिनशेती/ धारणाधिकार</Label>
                    <Input
                      id="जमिनीचा_प्रकार_शेती_बिनशेती_धारणाधिकार"
                      value={landRecordForm.जमिनीचा_प्रकार_शेती_बिनशेती_धारणाधिकार || ''}
                      onChange={(e) => handleInputChange('जमिनीचा_प्रकार_शेती_बिनशेती_धारणाधिकार', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="मंजुर_केलेला_दर_प्रति_हेक्टर_रक्कम_रुपये">मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये</Label>
                    <Input
                      id="मंजुर_केलेला_दर_प्रति_हेक्टर_रक्कम_रुपये"
                      type="number"
                      step="0.01"
                      value={landRecordForm.मंजुर_केलेला_दर_प्रति_हेक्टर_रक्कम_रुपये}
                      onChange={(e) => handleInputChange('मंजुर_केलेला_दर_प्रति_हेक्टर_रक्कम_रुपये', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य_र_रू">संपादीत होणाऱ्या जमिनीच्या क्षेत्रानुसार येणारे बाजारमुल्य र.रू</Label>
                    <Input
                      id="संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य_र_रू"
                      type="number"
                      step="0.01"
                      value={landRecordForm.संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य_र_रू}
                      onChange={(e) => handleInputChange('संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य_र_रू', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="कलम_26_2_नुसार_गावास_लागु_असलेले_गणक_Factor_अ_क्र_5_X_8">कलम 26 (2) नुसार गावास लागु असलेले गणक Factor (अ.क्र. 5 X 8)</Label>
                    <Input
                      id="कलम_26_2_नुसार_गावास_लागु_असलेले_गणक_Factor_अ_क्र_5_X_8"
                      type="number"
                      step="0.01"
                      value={landRecordForm.कलम_26_2_नुसार_गावास_लागु_असलेले_गणक_Factor_अ_क्र_5_X_8}
                      onChange={(e) => handleInputChange('कलम_26_2_नुसार_गावास_लागु_असलेले_गणक_Factor_अ_क्र_5_X_8', parseFloat(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="कलम_26_नुसार_जमिनीचा_मोबदला_9X10">कलम 26 नुसार जमिनीचा मोबदला (9X10)</Label>
                    <Input
                      id="कलम_26_नुसार_जमिनीचा_मोबदला_9X10"
                      type="number"
                      step="0.01"
                      value={landRecordForm.कलम_26_नुसार_जमिनीचा_मोबदला_9X10}
                      onChange={(e) => handleInputChange('कलम_26_नुसार_जमिनीचा_मोबदला_9X10', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="बांधकामे">बांधकामे</Label>
                    <Input
                      id="बांधकामे"
                      type="number"
                      step="0.01"
                      value={landRecordForm.बांधकामे}
                      onChange={(e) => handleInputChange('बांधकामे', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="वनझाडे">वनझाडे</Label>
                    <Input
                      id="वनझाडे"
                      type="number"
                      step="0.01"
                      value={landRecordForm.वनझाडे}
                      onChange={(e) => handleInputChange('वनझाडे', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="फळझाडे">फळझाडे</Label>
                    <Input
                      id="फळझाडे"
                      type="number"
                      step="0.01"
                      value={landRecordForm.फळझाडे}
                      onChange={(e) => handleInputChange('फळझाडे', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="विहिरी_बोअरवेल">विहिरी/बोअरवेल</Label>
                    <Input
                      id="विहिरी_बोअरवेल"
                      type="number"
                      step="0.01"
                      value={landRecordForm.विहिरी_बोअरवेल}
                      onChange={(e) => handleInputChange('विहिरी_बोअरवेल', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="एकुण_रक्कम_रुपये_16_18_20_22">एकुण रक्कम रुपये (16+18+ 20+22)</Label>
                    <Input
                      id="एकुण_रक्कम_रुपये_16_18_20_22"
                      type="number"
                      step="0.01"
                      value={landRecordForm.एकुण_रक्कम_रुपये_16_18_20_22}
                      onChange={(e) => handleInputChange('एकुण_रक्कम_रुपये_16_18_20_22', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="एकुण_रक्कम_14_23">एकुण रक्कम (14+23)</Label>
                    <Input
                      id="एकुण_रक्कम_14_23"
                      type="number"
                      step="0.01"
                      value={landRecordForm.एकुण_रक्कम_14_23}
                      onChange={(e) => handleInputChange('एकुण_रक्कम_14_23', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="सोलेशियम_दिलासा_रक्कम">100 % सोलेशियम (दिलासा रक्कम)</Label>
                    <Input
                      id="सोलेशियम_दिलासा_रक्कम"
                      type="number"
                      step="0.01"
                      value={landRecordForm.सोलेशियम_दिलासा_रक्कम}
                      onChange={(e) => handleInputChange('सोलेशियम_दिलासा_रक्कम', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="निर्धारित_मोबदला_26">निर्धारित मोबदला 26 = (24+25)</Label>
                    <Input
                      id="निर्धारित_मोबदला_26"
                      type="number"
                      step="0.01"
                      value={landRecordForm.निर्धारित_मोबदला_26}
                      onChange={(e) => handleInputChange('निर्धारित_मोबदला_26', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="एकूण_रक्कमेवर_25_वाढीव_मोबदला">एकूण रक्कमेवर 25% वाढीव मोबदला</Label>
                    <Input
                      id="एकूण_रक्कमेवर_25_वाढीव_मोबदला"
                      type="number"
                      step="0.01"
                      value={landRecordForm.एकूण_रक्कमेवर_25_वाढीव_मोबदला}
                      onChange={(e) => handleInputChange('एकूण_रक्कमेवर_25_वाढीव_मोबदला', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="एकुण_मोबदला_26_27">एकुण मोबदला (26+ 27)</Label>
                    <Input
                      id="एकुण_मोबदला_26_27"
                      type="number"
                      step="0.01"
                      value={landRecordForm.एकुण_मोबदला_26_27}
                      onChange={(e) => handleInputChange('एकुण_मोबदला_26_27', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="वजावट_रक्कम_रुपये">वजावट रक्कम रुपये</Label>
                    <Input
                      id="वजावट_रक्कम_रुपये"
                      type="number"
                      step="0.01"
                      value={landRecordForm.वजावट_रक्कम_रुपये}
                      onChange={(e) => handleInputChange('वजावट_रक्कम_रुपये', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम_रुपये">हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये</Label>
                    <Input
                      id="हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम_रुपये"
                      type="number"
                      step="0.01"
                      value={landRecordForm.हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम_रुपये}
                      onChange={(e) => handleInputChange('हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम_रुपये', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="शेरा">शेरा</Label>
                    <Textarea
                      id="शेरा"
                      value={landRecordForm.शेरा || ''}
                      onChange={(e) => handleInputChange('शेरा', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="मोबदला_वाटप_तपशिल">मोबदला वाटप तपशिल</Label>
                    <Input
                      id="मोबदला_वाटप_तपशिल"
                      value={landRecordForm.मोबदला_वाटप_तपशिल || ''}
                      onChange={(e) => handleInputChange('मोबदला_वाटप_तपशिल', e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Land Record'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-file">Upload CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  />
                </div>
                <Button onClick={handleFileUpload} disabled={!csvFile || loading}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              {filteredLandRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? `No land records found matching "${searchTerm}"` : "No land records found for this project"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Owner Name</TableHead>
                        <TableHead>Old Survey Number</TableHead>
                        <TableHead>New Survey Number</TableHead>
                        <TableHead>Group Number</TableHead>
                        <TableHead>CTS Number</TableHead>
                        <TableHead>Village</TableHead>
                        <TableHead>Taluka</TableHead>
                        <TableHead>District</TableHead>
                        <TableHead>Land Area as per 7/12</TableHead>
                        <TableHead>Acquired Land Area</TableHead>
                        <TableHead>Land Type</TableHead>
                        <TableHead>Land Classification</TableHead>
                        <TableHead>Approved Rate per Hectare</TableHead>
                        <TableHead>Market Value as per Acquired Area</TableHead>
                        <TableHead>Factor as per Section 26(2)</TableHead>
                        <TableHead>Land Compensation as per Section 26</TableHead>
                        <TableHead>Structures</TableHead>
                        <TableHead>Forest Trees</TableHead>
                        <TableHead>Fruit Trees</TableHead>
                        <TableHead>Wells/Borewells</TableHead>
                        <TableHead>Total Structures Amount</TableHead>
                        <TableHead>Total Amount (14+23)</TableHead>
                        <TableHead>Determined Compensation 26</TableHead>
                        <TableHead>Total Compensation (26+27)</TableHead>
                        <TableHead>Deduction Amount</TableHead>
                        <TableHead>Final Payable Compensation</TableHead>
                        <TableHead>Remarks</TableHead>
                        <TableHead>Compensation Distribution Status</TableHead>
                        <TableHead>Project ID</TableHead>
                        {dynamicColumns.filter(col => 
                          !['serial_number', 'owner_name', 'old_survey_number', 'new_survey_number', 
                            'group_number', 'cts_number', 'village', 'taluka', 'district', 
                            'land_area_as_per_7_12', 'acquired_land_area', 'land_type', 'land_classification',
                            'approved_rate_per_hectare', 'market_value_as_per_acquired_area',
                            'factor_as_per_section_26_2', 'land_compensation_as_per_section_26',
                            'structures', 'forest_trees', 'fruit_trees', 'wells_borewells',
                            'total_structures_amount', 'total_amount_14_23',
                            'determined_compensation_26', 'total_compensation_26_27',
                            'deduction_amount', 'final_payable_compensation', 'remarks', 
                            'compensation_distribution_status', 'project_id', 'id', '_id', '__v'].includes(col)
                        ).map(col => (
                          <TableHead key={col}>{col.replace(/_/g, ' ').toUpperCase()}</TableHead>
                        ))}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLandRecords.map((record, index) => (
                        <TableRow key={record.id || record._id?.toString()}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.owner_name || ''}
                                onChange={(e) => handleEditInputChange('owner_name', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.owner_name
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.old_survey_number || ''}
                                onChange={(e) => handleEditInputChange('old_survey_number', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.खातेदाराचे_नांव || record.old_survey_number || ''
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.new_survey_number || ''}
                                onChange={(e) => handleEditInputChange('new_survey_number', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.नविन_स_नं || record.new_survey_number || ''
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.group_number || ''}
                                onChange={(e) => handleEditInputChange('group_number', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.गट_नंबर || record.group_number || ''
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.cts_number || ''}
                                onChange={(e) => handleEditInputChange('cts_number', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.सी_टी_एस_नंबर || record.cts_number || ''
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.village || ''}
                                onChange={(e) => handleEditInputChange('village', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.village
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.taluka || ''}
                                onChange={(e) => handleEditInputChange('taluka', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.taluka
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.district || ''}
                                onChange={(e) => handleEditInputChange('district', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.district
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.0001"
                                value={editForm.land_area_as_per_7_12 || ''}
                                onChange={(e) => handleEditInputChange('land_area_as_per_7_12', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.land_area_as_per_7_12)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.0001"
                                value={editForm.acquired_land_area || ''}
                                onChange={(e) => handleEditInputChange('acquired_land_area', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.acquired_land_area)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.land_type || ''}
                                onChange={(e) => handleEditInputChange('land_type', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.land_type
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.land_classification || ''}
                                onChange={(e) => handleEditInputChange('land_classification', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.land_classification
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.approved_rate_per_hectare || ''}
                                onChange={(e) => handleEditInputChange('approved_rate_per_hectare', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.approved_rate_per_hectare)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.market_value_as_per_acquired_area || ''}
                                onChange={(e) => handleEditInputChange('market_value_as_per_acquired_area', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.market_value_as_per_acquired_area)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.factor_as_per_section_26_2 || ''}
                                onChange={(e) => handleEditInputChange('factor_as_per_section_26_2', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.factor_as_per_section_26_2)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.land_compensation_as_per_section_26 || ''}
                                onChange={(e) => handleEditInputChange('land_compensation_as_per_section_26', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.land_compensation_as_per_section_26)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                value={editForm.structures || ''}
                                onChange={(e) => handleEditInputChange('structures', parseInt(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              record.structures
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                value={editForm.forest_trees || ''}
                                onChange={(e) => handleEditInputChange('forest_trees', parseInt(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              record.forest_trees
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                value={editForm.fruit_trees || ''}
                                onChange={(e) => handleEditInputChange('fruit_trees', parseInt(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              record.fruit_trees
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                value={editForm.wells_borewells || ''}
                                onChange={(e) => handleEditInputChange('wells_borewells', parseInt(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              record.wells_borewells
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.total_structures_amount || ''}
                                onChange={(e) => handleEditInputChange('total_structures_amount', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.total_structures_amount)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.total_amount_14_23 || ''}
                                onChange={(e) => handleEditInputChange('total_amount_14_23', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.total_amount_14_23)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.determined_compensation_26 || ''}
                                onChange={(e) => handleEditInputChange('determined_compensation_26', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.determined_compensation_26)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.total_compensation_26_27 || ''}
                                onChange={(e) => handleEditInputChange('total_compensation_26_27', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.total_compensation_26_27)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.deduction_amount || ''}
                                onChange={(e) => handleEditInputChange('deduction_amount', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.deduction_amount)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.final_payable_compensation || ''}
                                onChange={(e) => handleEditInputChange('final_payable_compensation', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.final_payable_compensation)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Textarea
                                value={editForm.remarks || ''}
                                onChange={(e) => handleEditInputChange('remarks', e.target.value)}
                                className="h-8 min-h-8"
                                rows={1}
                              />
                            ) : (
                              record.remarks || ''
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.compensation_distribution_status || ''}
                                onChange={(e) => handleEditInputChange('compensation_distribution_status', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.compensation_distribution_status
                            )}
                          </TableCell>
                          <TableCell>{record.project_id ? record.project_id.toString() : ''}</TableCell>
                          {dynamicColumns.filter(col => 
                            !['serial_number', 'owner_name', 'old_survey_number', 'new_survey_number', 
                              'group_number', 'cts_number', 'village', 'taluka', 'district', 
                              'land_area_as_per_7_12', 'acquired_land_area', 'land_type', 'land_classification',
                              'approved_rate_per_hectare', 'market_value_as_per_acquired_area',
                              'factor_as_per_section_26_2', 'land_compensation_as_per_section_26',
                              'structures', 'forest_trees', 'fruit_trees', 'wells_borewells',
                              'total_structures_amount', 'total_amount_14_23',
                              'determined_compensation_26', 'total_compensation_26_27',
                              'deduction_amount', 'final_payable_compensation', 'remarks', 
                              'compensation_distribution_status', 'project_id', 'id', '_id', '__v'].includes(col)
                          ).map(col => (
                            <TableCell key={col}>
                              {editingRecord === (record.id || record._id?.toString()) ? (
                                <Input
                                  value={editForm[col] || ''}
                                  onChange={(e) => handleEditInputChange(col as keyof LandRecord2, e.target.value)}
                                  className="h-8"
                                />
                              ) : (
                                String(record[col] || '')
                              )}
                            </TableCell>
                          ))}
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleSaveEdit}
                                  disabled={loading}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(record)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LandRecordsManager2;


// Helper functions to calculate solatium and enhanced compensation
const calculateSolatiumAmount = (record: any): number => {
  const determinedCompensation = Number(record.determined_compensation_26) || 0;
  const landCompensation = Number(record.land_compensation_as_per_section_26) || 0;
  return determinedCompensation - landCompensation;
};

const calculateEnhancedCompensation = (record: any): number => {
  const totalCompensation = Number(record.total_compensation_26_27) || 0;
  const determinedCompensation = Number(record.determined_compensation_26) || 0;
  return totalCompensation - determinedCompensation;
};