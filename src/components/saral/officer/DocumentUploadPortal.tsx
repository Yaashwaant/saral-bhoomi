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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  Image,
  File,
  FolderOpen,
  Eye,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Hash,
  RefreshCw,
  Search,
  Filter,
  Database,
  Award,
  Banknote,
  Calendar
} from 'lucide-react';
import { config } from '../../../config';

interface DocumentRecord {
  id?: string;
  survey_number: string;
  project_id: string;
  officer_id: string;
  document_type: string;
  document_category: string;
  file_name: string;
  file_size: number;
  file_type: string;
  upload_date: string;
  description: string;
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
  status: string;
}

interface AwardRecord {
  id: string;
  survey_number: string;
  award_number: string;
  total_amount: number;
  status: string;
}

interface NoticeRecord {
  id: string;
  survey_number: string;
  notice_number: string;
  notice_type: string;
  amount: number;
  status: string;
}

interface PaymentRecord {
  id: string;
  survey_number: string;
  payment_number: string;
  payment_type: string;
  amount: number;
  status: string;
}

const DocumentUploadPortal: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useSaral();
  
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [jmrRecords, setJmrRecords] = useState<JMRRecord[]>([]);
  const [awardRecords, setAwardRecords] = useState<AwardRecord[]>([]);
  const [noticeRecords, setNoticeRecords] = useState<NoticeRecord[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState<DocumentRecord>({
    survey_number: '',
    project_id: '',
    officer_id: '',
    document_type: 'jmr',
    document_category: '',
    file_name: '',
    file_size: 0,
    file_type: '',
    upload_date: new Date().toISOString().slice(0, 10),
    description: '',
    status: 'pending',
    blockchain_verified: false
  });
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSurveyNumber, setSelectedSurveyNumber] = useState<string>('');
  const [showSurveySelector, setShowSurveySelector] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const API_BASE_URL = config.API_BASE_URL;

  useEffect(() => {
    if (selectedProject) {
      loadDocuments();
      loadRelatedRecords();
    }
  }, [selectedProject]);

  const loadDocuments = async () => {
    if (!selectedProject) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${selectedProject}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedRecords = async () => {
    if (!selectedProject) return;
    
    try {
      const [jmrRes, awardRes, noticeRes, paymentRes] = await Promise.all([
        fetch(`${API_BASE_URL}/jmr/${selectedProject}`),
        fetch(`${API_BASE_URL}/awards/${selectedProject}`),
        fetch(`${API_BASE_URL}/notices/${selectedProject}`),
        fetch(`${API_BASE_URL}/payments/${selectedProject}`)
      ]);

      if (jmrRes.ok) {
        const jmrData = await jmrRes.json();
        setJmrRecords(jmrData.data || []);
      }
      
      if (awardRes.ok) {
        const awardData = await awardRes.json();
        setAwardRecords(awardData.data || []);
      }
      
      if (noticeRes.ok) {
        const noticeData = await noticeRes.json();
        setNoticeRecords(noticeData.data || []);
      }
      
      if (paymentRes.ok) {
        const paymentData = await paymentRes.json();
        setPaymentRecords(paymentData.data || []);
      }
    } catch (error) {
      console.error('Failed to load related records:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadForm(prev => ({
        ...prev,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type
      }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedProject || !uploadForm.survey_number) {
      toast.error('Please select a file, project, and survey number');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('survey_number', uploadForm.survey_number);
      formData.append('project_id', selectedProject);
      formData.append('officer_id', user?.id || '');
      formData.append('document_type', uploadForm.document_type);
      formData.append('document_category', uploadForm.document_category);
      formData.append('description', uploadForm.description);
      formData.append('upload_date', uploadForm.upload_date);

      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Document uploaded successfully');
        
        // Reset form
        setUploadForm({
          survey_number: '',
          project_id: '',
          officer_id: '',
          document_type: 'jmr',
          document_category: '',
          file_name: '',
          file_size: 0,
          file_type: '',
          upload_date: new Date().toISOString().slice(0, 10),
          description: '',
          status: 'pending',
          blockchain_verified: false
        });
        setSelectedFile(null);
        setSelectedSurveyNumber('');
        
        // Reload documents
        loadDocuments();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to upload document');
      }
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const selectSurveyNumber = (surveyNumber: string) => {
    setUploadForm(prev => ({ ...prev, survey_number: surveyNumber }));
    setSelectedSurveyNumber(surveyNumber);
    setShowSurveySelector(false);
  };

  const getDocumentCategories = (documentType: string) => {
    switch (documentType) {
      case 'jmr':
        return [
          'measurement_report',
          'land_photos',
          'boundary_markers',
          'area_calculation',
          'field_notes'
        ];
      case 'award':
        return [
          'award_order',
          'compensation_calculation',
          'land_valuation',
          'owner_consent',
          'legal_documents'
        ];
      case 'notice':
        return [
          'notice_copy',
          'delivery_proof',
          'acknowledgment',
          'public_notice',
          'legal_notice'
        ];
      case 'payment':
        return [
          'payment_receipt',
          'bank_statement',
          'transaction_proof',
          'payment_order',
          'completion_certificate'
        ];
      default:
        return [];
    }
  };

  const getAvailableSurveyNumbers = () => {
    const allSurveyNumbers = new Set<string>();
    
    jmrRecords.forEach(record => allSurveyNumbers.add(record.survey_number));
    awardRecords.forEach(record => allSurveyNumbers.add(record.survey_number));
    noticeRecords.forEach(record => allSurveyNumbers.add(record.survey_number));
    paymentRecords.forEach(record => allSurveyNumbers.add(record.survey_number));
    
    return Array.from(allSurveyNumbers).sort();
  };

  const getFilteredDocuments = () => {
    let filtered = [...documents];
    
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.survey_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedDocumentType) {
      filtered = filtered.filter(doc => doc.document_type === selectedDocumentType);
    }
    
    if (selectedStatus) {
      filtered = filtered.filter(doc => doc.status === selectedStatus);
    }
    
    return filtered;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'verified': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const projectOptions = projects.map(p => ({ 
    id: p.id, 
    name: (p as any).projectName || (p as any).name || p.id 
  }));

  const filteredDocuments = getFilteredDocuments();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Document Upload Portal for Field Officers
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
                <TabsTrigger value="upload">Upload Documents</TabsTrigger>
                <TabsTrigger value="manage">Manage Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-6">
                <form onSubmit={(e) => { e.preventDefault(); handleUpload(); }} className="space-y-6">
                  {/* Document Type Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Document Type & Category</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="document_type">Document Type *</Label>
                          <Select 
                            value={uploadForm.document_type} 
                            onValueChange={(value) => {
                              setUploadForm(prev => ({ 
                                ...prev, 
                                document_type: value,
                                document_category: ''
                              }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="jmr">JMR (Joint Measurement Report)</SelectItem>
                              <SelectItem value="award">Award</SelectItem>
                              <SelectItem value="notice">Notice</SelectItem>
                              <SelectItem value="payment">Payment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="document_category">Document Category *</Label>
                          <Select 
                            value={uploadForm.document_category} 
                            onValueChange={(value) => setUploadForm(prev => ({ ...prev, document_category: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {getDocumentCategories(uploadForm.document_type).map(category => (
                                <SelectItem key={category} value={category}>
                                  {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Survey Number Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Survey Number Selection</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowSurveySelector(true)}
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Select Survey Number
                        </Button>
                        {selectedSurveyNumber && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Selected:</span>
                            <Badge variant="outline">
                              Survey: {selectedSurveyNumber}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        Available survey numbers: {getAvailableSurveyNumbers().length} 
                        (From JMR, Awards, Notices, and Payments)
                      </div>
                    </CardContent>
                  </Card>

                  {/* File Upload */}
                  <Card>
                    <CardHeader>
                      <CardTitle>File Upload</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="file">Select File *</Label>
                        <Input
                          id="file"
                          type="file"
                          onChange={handleFileSelect}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                        />
                        <p className="text-xs text-gray-600">
                          Supported formats: PDF, DOC, DOCX, JPG, PNG, XLS, XLSX (Max 10MB)
                        </p>
                      </div>
                      
                      {selectedFile && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4" />
                            <span className="font-medium">{selectedFile.name}</span>
                            <Badge variant="secondary">{selectedFile.size} bytes</Badge>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Additional Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="upload_date">Upload Date</Label>
                          <Input
                            id="upload_date"
                            type="date"
                            value={uploadForm.upload_date}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, upload_date: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={uploadForm.description}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe the document content and purpose..."
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Button type="submit" disabled={loading || !selectedFile || !uploadForm.survey_number} className="w-full">
                    {loading ? 'Uploading...' : 'Upload Document'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="manage" className="space-y-6">
                {/* Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Search</Label>
                        <Input
                          placeholder="Search survey number, filename, or description..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Document Type</Label>
                        <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                          <SelectTrigger>
                            <SelectValue placeholder="All types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All types</SelectItem>
                            <SelectItem value="jmr">JMR</SelectItem>
                            <SelectItem value="award">Award</SelectItem>
                            <SelectItem value="notice">Notice</SelectItem>
                            <SelectItem value="payment">Payment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="All statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Documents Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Documents ({filteredDocuments.length})</span>
                      <Button onClick={loadDocuments} variant="outline" size="sm">
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
                          <TableHead>Document Type</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>File Name</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Upload Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Blockchain</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDocuments.map((document) => (
                          <TableRow key={document.id}>
                            <TableCell className="font-medium">{document.survey_number}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="uppercase">
                                {document.document_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="capitalize">
                              {document.document_category.replace('_', ' ')}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate" title={document.file_name}>
                              {document.file_name}
                            </TableCell>
                            <TableCell>{(document.file_size / 1024).toFixed(1)} KB</TableCell>
                            <TableCell>{new Date(document.upload_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(document.status)}>
                                {document.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {document.blockchain_verified ? (
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
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {!selectedProject && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select a project to access the document upload portal.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Survey Number Selector Dialog */}
      <Dialog open={showSurveySelector} onOpenChange={setShowSurveySelector}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Survey Number</DialogTitle>
            <DialogDescription>
              Choose a survey number from available records to upload documents for.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Available Survey Numbers: {getAvailableSurveyNumbers().length}
            </div>
            
            {getAvailableSurveyNumbers().length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Survey Number</TableHead>
                      <TableHead>JMR Status</TableHead>
                      <TableHead>Award Status</TableHead>
                      <TableHead>Notice Status</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getAvailableSurveyNumbers().map((surveyNumber) => {
                      const jmr = jmrRecords.find(r => r.survey_number === surveyNumber);
                      const award = awardRecords.find(r => r.survey_number === surveyNumber);
                      const notice = noticeRecords.find(r => r.survey_number === surveyNumber);
                      const payment = paymentRecords.find(r => r.survey_number === surveyNumber);
                      
                      return (
                        <TableRow key={surveyNumber}>
                          <TableCell className="font-medium">{surveyNumber}</TableCell>
                          <TableCell>
                            {jmr ? (
                              <Badge variant={jmr.status === 'approved' ? 'default' : 'secondary'}>
                                {jmr.status}
                              </Badge>
                            ) : (
                              <Badge variant="outline">N/A</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {award ? (
                              <Badge variant={award.status === 'approved' ? 'default' : 'secondary'}>
                                {award.status}
                              </Badge>
                            ) : (
                              <Badge variant="outline">N/A</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {notice ? (
                              <Badge variant={notice.status === 'issued' ? 'default' : 'secondary'}>
                                {notice.status}
                              </Badge>
                            ) : (
                              <Badge variant="outline">N/A</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {payment ? (
                              <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                                {payment.status}
                              </Badge>
                            ) : (
                              <Badge variant="outline">N/A</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              onClick={() => selectSurveyNumber(surveyNumber)}
                            >
                              Select
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No survey numbers found. Please ensure JMR, Award, Notice, or Payment records exist for this project.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentUploadPortal;
