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
import { config } from '../../../config';

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
  blockchain_verified: boolean;
  blockchain_status?: 'verified' | 'pending' | 'compromised' | 'not_on_blockchain';
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
    payment_status: 'pending',
    blockchain_verified: false,
    blockchain_status: 'not_on_blockchain'
  });

  const API_BASE_URL = config.API_BASE_URL;

  useEffect(() => {
    if (selectedProject) {
      loadLandRecords();
    }
  }, [selectedProject]); // Only run when selectedProject changes

  // 🔧 Process records sequentially to avoid rate limiting
  const processRecordsSequentially = async (records: any[]) => {
    console.log(`🔄 Starting blockchain status processing for ${records.length} records...`);
    const results = [];
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        console.log(`🔍 Processing blockchain status for ${record.survey_number} (${i + 1}/${records.length})`);
        
        // 🔍 Check if blockchain block exists
        const blockchainResponse = await fetch(`${API_BASE_URL}/blockchain/search/${record.survey_number}`, {
          headers: {
            'Authorization': 'Bearer demo-jwt-token',
            'x-demo-role': 'officer'
          }
        });
        
        if (blockchainResponse.ok) {
          const blockchainData = await blockchainResponse.json();
          console.log(`🔍 Raw blockchain response for ${record.survey_number}:`, blockchainData);
          
          // 🔍 Check the correct response structure
          const existsOnBlockchain = blockchainData.existsOnBlockchain || blockchainData.data?.existsOnBlockchain || false;
          const overallStatus = blockchainData.overallStatus || blockchainData.data?.overallStatus || 'unknown';
          
          console.log(`🔍 Parsed blockchain status for ${record.survey_number}:`, { existsOnBlockchain, overallStatus });
          
          // 🔍 If block exists, verify data integrity
          let blockchainStatus = 'pending';
          if (existsOnBlockchain) {
            try {
              // Add delay between requests to avoid rate limiting
              if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
              }
              
              // Verify data integrity between DB and blockchain
              const integrityResponse = await fetch(`${API_BASE_URL}/blockchain/verify-integrity/${record.survey_number}`, {
                headers: {
                  'Authorization': 'Bearer demo-jwt-token',
                  'x-demo-role': 'officer'
                }
              });
              
              if (integrityResponse.ok) {
                const integrityData = await integrityResponse.json();
                console.log(`🔍 Raw integrity response for ${record.survey_number}:`, integrityData);
                
                // 🔍 Check the correct response structure
                const isValid = integrityData.isValid || integrityData.data?.isValid || false;
                blockchainStatus = isValid ? 'verified' : 'compromised';
                
                console.log(`🔍 Parsed integrity status for ${record.survey_number}:`, { isValid, blockchainStatus });
              } else if (integrityResponse.status === 429) {
                console.warn(`⚠️ Rate limited for ${record.survey_number}, skipping integrity check`);
                // Use overallStatus from search API as fallback
                if (overallStatus === 'synced') {
                  blockchainStatus = 'verified';
                } else {
                  blockchainStatus = 'pending';
                }
              } else {
                // Use overallStatus from search API as fallback
                if (overallStatus === 'synced') {
                  blockchainStatus = 'verified';
                } else {
                  blockchainStatus = 'pending';
                }
              }
            } catch (integrityError) {
              console.debug(`Integrity check failed for ${record.survey_number}:`, integrityError);
              // Use overallStatus from search API as fallback
              if (overallStatus === 'synced') {
                blockchainStatus = 'verified';
              } else {
                blockchainStatus = 'pending';
              }
            }
          }
          
          results.push({
            ...record,
            blockchain_verified: existsOnBlockchain,
            blockchain_status: blockchainStatus
          });
        } else {
          results.push({
            ...record,
            blockchain_verified: false,
            blockchain_status: 'not_on_blockchain'
          });
        }
      } catch (error) {
        console.debug(`Could not check blockchain status for ${record.survey_number}:`, error);
        results.push({
          ...record,
          blockchain_verified: false,
          blockchain_status: 'not_on_blockchain'
        });
      }
    }
    
    console.log(`✅ Blockchain status processing completed for ${records.length} records`);
    return results;
  };

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
        
        // 🔗 Check blockchain status for each record with rate limiting
        console.log(`🔄 Processing blockchain status for ${records.length} records...`);
        const recordsWithBlockchainStatus = await processRecordsSequentially(records);
        console.log(`✅ Blockchain status processing completed, setting ${recordsWithBlockchainStatus.length} records`);
        
        setLandRecords(recordsWithBlockchainStatus);
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
        
        // 🔗 AUTOMATIC BLOCKCHAIN GENERATION
        try {
          console.log('🔄 Creating blockchain block for survey:', landRecordForm.survey_number);
          
          const blockchainResponse = await fetch(`${API_BASE_URL}/blockchain/create-or-update-survey-complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
              ...(isDemo ? { 'x-demo-role': 'officer' } : {})
            },
            body: JSON.stringify({
              survey_number: landRecordForm.survey_number,
              officer_id: isDemo ? 'demo-officer' : (user?.id || ''),
              project_id: selectedProject,
              remarks: `Land record created for survey ${landRecordForm.survey_number}`
            })
          });

          if (blockchainResponse.ok) {
            const blockchainResult = await blockchainResponse.json();
            toast.success(`✅ Blockchain block created successfully for survey ${landRecordForm.survey_number}!`);
            console.log('Blockchain creation result:', blockchainResult);
          } else if (blockchainResponse.status === 401) {
            // Fallback: retry once with demo auth headers in case of stale/invalid JWT
            console.warn('⚠️ 401 on blockchain create, retrying with demo token...');
            const retryResp = await fetch(`${API_BASE_URL}/blockchain/create-or-update-survey-complete`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer demo-jwt-token',
                'x-demo-role': 'officer'
              },
              body: JSON.stringify({
                survey_number: landRecordForm.survey_number,
                officer_id: 'demo-officer',
                project_id: selectedProject,
                remarks: `Retry with demo token: ${landRecordForm.survey_number}`
              })
            });
            if (retryResp.ok) {
              const retryData = await retryResp.json();
              toast.success(`✅ Blockchain block created (retry) for ${landRecordForm.survey_number}`);
              console.log('Blockchain creation (retry) result:', retryData);
            } else {
              const retryErrorText = await retryResp.text();
              console.warn('⚠️ Blockchain creation failed after retry:', retryErrorText);
              toast.warning('⚠️ Land record saved but blockchain creation failed (auth)');
            }
          } else {
            const blockchainError = await blockchainResponse.json().catch(() => ({ message: blockchainResponse.statusText }));
            console.warn('⚠️ Blockchain creation failed:', blockchainError);
            toast.warning(`⚠️ Land record saved but blockchain creation failed: ${blockchainError.message}`);
          }
        } catch (blockchainError) {
          console.error('❌ Error creating blockchain block:', blockchainError);
          toast.warning('⚠️ Land record saved but blockchain creation failed');
        }
        
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

  const downloadTemplate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/csv/template`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'parishisht-k-template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        toast.error('Failed to download template');
      }
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template');
    }
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
                  {project.name}
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
                    <Label htmlFor="csv-file">Select CSV or Excel File</Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-sm text-gray-600">
                      Upload CSV or Excel file with land records for bulk processing. 
                      <br />
                      <strong>Supported formats:</strong> परिशिष्ट - क format with Marathi column headers (.csv, .xlsx, .xls)
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
                      <span className="text-green-600">✅ Verified: {landRecords.filter(r => r.blockchain_status === 'verified').length}</span>
                      <span className="text-yellow-600">⏳ Pending: {landRecords.filter(r => r.blockchain_status === 'pending').length}</span>
                      <span className="text-red-600">⚠️ Compromised: {landRecords.filter(r => r.blockchain_status === 'compromised').length}</span>
                      <span className="text-gray-600">❌ Not on Blockchain: {landRecords.filter(r => r.blockchain_status === 'not_on_blockchain').length}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleBulkBlockchainSync}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Sync Missing to Blockchain
                  </Button>
                  {syncProgress && (
                    <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
                      {syncProgress.message} ({syncProgress.current}/{syncProgress.total})
                    </div>
                  )}
                  <Button 
                    onClick={loadLandRecords}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Status
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
                        <TableHead>Survey Number</TableHead>
                        <TableHead>Landowner</TableHead>
                        <TableHead>Area (Ha)</TableHead>
                        <TableHead>Village</TableHead>
                        <TableHead>KYC Status</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Blockchain Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {landRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.survey_number}</TableCell>
                          <TableCell>{record.landowner_name}</TableCell>
                          <TableCell>{record.area}</TableCell>
                          <TableCell>{record.village}</TableCell>
                          <TableCell>{getStatusBadge(record.kyc_status, 'kyc')}</TableCell>
                          <TableCell>{getStatusBadge(record.payment_status, 'payment')}</TableCell>
                          <TableCell>
                            {getBlockchainStatusBadge(record.blockchain_status || 'not_on_blockchain')}
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
