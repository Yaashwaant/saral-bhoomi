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
import { FileText, Eye, Download, CheckCircle, AlertCircle, RefreshCw, Printer, Banknote } from 'lucide-react';
import { config } from '../../../config';

interface PaymentRecord {
  id?: string;
  survey_number: string;
  project_id: string;
  officer_id: string;
  notice_id: string;
  payment_type: string;
  payment_date: string;
  payment_number: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  failure_reason: string;
  remarks: string;
  blockchain_verified: boolean;
}

const EnhancedPaymentManager: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useSaral();
  
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('form');
  
  const [paymentForm, setPaymentForm] = useState<PaymentRecord>({
    survey_number: '',
    project_id: '',
    officer_id: '',
    notice_id: '',
    payment_type: 'compensation',
    payment_date: new Date().toISOString().slice(0, 10),
    payment_number: '',
    amount: 0,
    payment_method: 'rtgs',
    payment_status: 'pending',
    failure_reason: '',
    remarks: '',
    blockchain_verified: false
  });

  const API_BASE_URL = config.API_BASE_URL;

  useEffect(() => {
    if (selectedProject) {
      loadPaymentRecords();
    }
  }, [selectedProject]);

  const loadPaymentRecords = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${selectedProject}`);
      if (response.ok) {
        const data = await response.json();
        setPaymentRecords(data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load payment records');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject || !paymentForm.survey_number || !paymentForm.payment_number || !paymentForm.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        ...paymentForm,
        project_id: selectedProject,
        officer_id: user?.id || ''
      };

      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      if (response.ok) {
        toast.success('Payment record created successfully');
        setPaymentForm({
          survey_number: '',
          project_id: '',
          officer_id: '',
          notice_id: '',
          payment_type: 'compensation',
          payment_date: new Date().toISOString().slice(0, 10),
          payment_number: '',
          amount: 0,
          payment_method: 'rtgs',
          payment_status: 'pending',
          failure_reason: '',
          remarks: '',
          blockchain_verified: false
        });
        loadPaymentRecords();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create payment record');
      }
    } catch (error) {
      toast.error('Failed to create payment record');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['survey_number', 'payment_type', 'payment_date', 'payment_number', 'amount', 'payment_method', 'payment_status', 'remarks'];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payment_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const projectOptions = projects.map(p => ({ 
    id: p.id, 
    name: (p as any).projectName || (p as any).name || p.id 
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Enhanced Payment Management
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="survey_number">Survey Number *</Label>
                        <Input
                          id="survey_number"
                          value={paymentForm.survey_number}
                          onChange={(e) => setPaymentForm({ ...paymentForm, survey_number: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment_number">Payment Number *</Label>
                        <Input
                          id="payment_number"
                          value={paymentForm.payment_number}
                          onChange={(e) => setPaymentForm({ ...paymentForm, payment_number: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment_date">Payment Date</Label>
                        <Input
                          id="payment_date"
                          type="date"
                          value={paymentForm.payment_date}
                          onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment_type">Payment Type</Label>
                        <Select value={paymentForm.payment_type} onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compensation">Compensation</SelectItem>
                            <SelectItem value="solatium">Solatium</SelectItem>
                            <SelectItem value="interest">Interest</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (₹) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment_method">Payment Method</Label>
                        <Select value={paymentForm.payment_method} onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_method: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rtgs">RTGS</SelectItem>
                            <SelectItem value="neft">NEFT</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment_status">Payment Status</Label>
                        <Select value={paymentForm.payment_status} onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="initiated">Initiated</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="reversed">Reversed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Textarea
                          id="remarks"
                          value={paymentForm.remarks}
                          onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                          placeholder="Additional notes or observations..."
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Creating...' : 'Create Payment Record'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="csv" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>CSV Upload for Payment Records</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Button variant="outline" onClick={downloadTemplate}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                      <div className="text-sm text-gray-600">
                        Upload CSV file with payment records for bulk processing
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="csv-upload">Select CSV File</Label>
                      <Input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      />
                    </div>

                    {csvFile && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{csvFile.name}</span>
                          <Badge variant="secondary">{csvFile.size} bytes</Badge>
                        </div>
                        
                        <Button disabled={loading} className="w-full">
                          {loading ? 'Uploading...' : 'Upload CSV'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Payment Records Table */}
          {selectedProject && paymentRecords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Payment Records ({paymentRecords.length})</span>
                  <Button onClick={loadPaymentRecords} variant="outline" size="sm">
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
                      <TableHead>Payment No.</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Blockchain</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.survey_number}</TableCell>
                        <TableCell>{record.payment_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {record.payment_type}
                          </Badge>
                        </TableCell>
                        <TableCell>₹{record.amount.toLocaleString()}</TableCell>
                        <TableCell className="uppercase">{record.payment_method}</TableCell>
                        <TableCell>
                          <Badge variant={
                            record.payment_status === 'completed' ? 'default' : 
                            record.payment_status === 'initiated' ? 'secondary' : 
                            record.payment_status === 'failed' ? 'destructive' : 'outline'
                          }>
                            {record.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(record.payment_date).toLocaleDateString()}</TableCell>
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
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
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
                Please select a project to start managing payment records.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedPaymentManager;
