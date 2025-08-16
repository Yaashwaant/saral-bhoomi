import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Shield, 
  FileText, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Hash,
  Eye,
  RefreshCw,
  Download,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface BlockchainEntry {
  id: number;
  block_id: string;
  survey_number: string;
  event_type: string;
  officer_id: number;
  timestamp: string;
  metadata: any;
  previous_hash: string;
  current_hash: string;
  nonce: number;
  project_id: number;
  remarks: string;
  is_valid: boolean;
  officer?: {
    name: string;
    designation: string;
    district: string;
    taluka: string;
  };
  project?: {
    name: string;
    description: string;
  };
}

interface BlockchainStats {
  total_entries: number;
  valid_entries: number;
  invalid_entries: number;
  integrity_rate: number;
  event_type_distribution: Array<{
    event_type: string;
    count: number;
  }>;
  officer_activity: Array<{
    officer_id: number;
    count: number;
    officer: {
      name: string;
      designation: string;
    };
  }>;
  blockchain_status: {
    connected: boolean;
    network: string;
    chainId: number;
    blockNumber: string;
    gasPrice: string;
  };
}

interface JMRRecord {
  id: number;
  survey_number: string;
  measured_area: number;
  land_type: string;
  tribal_classification: boolean;
  village: string;
  taluka: string;
  district: string;
  status: string;
  blockchain_verified: boolean;
  blockchain_hash: string;
  blockchain_timestamp: string;
  project?: {
    name: string;
    description: string;
  };
}

const BlockchainDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [blockchainStats, setBlockchainStats] = useState<BlockchainStats | null>(null);
  const [recentEntries, setRecentEntries] = useState<BlockchainEntry[]>([]);
  const [jmrRecords, setJmrRecords] = useState<JMRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterEventType, setFilterEventType] = useState('');
  const [filterOfficer, setFilterOfficer] = useState('');
  const [verifyingIntegrity, setVerifyingIntegrity] = useState(false);

  // Fetch blockchain statistics
  const fetchBlockchainStats = async () => {
    try {
      const response = await fetch('/api/blockchain/stats');
      if (response.ok) {
        const data = await response.json();
        setBlockchainStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch blockchain stats:', error);
      toast.error('Failed to fetch blockchain statistics');
    }
  };

  // Fetch recent blockchain entries
  const fetchRecentEntries = async () => {
    try {
      const response = await fetch('/api/blockchain/ledger/all?limit=20');
      if (response.ok) {
        const data = await response.json();
        setRecentEntries(data.data.entries || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent entries:', error);
      toast.error('Failed to fetch recent blockchain entries');
    }
  };

  // Fetch JMR records with blockchain verification
  const fetchJMRRecords = async () => {
    try {
      const response = await fetch('/api/jmr-blockchain');
      if (response.ok) {
        const data = await response.json();
        setJmrRecords(data.data.records || []);
      }
    } catch (error) {
      console.error('Failed to fetch JMR records:', error);
      toast.error('Failed to fetch JMR records');
    }
  };

  // Verify blockchain integrity for a survey number
  const verifyIntegrity = async (surveyNumber: string) => {
    setVerifyingIntegrity(true);
    try {
      const response = await fetch(`/api/blockchain/verify/${surveyNumber}`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(`Integrity verification completed for ${surveyNumber}`);
        // Refresh data
        await Promise.all([fetchBlockchainStats(), fetchRecentEntries()]);
      } else {
        toast.error('Failed to verify blockchain integrity');
      }
    } catch (error) {
      console.error('Integrity verification failed:', error);
      toast.error('Failed to verify blockchain integrity');
    } finally {
      setVerifyingIntegrity(false);
    }
  };

  // Get blockchain ledger for a specific survey number
  const getSurveyLedger = async (surveyNumber: string) => {
    try {
      const response = await fetch(`/api/blockchain/ledger/${surveyNumber}`);
      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (error) {
      console.error('Failed to fetch survey ledger:', error);
      toast.error('Failed to fetch survey ledger');
    }
    return null;
  };

  // Refresh all data
  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBlockchainStats(),
        fetchRecentEntries(),
        fetchJMRRecords()
      ]);
      toast.success('Dashboard data refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Export blockchain data
  const exportBlockchainData = async () => {
    try {
      const response = await fetch('/api/blockchain/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blockchain-data-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Blockchain data exported successfully');
      }
    } catch (error) {
      console.error('Failed to export blockchain data:', error);
      toast.error('Failed to export blockchain data');
    }
  };

  // Filter entries based on search and filters
  const filteredEntries = recentEntries.filter(entry => {
    const matchesSearch = entry.survey_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.remarks.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = !filterProject || entry.project_id.toString() === filterProject;
    const matchesEventType = !filterEventType || entry.event_type === filterEventType;
    const matchesOfficer = !filterOfficer || entry.officer_id.toString() === filterOfficer;
    
    return matchesSearch && matchesProject && matchesEventType && matchesOfficer;
  });

  // Filter JMR records
  const filteredJMRRecords = jmrRecords.filter(record => {
    const matchesSearch = record.survey_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.taluka.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = !filterProject || record.project?.name.toLowerCase().includes(filterProject.toLowerCase());
    const matchesLandType = !filterEventType || record.land_type === filterEventType;
    
    return matchesSearch && matchesProject && matchesLandType;
  });

  useEffect(() => {
    refreshData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading blockchain dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Blockchain Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of land records blockchain integrity
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportBlockchainData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Blockchain Status Alert */}
      {blockchainStats?.blockchain_status && (
        <Alert className={blockchainStats.blockchain_status.connected ? 'border-green-500' : 'border-red-500'}>
          <Database className="h-4 w-4" />
          <AlertDescription>
            <strong>Blockchain Status:</strong> {blockchainStats.blockchain_status.connected ? 'Connected' : 'Disconnected'} 
            to {blockchainStats.blockchain_status.network} (Chain ID: {blockchainStats.blockchain_status.chainId})
            {blockchainStats.blockchain_status.connected && (
              <> • Block: {blockchainStats.blockchain_status.blockNumber} • Gas: {blockchainStats.blockchain_status.gasPrice}</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockchainStats?.total_entries || 0}</div>
            <p className="text-xs text-muted-foreground">
              Blockchain ledger entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integrity Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockchainStats?.integrity_rate || 0}%</div>
            <Progress value={blockchainStats?.integrity_rate || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground">
              Valid entries percentage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valid Entries</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{blockchainStats?.valid_entries || 0}</div>
            <p className="text-xs text-muted-foreground">
              Untampered records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invalid Entries</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{blockchainStats?.invalid_entries || 0}</div>
            <p className="text-xs text-muted-foreground">
              Compromised records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ledger">Blockchain Ledger</TabsTrigger>
          <TabsTrigger value="jmr">JMR Records</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Event Type Distribution</CardTitle>
                <CardDescription>Blockchain events by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {blockchainStats?.event_type_distribution.map((event, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{event.event_type}</span>
                      <Badge variant="secondary">{event.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Officer Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Officer Activity</CardTitle>
                <CardDescription>Most active field officers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {blockchainStats?.officer_activity.slice(0, 5).map((officer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{officer.officer.name}</p>
                        <p className="text-xs text-muted-foreground">{officer.officer.designation}</p>
                      </div>
                      <Badge variant="outline">{officer.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Blockchain Activity</CardTitle>
              <CardDescription>Latest entries in the blockchain ledger</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{entry.survey_number}</p>
                        <p className="text-sm text-muted-foreground">{entry.event_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={entry.is_valid ? "default" : "destructive"}>
                        {entry.is_valid ? "Valid" : "Invalid"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blockchain Ledger Tab */}
        <TabsContent value="ledger" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Survey number or remarks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="project">Project</Label>
                  <Select value={filterProject} onValueChange={setFilterProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="All projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All projects</SelectItem>
                      {/* Add project options here */}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select value={filterEventType} onValueChange={setFilterEventType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All events</SelectItem>
                      <SelectItem value="JMR_Measurement_Uploaded">JMR Measurement</SelectItem>
                      <SelectItem value="Notice_Generated">Notice Generated</SelectItem>
                      <SelectItem value="Payment_Slip_Created">Payment Slip</SelectItem>
                      <SelectItem value="Payment_Released">Payment Released</SelectItem>
                      <SelectItem value="Payment_Failed">Payment Failed</SelectItem>
                      <SelectItem value="Ownership_Updated">Ownership Updated</SelectItem>
                      <SelectItem value="Award_Declared">Award Declared</SelectItem>
                      <SelectItem value="Compensated">Compensated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="officer">Officer</Label>
                  <Select value={filterOfficer} onValueChange={setFilterOfficer}>
                    <SelectTrigger>
                      <SelectValue placeholder="All officers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All officers</SelectItem>
                      {/* Add officer options here */}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Entries Table */}
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Ledger Entries</CardTitle>
              <CardDescription>
                Showing {filteredEntries.length} of {recentEntries.length} entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Block ID</TableHead>
                    <TableHead>Survey Number</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Officer</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-xs">
                        {entry.block_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="font-medium">{entry.survey_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.event_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {entry.officer?.name || `ID: ${entry.officer_id}`}
                      </TableCell>
                      <TableCell>
                        {new Date(entry.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.is_valid ? "default" : "destructive"}>
                          {entry.is_valid ? "Valid" : "Invalid"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => getSurveyLedger(entry.survey_number)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => verifyIntegrity(entry.survey_number)}
                            disabled={verifyingIntegrity}
                          >
                            <Shield className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* JMR Records Tab */}
        <TabsContent value="jmr" className="space-y-4">
          {/* JMR Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>JMR Records with Blockchain Verification</CardTitle>
              <CardDescription>
                Joint Measurement Records and their blockchain status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Survey Number</TableHead>
                    <TableHead>Area (acres)</TableHead>
                    <TableHead>Land Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Blockchain</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJMRRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.survey_number}</TableCell>
                      <TableCell>{record.measured_area}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.land_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{record.village}</p>
                          <p className="text-muted-foreground">
                            {record.taluka}, {record.district}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.status === 'approved' ? "default" : "secondary"}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {record.blockchain_verified ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {record.blockchain_verified ? "Verified" : "Not Verified"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => getSurveyLedger(record.survey_number)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Ledger
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Integrity Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Integrity Trends</CardTitle>
                <CardDescription>Blockchain integrity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Integrity trend charts coming soon</p>
                </div>
              </CardContent>
            </Card>

            {/* Officer Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Officer Performance</CardTitle>
                <CardDescription>Field officer activity metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Officer performance metrics coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlockchainDashboard;
