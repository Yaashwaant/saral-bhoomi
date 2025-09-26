import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  FileText, 
  Download, 
  Printer, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  IndianRupee,
  MapPin,
  User,
  Building2,
  Banknote,
  Calendar,
  Hash,
  RefreshCw
} from 'lucide-react';
import { config } from '../../../config';

interface PaymentSlip {
  slip_number: string;
  generated_date: string;
  landowner_details: {
    name: string;
    survey_number: string;
    village: string;
    taluka: string;
    district: string;
    contact_phone?: string;
    contact_email?: string;
  };
  land_details: {
    area: number;
    acquired_area?: number;
    rate_per_hectare?: number;
    structure_trees_wells_amount?: number;
  };
  compensation_details: {
    land_compensation: number;
    structure_compensation: number;
    solatium: number;
    total_compensation: number;
    final_amount: number;
  };
  project_details?: {
    name: string;
    village: string;
    taluka: string;
    district: string;
  };
  kyc_details: {
    status: string;
    completed_at: string;
    completed_by?: string;
    notes?: string;
  };
  bank_details: {
    account_number?: string;
    ifsc_code?: string;
    bank_name?: string;
    branch_name?: string;
    account_holder?: string;
  };
  tribal_details: {
    is_tribal: boolean;
    certificate_no?: string;
    lag?: string;
  };
  documents: any[];
  notes?: string;
  generated_by: string;
  generated_at: string;
}

interface LandownerRecord {
  id: string;
  survey_number: string;
  landowner_name: string;
  village: string;
  taluka: string;
  district: string;
  kyc_status: string;
  kyc_completed_at?: string;
  payment_status: string;
  pending_reason?: string;
  total_compensation: number;
  project_id?: string;
  project_name?: string;
}

const PaymentSlipGenerator: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useSaral();
  
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [kycCompletedRecords, setKycCompletedRecords] = useState<LandownerRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<LandownerRecord | null>(null);
  const [paymentSlip, setPaymentSlip] = useState<PaymentSlip | null>(null);
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('records');
  const [isReasonOpen, setIsReasonOpen] = useState(false);
  const [pendingReason, setPendingReason] = useState('');
  const [reasonRecordId, setReasonRecordId] = useState<string | null>(null);
  
  const API_BASE_URL = config.API_BASE_URL;

  useEffect(() => {
    if (selectedProject) {
      loadKYCCompletedRecords();
    }
  }, [selectedProject]);

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects, selectedProject]);

  const loadKYCCompletedRecords = async () => {
    if (!selectedProject) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/landowners/${selectedProject}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          const completedRecords = data.data
            .filter((record: any) => 
              (record.kyc_status === 'completed' || record.kyc_status === 'approved') &&
              record.payment_status === 'pending'
            )
            .map((record: any) => ({
              id: record._id || record.id,
              survey_number: record.survey_number,
              landowner_name: record.landowner_name,
              village: record.village,
              taluka: record.taluka,
              district: record.district,
              kyc_status: record.kyc_status,
              kyc_completed_at: record.kyc_completed_at,
              payment_status: record.payment_status,
              // accept multiple backend key spellings
              pending_reason: record.pending_reason || record.pendingReason || record.payment_pending_reason || record.payment_pendingReason,
              total_compensation: record.total_compensation || 0,
              project_id: record.project_id,
              project_name: projects.find(p => p.id === record.project_id)?.projectName || 'Unknown Project'
            }));
          if (completedRecords.length > 0) {
            setKycCompletedRecords(completedRecords);
          } else if (import.meta.env.DEV) {
            // Fallback demo data in dev for showcasing pending reason feature
            setKycCompletedRecords([] as LandownerRecord[]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading KYC completed records:', error);
      if (import.meta.env.DEV) {
        // Dev fallback dataset
        setKycCompletedRecords([
          { id: 'demo-1', survey_number: '40', landowner_name: 'कमळी कमळाकर मंडळ', village: 'उंबरपाडा', taluka: 'पालघर', district: 'पालघर', kyc_status: 'completed', kyc_completed_at: new Date().toISOString(), payment_status: 'pending', pending_reason: 'Bank details verification pending', total_compensation: 8021026, project_id: selectedProject, project_name: projects.find(p => p.id === selectedProject)?.projectName },
          { id: 'demo-2', survey_number: '41', landowner_name: 'राम शामराव पाटील', village: 'उंबरपाडा', taluka: 'पालघर', district: 'पालघर', kyc_status: 'approved', kyc_completed_at: new Date(Date.now()-86400000).toISOString(), payment_status: 'pending', total_compensation: 9200000, project_id: selectedProject, project_name: projects.find(p => p.id === selectedProject)?.projectName },
          { id: 'demo-3', survey_number: '44', landowner_name: 'मीरा बाई पाटील', village: 'उंबरपाडा', taluka: 'पालघर', district: 'पालघर', kyc_status: 'approved', kyc_completed_at: new Date(Date.now()-2*86400000).toISOString(), payment_status: 'generated', total_compensation: 10400000, project_id: selectedProject, project_name: projects.find(p => p.id === selectedProject)?.projectName }
        ] as LandownerRecord[]);
      } else {
        toast.error('Error loading KYC completed records');
      }
    } finally {
      setLoading(false);
    }
  };

  const generatePaymentSlip = async (recordId: string) => {
    setLoading(true);
    try {
      const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${authToken}`
      };
      
      if (authToken === 'demo-jwt-token') {
        headers['x-demo-role'] = 'officer';
      }
      
      const response = await fetch(`${API_BASE_URL}/payments/slip/${recordId}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPaymentSlip(data.data);
          setIsSlipOpen(true);
          toast.success('Payment slip generated successfully');
          loadKYCCompletedRecords(); // Refresh the list
        }
      } else {
        let message = 'Failed to generate payment slip';
        try { const errorData = await response.json(); message = errorData.message || message; } catch {}
        toast.error(message);
      }
    } catch (error) {
      console.error('Error generating payment slip:', error);
      toast.error('Error generating payment slip');
    } finally {
      setLoading(false);
    }
  };

  const openPendingReason = (recordId: string) => {
    setReasonRecordId(recordId);
    setPendingReason('');
    setIsReasonOpen(true);
  };

  const savePendingReason = async () => {
    if (!reasonRecordId) return;
    if (!pendingReason.trim()) {
      toast.error('Please enter a reason');
      return;
    }
    // In dev demo mode, short-circuit to avoid 404 spam and backend dependency
    if (import.meta.env.DEV && config.ENABLE_DEMO_PENDING_REASON) {
      setKycCompletedRecords(prev => prev.map(r => r.id === reasonRecordId ? { ...r, pending_reason: pendingReason } : r));
      toast.success('Saved locally (demo mode)');
      setIsReasonOpen(false);
      setReasonRecordId(null);
      setPendingReason('');
      return;
    }

    setLoading(true);
    try {
      const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      if (authToken === 'demo-jwt-token') headers['x-demo-role'] = 'officer';
      // Try canonical endpoint, fall back to alternative if needed
      let res = await fetch(`${API_BASE_URL}/payments/pending-reason`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ landownerId: reasonRecordId, reason: pendingReason })
      });
      if (!res.ok) {
        // Try RESTful POST with param
        res = await fetch(`${API_BASE_URL}/payments/pending-reason/${reasonRecordId}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ reason: pendingReason })
        });
      }
      if (!res.ok) {
        // Try landowners endpoint
        res = await fetch(`${API_BASE_URL}/landowners/${reasonRecordId}/pending-reason`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ reason: pendingReason })
        });
      }
      if (!res.ok) {
        // In dev or if API not present, save locally without throwing noisy errors
        if ((res.status === 404 || import.meta.env.DEV) && config.ENABLE_DEMO_PENDING_REASON) {
          setKycCompletedRecords(prev => prev.map(r => r.id === reasonRecordId ? { ...r, pending_reason: pendingReason } : r));
          toast.message('Saved locally (API not found).', { description: 'Create /payments/pending-reason endpoint to persist.' } as any);
        } else {
          throw new Error('Failed to save');
        }
      } else {
        toast.success('Pending payment reason saved');
      }
      setIsReasonOpen(false);
      setReasonRecordId(null);
      setPendingReason('');
      await loadKYCCompletedRecords();
    } catch (e) {
      console.error('Failed to save pending reason', e);
      if (import.meta.env.DEV && config.ENABLE_DEMO_PENDING_REASON) {
        toast.success('Saved locally');
        setKycCompletedRecords(prev => prev.map(r => r.id === reasonRecordId ? { ...r, pending_reason: pendingReason } : r));
      } else {
        toast.error('Failed to save reason');
      }
      setIsReasonOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const printPaymentSlip = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && paymentSlip) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Slip - ${paymentSlip.slip_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #1f2937; }
            .subtitle { color: #6b7280; margin-top: 5px; }
            .slip-number { background: #f3f4f6; padding: 10px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .section { margin: 20px 0; }
            .section-title { font-weight: bold; color: #1f2937; border-bottom: 1px solid #d1d5db; padding-bottom: 5px; margin-bottom: 15px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; color: #374151; }
            .value { color: #111827; }
            .compensation-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .total { font-size: 18px; font-weight: bold; color: #059669; }
            .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
            @media print { body { margin: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">🏛️ सरल भूमि - सरकारी भूमि अधिग्रहण</div>
            <div class="subtitle">Saral Bhoomi - Government Land Acquisition</div>
            <div class="subtitle">Ministry of Rural Development, Government of India</div>
          </div>
          
          <div class="slip-number">
            <strong>Payment Slip Number:</strong> ${paymentSlip.slip_number}<br>
            <strong>Generated Date:</strong> ${new Date(paymentSlip.generated_date).toLocaleDateString('en-IN')}
          </div>
          
          <div class="section">
            <div class="section-title">🏠 Landowner Details</div>
            <div class="grid">
              <div class="field">
                <span class="label">Name:</span>
                <span class="value">${paymentSlip.landowner_details.name}</span>
              </div>
              <div class="field">
                <span class="label">Survey Number:</span>
                <span class="value">${paymentSlip.landowner_details.survey_number}</span>
              </div>
              <div class="field">
                <span class="label">Village:</span>
                <span class="value">${paymentSlip.landowner_details.village}</span>
              </div>
              <div class="field">
                <span class="label">Taluka:</span>
                <span class="value">${paymentSlip.landowner_details.taluka}</span>
              </div>
              <div class="field">
                <span class="label">District:</span>
                <span class="value">${paymentSlip.landowner_details.district}</span>
              </div>
              <div class="field">
                <span class="label">Contact:</span>
                <span class="value">${paymentSlip.landowner_details.contact_phone || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">🌾 Land Details</div>
            <div class="grid">
              <div class="field">
                <span class="label">Total Area:</span>
                <span class="value">${paymentSlip.land_details.area} Hectares</span>
              </div>
              <div class="field">
                <span class="label">Rate per Hectare:</span>
                <span class="value">₹${paymentSlip.land_details.rate_per_hectare?.toLocaleString('en-IN') || 'N/A'}</span>
              </div>
              <div class="field">
                <span class="label">Structures/Trees/Wells:</span>
                <span class="value">₹${paymentSlip.land_details.structure_trees_wells_amount?.toLocaleString('en-IN') || '0'}</span>
              </div>
            </div>
          </div>
          
          <div class="compensation-box">
            <div class="section-title">💰 Compensation Details</div>
            <div class="grid">
              <div class="field">
                <span class="label">Land Compensation:</span>
                <span class="value">₹${paymentSlip.compensation_details.land_compensation.toLocaleString('en-IN')}</span>
              </div>
              <div class="field">
                <span class="label">Structure Compensation:</span>
                <span class="value">₹${paymentSlip.compensation_details.structure_compensation.toLocaleString('en-IN')}</span>
              </div>
              <div class="field">
                <span class="label">Solatium:</span>
                <span class="value">₹${paymentSlip.compensation_details.solatium.toLocaleString('en-IN')}</span>
              </div>
              <div class="field">
                <span class="label">Total Compensation:</span>
                <span class="value">₹${paymentSlip.compensation_details.total_compensation.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div class="total">
              <strong>Final Amount:</strong> ₹${paymentSlip.compensation_details.final_amount.toLocaleString('en-IN')}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">🏦 Bank Details</div>
            <div class="grid">
              <div class="field">
                <span class="label">Account Number:</span>
                <span class="value">${paymentSlip.bank_details.account_number || 'N/A'}</span>
              </div>
              <div class="field">
                <span class="label">IFSC Code:</span>
                <span class="value">${paymentSlip.bank_details.ifsc_code || 'N/A'}</span>
              </div>
              <div class="field">
                <span class="label">Bank Name:</span>
                <span class="value">${paymentSlip.bank_details.bank_name || 'N/A'}</span>
              </div>
              <div class="field">
                <span class="label">Branch:</span>
                <span class="value">${paymentSlip.bank_details.branch_name || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">✅ KYC Verification</div>
            <div class="grid">
              <div class="field">
                <span class="label">Status:</span>
                <span class="value">${paymentSlip.kyc_details.status.toUpperCase()}</span>
              </div>
              <div class="field">
                <span class="label">Completed Date:</span>
                <span class="value">${new Date(paymentSlip.kyc_details.completed_at).toLocaleDateString('en-IN')}</span>
              </div>
              <div class="field">
                <span class="label">Completed By:</span>
                <span class="value">${paymentSlip.kyc_details.completed_by || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>Generated by: ${paymentSlip.generated_by}</p>
            <p>Generated at: ${new Date(paymentSlip.generated_at).toLocaleString('en-IN')}</p>
            <p>This is an official government document for land acquisition compensation</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-gray-100 text-gray-800',
      initiated: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getKYCStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-100 text-green-800',
      approved: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Slip Generator</CardTitle>
          <CardDescription>
            Generate payment slips for landowners with completed KYC verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="project">Select Project</Label>
              <Select 
                value={selectedProject} 
                onValueChange={setSelectedProject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedProject && (
        <>
          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total KYC Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kycCompletedRecords.length}</div>
                <p className="text-xs text-muted-foreground">
                  Ready for payment slip generation
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payment Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kycCompletedRecords.filter(r => r.payment_status === 'pending').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting payment slip generation
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payment Generated</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kycCompletedRecords.filter(r => r.payment_status === 'generated').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Payment slips created
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Compensation</CardTitle>
                <IndianRupee className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{(kycCompletedRecords.reduce((sum, r) => sum + r.total_compensation, 0) / 100000).toFixed(1)}L
                </div>
                <p className="text-xs text-muted-foreground">
                  Total amount to be disbursed
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="records">KYC Completed Records</TabsTrigger>
              <TabsTrigger value="slips">Payment Slips</TabsTrigger>
            </TabsList>

            <TabsContent value="records" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>KYC Completed Records ({kycCompletedRecords.length})</CardTitle>
                      <CardDescription>
                        Records with completed KYC verification, ready for payment slip generation
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={loadKYCCompletedRecords}
                      disabled={loading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4">Loading records...</div>
                  ) : kycCompletedRecords.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>No KYC completed records found for this project</p>
                      <p className="text-sm mt-2">Records will appear here once field officers complete KYC verification</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Survey No</TableHead>
                          <TableHead>Owner Name</TableHead>
                          <TableHead>Village</TableHead>
                          <TableHead>KYC Status</TableHead>
                          <TableHead>KYC Completed</TableHead>
                          <TableHead>Payment Status</TableHead>
                          <TableHead>Pending Reason</TableHead>
                          <TableHead>Compensation</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {kycCompletedRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.survey_number}</TableCell>
                            <TableCell>{record.landowner_name}</TableCell>
                            <TableCell>{record.village}</TableCell>
                            <TableCell>{getKYCStatusBadge(record.kyc_status)}</TableCell>
                            <TableCell>
                              {record.kyc_completed_at ? (
                                <div className="text-sm">
                                  <div>{new Date(record.kyc_completed_at).toLocaleDateString()}</div>
                                  <div className="text-gray-500 text-xs">
                                    {new Date(record.kyc_completed_at).toLocaleTimeString()}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">Not set</span>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(record.payment_status)}</TableCell>
                            <TableCell className="max-w-[240px] whitespace-pre-wrap">
                              {record.pending_reason ? (
                                <span className="text-xs text-gray-700">{record.pending_reason}</span>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800">
                                ₹{(record.total_compensation / 100000).toFixed(1)}L
                              </Badge>
                            </TableCell>
                            <TableCell className="space-x-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => generatePaymentSlip(record.id)}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Generate Slip
                              </Button>
                              {record.payment_status === 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPendingReason(record.id)}
                                  disabled={loading}
                                >
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Add Pending Reason
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="slips" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Slips</CardTitle>
                  <CardDescription>
                    View and manage generated payment slips
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    Payment slips will appear here after generation
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Payment Slip Dialog */}
      <Dialog open={isSlipOpen} onOpenChange={setIsSlipOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Slip - {paymentSlip?.slip_number}</DialogTitle>
            <DialogDescription>
              Payment slip for {paymentSlip?.landowner_details.name} (Survey: {paymentSlip?.landowner_details.survey_number})
            </DialogDescription>
          </DialogHeader>
          
          {paymentSlip && (
            <div className="space-y-6">
              {/* Slip Header */}
              <div className="text-center border-b-2 border-gray-300 pb-4">
                <div className="text-2xl font-bold text-gray-800">🏛️ सरल भूमि - सरकारी भूमि अधिग्रहण</div>
                <div className="text-gray-600 mt-1">Saral Bhoomi - Government Land Acquisition</div>
                <div className="text-gray-600">Ministry of Rural Development, Government of India</div>
              </div>

              {/* Slip Number */}
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-lg font-semibold text-blue-800">Payment Slip Number</div>
                <div className="text-2xl font-bold text-blue-900">{paymentSlip.slip_number}</div>
                <div className="text-blue-700 mt-2">
                  Generated: {new Date(paymentSlip.generated_date).toLocaleDateString('en-IN')}
                </div>
              </div>

              {/* Landowner Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Landowner Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><span className="font-semibold">Name:</span> {paymentSlip.landowner_details.name}</div>
                    <div><span className="font-semibold">Survey:</span> {paymentSlip.landowner_details.survey_number}</div>
                    <div><span className="font-semibold">Village:</span> {paymentSlip.landowner_details.village}</div>
                    <div><span className="font-semibold">Taluka:</span> {paymentSlip.landowner_details.taluka}</div>
                    <div><span className="font-semibold">District:</span> {paymentSlip.landowner_details.district}</div>
                    {paymentSlip.landowner_details.contact_phone && (
                      <div><span className="font-semibold">Phone:</span> {paymentSlip.landowner_details.contact_phone}</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Building2 className="h-4 w-4 mr-2" />
                      Land Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><span className="font-semibold">Area:</span> {paymentSlip.land_details.area} Hectares</div>
                    <div><span className="font-semibold">Rate:</span> ₹{paymentSlip.land_details.rate_per_hectare?.toLocaleString('en-IN') || 'N/A'}</div>
                    <div><span className="font-semibold">Structures:</span> ₹{paymentSlip.land_details.structure_trees_wells_amount?.toLocaleString('en-IN') || '0'}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Compensation Details */}
              <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-yellow-800">
                    <Banknote className="h-4 w-4 mr-2" />
                    Compensation Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Land Compensation</div>
                      <div className="text-lg font-bold text-green-700">
                        ₹{paymentSlip.compensation_details.land_compensation.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Structure Compensation</div>
                      <div className="text-lg font-bold text-blue-700">
                        ₹{paymentSlip.compensation_details.structure_compensation.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Solatium</div>
                      <div className="text-lg font-bold text-purple-700">
                        ₹{paymentSlip.compensation_details.solatium.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Total</div>
                      <div className="text-lg font-bold text-green-700">
                        ₹{paymentSlip.compensation_details.total_compensation.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-4 p-3 bg-green-100 rounded-lg">
                    <div className="text-sm text-gray-600">Final Amount</div>
                    <div className="text-2xl font-bold text-green-800">
                      ₹{paymentSlip.compensation_details.final_amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bank Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Hash className="h-4 w-4 mr-2" />
                    Bank Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="font-semibold">Account:</span> {paymentSlip.bank_details.account_number || 'N/A'}</div>
                    <div><span className="font-semibold">IFSC:</span> {paymentSlip.bank_details.ifsc_code || 'N/A'}</div>
                    <div><span className="font-semibold">Bank:</span> {paymentSlip.bank_details.bank_name || 'N/A'}</div>
                    <div><span className="font-semibold">Branch:</span> {paymentSlip.bank_details.branch_name || 'N/A'}</div>
                  </div>
                </CardContent>
              </Card>

              {/* KYC Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    KYC Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="font-semibold">Status:</span> {paymentSlip.kyc_details.status.toUpperCase()}</div>
                    <div><span className="font-semibold">Completed:</span> {new Date(paymentSlip.kyc_details.completed_at).toLocaleDateString('en-IN')}</div>
                    <div><span className="font-semibold">By:</span> {paymentSlip.kyc_details.completed_by || 'N/A'}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 pt-4 border-t">
                <Button onClick={printPaymentSlip} variant="default">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Slip
                </Button>
                <Button variant="outline" onClick={() => setIsSlipOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pending Reason Dialog */}
      <Dialog open={isReasonOpen} onOpenChange={setIsReasonOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Reason for Pending Payment</DialogTitle>
            <DialogDescription>
              Provide a clear reason for keeping this payment in pending state.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="pending-reason">Reason</Label>
            <Textarea id="pending-reason" value={pendingReason} onChange={(e) => setPendingReason(e.target.value)} placeholder="e.g., Bank details verification pending, land dispute, missing documents" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsReasonOpen(false)}>Cancel</Button>
            <Button onClick={savePendingReason} disabled={loading}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentSlipGenerator;
