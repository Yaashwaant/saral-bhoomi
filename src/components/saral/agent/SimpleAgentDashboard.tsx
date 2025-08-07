import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  MapPin, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Shield,
  Building2,
  IndianRupee
} from 'lucide-react';
import emblemOfIndia from '../../../assets/images/emblem-of-india.png';

interface LandownerRecord {
  _id: string;
  खातेदाराचे_नांव: string;
  सर्वे_नं: string;
  क्षेत्र: string;
  एकूण_मोबदला: string;
  village: string;
  taluka: string;
  district: string;
  kycStatus: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  assignedAt: string;
  projectId?: {
    projectName: string;
    pmisCode: string;
  };
}

const API_BASE_URL = 'http://localhost:5000/api';

const SimpleAgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<LandownerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<LandownerRecord | null>(null);
  const [kycStatus, setKycStatus] = useState<string>('');
  const [kycNotes, setKycNotes] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const translations = {
    marathi: {
      welcome: 'स्वागत',
      dashboard: 'एजंट डॅशबोर्ड',
      assignedRecords: 'नियुक्त केलेले रेकॉर्ड्स',
      totalAssigned: 'एकूण नियुक्त',
      pendingKYC: 'प्रलंबित KYC',
      completedKYC: 'पूर्ण झालेले KYC',
      approvedKYC: 'मंजूर KYC',
      landownerName: 'खातेदाराचे नांव',
      surveyNumber: 'सर्वे नंबर',
      area: 'क्षेत्र',
      compensation: 'मोबदला',
      village: 'गाव',
      status: 'स्थिती',
      actions: 'कृती',
      updateKYC: 'KYC अपडेट करा',
      notes: 'टिप्पणी',
      submit: 'सबमिट करा',
      cancel: 'रद्द करा'
    },
    english: {
      welcome: 'Welcome',
      dashboard: 'Agent Dashboard',
      assignedRecords: 'Assigned Records',
      totalAssigned: 'Total Assigned',
      pendingKYC: 'Pending KYC',
      completedKYC: 'Completed KYC',
      approvedKYC: 'Approved KYC',
      landownerName: 'Landowner Name',
      surveyNumber: 'Survey Number',
      area: 'Area',
      compensation: 'Compensation',
      village: 'Village',
      status: 'Status',
      actions: 'Actions',
      updateKYC: 'Update KYC',
      notes: 'Notes',
      submit: 'Submit',
      cancel: 'Cancel'
    },
    hindi: {
      welcome: 'स्वागत',
      dashboard: 'एजेंट डैशबोर्ड',
      assignedRecords: 'आवंटित रिकॉर्ड',
      totalAssigned: 'कुल आवंटित',
      pendingKYC: 'लंबित KYC',
      completedKYC: 'पूर्ण KYC',
      approvedKYC: 'स्वीकृत KYC',
      landownerName: 'भूमि मालिक का नाम',
      surveyNumber: 'सर्वेक्षण संख्या',
      area: 'क्षेत्र',
      compensation: 'मुआवजा',
      village: 'गांव',
      status: 'स्थिति',
      actions: 'कार्य',
      updateKYC: 'KYC अपडेट करें',
      notes: 'टिप्पणियां',
      submit: 'सबमिट करें',
      cancel: 'रद्द करें'
    }
  };

  const t = translations[user?.language || 'marathi'];

  // Load assigned records
  const loadAssignedRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/agents/assigned`);
      const data = await response.json();
      
      if (data.success) {
        setRecords(data.records || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to load assigned records",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading records:', error);
      toast({
        title: "Error",
        description: "Failed to load assigned records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Update KYC status
  const updateKYCStatus = async () => {
    if (!selectedRecord || !kycStatus) return;

    try {
      const response = await fetch(`${API_BASE_URL}/agents/kyc-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          landownerId: selectedRecord._id,
          kycStatus,
          notes: kycNotes
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "KYC status updated successfully"
        });
        
        // Update local state
        setRecords(prev => prev.map(record => 
          record._id === selectedRecord._id 
            ? { ...record, kycStatus: kycStatus as any }
            : record
        ));
        
        setIsDialogOpen(false);
        setSelectedRecord(null);
        setKycStatus('');
        setKycNotes('');
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update KYC status",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating KYC status:', error);
      toast({
        title: "Error",
        description: "Failed to update KYC status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">प्रलंबित</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">प्रगतीत</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">पूर्ण</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">मंजूर</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">नाकारले</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'completed':
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  useEffect(() => {
    loadAssignedRecords();
  }, []);

  const stats = {
    totalAssigned: records.length,
    pendingKYC: records.filter(r => r.kycStatus === 'pending').length,
    completedKYC: records.filter(r => r.kycStatus === 'completed').length,
    approvedKYC: records.filter(r => r.kycStatus === 'approved').length
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ 
              fontFamily: "'Noto Sans', 'Arial', sans-serif",
              fontWeight: 700,
              letterSpacing: '0.5px',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>{t.welcome}, {user?.name}!</h1>
            <p className="text-blue-100 mt-1" style={{ 
              fontFamily: "'Noto Sans', 'Arial', sans-serif",
              fontWeight: 500,
              letterSpacing: '0.2px'
            }}>{t.dashboard}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium" style={{ 
              fontFamily: "'Noto Sans', 'Arial', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.2px'
            }}>Field Agent</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800" style={{ 
              fontFamily: "'Noto Sans', 'Arial', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.2px'
            }}>{t.totalAssigned}</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalAssigned}</div>
            <p className="text-xs text-blue-600 mt-1">Total assigned records</p>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-orange-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800" style={{ 
              fontFamily: "'Noto Sans', 'Arial', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.2px'
            }}>{t.pendingKYC}</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.pendingKYC}</div>
            <p className="text-xs text-orange-600 mt-1">Awaiting KYC</p>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-green-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800" style={{ 
              fontFamily: "'Noto Sans', 'Arial', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.2px'
            }}>{t.completedKYC}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.completedKYC}</div>
            <p className="text-xs text-green-600 mt-1">KYC completed</p>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-purple-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800" style={{ 
              fontFamily: "'Noto Sans', 'Arial', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.2px'
            }}>{t.approvedKYC}</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{stats.approvedKYC}</div>
            <p className="text-xs text-purple-600 mt-1">KYC approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Records Table */}
      <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center space-x-2" style={{ 
            fontFamily: "'Noto Sans', 'Arial', sans-serif",
            fontWeight: 600,
            letterSpacing: '0.2px'
          }}>
            <MapPin className="h-5 w-5" />
            <span>{t.assignedRecords}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-blue-600 mt-2">Loading records...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                                 <TableHeader>
                   <TableRow className="bg-blue-50">
                     <TableHead className="text-blue-900 font-semibold" style={{ 
                       fontFamily: "'Noto Sans', 'Arial', sans-serif",
                       fontWeight: 600,
                       letterSpacing: '0.2px'
                     }}>{t.landownerName}</TableHead>
                     <TableHead className="text-blue-900 font-semibold" style={{ 
                       fontFamily: "'Noto Sans', 'Arial', sans-serif",
                       fontWeight: 600,
                       letterSpacing: '0.2px'
                     }}>{t.surveyNumber}</TableHead>
                     <TableHead className="text-blue-900 font-semibold" style={{ 
                       fontFamily: "'Noto Sans', 'Arial', sans-serif",
                       fontWeight: 600,
                       letterSpacing: '0.2px'
                     }}>{t.area}</TableHead>
                     <TableHead className="text-blue-900 font-semibold" style={{ 
                       fontFamily: "'Noto Sans', 'Arial', sans-serif",
                       fontWeight: 600,
                       letterSpacing: '0.2px'
                     }}>{t.compensation}</TableHead>
                     <TableHead className="text-blue-900 font-semibold" style={{ 
                       fontFamily: "'Noto Sans', 'Arial', sans-serif",
                       fontWeight: 600,
                       letterSpacing: '0.2px'
                     }}>{t.village}</TableHead>
                     <TableHead className="text-blue-900 font-semibold" style={{ 
                       fontFamily: "'Noto Sans', 'Arial', sans-serif",
                       fontWeight: 600,
                       letterSpacing: '0.2px'
                     }}>{t.status}</TableHead>
                     <TableHead className="text-blue-900 font-semibold" style={{ 
                       fontFamily: "'Noto Sans', 'Arial', sans-serif",
                       fontWeight: 600,
                       letterSpacing: '0.2px'
                     }}>{t.actions}</TableHead>
                   </TableRow>
                 </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record._id} className="hover:bg-blue-50/50">
                      <TableCell className="font-medium text-blue-900">{record.खातेदाराचे_नांव}</TableCell>
                      <TableCell className="text-blue-800">{record.सर्वे_नं}</TableCell>
                      <TableCell className="text-blue-800">{record.क्षेत्र}</TableCell>
                      <TableCell className="text-blue-800 font-medium">{record.एकूण_मोबदला}</TableCell>
                      <TableCell className="text-blue-800">{record.village}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(record.kycStatus)}
                          {getStatusBadge(record.kycStatus)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog open={isDialogOpen && selectedRecord?._id === record._id} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-blue-200 text-blue-700 hover:bg-blue-50"
                              onClick={() => setSelectedRecord(record)}
                            >
                              {t.updateKYC}
                            </Button>
                          </DialogTrigger>
                                                     <DialogContent className="bg-white/95 backdrop-blur-sm">
                             <DialogHeader>
                               <DialogTitle className="text-blue-900" style={{ 
                                 fontFamily: "'Noto Sans', 'Arial', sans-serif",
                                 fontWeight: 600,
                                 letterSpacing: '0.2px'
                               }}>{t.updateKYC}</DialogTitle>
                             </DialogHeader>
                            <div className="space-y-4">
                                                             <div>
                                 <label className="text-sm font-medium text-blue-800" style={{ 
                                   fontFamily: "'Noto Sans', 'Arial', sans-serif",
                                   fontWeight: 600,
                                   letterSpacing: '0.1px'
                                 }}>{t.landownerName}</label>
                                 <p className="text-sm text-blue-600" style={{ 
                                   fontFamily: "'Noto Sans', 'Arial', sans-serif",
                                   fontWeight: 500,
                                   letterSpacing: '0.1px'
                                 }}>{record.खातेदाराचे_नांव}</p>
                               </div>
                               <div>
                                 <label className="text-sm font-medium text-blue-800" style={{ 
                                   fontFamily: "'Noto Sans', 'Arial', sans-serif",
                                   fontWeight: 600,
                                   letterSpacing: '0.1px'
                                 }}>{t.surveyNumber}</label>
                                 <p className="text-sm text-blue-600" style={{ 
                                   fontFamily: "'Noto Sans', 'Arial', sans-serif",
                                   fontWeight: 500,
                                   letterSpacing: '0.1px'
                                 }}>{record.सर्वे_नं}</p>
                               </div>
                               <div>
                                 <label className="text-sm font-medium text-blue-800" style={{ 
                                   fontFamily: "'Noto Sans', 'Arial', sans-serif",
                                   fontWeight: 600,
                                   letterSpacing: '0.1px'
                                 }}>KYC Status</label>
                                <Select value={kycStatus} onValueChange={setKycStatus}>
                                  <SelectTrigger className="border-blue-200">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">प्रलंबित (Pending)</SelectItem>
                                    <SelectItem value="in_progress">प्रगतीत (In Progress)</SelectItem>
                                    <SelectItem value="completed">पूर्ण (Completed)</SelectItem>
                                    <SelectItem value="approved">मंजूर (Approved)</SelectItem>
                                    <SelectItem value="rejected">नाकारले (Rejected)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                                                             <div>
                                 <label className="text-sm font-medium text-blue-800" style={{ 
                                   fontFamily: "'Noto Sans', 'Arial', sans-serif",
                                   fontWeight: 600,
                                   letterSpacing: '0.1px'
                                 }}>{t.notes}</label>
                                 <Textarea 
                                   value={kycNotes} 
                                   onChange={(e) => setKycNotes(e.target.value)}
                                   placeholder="Add notes about KYC verification..."
                                   className="border-blue-200"
                                   style={{ 
                                     fontFamily: "'Noto Sans', 'Arial', sans-serif",
                                     fontWeight: 500,
                                     letterSpacing: '0.1px'
                                   }}
                                 />
                               </div>
                              <div className="flex space-x-2">
                                <Button 
                                  onClick={updateKYCStatus}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {t.submit}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  onClick={() => setIsDialogOpen(false)}
                                  className="border-blue-200 text-blue-700"
                                >
                                  {t.cancel}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleAgentDashboard; 