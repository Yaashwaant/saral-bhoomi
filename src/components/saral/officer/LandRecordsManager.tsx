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
import { FileText, Eye, Download, Upload, Database } from 'lucide-react';
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
}

const LandRecordsManager: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useSaral();
  
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [landRecords, setLandRecords] = useState<LandRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('form');
  
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
    blockchain_verified: false
  });

  const API_BASE_URL = config.API_BASE_URL;

  useEffect(() => {
    if (selectedProject) {
      loadLandRecords();
    }
  }, [selectedProject]);

  const loadLandRecords = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/landowners/${selectedProject}`);
      if (response.ok) {
        const data = await response.json();
        setLandRecords(data.data || []);
      } else {
        toast.error('Failed to load land records');
      }
    } catch (error) {
      console.error('Error loading land records:', error);
      toast.error('Error loading land records');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/landowners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          ...landRecordForm,
          project_id: selectedProject,
          created_by: user?.id
        })
      });

      if (response.ok) {
        toast.success('Land record created successfully');
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

  const handleCSVUpload = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('project_id', selectedProject);

    try {
      const response = await fetch(`${API_BASE_URL}/landowners/upload-csv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully uploaded ${result.uploaded} land records`);
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
                          blockchain_verified: false
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
              <CardTitle>Land Records</CardTitle>
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
