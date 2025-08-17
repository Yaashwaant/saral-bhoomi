import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  FileText,
  Award,
  Banknote,
  Database,
  Filter,
  Search,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  MapPin,
  Hash,
  CheckCircle,
  AlertCircle,
  Clock,
  IndianRupee
} from 'lucide-react';
import { config } from '../../../config';

interface DashboardStats {
  totalLand: number;
  totalNotices: number;
  totalPayments: number;
  tribalCount: number;
  nonTribalCount: number;
  pendingPayments: number;
  successfulPayments: number;
  failedPayments: number;
}

interface JMRRecord {
  id: string;
  survey_number: string;
  measured_area: number;
  land_type: string;
  tribal_classification: string;
  category: string;
  status: string;
  blockchain_verified: boolean;
  created_at: string;
}

interface AwardRecord {
  id: string;
  survey_number: string;
  award_number: string;
  total_amount: number;
  land_type: string;
  tribal_classification: string;
  category: string;
  status: string;
  blockchain_verified: boolean;
  created_at: string;
}

interface NoticeRecord {
  id: string;
  survey_number: string;
  notice_number: string;
  notice_type: string;
  amount: number;
  notice_date: string;
  delivery_status: string;
  notice_status: string;
  blockchain_verified: boolean;
  created_at: string;
}

interface PaymentRecord {
  id: string;
  survey_number: string;
  payment_number: string;
  payment_type: string;
  amount: number;
  payment_status: string;
  payment_date: string;
  blockchain_verified: boolean;
  created_at: string;
}

interface BlockchainEntry {
  id: string;
  survey_number: string;
  event_type: string;
  officer_id: string;
  timestamp: string;
  data: any;
  current_hash: string;
}

const EnhancedDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useSaral();
  
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalLand: 0,
    totalNotices: 0,
    totalPayments: 0,
    tribalCount: 0,
    nonTribalCount: 0,
    pendingPayments: 0,
    successfulPayments: 0,
    failedPayments: 0
  });
  
  // Data states
  const [jmrRecords, setJmrRecords] = useState<JMRRecord[]>([]);
  const [awardRecords, setAwardRecords] = useState<AwardRecord[]>([]);
  const [noticeRecords, setNoticeRecords] = useState<NoticeRecord[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [blockchainEntries, setBlockchainEntries] = useState<BlockchainEntry[]>([]);
  
  // Filter states
  const [selectedOfficer, setSelectedOfficer] = useState<string>('');
  const [selectedTaluka, setSelectedTaluka] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedTribal, setSelectedTribal] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drill-down states
  const [selectedSurveyNumber, setSelectedSurveyNumber] = useState<string>('');
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [drillDownData, setDrillDownData] = useState<any>(null);

  const API_BASE_URL = config.API_BASE_URL;

  useEffect(() => {
    if (selectedProject) {
      loadDashboardData();
    }
  }, [selectedProject]);

  const loadDashboardData = async () => {
    if (!selectedProject) return;
    
    setLoading(true);
    try {
      // Load all data in parallel
      const [jmrRes, awardRes, noticeRes, paymentRes, blockchainRes] = await Promise.all([
        fetch(`${API_BASE_URL}/jmr/${selectedProject}`),
        fetch(`${API_BASE_URL}/awards/${selectedProject}`),
        fetch(`${API_BASE_URL}/notices/${selectedProject}`),
        fetch(`${API_BASE_URL}/payments/${selectedProject}`),
        fetch(`${API_BASE_URL}/blockchain/${selectedProject}`)
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
      
      if (blockchainRes.ok) {
        const blockchainData = await blockchainRes.json();
        setBlockchainEntries(blockchainData.data || []);
      }

      calculateStats();
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalLand = jmrRecords.reduce((sum, record) => sum + record.measured_area, 0);
    const totalNotices = noticeRecords.reduce((sum, record) => sum + record.amount, 0);
    const totalPayments = paymentRecords.reduce((sum, record) => sum + record.amount, 0);
    
    const tribalCount = jmrRecords.filter(record => record.tribal_classification === 'tribal').length;
    const nonTribalCount = jmrRecords.filter(record => record.tribal_classification === 'non-tribal').length;
    
    const pendingPayments = paymentRecords.filter(record => record.payment_status === 'pending').length;
    const successfulPayments = paymentRecords.filter(record => record.payment_status === 'completed').length;
    const failedPayments = paymentRecords.filter(record => record.payment_status === 'failed').length;

    setStats({
      totalLand,
      totalNotices,
      totalPayments,
      tribalCount,
      nonTribalCount,
      pendingPayments,
      successfulPayments,
      failedPayments
    });
  };

  const handleDrillDown = (surveyNumber: string) => {
    setSelectedSurveyNumber(surveyNumber);
    
    // Find all records for this survey number
    const jmr = jmrRecords.find(r => r.survey_number === surveyNumber);
    const award = awardRecords.find(r => r.survey_number === surveyNumber);
    const notice = noticeRecords.find(r => r.survey_number === surveyNumber);
    const payment = paymentRecords.find(r => r.survey_number === surveyNumber);
    const blockchain = blockchainEntries.filter(r => r.survey_number === surveyNumber);
    
    setDrillDownData({
      surveyNumber,
      jmr,
      award,
      notice,
      payment,
      blockchain
    });
    
    setShowDrillDown(true);
  };

  const getFilteredRecords = () => {
    let filtered = [...jmrRecords];
    
    if (selectedOfficer) {
      filtered = filtered.filter(record => record.id === selectedOfficer);
    }
    
    if (selectedTribal) {
      filtered = filtered.filter(record => record.tribal_classification === selectedTribal);
    }
    
    if (selectedStatus) {
      filtered = filtered.filter(record => record.status === selectedStatus);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.survey_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.land_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const projectOptions = projects.map(p => ({ 
    id: p.id, 
    name: (p as any).projectName || (p as any).name || p.id 
  }));

  const filteredRecords = getFilteredRecords();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Enhanced Dashboard - Land Records & Payments Tracking
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
            <>
              {/* Statistics Cards */}
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Land (Ha)</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalLand.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Measured area</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Notices</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{stats.totalNotices.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Notice amounts</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{stats.totalPayments.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Payment amounts</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tribal vs Non-Tribal</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.tribalCount}/{stats.nonTribalCount}</div>
                    <p className="text-xs text-muted-foreground">Tribal/Non-Tribal</p>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Status Breakdown */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Pending</span>
                        <Badge variant="outline">{stats.pendingPayments}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Successful</span>
                        <Badge variant="default">{stats.successfulPayments}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Failed</span>
                        <Badge variant="destructive">{stats.failedPayments}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Blockchain Status</CardTitle>
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Verified</span>
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {blockchainEntries.filter(e => e.id).length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Pending</span>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {blockchainEntries.filter(e => !e.id).length}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={loadDashboardData}
                        disabled={loading}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Data
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setActiveTab('records')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Records
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="records">Records</TabsTrigger>
                  <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {blockchainEntries.slice(0, 10).map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Hash className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="font-medium">Survey {entry.survey_number}</p>
                                <p className="text-sm text-gray-600">{entry.event_type}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">{new Date(entry.timestamp).toLocaleDateString()}</p>
                              <Badge variant={entry.id ? "default" : "secondary"}>
                                {entry.id ? "Verified" : "Pending"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="records" className="space-y-6">
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
                            placeholder="Search survey number or land type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tribal Classification</Label>
                          <Select value={selectedTribal} onValueChange={setSelectedTribal}>
                            <SelectTrigger>
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All</SelectItem>
                              <SelectItem value="tribal">Tribal</SelectItem>
                              <SelectItem value="non-tribal">Non-Tribal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Records Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Land Records ({filteredRecords.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Survey No.</TableHead>
                            <TableHead>Area (Ha)</TableHead>
                            <TableHead>Land Type</TableHead>
                            <TableHead>Tribal</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Blockchain</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRecords.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">{record.survey_number}</TableCell>
                              <TableCell>{record.measured_area}</TableCell>
                              <TableCell className="capitalize">{record.land_type}</TableCell>
                              <TableCell>
                                <Badge variant={record.tribal_classification === 'tribal' ? 'default' : 'secondary'}>
                                  {record.tribal_classification}
                                </Badge>
                              </TableCell>
                              <TableCell className="uppercase">{record.category}</TableCell>
                              <TableCell>
                                <Badge variant={record.status === 'approved' ? 'default' : 'secondary'}>
                                  {record.status}
                                </Badge>
                              </TableCell>
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
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDrillDown(record.survey_number)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="blockchain" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Blockchain Ledger</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {blockchainEntries.map((entry) => (
                          <div key={entry.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Hash className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Survey {entry.survey_number}</span>
                                <Badge variant="outline">{entry.event_type}</Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                {new Date(entry.timestamp).toLocaleString()}
                              </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Officer ID:</span> {entry.officer_id}
                              </div>
                              <div>
                                <span className="font-medium">Hash:</span> 
                                <span className="font-mono text-xs ml-2">{entry.current_hash?.slice(0, 16)}...</span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <span className="font-medium">Data:</span>
                              <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(entry.data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}

          {!selectedProject && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select a project to view the dashboard.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Drill-down Dialog */}
      <Dialog open={showDrillDown} onOpenChange={setShowDrillDown}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Survey Number: {selectedSurveyNumber}</DialogTitle>
            <DialogDescription>
              Complete lifecycle view for this survey number
            </DialogDescription>
          </DialogHeader>
          
          {drillDownData && (
            <div className="space-y-6">
              {/* JMR Record */}
              {drillDownData.jmr && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      JMR Record
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium">Area:</span> {drillDownData.jmr.measured_area} Ha</div>
                      <div><span className="font-medium">Land Type:</span> {drillDownData.jmr.land_type}</div>
                      <div><span className="font-medium">Tribal:</span> {drillDownData.jmr.tribal_classification}</div>
                      <div><span className="font-medium">Status:</span> {drillDownData.jmr.status}</div>
                      <div><span className="font-medium">Blockchain:</span> 
                        <Badge variant={drillDownData.jmr.blockchain_verified ? "default" : "secondary"} className="ml-2">
                          {drillDownData.jmr.blockchain_verified ? "Verified" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Award Record */}
              {drillDownData.award && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Award Record
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium">Award No:</span> {drillDownData.award.award_number}</div>
                      <div><span className="font-medium">Amount:</span> ₹{drillDownData.award.total_amount.toLocaleString()}</div>
                      <div><span className="font-medium">Status:</span> {drillDownData.award.status}</div>
                      <div><span className="font-medium">Blockchain:</span> 
                        <Badge variant={drillDownData.award.blockchain_verified ? "default" : "secondary"} className="ml-2">
                          {drillDownData.award.blockchain_verified ? "Verified" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notice Record */}
              {drillDownData.notice && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notice Record
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium">Notice No:</span> {drillDownData.notice.notice_number}</div>
                      <div><span className="font-medium">Type:</span> {drillDownData.notice.notice_type}</div>
                      <div><span className="font-medium">Amount:</span> ₹{drillDownData.notice.amount.toLocaleString()}</div>
                      <div><span className="font-medium">Status:</span> {drillDownData.notice.notice_status}</div>
                      <div><span className="font-medium">Blockchain:</span> 
                        <Badge variant={drillDownData.notice.blockchain_verified ? "default" : "secondary"} className="ml-2">
                          {drillDownData.notice.blockchain_verified ? "Verified" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Record */}
              {drillDownData.payment && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Payment Record
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium">Payment No:</span> {drillDownData.payment.payment_number}</div>
                      <div><span className="font-medium">Type:</span> {drillDownData.payment.payment_type}</div>
                      <div><span className="font-medium">Amount:</span> ₹{drillDownData.payment.amount.toLocaleString()}</div>
                      <div><span className="font-medium">Status:</span> {drillDownData.payment.payment_status}</div>
                      <div><span className="font-medium">Blockchain:</span> 
                        <Badge variant={drillDownData.payment.blockchain_verified ? "default" : "secondary"} className="ml-2">
                          {drillDownData.payment.blockchain_verified ? "Verified" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Blockchain Entries */}
              {drillDownData.blockchain && drillDownData.blockchain.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Blockchain Entries ({drillDownData.blockchain.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {drillDownData.blockchain.map((entry: BlockchainEntry, index: number) => (
                        <div key={index} className="border-l-2 border-blue-500 pl-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{entry.event_type}</span>
                            <span className="text-sm text-gray-600">
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Officer: {entry.officer_id} | Hash: {entry.current_hash?.slice(0, 16)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedDashboard;
