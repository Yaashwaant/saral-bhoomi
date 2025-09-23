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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Upload, 
  FileText, 
  Plus, 
  Eye, 
  Download, 
  CheckCircle, 
  AlertCircle,
  Award,
  Hash,
  RefreshCw,
  Calculator,
  IndianRupee
} from 'lucide-react';
import { config } from '../../../config';

interface AwardRecord {
  id?: string;
  survey_number: string;
  project_id: string;
  officer_id: string;
  landowner_id: string;
  award_number: string;
  award_date: string;
  base_amount: number;
  solatium: number;
  interest: number;
  total_amount: number;
  land_type: string;
  tribal_classification: string;
  category: string;
  payment_status: string;
  remarks: string;
  status: string;
  blockchain_verified: boolean;
  blockchain_hash?: string;
  blockchain_timestamp?: string;
}

interface JMRRecord {
  id: string;
  survey_number: string;
  measured_area: number;
  land_type: string;
  tribal_classification: string;
  category: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

const EnhancedAwardManager: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useSaral();
  
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [awardRecords, setAwardRecords] = useState<AwardRecord[]>([]);
  const [jmrRecords, setJmrRecords] = useState<JMRRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('form');
  const [selectedJMR, setSelectedJMR] = useState<JMRRecord | null>(null);
  const [showJMRSelector, setShowJMRSelector] = useState(false);
  
  // Form state
  const [awardForm, setAwardForm] = useState<AwardRecord>({
    survey_number: '',
    project_id: '',
    officer_id: '',
    landowner_id: '',
    award_number: '',
    award_date: new Date().toISOString().slice(0, 10),
    base_amount: 0,
    solatium: 0,
    interest: 0,
    total_amount: 0,
    land_type: 'agricultural',
    tribal_classification: 'non-tribal',
    category: 'general',
    payment_status: 'pending',
    remarks: '',
    status: 'draft',
    blockchain_verified: false
  });

  const API_BASE_URL = config.API_BASE_URL;

  useEffect(() => {
    if (selectedProject) {
      loadAwardRecords();
      loadJMRRecords();
    }
  }, [selectedProject]);

  const loadAwardRecords = async () => {
    if (!selectedProject) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/awards/${selectedProject}`);
      if (response.ok) {
        const data = await response.json();
        setAwardRecords(data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load award records');
    } finally {
      setLoading(false);
    }
  };

  const loadJMRRecords = async () => {
    if (!selectedProject) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/jmr/${selectedProject}`);
      if (response.ok) {
        const data = await response.json();
        setJmrRecords(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load JMR records:', error);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    if (!awardForm.survey_number || !awardForm.award_number || !awardForm.base_amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const awardData = {
        ...awardForm,
        project_id: selectedProject,
        officer_id: user?.id || '',
        total_amount: awardForm.base_amount + awardForm.solatium + awardForm.interest
      };

      const response = await fetch(`${API_BASE_URL}/awards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(awardData),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Award record created successfully');
        
        // Reset form
        setAwardForm({
          survey_number: '',
          project_id: '',
          officer_id: '',
          landowner_id: '',
          award_number: '',
          award_date: new Date().toISOString().slice(0, 10),
          base_amount: 0,
          solatium: 0,
          interest: 0,
          total_amount: 0,
          land_type: 'agricultural',
          tribal_classification: 'non-tribal',
          category: 'general',
          payment_status: 'pending',
          remarks: '',
          status: 'draft',
          blockchain_verified: false
        });
        
        // Reload records
        loadAwardRecords();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create award record');
      }
    } catch (error) {
      toast.error('Failed to create award record');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile || !selectedProject) {
      toast.error('Please select a CSV file and project');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('csv', csvFile);
      formData.append('project_id', selectedProject);
      formData.append('officer_id', user?.id || '');

      const response = await fetch(`${API_BASE_URL}/csv/upload-awards`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully uploaded ${result.uploaded} award records`);
        setCsvFile(null);
        setCsvPreview([]);
        loadAwardRecords();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to upload CSV');
      }
    } catch (error) {
      toast.error('Failed to upload CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      previewCsv(file);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  const previewCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      const preview = lines.slice(1, 6).map(line => {
        const values = line.split(',');
        const row: any = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || '';
        });
        return row;
      });
      setCsvPreview(preview);
    };
    reader.readAsText(file);
  };

  const selectJMRRecord = (jmr: JMRRecord) => {
    setAwardForm(prev => ({
      ...prev,
      survey_number: jmr.survey_number,
      land_type: jmr.land_type,
      tribal_classification: jmr.tribal_classification,
      category: jmr.category
    }));
    setSelectedJMR(jmr);
    setShowJMRSelector(false);
  };

  const calculateTotal = () => {
    const total = awardForm.base_amount + awardForm.solatium + awardForm.interest;
    setAwardForm(prev => ({ ...prev, total_amount: total }));
  };

  const downloadTemplate = () => {
    const headers = [
      'survey_number',
      'award_number',
      'award_date',
      'base_amount',
      'solatium',
      'interest',
      'land_type',
      'tribal_classification',
      'category',
      'remarks'
    ];
    
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'award_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const projectOptions = projects.map(p => ({ 
    id: p.id, 
    name: (p as any).projectName || (p as any).name || p.id 
  }));

  const availableJMRRecords = jmrRecords.filter(jmr => 
    jmr.status === 'approved' && 
    !awardRecords.some(award => award.survey_number === jmr.survey_number)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Enhanced Award Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="project">Select Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {projectOptions.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedProject && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="form">Manual Entry</TabsTrigger>
                <TabsTrigger value="csv">CSV Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="form" className="space-y-6">
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  {/* JMR Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Select JMR Record</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowJMRSelector(true)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Select from JMR Records
                        </Button>
                        {selectedJMR && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Selected:</span>
                            <Badge variant="outline">
                              Survey: {selectedJMR.survey_number} | 
                              Area: {selectedJMR.measured_area} Ha | 
                              Type: {selectedJMR.land_type}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        Available JMR records: {availableJMRRecords.length} 
                        (Approved JMR records that don't have awards yet)
                      </div>
                    </CardContent>
                  </Card>

                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="survey_number">Survey Number *</Label>
                        <Input
                          id="survey_number"
                          value={awardForm.survey_number}
                          onChange={(e) => setAwardForm({ ...awardForm, survey_number: e.target.value })}
                          required
                          readOnly={!!selectedJMR}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="award_number">Award Number *</Label>
                        <Input
                          id="award_number"
                          value={awardForm.award_number}
                          onChange={(e) => setAwardForm({ ...awardForm, award_number: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="award_date">Award Date</Label>
                        <Input
                          id="award_date"
                          type="date"
                          value={awardForm.award_date}
                          onChange={(e) => setAwardForm({ ...awardForm, award_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="land_type">Land Type</Label>
                        <Select value={awardForm.land_type} onValueChange={(value) => setAwardForm({ ...awardForm, land_type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="agricultural">Agricultural</SelectItem>
                            <SelectItem value="residential">Residential</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="industrial">Industrial</SelectItem>
                            <SelectItem value="forest">Forest</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tribal_classification">Tribal Classification</Label>
                        <Select value={awardForm.tribal_classification} onValueChange={(value) => setAwardForm({ ...awardForm, tribal_classification: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tribal">Tribal</SelectItem>
                            <SelectItem value="non-tribal">Non-Tribal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={awardForm.category} onValueChange={(value) => setAwardForm({ ...awardForm, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="sc">SC</SelectItem>
                            <SelectItem value="st">ST</SelectItem>
                            <SelectItem value="obc">OBC</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Financial Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Financial Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="base_amount">Base Amount (₹) *</Label>
                          <Input
                            id="base_amount"
                            type="number"
                            step="0.01"
                            value={awardForm.base_amount}
                            onChange={(e) => {
                              setAwardForm({ ...awardForm, base_amount: parseFloat(e.target.value) || 0 });
                              calculateTotal();
                            }}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="solatium">Solatium (₹)</Label>
                          <Input
                            id="solatium"
                            type="number"
                            step="0.01"
                            value={awardForm.solatium}
                            onChange={(e) => {
                              setAwardForm({ ...awardForm, solatium: parseFloat(e.target.value) || 0 });
                              calculateTotal();
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="interest">Interest (₹)</Label>
                          <Input
                            id="interest"
                            type="number"
                            step="0.01"
                            value={awardForm.interest}
                            onChange={(e) => {
                              setAwardForm({ ...awardForm, interest: parseFloat(e.target.value) || 0 });
                              calculateTotal();
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="total_amount">Total Amount (₹)</Label>
                          <Input
                            id="total_amount"
                            type="number"
                            step="0.01"
                            value={awardForm.total_amount}
                            readOnly
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <Calculator className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800">
                          Total = Base Amount + Solatium + Interest
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Additional Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="payment_status">Payment Status</Label>
                        <Select value={awardForm.payment_status} onValueChange={(value) => setAwardForm({ ...awardForm, payment_status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="initiated">Initiated</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Textarea
                          id="remarks"
                          value={awardForm.remarks}
                          onChange={(e) => setAwardForm({ ...awardForm, remarks: e.target.value })}
                          placeholder="Additional notes or observations..."
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Creating...' : 'Create Award Record'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="csv" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>CSV Upload for Award Records</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Button variant="outline" onClick={downloadTemplate}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                      <div className="text-sm text-gray-600">
                        Upload CSV file with award records for bulk processing
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="csv-upload">Select CSV File</Label>
                      <Input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleCsvFileChange}
                      />
                    </div>

                    {csvFile && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{csvFile.name}</span>
                          <Badge variant="secondary">{csvFile.size} bytes</Badge>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button onClick={() => setShowCsvPreview(!showCsvPreview)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                          <Button onClick={handleCsvUpload} disabled={loading}>
                            {loading ? 'Uploading...' : 'Upload CSV'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {showCsvPreview && csvPreview.length > 0 && (
                      <div className="space-y-2">
                        <Label>CSV Preview (First 5 rows):</Label>
                        <div className="border rounded p-2 bg-gray-50">
                          <pre className="text-sm overflow-x-auto">
                            {JSON.stringify(csvPreview, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Award Records Table */}
          {selectedProject && awardRecords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Award Records ({awardRecords.length})</span>
                  <Button onClick={loadAwardRecords} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Survey No.</TableHead>
                      <TableHead>Award No.</TableHead>
                      <TableHead>Base Amount</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Land Type</TableHead>
                      <TableHead>Tribal</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Blockchain</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {awardRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.survey_number}</TableCell>
                        <TableCell>{record.award_number}</TableCell>
                        <TableCell>₹{record.base_amount.toLocaleString()}</TableCell>
                        <TableCell className="font-medium">₹{record.total_amount.toLocaleString()}</TableCell>
                        <TableCell className="capitalize">{record.land_type}</TableCell>
                        <TableCell>
                          <Badge variant={record.tribal_classification === 'tribal' ? 'default' : 'secondary'}>
                            {record.tribal_classification}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            record.payment_status === 'completed' ? 'default' : 
                            record.payment_status === 'initiated' ? 'secondary' : 
                            record.payment_status === 'failed' ? 'destructive' : 'outline'
                          }>
                            {record.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.blockchain_verified ? (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {!selectedProject && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select a project to start managing award records.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* JMR Selector Dialog */}
      <Dialog open={showJMRSelector} onOpenChange={setShowJMRSelector}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select JMR Record</DialogTitle>
            <DialogDescription>
              Choose an approved JMR record to create an award for. Only records without existing awards are shown.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Available JMR Records: {availableJMRRecords.length}
            </div>
            
            {availableJMRRecords.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Survey No.</TableHead>
                      <TableHead>Area (Ha)</TableHead>
                      <TableHead>Land Type</TableHead>
                      <TableHead>Tribal</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableJMRRecords.map((jmr) => (
                      <TableRow key={jmr.id}>
                        <TableCell className="font-medium">{jmr.survey_number}</TableCell>
                        <TableCell>{jmr.measured_area}</TableCell>
                        <TableCell className="capitalize">{jmr.land_type}</TableCell>
                        <TableCell>
                          <Badge variant={jmr.tribal_classification === 'tribal' ? 'default' : 'secondary'}>
                            {jmr.tribal_classification}
                          </Badge>
                        </TableCell>
                        <TableCell className="uppercase">{jmr.category}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => selectJMRRecord(jmr)}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No available JMR records found. All approved JMR records already have awards.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedAwardManager;
