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
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { NoticeBasedKycRecord, DEFAULT_KYC_DOCUMENTS, KycUploadedDocument } from '@/types/enhancedKyc';

interface DocumentUpload {
  id: string;
  landownerId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  verified: boolean;
}

const AgentDashboard = () => {
  const { user } = useAuth();
  const { getAssignedRecords, updateLandownerRecord, uploadKYCDocument } = useSaral();
  const [assignedRecords, setAssignedRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showNoticeContent, setShowNoticeContent] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState<string[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentUpload[]>([]);

  // Use enhanced KYC documents
  const requiredDocuments = DEFAULT_KYC_DOCUMENTS;
  
  // Legacy documents for backward compatibility
  const legacyRequiredDocuments = [
    { 
      id: '7_12_extract', 
      name: '७/१२ उतारा', 
      description: 'संबंधित जमिनीचा अद्यायावत ७/१२ उतारा' 
    },
    { 
      id: 'identity_documents', 
      name: 'ओळखपत्राच्या झेरॉक्स प्रती', 
      description: 'रेशन कार्ड/निवडणूक ओळखपत्र/आधारकार्ड, पॅनकार्ड, ड्रायव्हींग लायसन्स इ.' 
    },
    { 
      id: 'encumbrance_clearance', 
      name: 'बोजा कमी केल्याचा फेरफार', 
      description: '७/१२ वर बोजा असल्यास बोजा कमी केल्याचा फेरफार अथवा ७/१२ इतर हक्कामधील बोजा असणाऱ्या संस्था/बँक यांचे रक्कम स्विकारण्याकरिता नाहरकत दाखला' 
    },
    { 
      id: 'other_rights_clearance', 
      name: 'इतर हक्क फेरफार', 
      description: '७/१२ चे सदरी इतर हक्कात जुनी शर्त अथवा नवीन शर्तीची नोंद असल्याने संबंधित फेरफार अथवा शर्तशिथिल केल्याचे आदेश' 
    },
    { 
      id: 'non_agricultural_order', 
      name: 'बिनशेती आदेश व मंजुरी नकाशा', 
      description: 'बिनशेती प्लॉटधारकांनी बिनशेती आदेश व मंजुरी नकाशा सादर करावेत' 
    },
    { 
      id: 'bank_passbook', 
      name: 'राष्ट्रीयकृत बँक पासबुक', 
      description: 'राष्ट्रीयकृत बँक पासबुक मूळ प्रत व छायांकित प्रत' 
    },
    { 
      id: 'photographs', 
      name: 'फोटो', 
      description: 'प्रत्येकी दोन फोटो' 
    },
    { 
      id: 'power_of_attorney', 
      name: 'कुळमुखत्यारपत्र', 
      description: 'ज्या खातेदारांना नुकसान भरपाईची एकत्रित रक्कम एकट्याचे नांवे घेण्याची आहे त्यांनी दुय्यम निबंधक कडील नोंदणीकृत कुळमुखत्यारपत्र सादर करावे' 
    },
    { 
      id: 'consent_letter', 
      name: 'संमतीपत्र', 
      description: 'ज्या खातेदाराला इतर खातेदारांच्या वतीने नुकसान भरपाईची रक्कम स्विकारावयाची आहे, त्यांनी देखील नोंदणीकृत संमतीपत्र सादर करावे' 
    },
    { 
      id: 'succession_certificate', 
      name: 'वारस हक्काचा पुरावा', 
      description: 'खातेदार मयत असल्याने वारस हक्काचा पुरावा व फेरफार जोडावा' 
    },
    { 
      id: 'guardian_certificate', 
      name: 'पालन पोषण दाखला', 
      description: 'सदर खातेदार १८ वर्षाआतील असल्यास, पालन पोषण करणा-याचे नाव असलेले संबंधित तलाठीकडील दाखला' 
    },
    { 
      id: 'land_handover_declaration', 
      name: 'जमिन हस्तांतरण घोषणा', 
      description: 'जमिन ३८ नुसार नुकसान भरपाई स्विकारल्यावर तात्काळ जमिन संपादित संस्थेच्या नियत होईल' 
    }
  ];

  // Sample data for testing when no real data is available
  const sampleRecords = [
    {
      id: '1',
      खातेदाराचे_नांव: 'कमळी कमळाकर मंडळ',
      सर्वे_नं: '40',
      village: 'उंबरपाडा नंदाडे',
      taluka: 'पालघर',
      district: 'पालघर',
      अंतिम_रक्कम: '8021026',
      noticeGenerated: true,
      documentsUploaded: false,
      kycStatus: 'pending',
      paymentStatus: 'pending',
      assignedAgent: user?.email || 'agent@example.com'
    },
    {
      id: '2',
      खातेदाराचे_नांव: 'राम शामराव पाटील',
      सर्वे_नं: '41',
      village: 'उंबरपाडा नंदाडे',
      taluka: 'पालघर',
      district: 'पालघर',
      अंतिम_रक्कम: '9200000',
      noticeGenerated: true,
      documentsUploaded: true,
      kycStatus: 'in_progress',
      paymentStatus: 'pending',
      assignedAgent: user?.email || 'agent@example.com'
    },
    {
      id: '3',
      खातेदाराचे_नांव: 'सीता देवी शर्मा',
      सर्वे_नं: '42',
      village: 'उंबरपाडा नंदाडे',
      taluka: 'पालघर',
      district: 'पालघर',
      अंतिम_रक्कम: '6900000',
      noticeGenerated: false,
      documentsUploaded: false,
      kycStatus: 'pending',
      paymentStatus: 'pending',
      assignedAgent: user?.email || 'agent@example.com'
    },
    {
      id: '4',
      खातेदाराचे_नांव: 'अमित कुमार सिंह',
      सर्वे_नं: '43',
      village: 'उंबरपाडा नंदाडे',
      taluka: 'पालघर',
      district: 'पालघर',
      अंतिम_रक्कम: '8400000',
      noticeGenerated: true,
      documentsUploaded: true,
      kycStatus: 'completed',
      paymentStatus: 'initiated',
      assignedAgent: user?.email || 'agent@example.com'
    },
    {
      id: '5',
      खातेदाराचे_नांव: 'मीरा बाई पाटील',
      सर्वे_नं: '44',
      village: 'उंबरपाडा नंदाडे',
      taluka: 'पालघर',
      district: 'पालघर',
      अंतिम_रक्कम: '10400000',
      noticeGenerated: true,
      documentsUploaded: true,
      kycStatus: 'approved',
      paymentStatus: 'success',
      assignedAgent: user?.email || 'agent@example.com'
    }
  ];

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const agentKey = (user.id || user.email || '').toString();
      const records = await getAssignedRecords(agentKey);
      setAssignedRecords(records && records.length ? records : sampleRecords);
    };
    load();
  }, [user, getAssignedRecords]);

  const translations = {
    marathi: {
      title: 'एजंट डॅशबोर्ड',
      subtitle: 'नोटीस पाहणे आणि कागदपत्रे अपलोड करणे',
      assignedRecords: 'नियुक्त केलेली नोंदी',
      noticeDetails: 'नोटीस तपशील',
      documentUpload: 'कागदपत्रे अपलोड',
      landownerName: 'जमीन मालकाचे नाव',
      surveyNumber: 'सर्वे नं.',
      village: 'गाव',
      compensationAmount: 'मोबदला रक्कम',
      noticeStatus: 'नोटीस स्थिती',
      documentStatus: 'कागदपत्र स्थिती',
      actions: 'कृती',
      viewNotice: 'नोटीस पाहा',
      uploadDocuments: 'कागदपत्रे अपलोड करा',
      downloadNotice: 'नोटीस डाउनलोड करा',
      processing: 'प्रक्रिया करत आहे...',
      uploadSuccess: 'कागदपत्र यशस्वीरित्या अपलोड केले',
      uploadFailed: 'कागदपत्र अपलोड अयशस्वी',
      noRecords: 'कोणतेही नोंदी नाहीत',
      totalAssigned: 'एकूण नियुक्त',
      pendingDocuments: 'प्रलंबित कागदपत्रे',
      completedDocuments: 'पूर्ण कागदपत्रे',
      requiredDocuments: 'आवश्यक कागदपत्रे',
      uploadFile: 'फाईल अपलोड करा',
      selectFile: 'फाईल निवडा',
      upload: 'अपलोड करा',
      cancel: 'रद्द करा',
      documentUploaded: 'कागदपत्र अपलोड केले',
      allDocumentsUploaded: 'सर्व कागदपत्रे अपलोड केली'
    },
    english: {
      title: 'Agent Dashboard',
      subtitle: 'View notices and upload documents',
      assignedRecords: 'Assigned Records',
      noticeDetails: 'Notice Details',
      documentUpload: 'Document Upload',
      landownerName: 'Landowner Name',
      surveyNumber: 'Survey No.',
      village: 'Village',
      compensationAmount: 'Compensation Amount',
      noticeStatus: 'Notice Status',
      documentStatus: 'Document Status',
      actions: 'Actions',
      viewNotice: 'View Notice',
      uploadDocuments: 'Upload Documents',
      downloadNotice: 'Download Notice',
      processing: 'Processing...',
      uploadSuccess: 'Document uploaded successfully',
      uploadFailed: 'Document upload failed',
      noRecords: 'No records found',
      totalAssigned: 'Total Assigned',
      pendingDocuments: 'Pending Documents',
      completedDocuments: 'Completed Documents',
      requiredDocuments: 'Required Documents',
      uploadFile: 'Upload File',
      selectFile: 'Select File',
      upload: 'Upload',
      cancel: 'Cancel',
      documentUploaded: 'Document uploaded',
      allDocumentsUploaded: 'All documents uploaded'
    }
  };

  const [currentLanguage, setCurrentLanguage] = useState<'marathi' | 'english'>('marathi');
  const t = translations[currentLanguage];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-700">{t.completedDocuments}</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700">{t.uploadFailed}</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700">{t.processing}</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700">{t.pendingDocuments}</Badge>;
    }
  };

  const handleViewNotice = (record: any) => {
    setSelectedRecord(record);
    setShowNoticeDialog(true);
  };

  const handleUploadDocuments = (record: any) => {
    setSelectedRecord(record);
    setShowUploadDialog(true);
  };

  const handleDocumentUpload = async (documentType: string, file: File) => {
    if (!selectedRecord) return;

    try {
      setUploadingDocuments(prev => [...prev, documentType]);
      
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newDocument: DocumentUpload = {
        id: Date.now().toString(),
        landownerId: selectedRecord.id,
        documentType,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        uploadedAt: new Date(),
        verified: false
      };

      setUploadedDocuments(prev => [...prev, newDocument]);
      
      // Update record status if all documents are uploaded
      const uploadedDocTypes = [...uploadedDocuments, newDocument].map(doc => doc.documentType);
      const allRequired = requiredDocuments.every(doc => uploadedDocTypes.includes(doc.id));
      
      if (allRequired) {
        await updateLandownerRecord(selectedRecord.id, { 
          documentsUploaded: true,
          kycStatus: 'completed'
        });
        toast.success(t.allDocumentsUploaded);
      } else {
        toast.success(t.documentUploaded);
      }
      
    } catch (error) {
      toast.error(t.uploadFailed);
    } finally {
      setUploadingDocuments(prev => prev.filter(type => type !== documentType));
    }
  };

  const stats = {
    total: Array.isArray(assignedRecords) ? assignedRecords.length : 0,
    pending: Array.isArray(assignedRecords) ? assignedRecords.filter(r => !r.documentsUploaded).length : 0,
    completed: Array.isArray(assignedRecords) ? assignedRecords.filter(r => r.documentsUploaded).length : 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SaralHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
              <p className="text-gray-600">{t.subtitle}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentLanguage(currentLanguage === 'marathi' ? 'english' : 'marathi')}
              className="text-sm"
            >
              {currentLanguage === 'marathi' ? 'English' : 'मराठी'}
            </Button>
          </div>
        </div>

        <Tabs value="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-orange-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="notices" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              Notices
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                      <p className="text-sm text-gray-600">{t.totalAssigned}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
                      <p className="text-sm text-gray-600">{t.pendingDocuments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{stats.completed}</p>
                      <p className="text-sm text-gray-600">{t.completedDocuments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assigned Records Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-orange-600" />
                  <span>{t.assignedRecords}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!Array.isArray(assignedRecords) || assignedRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{t.noRecords}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.landownerName}</TableHead>
                        <TableHead>{t.surveyNumber}</TableHead>
                        <TableHead>{t.village}</TableHead>
                        <TableHead>{t.compensationAmount}</TableHead>
                        <TableHead>{t.noticeStatus}</TableHead>
                        <TableHead>{t.documentStatus}</TableHead>
                        <TableHead>{t.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(assignedRecords) && assignedRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.खातेदाराचे_नांव}</TableCell>
                          <TableCell>{record.सर्वे_नं}</TableCell>
                          <TableCell>{record.village}</TableCell>
                          <TableCell>
                            <Badge>
                              {formatCurrency(parseFloat(record.अंतिम_रक्कम))}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {record.noticeGenerated ? (
                              <Badge variant="outline" className="text-green-600">
                                Generated
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600">
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.documentsUploaded ? (
                              <Badge className="bg-green-100 text-green-700">
                                Completed
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-700">
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewNotice(record)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUploadDocuments(record)}
                              >
                                <Upload className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notices">
            <Card>
              <CardHeader>
                <CardTitle>Notice Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Notice management features will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Document Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Document management features will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Notice Details Dialog */}
        <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Notice Details</DialogTitle>
              <DialogDescription>
                Land acquisition notice for {selectedRecord?.खातेदाराचे_नांव}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedRecord && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {/* Notice content would be displayed here */}
                    Notice content for {selectedRecord.खातेदाराचे_नांव}
                    Survey Number: {selectedRecord.सर्वे_नं}
                    Village: {selectedRecord.village}
                    Compensation: {formatCurrency(parseFloat(selectedRecord.अंतिम_रक्कम))}
                  </pre>
                </div>
              )}
              <div className="flex gap-2">
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Download Notice
                </Button>
                <Button variant="outline" onClick={() => setShowNoticeDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Document Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Required Documents</DialogTitle>
              <DialogDescription>
                Upload all required documents for {selectedRecord?.खातेदाराचे_नांव}
              </DialogDescription>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Documents Uploaded: {uploadedDocuments.filter(doc => doc.landownerId === selectedRecord?.id).length} / {requiredDocuments.length}</span>
                  <span>{Math.round((uploadedDocuments.filter(doc => doc.landownerId === selectedRecord?.id).length / requiredDocuments.length) * 100)}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${(uploadedDocuments.filter(doc => doc.landownerId === selectedRecord?.id).length / requiredDocuments.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                {requiredDocuments.map((doc) => {
                  const isUploaded = uploadedDocuments.some(
                    uploaded => uploaded.landownerId === selectedRecord?.id && uploaded.documentType === doc.id
                  );
                  const isUploading = uploadingDocuments.includes(doc.id);

                  return (
                    <Card key={doc.id} className={`${isUploaded ? 'border-green-200' : 'border-gray-200'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {isUploaded ? (
                              <CheckSquare className="h-4 w-4 text-green-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                            <Label className="font-medium">{doc.name}</Label>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleDocumentUpload(doc.id, file);
                              }
                            }}
                            disabled={isUploading || isUploaded}
                          />
                          {isUploading && (
                            <p className="text-sm text-blue-600">{t.processing}</p>
                          )}
                          {isUploaded && (
                            <p className="text-sm text-green-600">{t.uploadSuccess}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  {t.cancel}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AgentDashboard;