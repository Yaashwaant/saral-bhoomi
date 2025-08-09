import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import SaralHeader from '@/components/saral/layout/SaralHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Download,
  User,
  MapPin,
  IndianRupee,
  CheckSquare,
  Square,
  Receipt,
  UserCheck,
  Building2,
  Calendar,
  Phone,
  Banknote,
  FileCheck,
  Camera,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { NoticeBasedKycRecord, DEFAULT_KYC_DOCUMENTS, KycUploadedDocument } from '@/types/enhancedKyc';
import { agentApi } from '@/utils/agentApi';
import debugHelpers from '@/utils/debugHelpers';

interface EnhancedAgentDashboardProps {
  agentId?: string;
}

const EnhancedAgentDashboard: React.FC<EnhancedAgentDashboardProps> = ({ agentId }) => {
  const { user } = useAuth();
  const { getAssignedRecords, updateLandownerRecord, uploadKYCDocument } = useSaral();
  
  // State management
  const [kycRecords, setKycRecords] = useState<NoticeBasedKycRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<NoticeBasedKycRecord | null>(null);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showBankDetailsDialog, setShowBankDetailsDialog] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    accountHolderName: ''
  });

  // Load assigned records on component mount
  useEffect(() => {
    // Debug logging
    debugHelpers.logCurrentUser();
    debugHelpers.getDebugSummary();
    
    loadAssignedRecords();
  }, [user]);

  const loadAssignedRecords = async () => {
    try {
      const currentAgentEmail = user?.email;
      if (!currentAgentEmail) {
        console.log('❌ No agent ID available');
        return;
      }

      console.log('🔄 Loading assigned records for agent (by email):', currentAgentEmail);
      
      // Call the API with agent email parameter for stable matching
      const response = await fetch(`/api/agents/assigned-with-notices?agentEmail=${encodeURIComponent(currentAgentEmail)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const result = await response.json();
      console.log('📥 API response:', result);

      if (!result.success) {
        console.error('❌ Failed to fetch assigned records:', result.message);
        return;
      }

      const records = result.data || result.records || [];
      console.log('✅ Loaded records:', records.length, 'records');
      
      // Transform regular records to NoticeBasedKycRecord format
      const enhancedRecords: NoticeBasedKycRecord[] = records.map(record => {
        console.log('📋 Processing record:', record._id || record.id, record.खातेदाराचे_नांव);
        
          return {
          id: record._id || record.id,
          noticeId: record.noticeNumber || `notice-${record._id}`,
          noticeNumber: record.noticeNumber || `NOTICE-${Date.now()}-${record._id}`,
          noticeDate: record.noticeDate ? new Date(record.noticeDate) : new Date(),
          noticeContent: record.noticeContent || '',
          
          landownerId: record._id || record.id,
          landownerName: record.खातेदाराचे_नांव || record.landownerName || 'Unknown',
          surveyNumber: record.सर्वे_नं || record.surveyNumber || 'N/A',
          village: record.village || 'Unknown',
          
          compensationAmount: parseFloat(record.एकूण_मोबदला || record.compensationAmount || '0'),
          solatiumAmount: parseFloat(record.सोलेशियम_100 || record.solatiumAmount || '0'),
          finalAmount: parseFloat(record.अंतिम_रक्कम || record.finalAmount || '0'),
          
          assignedAgent: {
            id: record.assignedAgent?._id || record.assignedAgent || (user?.id as any),
            name: record.assignedAgent?.name || user?.name || 'Agent',
            phone: record.assignedAgent?.phone || user?.phone || '',
            area: record.assignedAgent?.area || user?.area || '',
            assignedAt: record.assignedAt ? new Date(record.assignedAt) : new Date()
          },
          
          kycStatus: record.kycStatus || 'assigned',
          kycStartedAt: record.kycStartedAt ? new Date(record.kycStartedAt) : undefined,
          kycCompletedAt: record.kycCompletedAt ? new Date(record.kycCompletedAt) : undefined,
          
          requiredDocuments: DEFAULT_KYC_DOCUMENTS,
          uploadedDocuments: (record.documents || []).map((doc: any) => ({
            id: doc._id || doc.id,
            documentTypeId: doc.type,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize || 0,
            mimeType: doc.mimeType || 'application/octet-stream',
            uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : new Date(),
            uploadedBy: doc.uploadedBy || currentAgentId,
            verificationStatus: doc.verified ? 'verified' : 'pending'
          })),
          documentCollectionStatus: (record.documents?.length > 0) ? 'in_progress' : 'pending',
          
          bankDetailsCollected: record.bankDetails?.accountNumber ? true : false,
          currentStep: 'document_collection',
        
        createdAt: record.createdAt || new Date(),
        updatedAt: record.updatedAt || new Date(),
        createdBy: record.createdBy || 'system',
        updatedBy: record.updatedBy || 'system'
      }));
      
      setKycRecords(enhancedRecords);
    } catch (error) {
      console.error('Failed to load assigned records:', error);
      toast.error('Failed to load assigned records');
    }
  };

  // Calculate dashboard statistics
  const stats = {
    total: kycRecords.length,
    pending: kycRecords.filter(r => r.kycStatus === 'assigned' || r.kycStatus === 'pending').length,
    inProgress: kycRecords.filter(r => r.kycStatus === 'in_progress').length,
    documentsCollected: kycRecords.filter(r => r.documentCollectionStatus === 'completed').length,
    completed: kycRecords.filter(r => r.kycStatus === 'completed').length,
    totalCompensation: kycRecords.reduce((sum, r) => sum + r.finalAmount, 0)
  };

  // Document upload handler
  const handleDocumentUpload = async (file: File) => {
    if (!selectedRecord || !selectedDocumentType) {
      toast.error('Please select a record and document type');
      return;
    }

    try {
      setUploadingDocument(selectedDocumentType);
      
      console.log('🔄 Uploading document:', {
        recordId: selectedRecord.id,
        documentType: selectedDocumentType,
        fileName: file.name,
        fileSize: file.size
      });

      // Send JSON metadata to backend (MVP, not storing binary)
      const objectUrl = URL.createObjectURL(file);
      const response = await fetch(`/api/agents/upload-document/${selectedRecord.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          documentType: selectedDocumentType,
          fileName: file.name,
          fileUrl: objectUrl,
          fileSize: file.size,
          mimeType: file.type,
          notes: `Uploaded by agent: ${user?.name || 'Agent'}`
        })
      });

      const result = await response.json();
      console.log('📥 Upload response:', result);

      if (!result.success) {
        throw new Error(result.message || 'Upload failed');
      }

      // Create document object from API response
      const uploadedDoc = result.data.document;
      const newDocument: KycUploadedDocument = {
        id: uploadedDoc._id || Date.now().toString(),
        documentTypeId: uploadedDoc.type,
        fileName: uploadedDoc.fileName,
        fileUrl: uploadedDoc.fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: new Date(uploadedDoc.uploadedAt),
        uploadedBy: uploadedDoc.uploadedBy,
        verificationStatus: uploadedDoc.verified ? 'verified' : 'pending'
      };

      // Update the selected record
      const updatedRecord = {
        ...selectedRecord,
        uploadedDocuments: [...selectedRecord.uploadedDocuments, newDocument],
        kycStatus: 'in_progress' as const,
        documentCollectionStatus: 'in_progress' as const,
        updatedAt: new Date()
      };

      // Update records list
      setKycRecords(prev => prev.map(r => 
        r.id === selectedRecord.id ? updatedRecord : r
      ));

      // Update selected record
      setSelectedRecord(updatedRecord);

      toast.success(`✅ Document "${file.name}" uploaded successfully`);
      console.log('✅ Document upload completed');
      setSelectedDocumentType('');

      // Refresh the records to get updated data from server
      setTimeout(() => loadAssignedRecords(), 500);

    } catch (error) {
      console.error('❌ Failed to upload document:', error);
      toast.error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingDocument(null);
    }
  };

  // Get document progress for a record
  const getDocumentProgress = (record: NoticeBasedKycRecord) => {
    const requiredCount = record.requiredDocuments.filter(d => d.isRequired).length;
    const uploadedCount = record.uploadedDocuments.length;
    return {
      percentage: requiredCount > 0 ? (uploadedCount / requiredCount) * 100 : 0,
      uploaded: uploadedCount,
      required: requiredCount
    };
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assigned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SaralHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent KYC Dashboard</h1>
              <p className="text-gray-600">Manage notice-based KYC processing and document collection</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={loadAssignedRecords}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Receipt className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total Notices</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.inProgress}</p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.completed}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <IndianRupee className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(stats.totalCompensation).slice(0, -3)}L
                  </p>
                  <p className="text-sm text-gray-600">Total Compensation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="assigned" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assigned">Assigned Notices</TabsTrigger>
            <TabsTrigger value="documents">Document Collection</TabsTrigger>
            <TabsTrigger value="completed">Completed KYC</TabsTrigger>
          </TabsList>

          {/* Assigned Notices Tab */}
          <TabsContent value="assigned" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>Assigned Notices for KYC Processing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kycRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Notices Assigned</h3>
                    <p className="text-gray-500">You don't have any notices assigned for KYC processing yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {kycRecords.map((record) => {
                      const progress = getDocumentProgress(record);
                      return (
                        <div key={record.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {record.landownerName}
                                </h3>
                                <Badge className={getStatusBadgeColor(record.kycStatus)}>
                                  {record.kycStatus.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-2">
                                  <Receipt className="h-4 w-4" />
                                  <span>Notice: {record.noticeNumber}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>Survey: {record.surveyNumber}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Building2 className="h-4 w-4" />
                                  <span>Village: {record.village}</span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                                <div className="flex items-center space-x-2">
                                  <IndianRupee className="h-4 w-4 text-green-600" />
                                  <span className="font-medium">Final Amount: {formatCurrency(record.finalAmount)}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4 text-blue-600" />
                                  <span>Notice Date: {record.noticeDate.toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end space-y-2">
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-700">Document Progress</p>
                                <p className="text-xs text-gray-500">{progress.uploaded} of {progress.required} required</p>
                              </div>
                              <Progress value={progress.percentage} className="w-24" />
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center pt-4 border-t">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setShowNoticeDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Notice
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setShowDocumentDialog(true);
                                }}
                              >
                                <Upload className="h-4 w-4 mr-1" />
                                Upload Documents
                              </Button>
                            </div>
                            
                            {record.documentCollectionStatus === 'completed' && !record.bankDetailsCollected && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setShowBankDetailsDialog(true);
                                }}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Banknote className="h-4 w-4 mr-1" />
                                Collect Bank Details
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Document Collection Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Collection Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Document collection interface will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed KYC Tab */}
          <TabsContent value="completed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Completed KYC Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Completed KYC records will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Notice Content Dialog */}
      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notice Content</DialogTitle>
            <DialogDescription>
              Full notice content for {selectedRecord?.landownerName}
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {selectedRecord.noticeContent || 'Notice content not available'}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Upload Dialog */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Upload required KYC documents for {selectedRecord?.landownerName}
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid gap-4">
                {selectedRecord.requiredDocuments.map((doc) => {
                  const isUploaded = selectedRecord.uploadedDocuments.some(
                    uploaded => uploaded.documentTypeId === doc.id
                  );
                  
                  return (
                    <div key={doc.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{doc.nameMarathi}</h4>
                          <p className="text-sm text-gray-600">{doc.descriptionMarathi}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Formats: {doc.acceptedFormats.join(', ')} | Max: {doc.maxSize}MB
                          </p>
                        </div>
                        {isUploaded && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Uploaded
                          </Badge>
                        )}
                      </div>
                      
                      {!isUploaded && (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="file"
                            accept={doc.acceptedFormats.map(f => `.${f}`).join(',')}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSelectedDocumentType(doc.id);
                                handleDocumentUpload(file);
                              }
                            }}
                            disabled={uploadingDocument === doc.id}
                          />
                          {uploadingDocument === doc.id && (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              <span className="text-sm text-gray-600">Uploading...</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bank Details Dialog */}
      <Dialog open={showBankDetailsDialog} onOpenChange={setShowBankDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collect Bank Details</DialogTitle>
            <DialogDescription>
              Collect bank account details for compensation transfer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                <Input
                  id="accountHolderName"
                  value={bankDetails.accountHolderName}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  value={bankDetails.ifscCode}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, ifscCode: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="branchName">Branch Name</Label>
              <Input
                id="branchName"
                value={bankDetails.branchName}
                onChange={(e) => setBankDetails(prev => ({ ...prev, branchName: e.target.value }))}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBankDetailsDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                // Handle bank details save
                toast.success('Bank details saved successfully');
                setShowBankDetailsDialog(false);
              }}>
                Save Bank Details
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedAgentDashboard;