import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Upload, 
  FileText, 
  Plus, 
  Save, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Eye,
  Hash,
  Shield,
  MapPin,
  User,
  Calculator,
  Database,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';

interface JMRFormData {
  survey_number: string;
  project_id: string;
  landowner_id: string;
  measured_area: string;
  land_type: 'Agricultural' | 'Non-Agricultural';
  tribal_classification: boolean;
  category: string;
  village: string;
  taluka: string;
  district: string;
  officer_id: string;
  notes: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
}

interface Officer {
  id: number;
  name: string;
  designation: string;
  district: string;
  taluka: string;
}

interface CSVRow {
  survey_number: string;
  project_id: string;
  landowner_id: string;
  measured_area: string;
  land_type: string;
  tribal_classification: string;
  category: string;
  village: string;
  taluka: string;
  district: string;
  officer_id: string;
  notes: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

const JMRBlockchainForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState('manual');
  const [formData, setFormData] = useState<JMRFormData>({
    survey_number: '',
    project_id: '',
    landowner_id: '',
    measured_area: '',
    land_type: 'Agricultural',
    tribal_classification: false,
    category: '',
    village: '',
    taluka: '',
    district: '',
    officer_id: '',
    notes: ''
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [blockchainStatus, setBlockchainStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  // Fetch projects and officers on component mount
  useEffect(() => {
    fetchProjects();
    fetchOfficers();
  }, []);

  // Fetch available projects
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to fetch projects');
    }
  };

  // Fetch available officers
  const fetchOfficers = async () => {
    try {
      const response = await fetch('/api/users?role=officer');
      if (response.ok) {
        const data = await response.json();
        setOfficers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch officers:', error);
      toast.error('Failed to fetch officers');
    }
  };

  // Handle form input changes
  const handleInputChange = (field: keyof JMRFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate form data
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.survey_number.trim()) errors.push('Survey number is required');
    if (!formData.project_id) errors.push('Project is required');
    if (!formData.landowner_id.trim()) errors.push('Landowner ID is required');
    if (!formData.measured_area || parseFloat(formData.measured_area) <= 0) errors.push('Valid measured area is required');
    if (!formData.village.trim()) errors.push('Village is required');
    if (!formData.taluka.trim()) errors.push('Taluka is required');
    if (!formData.district.trim()) errors.push('District is required');
    if (!formData.officer_id) errors.push('Officer is required');

    return errors;
  };

  // Submit manual form
  const submitForm = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);
    setBlockchainStatus('processing');

    try {
      // Create FormData for file uploads
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'tribal_classification') {
          formDataToSend.append(key, value.toString());
        } else {
          formDataToSend.append(key, value);
        }
      });

      const response = await fetch('/api/jmr-blockchain', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        const result = await response.json();
        setBlockchainStatus('success');
        toast.success('JMR record created successfully with blockchain entry');
        
        // Reset form
        setFormData({
          survey_number: '',
          project_id: '',
          landowner_id: '',
          measured_area: '',
          land_type: 'Agricultural',
          tribal_classification: false,
          category: '',
          village: '',
          taluka: '',
          district: '',
          officer_id: '',
          notes: ''
        });

        // Show blockchain details
        setTimeout(() => {
          setBlockchainStatus('idle');
        }, 3000);
      } else {
        const errorData = await response.json();
        setBlockchainStatus('error');
        toast.error(errorData.message || 'Failed to create JMR record');
      }
    } catch (error) {
      console.error('Submit form error:', error);
      setBlockchainStatus('error');
      toast.error('Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  // Handle CSV file upload
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error('CSV parsing errors detected');
          console.error('CSV parsing errors:', results.errors);
        }

        const data = results.data as CSVRow[];
        setCsvData(data);
        toast.success(`Parsed ${data.length} rows from CSV`);
      },
      error: (error) => {
        toast.error('Failed to parse CSV file');
        console.error('CSV parsing error:', error);
      }
    });
  };

  // Validate CSV data
  const validateCSVData = (): { valid: CSVRow[]; invalid: { row: number; data: CSVRow; errors: string[] }[] } => {
    const valid: CSVRow[] = [];
    const invalid: { row: number; data: CSVRow; errors: string[] }[] = [];

    csvData.forEach((row, index) => {
      const errors: string[] = [];
      
      if (!row.survey_number?.trim()) errors.push('Survey number is required');
      if (!row.project_id?.trim()) errors.push('Project ID is required');
      if (!row.landowner_id?.trim()) errors.push('Landowner ID is required');
      if (!row.measured_area || parseFloat(row.measured_area) <= 0) errors.push('Valid measured area is required');
      if (!row.village?.trim()) errors.push('Village is required');
      if (!row.taluka?.trim()) errors.push('Taluka is required');
      if (!row.district?.trim()) errors.push('District is required');
      if (!row.officer_id?.trim()) errors.push('Officer ID is required');

      if (errors.length > 0) {
        invalid.push({ row: index + 2, data: row, errors }); // +2 for 1-indexing and header
      } else {
        valid.push(row);
      }
    });

    return { valid, invalid };
  };

  // Upload CSV data
  const uploadCSVData = async () => {
    const validation = validateCSVData();
    
    if (validation.invalid.length > 0) {
      toast.error(`${validation.invalid.length} rows have validation errors`);
      return;
    }

    if (validation.valid.length === 0) {
      toast.error('No valid data to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadResults([]);

    try {
      const results: UploadResult[] = [];
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < validation.valid.length; i++) {
        const row = validation.valid[i];
        
        try {
          // Create form data for this row
          const formDataToSend = new FormData();
          Object.entries(row).forEach(([key, value]) => {
            if (key === 'tribal_classification') {
              formDataToSend.append(key, value === 'true' ? 'true' : 'false');
            } else {
              formDataToSend.append(key, value);
            }
          });

          const response = await fetch('/api/jmr-blockchain', {
            method: 'POST',
            body: formDataToSend
          });

          if (response.ok) {
            const result = await response.json();
            results.push({
              success: true,
              message: `Row ${i + 2}: JMR created successfully`,
              data: result.data
            });
            successCount++;
          } else {
            const errorData = await response.json();
            results.push({
              success: false,
              message: `Row ${i + 2}: ${errorData.message || 'Failed to create JMR'}`,
              errors: [errorData.message || 'Unknown error']
            });
            errorCount++;
          }
        } catch (error) {
          results.push({
            success: false,
            message: `Row ${i + 2}: Network error`,
            errors: [error instanceof Error ? error.message : 'Unknown error']
          });
          errorCount++;
        }

        // Update progress
        setUploadProgress(((i + 1) / validation.valid.length) * 100);
        setUploadResults([...results]);

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setUploading(false);
      setShowResults(true);
      
      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} JMR records`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} records failed to upload`);
      }
    } catch (error) {
      console.error('CSV upload error:', error);
      toast.error('Failed to upload CSV data');
      setUploading(false);
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const template = [
      'survey_number,project_id,landowner_id,measured_area,land_type,tribal_classification,category,village,taluka,district,officer_id,notes',
      'SY-2024-001,1,OWN-001,5.5,Agricultural,false,Residential,Village A,Taluka A,District A,1,Sample JMR record',
      'SY-2024-002,1,OWN-002,3.2,Non-Agricultural,true,Commercial,Village B,Taluka B,District B,2,Another sample record'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jmr-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('CSV template downloaded');
  };

  // Get blockchain status icon
  const getBlockchainStatusIcon = () => {
    switch (blockchainStatus) {
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  // Get blockchain status text
  const getBlockchainStatusText = () => {
    switch (blockchainStatus) {
      case 'processing':
        return 'Creating blockchain entry...';
      case 'success':
        return 'Blockchain entry created successfully';
      case 'error':
        return 'Failed to create blockchain entry';
      default:
        return 'Ready to create blockchain entry';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">JMR Blockchain Entry</h1>
        <p className="text-muted-foreground">
          Create Joint Measurement Records with automatic blockchain integration
        </p>
      </div>

      {/* Blockchain Status */}
      <Alert className={blockchainStatus === 'success' ? 'border-green-500' : blockchainStatus === 'error' ? 'border-red-500' : 'border-blue-500'}>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Blockchain Status:</strong> {getBlockchainStatusText()}
        </AlertDescription>
      </Alert>

      {/* Main Form Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
        </TabsList>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual JMR Entry</CardTitle>
              <CardDescription>
                Enter JMR details manually. All entries will be automatically recorded on the blockchain.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="survey_number">Survey Number *</Label>
                  <Input
                    id="survey_number"
                    placeholder="e.g., SY-2024-001"
                    value={formData.survey_number}
                    onChange={(e) => handleInputChange('survey_number', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="project_id">Project *</Label>
                  <Select value={formData.project_id} onValueChange={(value) => handleInputChange('project_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.projectName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="landowner_id">Landowner ID *</Label>
                  <Input
                    id="landowner_id"
                    placeholder="e.g., OWN-001"
                    value={formData.landowner_id}
                    onChange={(e) => handleInputChange('landowner_id', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="measured_area">Measured Area (acres) *</Label>
                  <Input
                    id="measured_area"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 5.5"
                    value={formData.measured_area}
                    onChange={(e) => handleInputChange('measured_area', e.target.value)}
                  />
                </div>
              </div>

              {/* Land Classification */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="land_type">Land Type *</Label>
                  <Select value={formData.land_type} onValueChange={(value: 'Agricultural' | 'Non-Agricultural') => handleInputChange('land_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Agricultural">Agricultural</SelectItem>
                      <SelectItem value="Non-Agricultural">Non-Agricultural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tribal_classification">Tribal Classification</Label>
                  <Select 
                    value={formData.tribal_classification.toString()} 
                    onValueChange={(value) => handleInputChange('tribal_classification', value === 'true')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Non-Tribal</SelectItem>
                      <SelectItem value="true">Tribal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Residential, Commercial"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="village">Village *</Label>
                  <Input
                    id="village"
                    placeholder="Village name"
                    value={formData.village}
                    onChange={(e) => handleInputChange('village', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="taluka">Taluka *</Label>
                  <Input
                    id="taluka"
                    placeholder="Taluka name"
                    value={formData.taluka}
                    onChange={(e) => handleInputChange('taluka', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="district">District *</Label>
                  <Input
                    id="district"
                    placeholder="District name"
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                  />
                </div>
              </div>

              {/* Officer and Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="officer_id">Field Officer *</Label>
                  <Select value={formData.officer_id} onValueChange={(value) => handleInputChange('officer_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select officer" />
                    </SelectTrigger>
                    <SelectContent>
                      {officers.map((officer) => (
                        <SelectItem key={officer.id} value={officer.id.toString()}>
                          {officer.name} - {officer.designation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes about the measurement"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={submitForm} 
                  disabled={loading}
                  className="min-w-[200px]"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Creating JMR...' : 'Create JMR with Blockchain'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CSV Upload Tab */}
        <TabsContent value="csv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CSV Bulk Upload</CardTitle>
              <CardDescription>
                Upload multiple JMR records via CSV file. All entries will be automatically recorded on the blockchain.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* CSV Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Upload a CSV file with JMR data
                  </p>
                  <p className="text-xs text-gray-500">
                    Supported format: CSV with headers matching the form fields
                  </p>
                  <div className="flex justify-center space-x-2">
                    <Button variant="outline" size="sm" onClick={downloadTemplate}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <Label htmlFor="csv-upload">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <FileText className="h-4 w-4 mr-2" />
                          Choose CSV File
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>

              {/* CSV Data Preview */}
              {csvData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">CSV Data Preview</h3>
                    <Badge variant="secondary">{csvData.length} rows</Badge>
                  </div>
                  
                  <div className="max-h-60 overflow-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Survey #</th>
                          <th className="px-3 py-2 text-left font-medium">Landowner</th>
                          <th className="px-3 py-2 text-left font-medium">Area</th>
                          <th className="px-3 py-2 text-left font-medium">Village</th>
                          <th className="px-3 py-2 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(0, 10).map((row, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-3 py-2">{row.survey_number}</td>
                            <td className="px-3 py-2">{row.landowner_id}</td>
                            <td className="px-3 py-2">{row.measured_area}</td>
                            <td className="px-3 py-2">{row.village}</td>
                            <td className="px-3 py-2">
                              <Badge variant="outline">Ready</Badge>
                            </td>
                          </tr>
                        ))}
                        {csvData.length > 10 && (
                          <tr>
                            <td colSpan={5} className="px-3 py-2 text-center text-gray-500">
                              ... and {csvData.length - 10} more rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Upload Progress */}
                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading to blockchain...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}

                  {/* Upload Button */}
                  <div className="flex justify-end">
                    <Button 
                      onClick={uploadCSVData} 
                      disabled={uploading || csvData.length === 0}
                      className="min-w-[200px]"
                    >
                      {uploading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {uploading ? 'Uploading...' : `Upload ${csvData.length} Records`}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Results</DialogTitle>
            <DialogDescription>
              Results of the CSV upload operation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {uploadResults.map((result, index) => (
              <div key={index} className={`p-3 rounded-lg border ${
                result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center space-x-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.message}
                  </span>
                </div>
                
                {result.data && (
                  <div className="mt-2 text-xs text-green-700">
                    <p>Block ID: {result.data.block_id}</p>
                    <p>Blockchain Hash: {result.data.blockchain_hash}</p>
                  </div>
                )}
                
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2 text-xs text-red-700">
                    {result.errors.map((error, errorIndex) => (
                      <p key={errorIndex}>• {error}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JMRBlockchainForm;
