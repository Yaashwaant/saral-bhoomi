import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock,
  FileText,
  AlertCircle,
  Download,
  UserCheck,
  UserX,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

const KYCApprovalQueue = () => {
  const { user } = useAuth();
  const { landownerRecords, approveKYC, rejectKYC } = useSaral();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const translations = {
    marathi: {
      title: 'KYC मंजुरी क्यू',
      subtitle: 'एजंटांनी भौतिकदृष्ट्या पडताळलेल्या दस्तऐवजांची मंजुरी',
      pending: 'प्रलंबित',
      approved: 'मंजूर',
      rejected: 'नाकारले',
      completed: 'पूर्ण',
      inProgress: 'प्रगतीत',
      landownerName: 'जमीन मालकाचे नाव',
      surveyNumber: 'सर्वे नं.',
      village: 'गाव',
      agent: 'एजंट',
      documents: 'दस्तऐवज',
      status: 'स्थिती',
      actions: 'कृती',
      viewDetails: 'तपशील पाहा',
      approve: 'मंजूर करा',
      reject: 'नाकारा',
      reason: 'कारण',
      requiredDocuments: 'आवश्यक दस्तऐवज',
      uploadedDocuments: 'अपलोड केलेले दस्तऐवज',
      aadhaar: 'आधार कार्ड',
      pan: 'PAN कार्ड',
      voterId: 'मतदार ओळखपत्र',
      extract712: '7/12 उतारा',
      powerOfAttorney: 'वकिली नामा',
      bankPassbook: 'बँक पासबुक',
      photo: 'फोटो',
      uploaded: 'अपलोड केले',
      notUploaded: 'अपलोड केले नाही',
      reviewDocuments: 'दस्तऐवजांची पुनरावलोकन',
      approvalSuccess: 'KYC यशस्वीरित्या मंजूर केले',
      rejectionSuccess: 'KYC यशस्वीरित्या नाकारले',
      noRecords: 'कोणतेही नोंदी नाहीत',
      totalRecords: 'एकूण नोंदी',
      pendingRecords: 'प्रलंबित नोंदी',
      approvedRecords: 'मंजूर नोंदी',
      rejectedRecords: 'नाकारलेल्या नोंदी',
      physicalVerification: 'भौतिक पडताळणी',
      agentVerified: 'एजंटाने पडताळले',
      recordKeeping: 'नोंद ठेवण्यासाठी'
    },
    english: {
      title: 'KYC Approval Queue',
      subtitle: 'Approval of documents physically verified by agents',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
      inProgress: 'In Progress',
      landownerName: 'Landowner Name',
      surveyNumber: 'Survey No.',
      village: 'Village',
      agent: 'Agent',
      documents: 'Documents',
      status: 'Status',
      actions: 'Actions',
      viewDetails: 'View Details',
      approve: 'Approve',
      reject: 'Reject',
      reason: 'Reason',
      requiredDocuments: 'Required Documents',
      uploadedDocuments: 'Uploaded Documents',
      aadhaar: 'Aadhaar Card',
      pan: 'PAN Card',
      voterId: 'Voter ID',
      extract712: '7/12 Extract',
      powerOfAttorney: 'Power of Attorney',
      bankPassbook: 'Bank Passbook',
      photo: 'Photo',
      uploaded: 'Uploaded',
      notUploaded: 'Not Uploaded',
      reviewDocuments: 'Review Documents',
      approvalSuccess: 'KYC approved successfully',
      rejectionSuccess: 'KYC rejected successfully',
      noRecords: 'No records found',
      totalRecords: 'Total Records',
      pendingRecords: 'Pending Records',
      approvedRecords: 'Approved Records',
      rejectedRecords: 'Rejected Records',
      physicalVerification: 'Physical Verification',
      agentVerified: 'Verified by Agent',
      recordKeeping: 'For Record Keeping'
    },
    hindi: {
      title: 'KYC अनुमोदन क्यू',
      subtitle: 'एजेंटों द्वारा भौतिक रूप से सत्यापित दस्तावेजों का अनुमोदन',
      pending: 'लंबित',
      approved: 'अनुमोदित',
      rejected: 'अस्वीकृत',
      completed: 'पूर्ण',
      inProgress: 'प्रगति में',
      landownerName: 'भूमि मालिक का नाम',
      surveyNumber: 'सर्वेक्षण संख्या',
      village: 'गांव',
      agent: 'एजेंट',
      documents: 'दस्तावेज',
      status: 'स्थिति',
      actions: 'कार्रवाई',
      viewDetails: 'विवरण देखें',
      approve: 'अनुमोदित करें',
      reject: 'अस्वीकार करें',
      reason: 'कारण',
      requiredDocuments: 'आवश्यक दस्तावेज',
      uploadedDocuments: 'अपलोड किए गए दस्तावेज',
      aadhaar: 'आधार कार्ड',
      pan: 'PAN कार्ड',
      voterId: 'मतदार पहचान पत्र',
      extract712: '7/12 निष्कर्ष',
      powerOfAttorney: 'वकील का अधिकार',
      bankPassbook: 'बैंक पासबुक',
      photo: 'फोटो',
      uploaded: 'अपलोड किया गया',
      notUploaded: 'अपलोड नहीं किया गया',
      reviewDocuments: 'दस्तावेजों की समीक्षा',
      approvalSuccess: 'KYC सफलतापूर्वक अनुमोदित',
      rejectionSuccess: 'KYC सफलतापूर्वक अस्वीकृत',
      noRecords: 'कोई रिकॉर्ड नहीं मिला',
      totalRecords: 'कुल रिकॉर्ड',
      pendingRecords: 'लंबित रिकॉर्ड',
      approvedRecords: 'अनुमोदित रिकॉर्ड',
      rejectedRecords: 'अस्वीकृत रिकॉर्ड',
      physicalVerification: 'भौतिक सत्यापन',
      agentVerified: 'एजेंट द्वारा सत्यापित',
      recordKeeping: 'रिकॉर्ड रखने के लिए'
    }
  };

  const t = translations[user?.language || 'marathi'];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700">{t.approved}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">{t.rejected}</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700">{t.completed}</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-700">{t.inProgress}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">{t.pending}</Badge>;
    }
  };

  const getDocumentStatus = (documentType: string, record: any) => {
    // Mock document status - in real app, check actual uploaded documents
    const mockDocuments = {
      '1': { aadhaar: true, pan: true, voterId: false, extract712: true, powerOfAttorney: false, bankPassbook: true, photo: true },
      '2': { aadhaar: true, pan: false, voterId: true, extract712: true, powerOfAttorney: true, bankPassbook: false, photo: true }
    };
    
    const documents = mockDocuments[record.id] || {};
    return documents[documentType] || false;
  };

  const getDocumentIcon = (uploaded: boolean) => {
    return uploaded ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-600" />
    );
  };

  const handleApprove = async (recordId: string) => {
    try {
      await approveKYC(recordId);
      toast.success(t.approvalSuccess);
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to approve KYC');
    }
  };

  const handleReject = async (recordId: string, reason: string) => {
    try {
      await rejectKYC(recordId, reason);
      toast.success(t.rejectionSuccess);
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to reject KYC');
    }
  };

  const filteredRecords = landownerRecords.filter(record => {
    switch (activeTab) {
      case 'pending':
        return record.kycStatus === 'completed';
      case 'approved':
        return record.kycStatus === 'approved';
      case 'rejected':
        return record.kycStatus === 'rejected';
      default:
        return true;
    }
  });

  const stats = {
    total: landownerRecords.length,
    pending: landownerRecords.filter(r => r.kycStatus === 'completed').length,
    approved: landownerRecords.filter(r => r.kycStatus === 'approved').length,
    rejected: landownerRecords.filter(r => r.kycStatus === 'rejected').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
        <p className="text-gray-600">{t.subtitle}</p>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              <strong>{t.physicalVerification}:</strong> {t.agentVerified} - {t.recordKeeping}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-orange-600" />
              <div>
                <p className="text-lg font-bold">{stats.total}</p>
                <p className="text-sm text-gray-600">{t.totalRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="text-lg font-bold">{stats.pending}</p>
                <p className="text-sm text-gray-600">{t.pendingRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-lg font-bold">{stats.approved}</p>
                <p className="text-sm text-gray-600">{t.approvedRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-lg font-bold">{stats.rejected}</p>
                <p className="text-sm text-gray-600">{t.rejectedRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KYC Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-orange-600" />
            <span>KYC {t.status}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
                {t.pending} ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="approved" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                {t.approved} ({stats.approved})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
                {t.rejected} ({stats.rejected})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t.noRecords}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.landownerName}</TableHead>
                      <TableHead>{t.surveyNumber}</TableHead>
                      <TableHead>{t.village}</TableHead>
                      <TableHead>{t.agent}</TableHead>
                      <TableHead>{t.documents}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      <TableHead>{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.खातेदाराचे_नांव}</TableCell>
                        <TableCell>{record.सर्वे_नं}</TableCell>
                        <TableCell>{record.village}</TableCell>
                        <TableCell>{record.assignedAgent || 'Not Assigned'}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {getDocumentIcon(getDocumentStatus('aadhaar', record))}
                            {getDocumentIcon(getDocumentStatus('pan', record))}
                            {getDocumentIcon(getDocumentStatus('extract712', record))}
                            {getDocumentIcon(getDocumentStatus('bankPassbook', record))}
                            {getDocumentIcon(getDocumentStatus('photo', record))}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(record.kycStatus)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRecord(record);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(record.id)}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() => handleReject(record.id, 'Incomplete documents')}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t.noRecords}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.landownerName}</TableHead>
                      <TableHead>{t.surveyNumber}</TableHead>
                      <TableHead>{t.village}</TableHead>
                      <TableHead>{t.agent}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      <TableHead>{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.खातेदाराचे_नांव}</TableCell>
                        <TableCell>{record.सर्वे_नं}</TableCell>
                        <TableCell>{record.village}</TableCell>
                        <TableCell>{record.assignedAgent || 'Not Assigned'}</TableCell>
                        <TableCell>{getStatusBadge(record.kycStatus)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-8">
                  <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t.noRecords}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.landownerName}</TableHead>
                      <TableHead>{t.surveyNumber}</TableHead>
                      <TableHead>{t.village}</TableHead>
                      <TableHead>{t.agent}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      <TableHead>{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.खातेदाराचे_नांव}</TableCell>
                        <TableCell>{record.सर्वे_नं}</TableCell>
                        <TableCell>{record.village}</TableCell>
                        <TableCell>{record.assignedAgent || 'Not Assigned'}</TableCell>
                        <TableCell>{getStatusBadge(record.kycStatus)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Document Review Dialog */}
      {selectedRecord && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-orange-600" />
                <span>{t.reviewDocuments}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">{selectedRecord.खातेदाराचे_नांव}</h3>
                <p className="text-sm text-gray-600">Survey No: {selectedRecord.सर्वे_नं}</p>
                <p className="text-sm text-gray-600">Village: {selectedRecord.village}</p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">{t.physicalVerification}</span>
                </div>
                <p className="text-sm text-blue-700">
                  {t.agentVerified} - {t.recordKeeping}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">{t.requiredDocuments}</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    {getDocumentIcon(getDocumentStatus('aadhaar', selectedRecord))}
                    <span className="text-sm">{t.aadhaar}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getDocumentIcon(getDocumentStatus('pan', selectedRecord))}
                    <span className="text-sm">{t.pan}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getDocumentIcon(getDocumentStatus('voterId', selectedRecord))}
                    <span className="text-sm">{t.voterId}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getDocumentIcon(getDocumentStatus('extract712', selectedRecord))}
                    <span className="text-sm">{t.extract712}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getDocumentIcon(getDocumentStatus('powerOfAttorney', selectedRecord))}
                    <span className="text-sm">{t.powerOfAttorney}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getDocumentIcon(getDocumentStatus('bankPassbook', selectedRecord))}
                    <span className="text-sm">{t.bankPassbook}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getDocumentIcon(getDocumentStatus('photo', selectedRecord))}
                    <span className="text-sm">{t.photo}</span>
                  </div>
                </div>
              </div>

              {selectedRecord.kycStatus === 'completed' && (
                <div className="flex space-x-2">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(selectedRecord.id)}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    {t.approve}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => handleReject(selectedRecord.id, 'Incomplete documents')}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    {t.reject}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default KYCApprovalQueue;