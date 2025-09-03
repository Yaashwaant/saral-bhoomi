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
import { toast } from 'sonner';
import { Eye, Download, UserCheck, Upload, FileText, CheckCircle, Clock, AlertCircle, ArrowRight, Hash } from 'lucide-react';
import { config } from '../../../config';

interface KYCRecord {
  id: string;
  survey_number: string;
  landowner_name: string;
  area: number;
  village: string;
  taluka: string;
  district: string;
  total_compensation: number;
  is_tribal: boolean;
  tribal_certificate_no?: string;
  tribal_lag?: string;
  notice_generated: boolean;
  notice_number?: string;
  notice_date?: Date;
  kyc_status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  payment_status: 'pending' | 'initiated' | 'completed';
  assigned_agent?: string;
  assigned_at?: Date;
  documents_uploaded: boolean;
  blockchain_verified: boolean;
  project_id: string;
}

interface BlockchainEntry {
  id: string;
  survey_number: string;
  event_type: string;
  officer_id: string;
  timestamp: Date;
  metadata: any;
  block_hash: string;
  previous_hash: string;
}

const KYCAssignmentManager: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useSaral();
  
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [kycRecords, setKycRecords] = useState<KYCRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<KYCRecord | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isBlockchainOpen, setIsBlockchainOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('kyc');
  
  const [previewContent, setPreviewContent] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [blockchainEntries, setBlockchainEntries] = useState<BlockchainEntry[]>([]);
  
  const API_BASE_URL = config.API_BASE_URL;

  useEffect(() => {
    if (selectedProject) {
      loadKYCRecords();
      loadBlockchainEntries();
    }
  }, [selectedProject]);

  const loadKYCRecords = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/landowners/${selectedProject}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          const transformedRecords = data.data.map((record: any) => ({
            id: record._id || record.id,
            survey_number: record.survey_number,
            landowner_name: record.landowner_name,
            area: record.area || 0,
            village: record.village,
            taluka: record.taluka,
            district: record.district,
            total_compensation: record.total_compensation || 0,
            is_tribal: record.is_tribal || false,
            tribal_certificate_no: record.tribal_certificate_no,
            tribal_lag: record.tribal_lag,
            notice_generated: record.notice_generated || false,
            notice_number: record.notice_number,
            notice_date: record.notice_date ? new Date(record.notice_date) : undefined,
            kyc_status: record.kyc_status || 'pending',
            payment_status: record.payment_status || 'pending',
            assigned_agent: record.assigned_agent,
            assigned_at: record.assigned_at ? new Date(record.assigned_at) : undefined,
            documents_uploaded: record.documents_uploaded || false,
            blockchain_verified: record.blockchain_verified || false,
            project_id: record.project_id
          }));
          setKycRecords(transformedRecords);
        }
      } else {
        toast.error('Failed to load KYC records');
      }
    } catch (error) {
      console.error('Error loading KYC records:', error);
      toast.error('Error loading KYC records');
    } finally {
      setLoading(false);
    }
  };

  const loadBlockchainEntries = async () => {
    if (!selectedProject) return;
    try {
      const response = await fetch(`${API_BASE_URL}/blockchain/${selectedProject}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setBlockchainEntries(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading blockchain entries:', error);
    }
  };

  const previewNotice = async (recordId: string) => {
    const record = kycRecords.find(r => r.id === recordId);
    if (!record) return;

    // Generate notice content
    const noticeContent = generateNoticeContent(record);
    setPreviewContent(noticeContent);
    setSelectedRecord(record);
    setIsPreviewOpen(true);
  };

  const generateNotice = async (record: KYCRecord) => {
    setLoading(true);
    try {
      const noticeContent = generateNoticeContent(record);
      const response = await fetch(`${API_BASE_URL}/landowners/generate-notice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer demo-jwt-token`
        },
        body: JSON.stringify({
          survey_number: record.survey_number,
          landowner_name: record.landowner_name,
          area: record.area,
          village: record.village,
          taluka: record.taluka,
          district: record.district,
          total_compensation: record.total_compensation,
          is_tribal: record.is_tribal,
          tribal_certificate_no: record.tribal_certificate_no,
          tribal_lag: record.tribal_lag,
          project_id: selectedProject
        })
      });

      if (response.ok) {
        toast.success('Notice generated successfully');
        loadKYCRecords(); // Reload records to update notice_generated status
        // Note: Blockchain update is handled automatically by the notice generation endpoint
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to generate notice');
      }
    } catch (error) {
      console.error('Error generating notice:', error);
      toast.error('Error generating notice');
    } finally {
      setLoading(false);
    }
  };

  const generateNoticeContent = (record: KYCRecord): string => {
    const project = projects.find(p => p.id === selectedProject);
    const today = new Date();
    
    return `
      <div style="text-align:center; font-weight:700;">महाराष्ट्र शासन</div>
      <div style="text-align:center; margin-top:4px;">उपजिल्हाधिकारी (भूसंपादन) सुर्या प्रकल्प, नांदे यांचे कार्यालय</div>
      <div style="text-align:center; font-size:12px;">पत्र व्यवहाराचा पत्ता: इराणी रोड, आय.डी.बी.आय. बँकेच्या समोर, ता. नांदे, जि. पालघर<br/>दूरध्वनी: ०२५२८-२२०१८० | Email: desplandacquisition@gmail.com</div>
      <hr/>
      <div style="display:flex; justify-content:space-between; font-size:13px;">
        <div>जा.क्र./भूसंपादन/रेल्वे उड्डाणपूल प्रकल्प/कावि-${project?.pmisCode || 'PROJECT-001'}</div>
        <div>दिनांक: ${today.toLocaleDateString('hi-IN')}</div>
      </div>

      <h3 style="text-align:center; margin:8px 0;">नोटीस</h3>

      <div style="margin:12px 0;">
        प्रति: <b>${record.landowner_name}</b><br/>
        पत्ता: रा. ${record.village}, ता. ${record.taluka}, जि. ${record.district}
      </div>

      <div style="margin:12px 0;">
        भूमिसंपादन, पुनर्वसन व पुनर्स्थापना करताना वाजवी भरपाई मिळण्याचा व पारदर्शकतेचा हक्क अधिनियम २०१३ च्या तरतुदीनुसार, ${project?.projectName || 'Railway Flyover Project'} प्रकल्पाकरिता नमूद जमीन संपादित करण्यात येत आहे. सदर प्रक्रियेत आवश्यक त्या कार्यवाहीसाठी आपणास सूचित करण्यात येत आहे.
      </div>

      <div style="margin:12px 0;">
        मौजे ${record.village}, ता. ${record.taluka}, जि. ${record.district} येथील संयुक्त मोजणी पूर्ण झाली असून आपल्या स.नं./गट नंबरचे क्षेत्र संपादित होणार आहे. सदर संपादित जमिनीचा मोबदला देय असून आवश्यक कागदपत्रांच्या मुळ प्रती व साक्षांकित (Attested) प्रती <b>७ दिवसात</b> कार्यालयात जमा कराव्यात.
      </div>

      <h4 style="margin:12px 0 6px;">जमिनीचा तपशील</h4>
      <table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse; width:100%; font-size:12px;">
        <tr>
          <th style="padding:8px;">सर्वे नंबर</th>
          <th style="padding:8px;">क्षेत्र (हे.आर)</th>
          <th style="padding:8px;">जमिनीचा प्रकार</th>
          <th style="padding:8px;">एकूण मोबदला</th>
        </tr>
        <tr>
          <td style="padding:8px; text-align:center;">${record.survey_number}</td>
          <td style="padding:8px; text-align:center;">${record.area}</td>
          <td style="padding:8px; text-align:center;">${record.is_tribal ? 'आदिवासी जमीन' : 'सामान्य जमीन'}</td>
          <td style="padding:8px; text-align:center;">₹${(record.total_compensation / 100000).toFixed(1)}L</td>
        </tr>
      </table>

      <div style="margin:12px 0;">
        <div>संमतीपत्र सादर केल्यास खालील आवश्यक कागदपत्रे (मूळ व Attested):</div>
        <ul>
          <li>संबंधित जमिनीचा अद्ययावत ७/१२ उतारा</li>
          <li>ओळखपत्र (रेशन/मतदार/आधार/पॅन/ड्रायव्हिंग लायसन्स इ.)</li>
          <li>७/१२ वर बोजा असल्यास संबंधित नाहरकत दाखला/फेरफार आदेश</li>
          <li>बिनशेती असल्यास बिनशेती आदेश व मंजुरी नकाशा</li>
          <li>राष्ट्रीयकृत बँक पासबुक</li>
          <li>प्रत्येकी दोन फोटो</li>
          ${record.is_tribal ? '<li>आदिवासी प्रमाणपत्र</li>' : ''}
        </ul>
      </div>

      <div style="margin-top:24px; text-align:right;">
        <div>सही: ——————</div>
        <div>(संजीव जाधवर) सक्षम प्राधिकारी</div>
        <div>उपजिल्हाधिकारी (भूसंपादन) सुर्या प्रकल्प, नांदे</div>
      </div>
    `;
  };

  const recordBlockchainEvent = async (surveyNumber: string, eventType: string, metadata: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/blockchain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer demo-jwt-token`
        },
        body: JSON.stringify({
          survey_number: surveyNumber,
          event_type: eventType,
          officer_id: user?.id || 'demo-officer',
          metadata: metadata,
          project_id: selectedProject
        })
      });

      if (response.ok) {
        console.log('Blockchain event recorded successfully');
      }
    } catch (error) {
      console.error('Error recording blockchain event:', error);
    }
  };

  const downloadNoticeFromRecord = async (record: KYCRecord) => {
    try {
      const noticeContent = generateNoticeContent(record);
      const blob = new Blob([noticeContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Notice_${record.survey_number}_${record.landowner_name}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Notice downloaded successfully');
      
      // Record blockchain event
      await recordBlockchainEvent(record.survey_number, 'NOTICE_DOWNLOADED', {
        notice_number: record.notice_number,
        landowner_name: record.landowner_name
      });
    } catch (error) {
      console.error('Error downloading notice:', error);
      toast.error('Failed to download notice');
    }
  };

  const assignKYC = async (recordId: string) => {
    if (!selectedAgent) {
      toast.error('Please select an agent');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/agents/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer demo-jwt-token`
        },
        body: JSON.stringify({
          landowner_id: recordId,
          agent_id: selectedAgent,
          project_id: selectedProject,
          assignment_notes: assignmentNotes
        })
      });

      if (response.ok) {
        toast.success('KYC assigned successfully');
        setIsAssignmentOpen(false);
        loadKYCRecords();
        // Record blockchain event
        await recordBlockchainEvent(recordId, 'KYC_ASSIGNED', {
          agent_id: selectedAgent,
          notes: assignmentNotes
        });
      } else {
        toast.error('Failed to assign KYC');
      }
    } catch (error) {
      console.error('Error assigning KYC:', error);
      toast.error('Error assigning KYC');
    } finally {
      setLoading(false);
    }
  };

  const proceedToPayment = async (recordId: string) => {
    const record = kycRecords.find(r => r.id === recordId);
    if (!record) return;

    if (record.kyc_status !== 'completed') {
      toast.error('KYC must be completed before proceeding to payment');
      return;
    }

    setSelectedRecord(record);
    setIsPaymentOpen(true);
  };

  const generatePaymentSlip = async () => {
    if (!selectedRecord) return;

    setLoading(true);
    try {
      // Update payment status
      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer demo-jwt-token`
        },
        body: JSON.stringify({
          survey_number: selectedRecord.survey_number,
          landowner_id: selectedRecord.id,
          project_id: selectedProject,
          amount: selectedRecord.total_compensation,
          status: 'initiated',
          officer_id: user?.id || 'demo-officer'
        })
      });

      if (response.ok) {
        toast.success('Payment slip generated successfully');
        setIsPaymentOpen(false);
        loadKYCRecords();
        // Record blockchain event
        await recordBlockchainEvent(selectedRecord.survey_number, 'PAYMENT_SLIP_GENERATED', {
          amount: selectedRecord.total_compensation,
          status: 'initiated'
        });
      } else {
        toast.error('Failed to generate payment slip');
      }
    } catch (error) {
      console.error('Error generating payment slip:', error);
      toast.error('Error generating payment slip');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, type: 'kyc' | 'payment') => {
    const variants = {
      pending: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      initiated: 'bg-blue-100 text-blue-800'
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
          <CardTitle>KYC Assignment & Payment Management</CardTitle>
          <CardDescription>
            Manage KYC assignments, document uploads, and payment slip generation with blockchain tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="project">Select Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="kyc">KYC Assignment</TabsTrigger>
            <TabsTrigger value="payments">Payment Management</TabsTrigger>
            <TabsTrigger value="blockchain">Blockchain Ledger</TabsTrigger>
          </TabsList>

          <TabsContent value="kyc" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>KYC Assignment ({kycRecords.length})</CardTitle>
                <CardDescription>
                  View/download notice and assign directly for KYC
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Survey No</TableHead>
                      <TableHead>Owner Name</TableHead>
                      <TableHead>Village</TableHead>
                      <TableHead>Area (Ha)</TableHead>
                      <TableHead>Compensation</TableHead>
                      <TableHead>Tribal</TableHead>
                      <TableHead>Notice Status</TableHead>
                      <TableHead>KYC Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kycRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.survey_number}</TableCell>
                        <TableCell>{record.landowner_name}</TableCell>
                        <TableCell>{record.village}</TableCell>
                        <TableCell>{record.area}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            ₹{(record.total_compensation / 100000).toFixed(1)}L
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.is_tribal ? (
                            <div className="flex flex-col items-start">
                              <Badge variant="outline" className="text-orange-600">Tribal</Badge>
                              <span className="text-xs text-gray-600 mt-1">
                                Cert: {record.tribal_certificate_no || record.tribal_lag || 'NA'}
                              </span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-gray-600">Non-Tribal</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.notice_generated ? (
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
                          {getStatusBadge(record.kyc_status, 'kyc')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {!record.notice_generated ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => generateNotice(record)}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Generate Notice
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => previewNotice(record.id)}
                                  title="View Notice"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadNoticeFromRecord(record)}
                                  title="Download Notice"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                {record.kyc_status === 'pending' && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRecord(record);
                                      setIsAssignmentOpen(true);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Assign KYC
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>



          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Management</CardTitle>
                <CardDescription>
                  Generate payment slips for completed KYC records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Survey No</TableHead>
                      <TableHead>Owner Name</TableHead>
                      <TableHead>KYC Status</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kycRecords.filter(r => r.kyc_status === 'completed').map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.survey_number}</TableCell>
                        <TableCell>{record.landowner_name}</TableCell>
                        <TableCell>{getStatusBadge(record.kyc_status, 'kyc')}</TableCell>
                        <TableCell>{getStatusBadge(record.payment_status, 'payment')}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            ₹{(record.total_compensation / 100000).toFixed(1)}L
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.payment_status === 'pending' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => proceedToPayment(record.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <ArrowRight className="h-3 w-3 mr-1" />
                              Generate Payment Slip
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blockchain" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Blockchain Ledger</CardTitle>
                <CardDescription>
                  Track all events and actions on the blockchain
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Survey Number</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Officer ID</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Block Hash</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockchainEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.survey_number}</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">
                            {entry.event_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{entry.officer_id}</TableCell>
                        <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {entry.block_hash.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                                                       <Button
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 setBlockchainEntries([entry]);
                                 setIsBlockchainOpen(true);
                               }}
                             >
                               <Hash className="h-3 w-3 mr-1" />
                               View Details
                             </Button>
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

      {/* Notice Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notice Preview</DialogTitle>
            <DialogDescription>
              Preview of the generated notice
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div
                className="prose max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* KYC Assignment Dialog */}
      <Dialog open={isAssignmentOpen} onOpenChange={setIsAssignmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign KYC</DialogTitle>
            <DialogDescription>
              Assign this record to a field officer for KYC verification
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="agent">Select Field Officer</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a field officer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent-1">Rajesh Patil - Field Officer</SelectItem>
                  <SelectItem value="agent-2">Sunil Kamble - Field Officer</SelectItem>
                  <SelectItem value="agent-3">Mahesh Deshmukh - Field Officer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Assignment Notes</Label>
              <Input
                id="notes"
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Add any specific instructions for the field officer"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAssignmentOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => assignKYC(selectedRecord?.id || '')} disabled={!selectedAgent}>
                Assign KYC
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Payment Slip</DialogTitle>
            <DialogDescription>
              Generate payment slip for {selectedRecord?.landowner_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div><strong>Survey Number:</strong> {selectedRecord?.survey_number}</div>
                <div><strong>Landowner:</strong> {selectedRecord?.landowner_name}</div>
                <div><strong>Amount:</strong> ₹{(selectedRecord?.total_compensation || 0) / 100000} Lakhs</div>
                <div><strong>KYC Status:</strong> {selectedRecord?.kyc_status}</div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
                Cancel
              </Button>
              <Button onClick={generatePaymentSlip} disabled={loading}>
                Generate Payment Slip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Blockchain Details Dialog */}
      <Dialog open={isBlockchainOpen} onOpenChange={setIsBlockchainOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Blockchain Entry Details</DialogTitle>
            <DialogDescription>
              Detailed view of blockchain entry
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {blockchainEntries.map((entry) => (
              <div key={entry.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Survey Number:</strong> {entry.survey_number}</div>
                  <div><strong>Event Type:</strong> {entry.event_type}</div>
                  <div><strong>Officer ID:</strong> {entry.officer_id}</div>
                  <div><strong>Timestamp:</strong> {new Date(entry.timestamp).toLocaleString()}</div>
                  <div><strong>Block Hash:</strong> <span className="font-mono">{entry.block_hash}</span></div>
                  <div><strong>Previous Hash:</strong> <span className="font-mono">{entry.previous_hash}</span></div>
                </div>
                {entry.metadata && (
                  <div className="mt-4">
                    <strong>Metadata:</strong>
                    <pre className="bg-white p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(entry.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KYCAssignmentManager;
