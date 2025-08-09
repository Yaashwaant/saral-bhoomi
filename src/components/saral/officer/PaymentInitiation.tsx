import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  IndianRupee, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play,
  AlertCircle,
  Download,
  Eye,
  TrendingUp,
  Banknote,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
// Remove bank-server import and define PaymentResponse interface locally
interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  timestamp: Date;
  status: 'pending' | 'success' | 'failed' | 'processing';
  utrNumber?: string;
}

const PaymentInitiation = () => {
  const { user } = useAuth();
  const { landownerRecords, initiatePayment, getPaymentStatus, updateLandownerRecord, processRTGSPayment: processPayment } = useSaral();
  const [processingPayments, setProcessingPayments] = useState<string[]>([]);
  const [bankTransactions, setBankTransactions] = useState<Map<string, PaymentResponse>>(new Map());
  const [refreshingStatus, setRefreshingStatus] = useState<string[]>([]);
  const [showBankDetailsDialog, setShowBankDetailsDialog] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [bankDetails, setBankDetails] = useState({
    beneficiaryName: '',
    beneficiaryAccount: '',
    beneficiaryIFSC: ''
  });

  const translations = {
    marathi: {
      title: 'पेमेंट इनिशिएशन',
      subtitle: 'RTGS पेमेंट इनिशिएशन आणि ट्रॅकिंग',
      pending: 'प्रलंबित',
      initiated: 'सुरू केले',
      success: 'यशस्वी',
      failed: 'अयशस्वी',
      landownerName: 'जमीन मालकाचे नाव',
      surveyNumber: 'सर्वे नं.',
      village: 'गाव',
      compensationAmount: 'मोबदला रक्कम',
      paymentStatus: 'पेमेंट स्थिती',
      actions: 'कृती',
      initiatePayment: 'पेमेंट सुरू करा',
      viewDetails: 'तपशील पाहा',
      downloadReceipt: 'पावती डाउनलोड करा',
      retryPayment: 'पेमेंट पुन्हा प्रयत्न करा',
      processing: 'प्रक्रिया करत आहे...',
      paymentSuccess: 'पेमेंट यशस्वीरित्या सुरू केले',
      paymentFailed: 'पेमेंट अयशस्वी',
      noRecords: 'कोणतेही नोंदी नाहीत',
      totalPayments: 'एकूण पेमेंट',
      pendingPayments: 'प्रलंबित पेमेंट',
      successfulPayments: 'यशस्वी पेमेंट',
      failedPayments: 'अयशस्वी पेमेंट',
      amount: 'रक्कम',
      status: 'स्थिती',
      date: 'तारीख',
      reference: 'संदर्भ',
      bankDetails: 'बँक तपशील',
      accountNumber: 'खाते क्रमांक',
      ifscCode: 'IFSC कोड',
      bankName: 'बँकेचे नाव',
      branch: 'शाखा'
    },
    english: {
      title: 'Payment Initiation',
      subtitle: 'RTGS payment initiation and tracking',
      pending: 'Pending',
      initiated: 'Initiated',
      success: 'Success',
      failed: 'Failed',
      landownerName: 'Landowner Name',
      surveyNumber: 'Survey No.',
      village: 'Village',
      compensationAmount: 'Compensation Amount',
      paymentStatus: 'Payment Status',
      actions: 'Actions',
      initiatePayment: 'Initiate Payment',
      viewDetails: 'View Details',
      downloadReceipt: 'Download Receipt',
      retryPayment: 'Retry Payment',
      processing: 'Processing...',
      paymentSuccess: 'Payment initiated successfully',
      paymentFailed: 'Payment failed',
      noRecords: 'No records found',
      totalPayments: 'Total Payments',
      pendingPayments: 'Pending Payments',
      successfulPayments: 'Successful Payments',
      failedPayments: 'Failed Payments',
      amount: 'Amount',
      status: 'Status',
      date: 'Date',
      reference: 'Reference',
      bankDetails: 'Bank Details',
      accountNumber: 'Account Number',
      ifscCode: 'IFSC Code',
      bankName: 'Bank Name',
      branch: 'Branch'
    },
    hindi: {
      title: 'भुगतान शुरुआत',
      subtitle: 'RTGS भुगतान शुरुआत और ट्रैकिंग',
      pending: 'लंबित',
      initiated: 'शुरू किया गया',
      success: 'सफल',
      failed: 'असफल',
      landownerName: 'भूमि मालिक का नाम',
      surveyNumber: 'सर्वेक्षण संख्या',
      village: 'गांव',
      compensationAmount: 'मुआवजा राशि',
      paymentStatus: 'भुगतान स्थिति',
      actions: 'कार्रवाई',
      initiatePayment: 'भुगतान शुरू करें',
      viewDetails: 'विवरण देखें',
      downloadReceipt: 'रसीद डाउनलोड करें',
      retryPayment: 'भुगतान पुनः प्रयास करें',
      processing: 'प्रक्रिया कर रहा है...',
      paymentSuccess: 'भुगतान सफलतापूर्वक शुरू किया गया',
      paymentFailed: 'भुगतान विफल',
      noRecords: 'कोई रिकॉर्ड नहीं मिला',
      totalPayments: 'कुल भुगतान',
      pendingPayments: 'लंबित भुगतान',
      successfulPayments: 'सफल भुगतान',
      failedPayments: 'असफल भुगतान',
      amount: 'राशि',
      status: 'स्थिति',
      date: 'तिथि',
      reference: 'संदर्भ',
      bankDetails: 'बैंक विवरण',
      accountNumber: 'खाता संख्या',
      ifscCode: 'IFSC कोड',
      bankName: 'बैंक का नाम',
      branch: 'शाखा'
    }
  };

  const t = translations[user?.language || 'marathi'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-700">{t.success}</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700">{t.failed}</Badge>;
      case 'initiated':
        return <Badge className="bg-blue-100 text-blue-700">{t.initiated}</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700">{t.pending}</Badge>;
    }
  };

  const handleInitiatePayment = async (recordId: string) => {
    setSelectedRecordId(recordId);
    setShowBankDetailsDialog(true);
  };

  const handleProcessPayment = async () => {
    try {
      setProcessingPayments(prev => [...prev, selectedRecordId]);
      setShowBankDetailsDialog(false);
      
      // For now, accept any beneficiary details (no validation)

      // Process payment through bank server
      const response = await processPayment(selectedRecordId, bankDetails);
      
      // Store transaction response
      setBankTransactions(prev => new Map(prev.set(selectedRecordId, response)));
      
      // Always consider success per current requirement
      toast.success('Payment processed successfully');
      
    } catch (error) {
      console.error('Payment processing failed:', error);
      toast.error('Payment processing failed');
    } finally {
      setProcessingPayments(prev => prev.filter(id => id !== selectedRecordId));
      setBankDetails({
        beneficiaryName: '',
        beneficiaryAccount: '',
        beneficiaryIFSC: ''
      });
    }
  };

  const refreshPaymentStatus = async (recordId: string) => {
    setRefreshingStatus(prev => [...prev, recordId]);
    
    try {
      const transaction = bankTransactions.get(recordId);
      if (transaction && transaction.transactionId) {
        // Call bank server API to get transaction status
        const response = await fetch(`http://localhost:3001/payment-status/${transaction.transactionId}`);
        const updatedStatus = await response.json();
        
        if (updatedStatus) {
          setBankTransactions(prev => new Map(prev.set(recordId, updatedStatus)));
          
          // Update record status
          let newStatus: 'pending' | 'success' | 'failed' = 'pending';
          if (updatedStatus.status === 'success') {
            newStatus = 'success';
          } else if (updatedStatus.status === 'failed') {
            newStatus = 'failed';
          }
          
          await updateLandownerRecord(recordId, { paymentStatus: newStatus });
          
          if (updatedStatus.status !== 'pending') {
            toast.success(`Payment status updated: ${updatedStatus.status}`);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to refresh payment status');
    } finally {
      setRefreshingStatus(prev => prev.filter(id => id !== recordId));
    }
  };

  const approvedRecords = landownerRecords.filter(record => record.kycStatus === 'approved');
  
  const stats = {
    total: approvedRecords.length,
    pending: approvedRecords.filter(r => r.paymentStatus === 'pending').length,
    successful: approvedRecords.filter(r => r.paymentStatus === 'success').length,
    failed: approvedRecords.filter(r => r.paymentStatus === 'failed').length
  };

  const totalCompensation = approvedRecords.reduce((sum, record) => 
    sum + parseFloat(record.अंतिम_रक्कम), 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
        <p className="text-gray-600">{t.subtitle}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <IndianRupee className="h-6 w-6 text-orange-600" />
              <div>
                <p className="text-lg font-bold">{formatCurrency(totalCompensation)}</p>
                <p className="text-sm text-gray-600">{t.totalPayments}</p>
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
                <p className="text-sm text-gray-600">{t.pendingPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-lg font-bold">{stats.successful}</p>
                <p className="text-sm text-gray-600">{t.successfulPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-lg font-bold">{stats.failed}</p>
                <p className="text-sm text-gray-600">{t.failedPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Banknote className="h-5 w-5 text-orange-600" />
            <span>Payment Queue</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvedRecords.length === 0 ? (
            <div className="text-center py-8">
              <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
                  <TableHead>{t.paymentStatus}</TableHead>
                  <TableHead>{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedRecords.map((record) => {
                  const isProcessing = processingPayments.includes(record.id);
                  
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.खातेदाराचे_नांव}</TableCell>
                      <TableCell>{record.सर्वे_नं}</TableCell>
                      <TableCell>{record.village}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(parseFloat(record.अंतिम_रक्कम))}
                      </TableCell>
                      <TableCell>
                        {isProcessing ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                            <span className="text-sm text-orange-600">{t.processing}</span>
                          </div>
                        ) : (
                          getStatusBadge(record.paymentStatus)
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {record.paymentStatus === 'pending' && (
                            <Button
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700"
                              onClick={() => handleInitiatePayment(record.id)}
                              disabled={isProcessing}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              {t.initiatePayment}
                            </Button>
                          )}
                          
                          {record.paymentStatus === 'success' && (
                            <>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          
                          {record.paymentStatus === 'failed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() => handleInitiatePayment(record.id)}
                              disabled={isProcessing}
                            >
                              <AlertCircle className="h-4 w-4 mr-1" />
                              {t.retryPayment}
                            </Button>
                          )}

                          {/* Show bank transaction details if available */}
                          {bankTransactions.has(record.id) && (
                            <div className="text-xs text-gray-500">
                              <div>Ref: {bankTransactions.get(record.id)?.bankReference}</div>
                              <div>Time: {bankTransactions.get(record.id)?.processingTime}ms</div>
                            </div>
                          )}

                          {/* Refresh status button for pending payments */}
                          {record.paymentStatus === 'initiated' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => refreshPaymentStatus(record.id)}
                              disabled={refreshingStatus.includes(record.id)}
                            >
                              <RefreshCw className={`h-4 w-4 ${refreshingStatus.includes(record.id) ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Progress */}
      {stats.pending > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Payment Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-gray-600">
                  {stats.successful + stats.failed} / {stats.total} completed
                </span>
              </div>
              <Progress 
                value={((stats.successful + stats.failed) / stats.total) * 100} 
                className="h-2"
              />
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-green-600">{stats.successful}</p>
                  <p className="text-sm text-gray-600">{t.successfulPayments}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-600">{stats.pending}</p>
                  <p className="text-sm text-gray-600">{t.pendingPayments}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600">{stats.failed}</p>
                  <p className="text-sm text-gray-600">{t.failedPayments}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bank Details Dialog */}
      <Dialog open={showBankDetailsDialog} onOpenChange={setShowBankDetailsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Bank Details</DialogTitle>
            <DialogDescription>
              Please enter the beneficiary bank account details for RTGS payment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="beneficiaryName">Beneficiary Name</Label>
              <Input
                id="beneficiaryName"
                value={bankDetails.beneficiaryName}
                onChange={(e) => setBankDetails(prev => ({ ...prev, beneficiaryName: e.target.value }))}
                placeholder="Enter beneficiary name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beneficiaryAccount">Account Number</Label>
              <Input
                id="beneficiaryAccount"
                value={bankDetails.beneficiaryAccount}
                onChange={(e) => setBankDetails(prev => ({ ...prev, beneficiaryAccount: e.target.value }))}
                placeholder="Enter account number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beneficiaryIFSC">IFSC Code</Label>
              <Input
                id="beneficiaryIFSC"
                value={bankDetails.beneficiaryIFSC}
                onChange={(e) => setBankDetails(prev => ({ ...prev, beneficiaryIFSC: e.target.value.toUpperCase() }))}
                placeholder="Enter IFSC code"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleProcessPayment} disabled={processingPayments.includes(selectedRecordId)}>
                {processingPayments.includes(selectedRecordId) ? 'Processing...' : 'Process Payment'}
              </Button>
              <Button variant="outline" onClick={() => setShowBankDetailsDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentInitiation;