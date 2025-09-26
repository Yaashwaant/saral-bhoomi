import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { AlertTriangle, FileText, Eye, Download, Upload, Database, CheckCircle, Clock, RefreshCw, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { config } from '../../../config';
import { 
  safeGetField, 
  safeGetNumericField,
  formatNumber,
  formatCurrency,
  getLandownerName,
  getSurveyNumber,
  getDisplayArea,
  getVillageName,
  getCompensationAmount,
  getKycStatus,
  getPaymentStatus,
  isNewFormat
} from '../../../utils/fieldMappingUtils';

interface LandRecord {
  id?: string;
  survey_number: string;
  landowner_name: string;
  area: number;
  village: string;
  taluka: string;
  district: string;
  contact_phone?: string;
  contact_email?: string;
  is_tribal: boolean;
  rate?: number;
  total_compensation?: number;
  kyc_status: 'pending' | 'approved' | 'rejected';
  payment_status: 'pending' | 'initiated' | 'completed';
}

const LandRecordsManager: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useSaral();
  
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [landRecords, setLandRecords] = useState<LandRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('form');
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  
  const [landRecordForm, setLandRecordForm] = useState<LandRecord>({
    survey_number: '',
    landowner_name: '',
    area: 0,
    village: '',
    taluka: '',
    district: '',
    contact_phone: '',
    contact_email: '',
    is_tribal: false,
    rate: 0,
    total_compensation: 0,
    kyc_status: 'pending',
    payment_status: 'pending'
  });

  const API_BASE_URL = config.API_BASE_URL;

  useEffect(() => {
    if (selectedProject) {
      loadLandRecords();
    }
  }, [selectedProject]); // Only run when selectedProject changes

  // Blockchain verification disabled for performance
  const processRecordsSequentially = async (records: any[]) => records;

  const loadLandRecords = async () => {
    if (!selectedProject) return;
    if (loading) {
      console.log('🚫 loadLandRecords called while already loading, skipping...');
      return;
    }
    console.log('🔄 loadLandRecords called for project:', selectedProject);
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/landowners/${selectedProject}`);
      if (response.ok) {
        const data = await response.json();
        const records = data.data || [];
        
        // Use records directly without blockchain verification
        setLandRecords(records);
      } else {
        toast.error('Failed to load land records');
      }
    } catch (error) {
      console.error('Error loading land records:', error);
      toast.error('Error loading land records');
    } finally {
      setLoading(false);
      console.log('✅ loadLandRecords completed for project:', selectedProject);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    if (loading) return; // Prevent multiple simultaneous calls
    setLoading(true);
    try {
      const rawToken = localStorage.getItem('authToken') || '';
      const isDemo = !rawToken || rawToken === 'demo-jwt-token' || (user?.id && user.id.length !== 24);
      const authToken = isDemo ? 'demo-jwt-token' : rawToken;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      if (isDemo) {
        headers['x-demo-role'] = 'officer';
      }
      
      // 🔍 Debug: Log what we're sending
      const requestBody = {
        ...landRecordForm,
        project_id: selectedProject,
        created_by: user?.id
      };
      
      console.log('🔍 Sending request to /landowners:', {
        url: `${API_BASE_URL}/landowners`,
        headers,
        body: requestBody
      });
      
      const response = await fetch(`${API_BASE_URL}/landowners`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const landRecordData = await response.json();
        toast.success('Land record created successfully');
        
        // Blockchain creation disabled - no calls to blockchain APIs
        
        // Reset form
        setLandRecordForm({
          survey_number: '',
          landowner_name: '',
          area: 0,
          village: '',
          taluka: '',
          district: '',
          contact_phone: '',
          contact_email: '',
          is_tribal: false,
          rate: 0,
          total_compensation: 0,
          kyc_status: 'pending',
          payment_status: 'pending',
          blockchain_verified: false
        });
        
        // Refresh both land records and blockchain status
        loadLandRecords();
      } else {
        // 🔍 Debug: Log the error response
        const errorText = await response.text();
        console.error('❌ Landowners API Error:', {
          status: response.status,
          statusText: response.statusText,
          response: errorText
        });
        
        // Try to parse as JSON for better error details
        try {
          const errorData = JSON.parse(errorText);
          toast.error(`Failed to create land record: ${errorData.message || 'Unknown error'}`);
        } catch (e) {
          toast.error(`Failed to create land record: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error creating land record:', error);
      toast.error('Error creating land record');
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    if (loading) return; // Prevent multiple simultaneous calls
    setLoading(true);
    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('project_id', selectedProject);

    try {
      const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${authToken}`
      };
      
      // Add demo role header if using demo token
      if (authToken === 'demo-jwt-token') {
        headers['x-demo-role'] = 'officer';
      }
      
      const response = await fetch(`${API_BASE_URL}/landowners/upload-csv`, {
        method: 'POST',
        headers,
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully uploaded ${result.uploaded} land records`);
        
        // 🔗 AUTOMATIC BLOCKCHAIN GENERATION FOR CSV UPLOADS
        if (result.uploaded > 0 && result.survey_numbers) {
          try {
            console.log('🔄 Creating blockchain blocks for CSV uploaded surveys:', result.survey_numbers);
            
            // Create blockchain blocks for all uploaded survey numbers
            const blockchainPromises = result.survey_numbers.map(async (surveyNumber: string) => {
              try {
                const blockchainResponse = await fetch(`${API_BASE_URL}/blockchain/create-or-update-survey-complete`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                    'x-demo-role': 'officer'
                  },
                  body: JSON.stringify({
                    survey_number: surveyNumber,
                    officer_id: user?.id || 'demo-officer',
                    project_id: selectedProject,
                    remarks: `Land record created via CSV upload for survey ${surveyNumber}`
                  })
                });
                
                if (blockchainResponse.ok) {
                  console.log(`✅ Blockchain block created for survey ${surveyNumber}`);
                  return { surveyNumber, success: true };
                } else {
                  console.warn(`⚠️ Blockchain creation failed for survey ${surveyNumber}`);
                  return { surveyNumber, success: false };
                }
              } catch (error) {
                console.error(`❌ Error creating blockchain for survey ${surveyNumber}:`, error);
                return { surveyNumber, success: false };
              }
            });
            
            // Wait for all blockchain creations to complete
            const blockchainResults = await Promise.all(blockchainPromises);
            const successful = blockchainResults.filter(r => r.success).length;
            const failed = blockchainResults.filter(r => !r.success).length;
            
            if (successful > 0) {
              toast.success(`✅ Created blockchain blocks for ${successful} surveys`);
            }
            if (failed > 0) {
              toast.warning(`⚠️ Failed to create blockchain blocks for ${failed} surveys`);
            }
            
            console.log('Blockchain creation results:', blockchainResults);
            
          } catch (blockchainError) {
            console.error('❌ Error in bulk blockchain creation:', blockchainError);
            toast.warning('⚠️ CSV uploaded but blockchain creation failed');
          }
        }
        
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

  const downloadTemplate = () => {
    const headers = [
      'survey_number',
      'landowner_name',
      'area',
      'village',
      'taluka',
      'district',
      'contact_phone',
      'contact_email',
      'is_tribal',
      'rate',
      'total_compensation'
    ];

    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'land_records_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkBlockchainSync = async () => {
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }
    if (loading) return; // Prevent multiple simultaneous calls

    setLoading(true);
    try {
      // Get records that don't have blockchain verification
      const recordsToSync = landRecords.filter(record => !record.blockchain_verified);
      
      if (recordsToSync.length === 0) {
        toast.info('All land records are already on the blockchain!');
        return;
      }

      console.log(`🔄 Syncing ${recordsToSync.length} land records to blockchain...`);
      
      // Create blockchain blocks sequentially to avoid rate limiting
      const blockchainResults = [];
      
      for (let i = 0; i < recordsToSync.length; i++) {
        const record = recordsToSync[i];
        
        // Update progress
        setSyncProgress({
          current: i + 1,
          total: recordsToSync.length,
          message: `Creating blockchain block for ${record.survey_number}`
        });
        
        try {
          // Add delay between requests to avoid rate limiting
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
          }
          
          const blockchainResponse = await fetch(`${API_BASE_URL}/blockchain/create-or-update-survey-complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer demo-jwt-token',
              'x-demo-role': 'officer'
            },
            body: JSON.stringify({
              survey_number: record.survey_number,
              officer_id: user?.id || 'demo-officer',
              project_id: selectedProject,
              remarks: `Bulk sync: Land record for survey ${record.survey_number}`
            })
          });
          
          if (blockchainResponse.ok) {
            console.log(`✅ Blockchain block created for survey ${record.survey_number}`);
            blockchainResults.push({ surveyNumber: record.survey_number, success: true });
          } else if (blockchainResponse.status === 429) {
            console.warn(`⚠️ Rate limited for ${record.survey_number}, will retry later`);
            blockchainResults.push({ surveyNumber: record.survey_number, success: false, reason: 'rate_limited' });
          } else {
            console.warn(`⚠️ Blockchain creation failed for survey ${record.survey_number}`);
            blockchainResults.push({ surveyNumber: record.survey_number, success: false });
          }
        } catch (error) {
          console.error(`❌ Error creating blockchain for survey ${record.survey_number}:`, error);
          blockchainResults.push({ surveyNumber: record.survey_number, success: false });
        }
      }
      const successful = blockchainResults.filter(r => r.success).length;
      const failed = blockchainResults.filter(r => !r.success).length;
      
      if (successful > 0) {
        toast.success(`✅ Created blockchain blocks for ${successful} surveys`);
      }
      if (failed > 0) {
        toast.warning(`⚠️ Failed to create blockchain blocks for ${failed} surveys`);
      }
      
      console.log('Bulk blockchain sync results:', blockchainResults);
      
      // Update blockchain status locally without reloading all records
      const updatedLandRecords = landRecords.map(record => {
        const wasSynced = blockchainResults.find(r => r.surveyNumber === record.survey_number && r.success);
        if (wasSynced) {
          return {
            ...record,
            blockchain_verified: true,
            blockchain_status: 'verified'
          };
        }
        return record;
      });
      
      setLandRecords(updatedLandRecords);
      
      // Show success message with updated counts
      const verifiedCount = updatedLandRecords.filter(record => record.blockchain_status === 'verified').length;
      toast.success(`✅ Blockchain sync completed! ${successful} new blocks created. Total verified: ${verifiedCount}`);
      
    } catch (error) {
      console.error('❌ Error in bulk blockchain sync:', error);
      toast.error('Failed to sync records to blockchain');
    } finally {
      setLoading(false);
      setSyncProgress(null); // Clear progress indicator
      console.log('✅ Bulk blockchain sync completed');
    }
  };

  const getBlockchainStatusBadge = (status: string) => {
    const statusConfig = {
      verified: {
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="h-3 w-3" />,
        text: 'Verified'
      },
      pending: {
        variant: 'secondary' as const,
        className: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="h-3 w-3" />,
        text: 'Pending'
      },
      compromised: {
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800',
        icon: <AlertTriangle className="h-3 w-3" />,
        text: 'Compromised'
      },
      not_on_blockchain: {
        variant: 'outline' as const,
        className: 'bg-gray-100 text-gray-600',
        icon: <XCircle className="h-3 w-3" />,
        text: 'Not on Blockchain'
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_on_blockchain;
    
    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
        {config.icon}
        {config.text}
      </Badge>
    );
  };

  const getStatusBadge = (status: string, type: 'kyc' | 'payment') => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      initiated: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    };
    
    return (
      <Badge variant="secondary" className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  // Export filters + basic analytics as Excel
  const exportOverviewToExcel = () => {
    try {
      const projectName = projects.find((p) => p.id === selectedProject)?.projectName || selectedProject;
      const filtersSheetData = [
        ['Exported At', new Date().toLocaleString()],
        ['Project', projectName],
      ];

      // Basic analytics from current table data
      const totalRecords = landRecords.length;
      const totalArea = landRecords.reduce((sum, r: any) => sum + (Number(r.area) || 0), 0);
      const completedPayments = landRecords.filter((r: any) => r.payment_status === 'completed').length;
      const totalCompensation = landRecords.reduce((sum, r: any) => sum + (Number(r.total_compensation) || 0), 0);

      const analyticsSheetData = [
        ['Metric', 'Value'],
        ['Total Records', totalRecords],
        ['Total Area (Ha)', totalArea],
        ['Payments Completed (count)', completedPayments],
        ['Total Compensation (₹)', totalCompensation],
      ];

      // Build workbook
      const wb = XLSX.utils.book_new();
      const wsFilters = XLSX.utils.aoa_to_sheet(filtersSheetData);
      const wsAnalytics = XLSX.utils.aoa_to_sheet(analyticsSheetData);
      XLSX.utils.book_append_sheet(wb, wsFilters, 'Filters');
      XLSX.utils.book_append_sheet(wb, wsAnalytics, 'Analytics');

      // Optional: include a minimal records snapshot sheet (first 100 rows)
      const snapshot = landRecords.slice(0, 100).map((r: any) => ({
        Serial: r.serial_number || '',
        Owner: r.landowner_name || '',
        NewSurvey: r.new_survey_number || r.survey_number || '',
        CTS: r.cts_number || '',
        Area_Ha: r.area || '',
        Village: r.village || '',
        PaymentStatus: r.payment_status || '',
      }));
      if (snapshot.length > 0) {
        const wsSnap = XLSX.utils.json_to_sheet(snapshot);
        XLSX.utils.book_append_sheet(wb, wsSnap, 'RecordsSnapshot');
      }

      const filename = `overview_export_${projectName.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success('Exported Excel successfully');
    } catch (e) {
      console.error('Export failed:', e);
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Land Records Management</h2>
          <p className="text-gray-600">Manage land records, landowner information, and property details</p>
        </div>
      </div>

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProject && (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form">Manual Entry</TabsTrigger>
              <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Land Record</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="survey_number">Survey Number *</Label>
                        <Input
                          id="survey_number"
                          value={landRecordForm.survey_number}
                          onChange={(e) => setLandRecordForm({...landRecordForm, survey_number: e.target.value})}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="landowner_name">Landowner Name *</Label>
                        <Input
                          id="landowner_name"
                          value={landRecordForm.landowner_name}
                          onChange={(e) => setLandRecordForm({...landRecordForm, landowner_name: e.target.value})}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="area">Total Area (Hectares) *</Label>
                        <Input
                          id="area"
                          type="number"
                          step="0.01"
                          value={landRecordForm.area}
                          onChange={(e) => setLandRecordForm({...landRecordForm, area: parseFloat(e.target.value) || 0})}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="village">Village *</Label>
                        <Input
                          id="village"
                          value={landRecordForm.village}
                          onChange={(e) => setLandRecordForm({...landRecordForm, village: e.target.value})}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="taluka">Taluka *</Label>
                        <Input
                          id="taluka"
                          value={landRecordForm.taluka}
                          onChange={(e) => setLandRecordForm({...landRecordForm, taluka: e.target.value})}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="district">District *</Label>
                        <Input
                          id="district"
                          value={landRecordForm.district}
                          onChange={(e) => setLandRecordForm({...landRecordForm, district: e.target.value})}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="contact_phone">Contact Phone</Label>
                        <Input
                          id="contact_phone"
                          value={landRecordForm.contact_phone}
                          onChange={(e) => setLandRecordForm({...landRecordForm, contact_phone: e.target.value})}
                        />
                      </div>

                      <div>
                        <Label htmlFor="contact_email">Contact Email</Label>
                        <Input
                          id="contact_email"
                          type="email"
                          value={landRecordForm.contact_email}
                          onChange={(e) => setLandRecordForm({...landRecordForm, contact_email: e.target.value})}
                        />
                      </div>

                      <div>
                        <Label htmlFor="rate">Rate per Hectare</Label>
                        <Input
                          id="rate"
                          type="number"
                          value={landRecordForm.rate}
                          onChange={(e) => setLandRecordForm({...landRecordForm, rate: parseFloat(e.target.value) || 0})}
                        />
                      </div>

                      <div>
                        <Label htmlFor="total_compensation">Total Compensation</Label>
                        <Input
                          id="total_compensation"
                          type="number"
                          value={landRecordForm.total_compensation}
                          onChange={(e) => setLandRecordForm({...landRecordForm, total_compensation: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_tribal"
                        checked={landRecordForm.is_tribal}
                        onChange={(e) => setLandRecordForm({...landRecordForm, is_tribal: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="is_tribal">Is Tribal</Label>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLandRecordForm({
                          survey_number: '',
                          landowner_name: '',
                          area: 0,
                          village: '',
                          taluka: '',
                          district: '',
                          contact_phone: '',
                          contact_email: '',
                          is_tribal: false,
                          rate: 0,
                          total_compensation: 0,
                          kyc_status: 'pending',
                          payment_status: 'pending',
                          blockchain_verified: false,
                          blockchain_status: 'not_on_blockchain'
                        })}
                      >
                        Reset Form
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Land Record'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="csv" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>CSV Upload for Land Records</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex space-x-4">
                    <Button onClick={downloadTemplate} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="csv-file">Select CSV File</Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-sm text-gray-600">
                      Upload CSV file with land records for bulk processing
                    </p>
                  </div>

                  <Button 
                    onClick={handleCSVUpload} 
                    disabled={!csvFile || loading}
                    className="w-full"
                  >
                    {loading ? 'Uploading...' : 'Upload CSV'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Records Display */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
              <CardTitle>Land Records</CardTitle>
                  {landRecords.length > 0 && (
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>Total: {landRecords.length}</span>
                      <span className="text-gray-600">Blockchain verification disabled</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Blockchain sync disabled */}
                  {syncProgress && (
                    <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
                      {syncProgress.message} ({syncProgress.current}/{syncProgress.total})
                    </div>
                  )}
                  <Button onClick={() => exportOverviewToExcel()} variant="outline" size="sm" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export Data
                  </Button>
                  <Button onClick={loadLandRecords} variant="outline" size="sm" disabled={loading} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  Loading records...
                </div>
              ) : landRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No land records found for this project
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {/* Basic Identification */}
                        <TableHead className="min-w-[80px]">Serial No.</TableHead>
                        <TableHead className="min-w-[150px]">Landowner Name</TableHead>
                        <TableHead className="min-w-[120px]">Survey Number</TableHead>
                        <TableHead className="min-w-[100px]">Old Survey</TableHead>
                        <TableHead className="min-w-[100px]">Group No.</TableHead>
                        <TableHead className="min-w-[100px]">CTS No.</TableHead>
                        
                        {/* Area Fields */}
                        <TableHead className="min-w-[120px]">Village Record Area (Ha.Ar)</TableHead>
                        <TableHead className="min-w-[120px]">Acquired Area (Sq.m/Ha)</TableHead>
                        
                        {/* Land Classification */}
                        <TableHead className="min-w-[120px]">Land Category</TableHead>
                        <TableHead className="min-w-[150px]">Land Type Classification</TableHead>
                        <TableHead className="min-w-[100px]">Agricultural Type</TableHead>
                        <TableHead className="min-w-[130px]">Agricultural Classification</TableHead>
                        
                        {/* Rate and Market Value */}
                        <TableHead className="min-w-[120px]">Approved Rate (₹/Ha)</TableHead>
                        <TableHead className="min-w-[140px]">Market Value Acquired Area</TableHead>
                        
                        {/* Section 26 Calculations */}
                        <TableHead className="min-w-[120px]">Section 26(2) Factor</TableHead>
                        <TableHead className="min-w-[140px]">Section 26 Compensation</TableHead>
                        
                        {/* Structure Compensation */}
                        <TableHead className="min-w-[100px]">Buildings Count</TableHead>
                        <TableHead className="min-w-[120px]">Buildings Amount (₹)</TableHead>
                        <TableHead className="min-w-[120px]">Forest Trees Count</TableHead>
                        <TableHead className="min-w-[140px]">Forest Trees Amount (₹)</TableHead>
                        <TableHead className="min-w-[120px]">Fruit Trees Count</TableHead>
                        <TableHead className="min-w-[140px]">Fruit Trees Amount (₹)</TableHead>
                        <TableHead className="min-w-[130px]">Wells/Borewells Count</TableHead>
                        <TableHead className="min-w-[150px]">Wells/Borewells Amount (₹)</TableHead>
                        <TableHead className="min-w-[140px]">Total Structures Amount</TableHead>
                        
                        {/* Compensation Calculations */}
                        <TableHead className="min-w-[140px]">Total Compensation Amount</TableHead>
                        <TableHead className="min-w-[120px]">100% Solatium</TableHead>
                        <TableHead className="min-w-[140px]">Determined Compensation</TableHead>
                        <TableHead className="min-w-[150px]">Additional 25% Compensation</TableHead>
                        <TableHead className="min-w-[140px]">Total Final Compensation</TableHead>
                        <TableHead className="min-w-[120px]">Deduction Amount</TableHead>
                        <TableHead className="min-w-[150px]">Final Payable Amount</TableHead>
                        
                        {/* Location */}
                        <TableHead className="min-w-[100px]">Village</TableHead>
                        <TableHead className="min-w-[100px]">Taluka</TableHead>
                        <TableHead className="min-w-[100px]">District</TableHead>
                        
                        {/* Contact Information */}
                        <TableHead className="min-w-[120px]">Contact Phone</TableHead>
                        <TableHead className="min-w-[150px]">Contact Email</TableHead>
                        <TableHead className="min-w-[200px]">Contact Address</TableHead>
                        
                        {/* Banking Information */}
                        <TableHead className="min-w-[150px]">Bank Account Number</TableHead>
                        <TableHead className="min-w-[100px]">Bank IFSC</TableHead>
                        <TableHead className="min-w-[150px]">Bank Name</TableHead>
                        <TableHead className="min-w-[150px]">Bank Branch</TableHead>
                        <TableHead className="min-w-[150px]">Account Holder Name</TableHead>
                        
                        {/* Tribal Information */}
                        <TableHead className="min-w-[80px]">Is Tribal</TableHead>
                        <TableHead className="min-w-[150px]">Tribal Certificate No.</TableHead>
                        <TableHead className="min-w-[100px]">Tribal Lag</TableHead>
                        
                        {/* Status Fields */}
                        <TableHead className="min-w-[100px]">KYC Status</TableHead>
                        <TableHead className="min-w-[120px]">Payment Status</TableHead>
                        <TableHead className="min-w-[100px]">Notice Generated</TableHead>
                        <TableHead className="min-w-[120px]">Assigned Agent</TableHead>
                        
                        {/* Additional Fields */}
                        <TableHead className="min-w-[200px]">Notes</TableHead>
                        <TableHead className="min-w-[200px]">Remarks (शेरा)</TableHead>
                        
                        {/* Format Indicator */}
                        <TableHead className="min-w-[100px]">Data Format</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {landRecords.map((record) => (
                        <TableRow key={record.id}>
                          {/* Basic Identification */}
                          <TableCell className="text-center">{safeGetField(record, 'serial_number') || '-'}</TableCell>
                          <TableCell className="font-medium">{getLandownerName(record)}</TableCell>
                          <TableCell className="font-medium">{getSurveyNumber(record)}</TableCell>
                          <TableCell>{safeGetField(record, 'old_survey_number') || '-'}</TableCell>
                          <TableCell>{safeGetField(record, 'group_number') || '-'}</TableCell>
                          <TableCell>{safeGetField(record, 'cts_number') || '-'}</TableCell>
                          
                          {/* Area Fields */}
                          <TableCell className="text-right">
                            {safeGetNumericField(record, 'total_area_village_record') > 0 
                              ? formatNumber(safeGetNumericField(record, 'total_area_village_record'))
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {safeGetNumericField(record, 'acquired_area_sqm_hectare') > 0 
                              ? formatNumber(safeGetNumericField(record, 'acquired_area_sqm_hectare'))
                              : '-'
                            }
                          </TableCell>
                          
                          {/* Land Classification */}
                          <TableCell>{safeGetField(record, 'land_category') || '-'}</TableCell>
                          <TableCell>{safeGetField(record, 'land_type_classification') || '-'}</TableCell>
                          <TableCell>{safeGetField(record, 'agricultural_type') || '-'}</TableCell>
                          <TableCell>{safeGetField(record, 'agricultural_classification') || '-'}</TableCell>
                          
                          {/* Rate and Market Value */}
                          <TableCell className="text-right">
                            {safeGetNumericField(record, 'approved_rate_per_hectare') > 0 
                              ? formatCurrency(safeGetNumericField(record, 'approved_rate_per_hectare'))
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {safeGetNumericField(record, 'market_value_acquired_area') > 0 
                              ? formatCurrency(safeGetNumericField(record, 'market_value_acquired_area'))
                              : '-'
                            }
                          </TableCell>
                          
                          {/* Section 26 Calculations */}
                          <TableCell className="text-right">
                            {safeGetNumericField(record, 'section_26_2_factor') > 0 
                              ? formatNumber(safeGetNumericField(record, 'section_26_2_factor'))
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {safeGetNumericField(record, 'section_26_compensation') > 0 
                              ? formatCurrency(safeGetNumericField(record, 'section_26_compensation'))
                              : '-'
                            }
                          </TableCell>
                          
                          {/* Structure Compensation */}
                          <TableCell className="text-center">
                            {safeGetNumericField(record, 'buildings_count') > 0 
                              ? safeGetNumericField(record, 'buildings_count')
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {safeGetNumericField(record, 'buildings_amount') > 0 
                              ? formatCurrency(safeGetNumericField(record, 'buildings_amount'))
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-center">
                            {safeGetNumericField(record, 'forest_trees_count') > 0 
                              ? safeGetNumericField(record, 'forest_trees_count')
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {safeGetNumericField(record, 'forest_trees_amount') > 0 
                              ? formatCurrency(safeGetNumericField(record, 'forest_trees_amount'))
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-center">
                            {safeGetNumericField(record, 'fruit_trees_count') > 0 
                              ? safeGetNumericField(record, 'fruit_trees_count')
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {safeGetNumericField(record, 'fruit_trees_amount') > 0 
                              ? formatCurrency(safeGetNumericField(record, 'fruit_trees_amount'))
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-center">
                            {safeGetNumericField(record, 'wells_borewells_count') > 0 
                              ? safeGetNumericField(record, 'wells_borewells_count')
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {safeGetNumericField(record, 'wells_borewells_amount') > 0 
                              ? formatCurrency(safeGetNumericField(record, 'wells_borewells_amount'))
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {safeGetNumericField(record, 'total_structures_amount') > 0 
                              ? formatCurrency(safeGetNumericField(record, 'total_structures_amount'))
                              : '-'
                            }
                          </TableCell>
                          
                          {/* Compensation Calculations */}
                          <TableCell className="text-right">
                            {safeGetNumericField(record, 'total_compensation_amount') > 0 
                              ? formatCurrency(safeGetNumericField(record, 'total_compensation_amount'))
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {safeGetNumericField(record, 'solatium_100_percent') > 0 
                              ? formatCurrency(safeGetNumericField(record, 'solatium_100_percent'))
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {safeGetNumericField(record, 'determined_compensation') > 0 
                              ? formatCurrency(safeGetNumericField(record, 'determined_compensation'))
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {safeGetNumericField(record, 'additional_25_percent_compensation') > 0 
                              ? formatCurrency(safeGetNumericField(record, 'additional_25_percent_compensation'))
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {safeGetNumericField(record, 'total_final_compensation') > 0 
                              ? formatCurrency(safeGetNumericField(record, 'total_final_compensation'))
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {safeGetNumericField(record, 'deduction_amount') > 0 
                              ? formatCurrency(safeGetNumericField(record, 'deduction_amount'))
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {safeGetNumericField(record, 'final_payable_amount') > 0 
                              ? formatCurrency(safeGetNumericField(record, 'final_payable_amount'))
                              : '-'
                            }
                          </TableCell>
                          
                          {/* Location */}
                          <TableCell>{getVillageName(record)}</TableCell>
                          <TableCell>{safeGetField(record, 'taluka') || '-'}</TableCell>
                          <TableCell>{safeGetField(record, 'district') || '-'}</TableCell>
                          
                          {/* Contact Information */}
                          <TableCell>{safeGetField(record, 'contact_phone') || '-'}</TableCell>
                          <TableCell>{safeGetField(record, 'contact_email') || '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={safeGetField(record, 'contact_address')}>
                            {safeGetField(record, 'contact_address') || '-'}
                          </TableCell>
                          
                          {/* Banking Information */}
                          <TableCell className="font-mono text-xs">
                            {safeGetField(record, 'bank_account_number') || '-'}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {safeGetField(record, 'bank_ifsc_code') || '-'}
                          </TableCell>
                          <TableCell>{safeGetField(record, 'bank_name') || '-'}</TableCell>
                          <TableCell>{safeGetField(record, 'bank_branch_name') || '-'}</TableCell>
                          <TableCell>{safeGetField(record, 'bank_account_holder_name') || '-'}</TableCell>
                          
                          {/* Tribal Information */}
                          <TableCell className="text-center">
                            {safeGetField(record, 'is_tribal') ? (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">Yes</Badge>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </TableCell>
                          <TableCell>{safeGetField(record, 'tribal_certificate_no') || '-'}</TableCell>
                          <TableCell>{safeGetField(record, 'tribal_lag') || '-'}</TableCell>
                          
                          {/* Status Fields */}
                          <TableCell>{getStatusBadge(getKycStatus(record), 'kyc')}</TableCell>
                          <TableCell>{getStatusBadge(getPaymentStatus(record), 'payment')}</TableCell>
                          <TableCell className="text-center">
                            {safeGetField(record, 'notice_generated') ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">Generated</Badge>
                            ) : (
                              <span className="text-gray-400">Pending</span>
                            )}
                          </TableCell>
                          <TableCell>{safeGetField(record, 'assigned_agent') || '-'}</TableCell>
                          
                          {/* Additional Fields */}
                          <TableCell className="max-w-[200px] truncate" title={safeGetField(record, 'notes')}>
                            {safeGetField(record, 'notes') || '-'}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={safeGetField(record, 'remarks')}>
                            {safeGetField(record, 'remarks') || '-'}
                          </TableCell>
                          
                          {/* Format Indicator */}
                          <TableCell>
                            {isNewFormat(record) ? (
                              <Badge variant="default" className="bg-green-500">Parishisht-K</Badge>
                            ) : (
                              <Badge variant="secondary">Legacy</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default LandRecordsManager;
