import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Hash, 
  Database, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  FileText,
  Award,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const BlockchainDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchSurvey, setSearchSurvey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockchainStatus, setBlockchainStatus] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any>(null);

  const loadBlockchainStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/blockchain/status');
      if (response.ok) {
        const data = await response.json();
        setBlockchainStatus(data.data);
        console.log('Blockchain status loaded:', data);
      }
    } catch (err) {
      console.error('Failed to load blockchain status:', err);
      setError('Failed to connect to blockchain service');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle missing data
  const formatFieldValue = (value: any, defaultValue: string = 'N/A') => {
    if (value === null || value === undefined || value === '' || value === 'Loading...') {
      return defaultValue;
    }
    return value;
  };

  const handleSearch = async () => {
    if (!searchSurvey.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      // First check if survey exists on blockchain
      const searchResponse = await fetch(`/api/blockchain/search/${searchSurvey}`, {
        headers: {
          'Authorization': 'Bearer demo-jwt-token'
        }
      });
      const searchData = await searchResponse.json();
      
      // Get timeline events
      const timelineResponse = await fetch(`/api/blockchain/timeline/${searchSurvey}`, {
        headers: {
          'Authorization': 'Bearer demo-jwt-token'
        }
      });
      const timelineData = await timelineResponse.json();
      
      // Get JMR data if available
      let jmrData = null;
      try {
        const jmrResponse = await fetch(`/api/jmr-blockchain?search=${searchSurvey}`);
        if (jmrResponse.ok) {
          jmrData = await jmrResponse.json();
        }
      } catch (err) {
        console.debug('JMR data not available for this survey');
      }
      
      // Log responses for debugging
      console.log('Blockchain search response:', searchResponse.status, searchData);
      console.log('Timeline response:', timelineResponse.status, timelineData);
      console.log('JMR response:', jmrData);
      
      // Combine the data
      const searchResults = {
        surveyNumber: searchSurvey,
        existsOnBlockchain: searchResponse.ok && searchData.data?.existsOnBlockchain,
        integrityStatus: searchResponse.ok && searchData.data?.integrityStatus?.isIntegrityValid,
        timelineCount: timelineResponse.ok ? (timelineData.data?.timeline || []).length : 0,
        lastChecked: new Date().toISOString(),
        ownerId: jmrData?.data?.records?.[0]?.owner_id || searchData?.data?.metadata?.owner_id || null,
        landType: jmrData?.data?.records?.[0]?.land_type || searchData?.data?.metadata?.land_type || null,
        area: jmrData?.data?.records?.[0]?.measured_area || searchData?.data?.metadata?.area || null
      };
      
      setSearchResults(searchResults);
      
      if (searchResults.timelineCount > 0) {
        toast.success(`Found ${searchResults.timelineCount} timeline events for survey ${searchSurvey}`);
      } else if (searchResults.existsOnBlockchain) {
        toast.info(`Survey ${searchSurvey} found on blockchain but has no timeline events`);
      } else {
        toast.warning(`Survey ${searchSurvey} not found on blockchain`);
      }
    } catch (err) {
      console.error('Failed to search survey:', err);
      
      // Set fallback data when API calls fail
      setSearchResults({
        surveyNumber: searchSurvey,
        existsOnBlockchain: false,
        integrityStatus: false,
        timelineCount: 0,
        lastChecked: new Date().toISOString(),
        ownerId: null,
        landType: null,
        area: null,
        error: err.message
      });
      
      setError('Failed to search survey on blockchain. Check console for details.');
      toast.error('Failed to search survey on blockchain');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlockchainStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blockchain Dashboard</h1>
          <p className="text-gray-600">Manage land records on the blockchain</p>
        </div>
        <Button 
          onClick={loadBlockchainStatus} 
          disabled={loading}
          variant="outline"
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh Status
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="search">Search & Verify</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Blockchain Status</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Connected
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatFieldValue(blockchainStatus?.network, 'Polygon Mumbai Testnet')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatFieldValue(blockchainStatus?.chainId, '80001')}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Chain ID
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Block</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatFieldValue(blockchainStatus?.blockNumber)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Latest Block
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gas Price</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatFieldValue(blockchainStatus?.gasPrice)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current Gas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Status Info */}
          {blockchainStatus && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Wallet Balance</p>
                    <p className="text-lg font-semibold">{formatFieldValue(blockchainStatus.walletBalance)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pending Transactions</p>
                    <p className="text-lg font-semibold">{formatFieldValue(blockchainStatus.pendingTransactions, '0')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                    <p className="text-lg font-semibold">{formatFieldValue(blockchainStatus.totalTransactions, '0')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Service Status</p>
                    <p className="text-lg font-semibold">{formatFieldValue(blockchainStatus.serviceStatus)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Survey on Blockchain</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Survey Number"
                  value={searchSurvey}
                  onChange={(e) => setSearchSurvey(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {/* Search Results */}
              {searchResults && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">Search Results for {searchResults.surveyNumber}</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Blockchain Status:</span>
                      <Badge variant={searchResults.existsOnBlockchain ? "default" : "secondary"} className="ml-2">
                        {searchResults.existsOnBlockchain ? "Found" : "Not Found"}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Integrity Status:</span>
                      <Badge variant={searchResults.integrityStatus ? "default" : "destructive"} className="ml-2">
                        {searchResults.integrityStatus ? "Valid" : "Compromised"}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Timeline Events:</span>
                      <span className="ml-2 font-semibold">{formatFieldValue(searchResults.timelineCount, '0')}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Owner ID:</span>
                      <span className="ml-2 font-semibold">{formatFieldValue(searchResults.ownerId)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Land Type:</span>
                      <span className="ml-2 font-semibold">{formatFieldValue(searchResults.landType)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Land Area:</span>
                      <span className="ml-2 font-semibold">{formatFieldValue(searchResults.area)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Last Checked:</span>
                      <span className="ml-2 font-semibold">{formatFieldValue(searchResults.lastChecked, 'Never')}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Survey Timeline</CardTitle>
              <CardDescription>Search for a survey number to view its complete timeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input for Timeline */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Survey Number to view timeline"
                  value={searchSurvey}
                  onChange={(e) => setSearchSurvey(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  Search Timeline
                </Button>
              </div>

              {/* Timeline Results */}
              {searchResults && searchResults.timelineCount > 0 ? (
                <div className="space-y-4">
                  <div className="text-center py-4 text-green-600">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-medium">Timeline Available</p>
                    <p className="text-sm">{searchResults.timelineCount} events found for survey {searchResults.surveyNumber}</p>
                  </div>
                  
                  {/* Survey Info Summary */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Survey Number:</span>
                          <p className="font-semibold">{searchResults.surveyNumber}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Owner ID:</span>
                          <p className="font-semibold">{formatFieldValue(searchResults.ownerId)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Land Type:</span>
                          <p className="font-semibold">{formatFieldValue(searchResults.landType)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Land Area:</span>
                          <p className="font-semibold">{formatFieldValue(searchResults.area)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Timeline Events */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Timeline Events</h3>
                    <div className="text-center py-4 text-blue-600">
                      <Clock className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Timeline events loaded from blockchain</p>
                      <p className="text-xs text-gray-500">Click "View All Events" to see complete timeline</p>
                    </div>
                    
                    <div className="text-center py-2 text-gray-500">
                      <p className="text-sm">Found {searchResults.timelineCount} timeline events</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          // Navigate to detailed timeline view
                          window.open(`/admin/blockchain/timeline/${searchResults.surveyNumber}`, '_blank');
                        }}
                      >
                        View All Events
                      </Button>
                    </div>
                  </div>
                </div>
              ) : searchResults && searchResults.timelineCount === 0 ? (
                <div className="text-center py-8 text-orange-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-orange-300" />
                  <p className="text-lg font-medium">No Timeline Events Found</p>
                  <p className="text-sm">Survey {searchResults.surveyNumber} exists but has no timeline events</p>
                  <p className="text-xs text-gray-500 mt-2">This survey may be newly created or not yet processed</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No Timeline Events</p>
                  <p className="text-sm">Search for a survey number to view its timeline</p>
                  <p className="text-xs text-gray-500 mt-2">Enter a survey number above and click "Search Timeline"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Survey Block</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Create a new survey block on the blockchain.
                </p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p><span className="font-medium">Survey Number:</span> {formatFieldValue(searchSurvey, 'N/A')}</p>
                  <p><span className="font-medium">Owner ID:</span> {formatFieldValue(searchResults?.ownerId)}</p>
                  <p><span className="font-medium">Land Type:</span> {formatFieldValue(searchResults?.landType)}</p>
                </div>
                <Button className="w-full" disabled={!searchSurvey.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Survey Block
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verify Integrity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Verify survey integrity.
                </p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p><span className="font-medium">Current Status:</span> {formatFieldValue(searchResults?.integrityStatus ? 'Valid' : 'Unknown', 'N/A')}</p>
                  <p><span className="font-medium">Last Checked:</span> {formatFieldValue(searchResults?.lastChecked, 'Never')}</p>
                  <p><span className="font-medium">Blockchain Status:</span> {formatFieldValue(searchResults?.existsOnBlockchain ? 'Found' : 'Not Found', 'N/A')}</p>
                </div>
                <Button className="w-full" variant="outline" disabled={!searchSurvey.trim()}>
                  <Shield className="h-4 w-4 mr-2" />
                  Verify Integrity
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlockchainDashboard;
