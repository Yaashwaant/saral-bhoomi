import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  FileText, 
  Upload, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Camera,
  MapPin,
  User,
  Calendar,
  Phone,
  Mail,
  Building,
  FileImage,
  Download,
  Printer,
  Send,
  Clock,
  Shield,
  CheckSquare,
  Square
} from 'lucide-react';
import {
  RequiredDocument,
  UploadedDocument,
  EnhancedLandownerRecord
} from '@/types/notice';

interface AgentDocumentUploadProps {
  agentId: string;
}

const AgentDocumentUpload: React.FC<AgentDocumentUploadProps> = ({ agentId }) => {
  // State management
  const [assignedRecords, setAssignedRecords] = useState<EnhancedLandownerRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<string>('');
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<'marathi' | 'hindi' | 'english'>('marathi');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [verificationNotes, setVerificationNotes] = useState<string>('');
  const [isVerificationComplete, setIsVerificationComplete] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Demo data for required documents
  const demoRequiredDocuments: RequiredDocument[] = [
    {
      id: '1',
      projectId: '',
      name: '7/12 Extract',
      nameMarathi: '७/१२ उतारा',
      nameHindi: '७/१२ उतारा',
      nameEnglish: '7/12 Extract',
      isRequired: true,
      order: 1,
      description: 'Updated 7/12 extract of the concerned land',
      descriptionMarathi: 'संबंधित जमिनीचा अद्यायावत ७/१२ उतारा',
      descriptionHindi: 'संबंधित जमिनीचा अद्यायावत ७/१२ उतारा',
      descriptionEnglish: 'Updated 7/12 extract of the concerned land',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      projectId: '',
      name: 'Identity Proof',
      nameMarathi: 'ओळखपत्र',
      nameHindi: 'पहचान प्रमाण',
      nameEnglish: 'Identity Proof',
      isRequired: true,
      order: 2,
      description: 'Ration Card/Voter ID/Aadhaar Card, PAN Card, Driving License etc.',
      descriptionMarathi: 'रेशन कार्ड/निवडणूक ओळखपत्र/आधारकार्ड, पॅनकार्ड, ड्रायव्हींग लायसन्स इ.',
      descriptionHindi: 'राशन कार्ड/मतदान आईडी/आधार कार्ड, पैन कार्ड, ड्राइविंग लाइसेंस आदि',
      descriptionEnglish: 'Ration Card/Voter ID/Aadhaar Card, PAN Card, Driving License etc.',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      projectId: '',
      name: 'Bank Passbook',
      nameMarathi: 'बँक पासबुक',
      nameHindi: 'बैंक पासबुक',
      nameEnglish: 'Bank Passbook',
      isRequired: true,
      order: 3,
      description: 'Original and photocopy of nationalized bank passbook',
      descriptionMarathi: 'राष्ट्रीयकृत बँक पासबुक मूळ प्रत व छायांकित प्रत',
      descriptionHindi: 'राष्ट्रीयकृत बैंक पासबुक की मूल प्रति और फोटोकॉपी',
      descriptionEnglish: 'Original and photocopy of nationalized bank passbook',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      projectId: '',
      name: 'Photographs',
      nameMarathi: 'फोटो',
      nameHindi: 'फोटो',
      nameEnglish: 'Photographs',
      isRequired: true,
      order: 4,
      description: 'Two photographs each',
      descriptionMarathi: 'प्रत्येकी दोन फोटो',
      descriptionHindi: 'प्रत्येक के दो फोटो',
      descriptionEnglish: 'Two photographs each',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '5',
      projectId: '',
      name: 'Power of Attorney',
      nameMarathi: 'कुळमुखत्यारपत्र',
      nameHindi: 'वकीलनामा',
      nameEnglish: 'Power of Attorney',
      isRequired: false,
      order: 5,
      description: 'If receiving consolidated compensation in sole name',
      descriptionMarathi: 'ज्या खातेदारांना नुकसान भरपाई ची एकत्रित रक्कम एकट्याचे नांवे घेण्याची आहे',
      descriptionHindi: 'यदि एकमात्र नाम में समेकित मुआवजा प्राप्त कर रहे हैं',
      descriptionEnglish: 'If receiving consolidated compensation in sole name',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '6',
      projectId: '',
      name: 'Consent Letter',
      nameMarathi: 'संमतीपत्र',
      nameHindi: 'सहमति पत्र',
      nameEnglish: 'Consent Letter',
      isRequired: false,
      order: 6,
      description: 'If receiving compensation on behalf of other account holders',
      descriptionMarathi: 'ज्या खातेदाराला इतर खातेदारांच्या वतीने नुकसान भरपाईची रक्कम स्विकारावयाची आहे',
      descriptionHindi: 'यदि अन्य खाताधारकों की ओर से मुआवजा प्राप्त कर रहे हैं',
      descriptionEnglish: 'If receiving compensation on behalf of other account holders',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '7',
      projectId: '',
      name: 'Heirship Proof',
      nameMarathi: 'वारस हक्काचा पुरावा',
      nameHindi: 'उत्तराधिकार प्रमाण',
      nameEnglish: 'Heirship Proof',
      isRequired: false,
      order: 7,
      description: 'If the account holder is deceased',
      descriptionMarathi: 'खातेदार मयत असल्याने वारस हक्काचा पुरावा',
      descriptionHindi: 'यदि खाताधारक मृत है',
      descriptionEnglish: 'If the account holder is deceased',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '8',
      projectId: '',
      name: 'Guardian Certificate',
      nameMarathi: 'पालन पोषण दाखला',
      nameHindi: 'अभिभावक प्रमाणपत्र',
      nameEnglish: 'Guardian Certificate',
      isRequired: false,
      order: 8,
      description: 'If the account holder is below 18 years',
      descriptionMarathi: 'सदर खातेदार १८ वर्षाआतील असल्यास, पालन पोषण करणा-याचे नाव',
      descriptionHindi: 'यदि खाताधारक १८ वर्ष से कमजोर है',
      descriptionEnglish: 'If the account holder is below 18 years',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '9',
      projectId: '',
      name: 'Non-Agricultural Order',
      nameMarathi: 'बिनशेती आदेश',
      nameHindi: 'गैर-कृषि आदेश',
      nameEnglish: 'Non-Agricultural Order',
      isRequired: false,
      order: 9,
      description: 'For non-agricultural plot holders',
      descriptionMarathi: 'बिनशेती प्लॉटधारकांनी बिनशेती आदेश व मंजुरी नकाशा',
      descriptionHindi: 'गैर-कृषि प्लॉट धारकों के लिए',
      descriptionEnglish: 'For non-agricultural plot holders',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '10',
      projectId: '',
      name: 'Approved Map',
      nameMarathi: 'मंजुरी नकाशा',
      nameHindi: 'अनुमोदित नक्शा',
      nameEnglish: 'Approved Map',
      isRequired: false,
      order: 10,
      description: 'For non-agricultural plot holders',
      descriptionMarathi: 'बिनशेती प्लॉटधारकांनी बिनशेती आदेश व मंजुरी नकाशा',
      descriptionHindi: 'गैर-कृषि प्लॉट धारकों के लिए',
      descriptionEnglish: 'For non-agricultural plot holders',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '11',
      projectId: '',
      name: 'Land Vesting Declaration',
      nameMarathi: 'जमिन संपादित घोषणा',
      nameHindi: 'भूमि अधिग्रहण घोषणा',
      nameEnglish: 'Land Vesting Declaration',
      isRequired: true,
      order: 11,
      description: 'Declaration that land will vest with acquiring body after compensation',
      descriptionMarathi: 'जमिन ३८ नुसार नुकसान भरपाई स्विकारल्यावर तात्काळ जमिन संपादित संस्थेच्या नियत होईल',
      descriptionHindi: 'मुआवजा के बाद भूमि अधिग्रहण संस्था के पास जाएगी',
      descriptionEnglish: 'Declaration that land will vest with acquiring body after compensation',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '12',
      projectId: '',
      name: 'Site Verification Report',
      nameMarathi: 'स्थळ तपासणी अहवाल',
      nameHindi: 'स्थल जांच रिपोर्ट',
      nameEnglish: 'Site Verification Report',
      isRequired: true,
      order: 12,
      description: 'Physical verification report with photos and measurements',
      descriptionMarathi: 'फोटो आणि मोजमापांसह भौतिक तपासणी अहवाल',
      descriptionHindi: 'फोटो और मापन के साथ भौतिक जांच रिपोर्ट',
      descriptionEnglish: 'Physical verification report with photos and measurements',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Demo assigned records
  const demoAssignedRecords: EnhancedLandownerRecord[] = [
    {
      id: 'record-1',
      projectId: 'project-1',
      surveyNumber: '40',
      landownerName: 'कमळी कमळाकर मंडळ',
      area: 0.1850,
      acquiredArea: 0.0504,
      rate: 53100000,
      compensationAmount: 4010513,
      solatium: 4010513,
      finalAmount: 8021026,
      village: 'उंबरपाडा नंदाडे',
      taluka: 'पालघर',
      district: 'पालघर',
      noticeStatus: 'issued',
      noticeNumber: 'NOTICE-2024-001',
      noticeDate: new Date('2024-01-15'),
      assignedAgent: agentId,
      assignedAt: new Date('2024-01-16'),
      documentsRequired: 12,
      documentsUploaded: 8,
      documentsVerified: 6,
      kycStatus: 'in_progress',
      paymentStatus: 'pending',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-16'),
      createdBy: 'officer',
      updatedBy: 'agent'
    },
    {
      id: 'record-2',
      projectId: 'project-1',
      surveyNumber: '41',
      landownerName: 'राम शामराव पाटील',
      area: 0.2000,
      acquiredArea: 0.0600,
      rate: 53100000,
      compensationAmount: 4600000,
      solatium: 4600000,
      finalAmount: 9200000,
      village: 'उंबरपाडा नंदाडे',
      taluka: 'पालघर',
      district: 'पालघर',
      noticeStatus: 'issued',
      noticeNumber: 'NOTICE-2024-002',
      noticeDate: new Date('2024-01-15'),
      assignedAgent: agentId,
      assignedAt: new Date('2024-01-16'),
      documentsRequired: 12,
      documentsUploaded: 12,
      documentsVerified: 12,
      kycStatus: 'completed',
      paymentStatus: 'pending',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-16'),
      createdBy: 'officer',
      updatedBy: 'agent'
    }
  ];

  useEffect(() => {
    // Load assigned records for this agent
    setAssignedRecords(demoAssignedRecords);
    setRequiredDocuments(demoRequiredDocuments);
  }, [agentId]);

  // Get localized text
  const getLocalizedText = (texts: { marathi: string; hindi: string; english: string }) => {
    return texts[currentLanguage] || texts.english;
  };

  // Handle document upload
  const handleDocumentUpload = async (documentTypeId: string, file: File) => {
    if (!selectedRecord) {
      toast.error('Please select a landowner record first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 20) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const newDocument: UploadedDocument = {
        id: Date.now().toString(),
        landownerId: selectedRecord,
        documentTypeId,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size,
        uploadedAt: new Date(),
        uploadedBy: agentId,
        verified: false,
        status: 'pending'
      };

      setUploadedDocuments(prev => [...prev, newDocument]);

      // Update record document count
      setAssignedRecords(prev => prev.map(record => 
        record.id === selectedRecord 
          ? { ...record, documentsUploaded: record.documentsUploaded + 1 }
          : record
      ));

      toast.success('Document uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload document');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle document verification
  const handleDocumentVerification = (documentId: string, verified: boolean, notes?: string) => {
    setUploadedDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { 
            ...doc, 
            verified, 
            verifiedAt: new Date(), 
            verifiedBy: agentId,
            verificationNotes: notes,
            status: verified ? 'approved' : 'rejected'
          }
        : doc
    ));

    // Update record verification count
    const document = uploadedDocuments.find(d => d.id === documentId);
    if (document) {
      setAssignedRecords(prev => prev.map(record => 
        record.id === document.landownerId 
          ? { ...record, documentsVerified: record.documentsVerified + 1 }
          : record
      ));
    }

    toast.success(`Document ${verified ? 'approved' : 'rejected'} successfully`);
  };

  // Complete KYC verification
  const completeKYCVerification = () => {
    if (!selectedRecord) {
      toast.error('Please select a landowner record');
      return;
    }

    const record = assignedRecords.find(r => r.id === selectedRecord);
    if (!record) {
      toast.error('Record not found');
      return;
    }

    // Check if all required documents are uploaded and verified
    const requiredDocs = requiredDocuments.filter(d => d.isRequired);
    const uploadedDocs = uploadedDocuments.filter(d => d.landownerId === selectedRecord);
    const verifiedDocs = uploadedDocs.filter(d => d.verified);

    if (verifiedDocs.length < requiredDocs.length) {
      toast.error('Please upload and verify all required documents');
      return;
    }

    // Update record KYC status
    setAssignedRecords(prev => prev.map(record => 
      record.id === selectedRecord 
        ? { 
            ...record, 
            kycStatus: 'completed',
            kycCompletedAt: new Date()
          }
        : record
    ));

    toast.success('KYC verification completed successfully');
    setIsVerificationComplete(true);
  };

  // Preview document
  const previewDocument = (document: UploadedDocument) => {
    setPreviewDocument(document.fileUrl);
    setIsPreviewOpen(true);
  };

  // Get documents for selected record
  const getDocumentsForRecord = (recordId: string) => {
    return uploadedDocuments.filter(d => d.landownerId === recordId);
  };

  // Get document type name
  const getDocumentTypeName = (documentTypeId: string) => {
    const docType = requiredDocuments.find(d => d.id === documentTypeId);
    return docType ? getLocalizedText({
      marathi: docType.nameMarathi,
      hindi: docType.nameHindi,
      english: docType.nameEnglish
    }) : 'Unknown Document';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Agent Document Upload Portal
          </CardTitle>
          <CardDescription>
            Upload and verify documents for land acquisition notices
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Language Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            {['marathi', 'hindi', 'english'].map(lang => (
              <Button
                key={lang}
                variant={currentLanguage === lang ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentLanguage(lang as any)}
              >
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="assigned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assigned">Assigned Records</TabsTrigger>
          <TabsTrigger value="upload">Document Upload</TabsTrigger>
          <TabsTrigger value="verification">KYC Verification</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Assigned Records Tab */}
        <TabsContent value="assigned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Landowner Records</CardTitle>
              <CardDescription>
                Records assigned to you for document collection and verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Survey No</TableHead>
                    <TableHead>Owner Name</TableHead>
                    <TableHead>Village</TableHead>
                    <TableHead>Notice Status</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.surveyNumber}</TableCell>
                      <TableCell>{record.landownerName}</TableCell>
                      <TableCell>{record.village}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-green-600">
                          {record.noticeStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {record.documentsUploaded}/{record.documentsRequired}
                          </span>
                          <Progress 
                            value={(record.documentsUploaded / record.documentsRequired) * 100} 
                            className="w-16 h-2"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            record.kycStatus === 'completed' ? 'default' : 
                            record.kycStatus === 'in_progress' ? 'secondary' : 'outline'
                          }
                        >
                          {record.kycStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRecord(record.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Upload</CardTitle>
              <CardDescription>
                Upload required documents for the selected landowner
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Record Selection */}
              <div className="space-y-2">
                <Label>Select Landowner Record</Label>
                <Select value={selectedRecord} onValueChange={setSelectedRecord}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a landowner record" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedRecords.map(record => (
                      <SelectItem key={record.id} value={record.id}>
                        {record.surveyNumber} - {record.landownerName} ({record.village})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRecord && (
                <>
                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <Label>Uploading Document...</Label>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}

                  {/* Document Upload Section */}
                  <div className="space-y-4">
                    <Label>Upload Required Documents</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {requiredDocuments.map((docType) => (
                        <Card key={docType.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">
                                  {getLocalizedText({
                                    marathi: docType.nameMarathi,
                                    hindi: docType.nameHindi,
                                    english: docType.nameEnglish
                                  })}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {getLocalizedText({
                                    marathi: docType.descriptionMarathi || '',
                                    hindi: docType.descriptionHindi || '',
                                    english: docType.descriptionEnglish || ''
                                  })}
                                </p>
                              </div>
                              {docType.isRequired && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleDocumentUpload(docType.id, file);
                                  }
                                }}
                                className="text-sm"
                              />
                              
                              {/* Show uploaded document if exists */}
                              {uploadedDocuments
                                .filter(d => d.landownerId === selectedRecord && d.documentTypeId === docType.id)
                                .map(doc => (
                                  <div key={doc.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                    <FileImage className="h-4 w-4 text-green-600" />
                                    <span className="text-sm flex-1">{doc.fileName}</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => previewDocument(doc)}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* KYC Verification Tab */}
        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>KYC Verification</CardTitle>
              <CardDescription>
                Verify uploaded documents and complete KYC process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedRecord ? (
                <>
                  {/* Document Verification List */}
                  <div className="space-y-4">
                    <Label>Verify Uploaded Documents</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document Type</TableHead>
                          <TableHead>File Name</TableHead>
                          <TableHead>Upload Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getDocumentsForRecord(selectedRecord).map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">
                              {getDocumentTypeName(doc.documentTypeId)}
                            </TableCell>
                            <TableCell>{doc.fileName}</TableCell>
                            <TableCell>{doc.uploadedAt.toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  doc.status === 'approved' ? 'default' : 
                                  doc.status === 'rejected' ? 'destructive' : 'secondary'
                                }
                              >
                                {doc.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => previewDocument(doc)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDocumentVerification(doc.id, true)}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDocumentVerification(doc.id, false)}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Verification Notes */}
                  <div className="space-y-2">
                    <Label>Verification Notes</Label>
                    <Textarea
                      placeholder="Add any notes about the verification process..."
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Complete KYC Button */}
                  <Button 
                    onClick={completeKYCVerification}
                    disabled={!selectedRecord}
                    className="w-full"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Complete KYC Verification
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Please select a landowner record to verify documents</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verification Reports</CardTitle>
              <CardDescription>
                View progress and generate reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Completed KYC</p>
                      <p className="text-2xl font-bold">
                        {assignedRecords.filter(r => r.kycStatus === 'completed').length}
                      </p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-gray-600">In Progress</p>
                      <p className="text-2xl font-bold">
                        {assignedRecords.filter(r => r.kycStatus === 'in_progress').length}
                      </p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <Square className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="text-2xl font-bold">
                        {assignedRecords.filter(r => r.kycStatus === 'pending').length}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Document Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
            <DialogDescription>
              Preview uploaded document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <img src={previewDocument} alt="Document preview" className="w-full" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => {
                const a = document.createElement('a');
                a.href = previewDocument;
                a.download = 'document-preview';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentDocumentUpload; 