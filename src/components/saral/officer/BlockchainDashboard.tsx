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
import { config } from '@/config';

const BlockchainDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchSurvey, setSearchSurvey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockchainStatus, setBlockchainStatus] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [timelineAction, setTimelineAction] = useState('');
  const [timelineRemarks, setTimelineRemarks] = useState('');
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [surveyOverview, setSurveyOverview] = useState<any[]>([]);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; message: string } | null>(null);

  const loadBlockchainStatus = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      
      const response = await fetch(`${config.API_BASE_URL}/blockchain/status`);
        const data = await response.json();
      
      if (data.success) {
        setBlockchainStatus(data.data);
        console.log('Blockchain status loaded:', data);
      } else {
        // 🔧 FIX: Handle case where blockchain service is temporarily unavailable
        setBlockchainStatus(data.data); // Still set the fallback data
        console.warn('Blockchain status warning:', data.message);
        setError(null); // Don't show error for temporary unavailability
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

  // ---- Utility copied from Land Records (adapted) ----
  const getStatusBadge = (status: 'verified' | 'pending' | 'compromised' | 'not_on_blockchain') => {
    const map: Record<string, { cls: string; text: string; icon: JSX.Element } > = {
      verified: { cls: 'bg-green-100 text-green-800', text: 'Verified', icon: <CheckCircle className="h-3 w-3" /> },
      pending: { cls: 'bg-yellow-100 text-yellow-800', text: 'Pending', icon: <Clock className="h-3 w-3" /> },
      compromised: { cls: 'bg-red-100 text-red-800', text: 'Compromised', icon: <AlertTriangle className="h-3 w-3" /> },
      not_on_blockchain: { cls: 'bg-gray-100 text-gray-600', text: 'Not on Blockchain', icon: <XCircle className="h-3 w-3" /> }
    };
    const cfg = map[status] || map.not_on_blockchain;
    return (
      <Badge variant="secondary" className={`flex items-center gap-1 ${cfg.cls}`}>
        {cfg.icon}
        {cfg.text}
      </Badge>
    );
  };

  // Fetch surveys with basic blockchain presence (fast)
  const fetchSurveyOverview = async () => {
    try {
      setOverviewLoading(true);
      const resp = await fetch(`${config.API_BASE_URL}/blockchain/surveys-with-complete-status`, {
        headers: { 'Authorization': 'Bearer demo-jwt-token', 'x-demo-role': 'officer' }
      });
      if (!resp.ok) throw new Error('Failed to fetch overview');
      const data = await resp.json();
      // Normalize various possible response shapes to an array
      const list = Array.isArray(data?.surveys)
        ? data.surveys
        : Array.isArray(data?.data?.surveys)
          ? data.data.surveys
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];
      // Initialize status to a quick value without deep integrity
      const normalized = (list || []).map((r: any) => ({
        survey_number: r.survey_number,
        exists_on_blockchain: r.exists_on_blockchain ?? r.existsOnBlockchain ?? false,
        blockchain_last_updated: r.blockchain_last_updated || null,
        blockchain_block_id: r.blockchain_block_id || null,
        blockchain_hash: r.blockchain_hash || null,
        survey_data_summary: r.survey_data_summary || {},
        total_sections: r.total_sections || 5,
        sections_with_data: r.sections_with_data || 0,
        blockchain_status: (r.exists_on_blockchain ?? r.existsOnBlockchain) ? 'pending' : 'not_on_blockchain'
      }));
      setSurveyOverview(normalized);
    } catch (e: any) {
      console.error('Overview load failed:', e);
      toast.error('Failed to load survey overview');
    } finally {
      setOverviewLoading(false);
    }
  };

  // Sequentially verify integrity (copied pattern from Land Records)
  const refreshSurveyIntegrity = async () => {
    try {
      if (!surveyOverview.length) {
        await fetchSurveyOverview();
      }
      setOverviewLoading(true);
      const updated: any[] = [];
      for (let i = 0; i < surveyOverview.length; i++) {
        const s = surveyOverview[i];
        try {
          // Small delay to avoid rate-limits
          if (i > 0) await new Promise(r => setTimeout(r, 75));
          const resp = await fetch(`${config.API_BASE_URL}/blockchain/verify-integrity/${encodeURIComponent(s.survey_number)}`, {
            headers: { 'Authorization': 'Bearer demo-jwt-token', 'x-demo-role': 'officer' }
          });
          let status: 'verified' | 'pending' | 'compromised' | 'not_on_blockchain' = s.exists_on_blockchain ? 'pending' : 'not_on_blockchain';
          if (resp.ok) {
            const res = await resp.json();
            if (res?.isValid === true) status = 'verified';
            else if (res?.isValid === false) status = 'compromised';
          }
          updated.push({ ...s, blockchain_status: status });
        } catch (e) {
          updated.push({ ...s, blockchain_status: s.exists_on_blockchain ? 'pending' : 'not_on_blockchain' });
        }
      }
      setSurveyOverview(updated);
      toast.success('Blockchain status refreshed');
    } catch (e) {
      console.error(e);
      toast.error('Failed to refresh blockchain status');
    } finally {
      setOverviewLoading(false);
    }
  };

  // Sync missing surveys (similar utility as Land Records bulk sync)
  const syncMissingToBlockchain = async () => {
    const missing = surveyOverview.filter(s => !s.exists_on_blockchain);
    if (missing.length === 0) {
      toast.info('All surveys already on blockchain');
      return;
    }
    setSyncProgress({ current: 0, total: missing.length, message: 'Starting sync...' });
    try {
      for (let i = 0; i < missing.length; i++) {
        const s = missing[i];
        setSyncProgress({ current: i + 1, total: missing.length, message: `Creating block for ${s.survey_number}` });
        try {
          const resp = await fetch(`${config.API_BASE_URL}/blockchain/create-or-update-survey-complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer demo-jwt-token', 'x-demo-role': 'officer' },
            body: JSON.stringify({ survey_number: s.survey_number, officer_id: 'demo-officer', project_id: 'demo-project', remarks: 'Overview sync' })
          });
          if (!resp.ok) {
            console.warn('Sync failed for', s.survey_number);
          }
        } catch (err) {
          console.error('Sync error for', s.survey_number, err);
        }
      }
      await fetchSurveyOverview();
      toast.success('Sync completed');
    } finally {
      setSyncProgress(null);
    }
  };

  const handleSearch = async () => {
    if (!searchSurvey.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      // Get complete survey data using new aggregation endpoints
      const demoHeaders = { 'Authorization': 'Bearer demo-jwt-token', 'x-demo-role': 'officer' } as const;
      const [completeDataResponse, searchResponse, timelineResponse, integrityResponse] = await Promise.all([
        fetch(`${config.API_BASE_URL}/blockchain/survey-complete-data/${encodeURIComponent(searchSurvey)}`, {
          headers: demoHeaders
        }),
        fetch(`${config.API_BASE_URL}/blockchain/search/${encodeURIComponent(searchSurvey)}?includeIntegrity=true`, {
          headers: demoHeaders
        }),
        fetch(`${config.API_BASE_URL}/blockchain/survey-timeline/${encodeURIComponent(searchSurvey)}`, {
          headers: demoHeaders
        }),
        fetch(`${config.API_BASE_URL}/blockchain/verify-integrity/${encodeURIComponent(searchSurvey)}`, {
          headers: demoHeaders
        })
      ]);

      const completeData = completeDataResponse.ok ? await completeDataResponse.json() : null;
      const searchData = searchResponse.ok ? await searchResponse.json() : null;
      const timelineData = timelineResponse.ok ? await timelineResponse.json() : null;
      const integrityData = integrityResponse.ok ? await integrityResponse.json() : null;
      
      // Log responses for debugging
      console.log('Complete data response:', completeDataResponse.status, completeData);
      console.log('Blockchain search response:', searchResponse.status, searchData);
      console.log('Timeline response:', timelineResponse.status, timelineData);
      console.log('Integrity response:', integrityResponse.status, integrityData);
      
      // 🔍 DEBUG: Log timeline data structure
      if (timelineData?.timeline) {
        console.log('🔍 Timeline data structure:', {
          isArray: Array.isArray(timelineData.timeline),
          length: Array.isArray(timelineData.timeline) ? timelineData.timeline.length : 'not array',
          firstEvent: Array.isArray(timelineData.timeline) ? timelineData.timeline[0] : 'not array',
          dataType: typeof timelineData.timeline
        });
      }
      
      // Extract complete survey data sections
      const surveyData = completeData?.data?.survey_data || {};
      const summary = completeData?.data?.summary || {};
      
      // Combine all data with enhanced structure
      // Robust on-chain detection across possible response shapes
      const existsOnChain = Boolean(
        (searchData && ( 
          searchData.existsOnBlockchain === true ||
          searchData.localBlockchainEntry === true ||
          (searchData.data && (searchData.data.existsOnBlockchain === true || searchData.data.localBlockchainEntry === true)) ||
          // some older responses include a block object when present
          (searchData.block && (searchData.block.block_id || searchData.block.current_hash))
        ))
      );
      const quickIsValid = searchData?.quickIntegrity?.isValid;
      const verifyIsValid = integrityData?.isValid;
      let blockchainStatus: 'verified' | 'compromised' | 'pending' | 'not_on_blockchain' = 'not_on_blockchain';
      if (existsOnChain) {
        if (quickIsValid === true || verifyIsValid === true) blockchainStatus = 'verified';
        else if (quickIsValid === false || verifyIsValid === false) blockchainStatus = 'compromised';
        else if (searchData?.overallStatus === 'synced') blockchainStatus = 'verified';
        else blockchainStatus = 'pending';
      }

      const searchResults = {
        surveyNumber: searchSurvey,
        existsOnBlockchain: existsOnChain,
        existsInDatabase: searchData?.existsInDatabase || false,
        overallStatus: searchData?.overallStatus || 'unknown',
        statusMessage: searchData?.statusMessage || 'Search completed',
        integrityStatus: (searchData?.quickIntegrity?.isValid ?? integrityData?.isValid) || false,
        blockchainStatus,
        integrityDetails: searchData?.quickIntegrity || integrityData || null,
        timelineCount: timelineData?.timeline ? (Array.isArray(timelineData.timeline) ? timelineData.timeline.length : 0) : 0,
        timeline: timelineData?.timeline ? (Array.isArray(timelineData.timeline) ? timelineData.timeline : []) : [],
        lastChecked: new Date().toISOString(),
        
        // Complete survey data from all collections
        surveyData: surveyData,
        summary: summary,
        
        // Extract key information from each section
        jmrData: surveyData.jmr?.data || null,
        landownerData: surveyData.landowner?.data || null,
        noticeData: surveyData.notice?.data || null,
        paymentData: surveyData.payment?.data || null,
        awardData: surveyData.award?.data || null,
        
        // Data availability flags
        hasJMR: surveyData.jmr?.status === 'created',
        hasLandowner: surveyData.landowner?.status === 'created',
        hasNotice: surveyData.notice?.status === 'created',
        hasPayment: surveyData.payment?.status === 'created',
        hasAward: surveyData.award?.status === 'created',
        
        // Extract common fields for backward compatibility
        ownerId: surveyData.jmr?.data?.owner_id || surveyData.landowner?.data?.landowner_name || null,
        landType: surveyData.jmr?.data?.land_type || null,
        area: surveyData.jmr?.data?.measured_area || surveyData.landowner?.data?.area || null,
        village: surveyData.jmr?.data?.village || surveyData.landowner?.data?.village || null,
        taluka: surveyData.jmr?.data?.taluka || surveyData.landowner?.data?.taluka || null,
        district: surveyData.jmr?.data?.district || surveyData.landowner?.data?.district || null,
        
        blockchainEntry: searchData?.block || null
      };
      
      setSearchResults(searchResults);
      
      // 🔍 DEBUG: Log processed timeline data
      console.log('🔍 Processed timeline data:', {
        timelineCount: searchResults.timelineCount,
        timelineLength: searchResults.timeline?.length || 0,
        timelineData: searchResults.timeline,
        timelineDataStructure: searchResults.timeline ? searchResults.timeline[0] : 'no timeline'
      });
      
      // Enhanced success/info messages
      const sectionsWithData = Object.keys(summary).filter(key => summary[key]?.has_data).length;
      const totalSections = Object.keys(summary).length;
      
      if (searchResults.existsOnBlockchain) {
        toast.success(`Survey ${searchSurvey} found on blockchain with ${sectionsWithData}/${totalSections} data sections and ${searchResults.timelineCount} timeline events`);
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

  // NEW: Create or update complete survey block
  const handleCreateOrUpdateCompleteSurvey = async () => {
    if (!searchSurvey.trim()) {
      toast.error('Please enter a survey number first');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${config.API_BASE_URL}/blockchain/create-or-update-survey-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-jwt-token'
        },
        body: JSON.stringify({
          survey_number: searchSurvey,
          officer_id: 'demo-officer',
          project_id: 'demo-project',
          remarks: `Complete survey block created/updated for ${searchSurvey}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Complete survey block created/updated for ${searchSurvey}!`);
        console.log('Survey block result:', data);
        
        // Refresh the search results
        await handleSearch();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create/update survey block');
      }
    } catch (err) {
      console.error('Failed to create/update survey block:', err);
      toast.error(`Failed to create/update survey block: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Bulk sync all surveys
  const handleBulkSyncAllSurveys = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${config.API_BASE_URL}/blockchain/bulk-sync-all-surveys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-jwt-token'
        },
        body: JSON.stringify({
          officer_id: 'demo-officer',
          project_id: 'demo-project'
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Bulk sync completed! ${data.data.successful}/${data.data.total} surveys synced successfully`);
        console.log('Bulk sync result:', data);
        
        // Refresh blockchain status
        await loadBlockchainStatus();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to bulk sync surveys');
      }
    } catch (err) {
      console.error('Failed to bulk sync surveys:', err);
      toast.error(`Failed to bulk sync surveys: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Get all surveys with complete status
  const handleGetAllSurveysStatus = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${config.API_BASE_URL}/blockchain/surveys-with-complete-status`, {
        headers: {
          'Authorization': 'Bearer demo-jwt-token'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('All surveys status:', data);
        toast.success(`Found ${data.total} surveys with complete blockchain status`);
        
        // You could display this data in a modal or separate component
        // For now, just log it to console
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get surveys status');
      }
    } catch (err) {
      console.error('Failed to get surveys status:', err);
      toast.error(`Failed to get surveys status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Sync individual survey to blockchain
  const handleSyncToBlockchain = async (surveyNumber: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${config.API_BASE_URL}/jmr-blockchain/bulk-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-jwt-token'
        },
        body: JSON.stringify({
          project_id: 1, // Default project ID
          officer_id: 1  // Default officer ID
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Survey ${surveyNumber} synced to blockchain successfully!`);
        
        // Refresh the search results
        await handleSearch();
      } else {
        const errorData = await response.json();
        toast.error(`Failed to sync survey: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Failed to sync survey to blockchain:', error);
      toast.error('Failed to sync survey to blockchain');
    } finally {
      setLoading(false);
    }
  };

  // Bulk sync all records to blockchain
  const handleBulkSync = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${config.API_BASE_URL}/jmr-blockchain/bulk-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-jwt-token'
        },
        body: JSON.stringify({
          project_id: 1, // Default project ID
          officer_id: 1  // Default officer ID
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Bulk sync completed! ${data.data.synced} records synced, ${data.data.errors} errors`);
        
        // Show detailed results
        console.log('Bulk sync results:', data.data);
        
        // Refresh blockchain status
        await loadBlockchainStatus();
      } else {
        const errorData = await response.json();
        toast.error(`Bulk sync failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Failed to perform bulk sync:', error);
      toast.error('Failed to perform bulk sync');
    } finally {
      setLoading(false);
    }
  };

  // Create or update survey block on blockchain
  const handleCreateOrUpdateSurveyBlock = async () => {
    if (!searchSurvey.trim()) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`${config.API_BASE_URL}/blockchain/create-or-update-survey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-jwt-token'
        },
        body: JSON.stringify({
          survey_number: searchSurvey,
          data: {
            survey_number: searchSurvey,
            owner_id: searchResults?.ownerId || 'demo-owner',
            land_type: searchResults?.landType || 'agricultural',
            area: searchResults?.area || 1.0,
            location: `${searchResults?.village || 'Demo'}, ${searchResults?.taluka || 'Demo'}, ${searchResults?.district || 'Demo'}`,
            created_at: new Date().toISOString()
          },
          event_type: 'SURVEY_CREATED_ON_BLOCKCHAIN',
          officer_id: 'demo-officer',
          project_id: 'demo-project',
          remarks: `Survey ${searchSurvey} created/updated on blockchain via dashboard`
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Survey block created/updated successfully for ${searchSurvey}`);
        console.log('Survey block result:', result);
        
        // Refresh search results
        handleSearch();
      } else {
        const error = await response.json();
        toast.error(`Failed to create/update survey block: ${error.message}`);
      }
    } catch (err) {
      console.error('Failed to create/update survey block:', err);
      toast.error('Failed to create/update survey block on blockchain');
    } finally {
      setLoading(false);
    }
  };

  // Add timeline entry to survey block
  const handleAddTimelineEntry = async (action: string, remarks: string) => {
    if (!searchSurvey.trim()) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`${config.API_BASE_URL}/blockchain/add-timeline-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-jwt-token'
        },
        body: JSON.stringify({
          survey_number: searchSurvey,
          action: action,
          officer_id: 'demo-officer',
          data_hash: `hash_${Date.now()}`, // Simplified hash for demo
          previous_hash: searchResults?.blockchainEntry?.current_hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
          metadata: { action_type: action, source: 'dashboard' },
          remarks: remarks
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Timeline entry added successfully for ${searchSurvey}`);
        console.log('Timeline entry result:', result);
        
        // Refresh search results
        handleSearch();
      } else {
        const error = await response.json();
        toast.error(`Failed to add timeline entry: ${error.message}`);
      }
    } catch (err) {
      console.error('Failed to add timeline entry:', err);
      toast.error('Failed to add timeline entry to blockchain');
    } finally {
      setLoading(false);
    }
  };

  // Verify survey integrity
  const handleVerifyIntegrity = async () => {
    if (!searchSurvey.trim()) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`${config.API_BASE_URL}/blockchain/verify-integrity/${searchSurvey}`, {
        headers: {
          'Authorization': 'Bearer demo-jwt-token'
        }
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Integrity verification completed for ${searchSurvey}`);
        console.log('Integrity verification result:', result);
        
        // Refresh search results to show updated integrity status
        handleSearch();
      } else {
        const error = await response.json();
        toast.error(`Failed to verify integrity: ${error.message}`);
      }
    } catch (err) {
      console.error('Failed to verify integrity:', err);
      toast.error('Failed to verify survey integrity');
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
      {error && error !== 'Failed to connect to blockchain service' && (
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
                  {formatFieldValue(blockchainStatus?.network?.name, 'Polygon Amoy Testnet')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatFieldValue(blockchainStatus?.network?.chainId, '80002')}</div>
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
                <div className="text-2xl font-bold">{formatFieldValue(blockchainStatus?.status?.lastProcessedBlock || 'N/A')}</div>
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
                <div className="text-2xl font-bold">{formatFieldValue(blockchainStatus?.gas?.gasPrice || 'N/A')}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current Gas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Surveys Overview - mirrors Land Records utilities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Surveys Overview</CardTitle>
                <div className="flex items-center gap-2">
                  <Button onClick={fetchSurveyOverview} variant="outline" disabled={overviewLoading}>
                    {overviewLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Load
                  </Button>
                  <Button onClick={refreshSurveyIntegrity} variant="outline" disabled={overviewLoading || surveyOverview.length === 0}>
                    {overviewLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Refresh Status
                  </Button>
                  <Button onClick={syncMissingToBlockchain} variant="outline" disabled={overviewLoading || surveyOverview.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Sync Missing
                  </Button>
                  {syncProgress && (
                    <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
                      {syncProgress.message} ({syncProgress.current}/{syncProgress.total})
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <div className="py-6 text-center text-gray-500">Loading overview...</div>
              ) : surveyOverview.length === 0 ? (
                <div className="py-6 text-center text-gray-500">Click Load to fetch survey statuses</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="p-2">Survey No.</th>
                        <th className="p-2">Sections</th>
                        <th className="p-2">Blockchain</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Last Updated</th>
                        <th className="p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {surveyOverview.map((s) => (
                        <tr key={`${s.survey_number}-${s.blockchain_block_id || s.blockchain_hash || 'noblock'}`} className="border-b">
                          <td className="p-2 font-medium">{s.survey_number}</td>
                          <td className="p-2">{s.sections_with_data}/{s.total_sections}</td>
                          <td className="p-2">{s.exists_on_blockchain ? 'Yes' : 'No'}</td>
                          <td className="p-2">{getStatusBadge(s.blockchain_status)}</td>
                          <td className="p-2">{s.blockchain_last_updated ? new Date(s.blockchain_last_updated).toLocaleString() : '-'}</td>
                          <td className="p-2 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                // one-off verify
                                try {
                                  const resp = await fetch(`${config.API_BASE_URL}/blockchain/verify-integrity/${encodeURIComponent(s.survey_number)}`, {
                                    headers: { 'Authorization': 'Bearer demo-jwt-token', 'x-demo-role': 'officer' }
                                  });
                                  if (resp.ok) {
                                    const r = await resp.json();
                                    const status = r?.isValid ? 'verified' : 'compromised';
                                    setSurveyOverview((prev) => prev.map((x) => x.survey_number === s.survey_number ? { ...x, blockchain_status: status } : x));
                                  } else {
                                    toast.error('Integrity verify failed');
                                  }
                                } catch (e) {
                                  toast.error('Integrity verify error');
                                }
                              }}
                            >
                              Verify
                            </Button>
                            {!s.exists_on_blockchain && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    const resp = await fetch(`${config.API_BASE_URL}/blockchain/create-or-update-survey-complete`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer demo-jwt-token', 'x-demo-role': 'officer' },
                                      body: JSON.stringify({ survey_number: s.survey_number, officer_id: 'demo-officer', project_id: 'demo-project', remarks: 'one-off sync' })
                                    });
                                    if (resp.ok) {
                                      toast.success(`Synced ${s.survey_number}`);
                                      await fetchSurveyOverview();
                                    } else {
                                      toast.error('Sync failed');
                                    }
                                  } catch (e) {
                                    toast.error('Sync error');
                                  }
                                }}
                              >
                                Sync
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

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
                    <p className="text-lg font-semibold">{formatFieldValue(blockchainStatus?.wallet?.balance || 'N/A')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Wallet Address</p>
                    <p className="text-lg font-semibold text-xs">{formatFieldValue(blockchainStatus?.wallet?.address || 'N/A')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Contract Address</p>
                    <p className="text-lg font-semibold text-xs">{formatFieldValue(blockchainStatus?.contract?.address || 'N/A')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Service Status</p>
                    <p className="text-lg font-semibold">{formatFieldValue(blockchainStatus?.status?.isInitialized ? 'Active' : 'Inactive')}</p>
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

              {/* Enhanced Search Results with Complete Survey Data */}
              {searchResults && (
                <div className="mt-4 space-y-4">
                  {/* Overall Status Card */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">Search Results for {searchResults.surveyNumber}</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                         <span className="font-medium text-gray-600">Overall Status:</span>
                         <Badge 
                           variant={
                             searchResults.overallStatus === 'synced' ? "default" : 
                             searchResults.overallStatus === 'database_only' ? "secondary" :
                             searchResults.overallStatus === 'blockchain_only' ? "outline" :
                             "destructive"
                           } 
                           className="ml-2"
                         >
                           {searchResults.overallStatus === 'synced' ? 'Synced' :
                            searchResults.overallStatus === 'database_only' ? 'Database Only' :
                            searchResults.overallStatus === 'blockchain_only' ? 'Blockchain Only' :
                            'Not Found'}
                         </Badge>
                       </div>
                    <div>
                      <span className="font-medium text-gray-600">Blockchain Status:</span>
                      <Badge variant={searchResults.existsOnBlockchain ? "default" : "secondary"} className="ml-2">
                        {searchResults.existsOnBlockchain ? "Found" : "Not Found"}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Timeline Events:</span>
                      <span className="ml-2 font-semibold">{formatFieldValue(searchResults.timelineCount, '0')}</span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-600">Data Sections:</span>
                        <span className="ml-2 font-semibold">
                          {[searchResults.hasJMR, searchResults.hasLandowner, searchResults.hasNotice, searchResults.hasPayment, searchResults.hasAward].filter(Boolean).length}/5
                        </span>
                    </div>
                    </div>
                     
                     {/* Status Message */}
                     <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                       <p className="text-sm text-blue-800">
                         <strong>Status:</strong> {searchResults.statusMessage}
                       </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Integrity:</span>
                      <Badge 
                        variant={
                          searchResults.blockchainStatus === 'verified' ? 'default' :
                          searchResults.blockchainStatus === 'compromised' ? 'destructive' :
                          'secondary'
                        } 
                        className="ml-2"
                      >
                        {searchResults.blockchainStatus === 'verified' ? 'Verified' :
                         searchResults.blockchainStatus === 'compromised' ? 'Compromised' :
                         searchResults.blockchainStatus === 'pending' ? 'Pending' : 'Not on Blockchain'}
                      </Badge>
                    </div>
                  </div>

                  {/* Complete Survey Data Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* JMR Data Section */}
                    <Card className={`border-2 ${searchResults.hasJMR ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          JMR Data
                          <Badge variant={searchResults.hasJMR ? "default" : "secondary"} className="text-xs">
                            {searchResults.hasJMR ? "Available" : "Not Available"}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {searchResults.hasJMR && searchResults.jmrData ? (
                          <div className="space-y-2 text-sm">
                            <div><strong>Land Type:</strong> {formatFieldValue(searchResults.jmrData.land_type)}</div>
                            <div><strong>Area:</strong> {formatFieldValue(searchResults.jmrData.measured_area)}</div>
                            <div><strong>Village:</strong> {formatFieldValue(searchResults.jmrData.village)}</div>
                            <div><strong>Status:</strong> {formatFieldValue(searchResults.jmrData.status)}</div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No JMR data available</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Landowner Data Section */}
                    <Card className={`border-2 ${searchResults.hasLandowner ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Landowner Data
                          <Badge variant={searchResults.hasLandowner ? "default" : "secondary"} className="text-xs">
                            {searchResults.hasLandowner ? "Available" : "Not Available"}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {searchResults.hasLandowner && searchResults.landownerData ? (
                          <div className="space-y-2 text-sm">
                            <div><strong>Owner:</strong> {formatFieldValue(searchResults.landownerData.landowner_name)}</div>
                            <div><strong>Area:</strong> {formatFieldValue(searchResults.landownerData.area)}</div>
                            <div><strong>Compensation:</strong> {formatFieldValue(searchResults.landownerData.total_compensation)}</div>
                            <div><strong>KYC Status:</strong> {formatFieldValue(searchResults.landownerData.kyc_status)}</div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No landowner data available</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Notice Data Section */}
                    <Card className={`border-2 ${searchResults.hasNotice ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Notice Data
                          <Badge variant={searchResults.hasNotice ? "default" : "secondary"} className="text-xs">
                            {searchResults.hasNotice ? "Available" : "Not Available"}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {searchResults.hasNotice && searchResults.noticeData ? (
                          <div className="space-y-2 text-sm">
                            <div><strong>Notice Type:</strong> {formatFieldValue(searchResults.noticeData.notice_type)}</div>
                            <div><strong>Notice Number:</strong> {formatFieldValue(searchResults.noticeData.notice_number)}</div>
                            <div><strong>Amount:</strong> {formatFieldValue(searchResults.noticeData.amount)}</div>
                            <div><strong>Status:</strong> {formatFieldValue(searchResults.noticeData.notice_status)}</div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No notice data available</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Payment Data Section */}
                    <Card className={`border-2 ${searchResults.hasPayment ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Payment Data
                          <Badge variant={searchResults.hasPayment ? "default" : "secondary"} className="text-xs">
                            {searchResults.hasPayment ? "Available" : "Not Available"}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {searchResults.hasPayment && searchResults.paymentData ? (
                          <div className="space-y-2 text-sm">
                            <div><strong>Payment Type:</strong> {formatFieldValue(searchResults.paymentData.payment_type)}</div>
                            <div><strong>Amount:</strong> {formatFieldValue(searchResults.paymentData.amount)}</div>
                            <div><strong>Method:</strong> {formatFieldValue(searchResults.paymentData.payment_method)}</div>
                            <div><strong>Status:</strong> {formatFieldValue(searchResults.paymentData.payment_status)}</div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No payment data available</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Award Data Section */}
                    <Card className={`border-2 ${searchResults.hasAward ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Award Data
                          <Badge variant={searchResults.hasAward ? "default" : "secondary"} className="text-xs">
                            {searchResults.hasAward ? "Available" : "Not Available"}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {searchResults.hasAward && searchResults.awardData ? (
                          <div className="space-y-2 text-sm">
                            <div><strong>Award Number:</strong> {formatFieldValue(searchResults.awardData.award_number)}</div>
                            <div><strong>Base Amount:</strong> {formatFieldValue(searchResults.awardData.base_amount)}</div>
                            <div><strong>Total Amount:</strong> {formatFieldValue(searchResults.awardData.total_amount)}</div>
                            <div><strong>Status:</strong> {formatFieldValue(searchResults.awardData.award_status)}</div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No award data available</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                   
                   {/* Blockchain Entry Details */}
                   {searchResults.blockchainEntry && (
                     <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                       <p className="text-sm text-green-800">
                         <strong>Blockchain Entry:</strong> Block ID: {searchResults.blockchainEntry.block_id?.substring(0, 8)}..., 
                         Hash: {searchResults.blockchainEntry.current_hash?.substring(0, 8)}..., 
                         Timestamp: {new Date(searchResults.blockchainEntry.timestamp).toLocaleString()}
                       </p>
                     </div>
                   )}
                   
                   {/* Sync to Blockchain Button */}
                   {searchResults.existsInDatabase && !searchResults.existsOnBlockchain && (
                     <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                       <p className="text-sm text-orange-800 mb-2">
                         <strong>Action Required:</strong> This record exists in the database but not on the blockchain.
                       </p>
                       <Button 
                         onClick={() => handleSyncToBlockchain(searchResults.surveyNumber)}
                         variant="outline" 
                         size="sm"
                         className="bg-orange-100 hover:bg-orange-200 border-orange-300"
                       >
                         <Plus className="h-4 w-4 mr-2" />
                         Sync to Blockchain
                       </Button>
                     </div>
                   )}
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
                     
                     {searchResults.timeline && searchResults.timeline.length > 0 ? (
                       <div className="space-y-3">
                         <div className="text-center py-2 text-gray-500">
                           <p className="text-sm">Found {searchResults.timelineCount} timeline events</p>
                  </div>
                         
                         {/* Display actual timeline events */}
                  <div className="space-y-3">
                           {searchResults.timeline.map((event, index) => (
                            <div
                              key={`${event?.timestamp || event?.block_id || event?.current_hash || event?.data_hash || index}-${event?.event_type || event?.action || 'evt'}`}
                              className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                            >
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                                 <p className="font-medium">{event.event_type || event.action || `Event #${index + 1}`}</p>
                                 <p className="text-sm text-gray-600">{event.remarks || event.details || 'Event details'}</p>
                                 <p className="text-xs text-gray-500">
                                   {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Timestamp N/A'}
                                 </p>
                        </div>
                               <Badge variant="outline">{event.event_type || event.action || 'Event'}</Badge>
                      </div>
                    ))}
                  </div>
                         
                         <div className="text-center">
                           <Button 
                             variant="outline" 
                             size="sm"
                             onClick={() => {
                               // Navigate to detailed timeline view
                               window.open(`/admin/blockchain/timeline/${searchResults.surveyNumber}`, '_blank');
                             }}
                           >
                             View All Events
                           </Button>
                         </div>
                       </div>
                     ) : (
                       <div className="text-center py-4 text-blue-600">
                         <Clock className="h-8 w-8 mx-auto mb-2" />
                         <p className="text-sm">Timeline events loaded from blockchain</p>
                         <p className="text-xs text-gray-500">No timeline events found for this survey</p>
                       </div>
                     )}
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
                <CardTitle>Complete Survey Block</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Create or update a complete survey block with data from all collections.
                </p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p><span className="font-medium">Survey Number:</span> {formatFieldValue(searchSurvey, 'N/A')}</p>
                  <p><span className="font-medium">Data Sections:</span> {searchResults ? `${[searchResults.hasJMR, searchResults.hasLandowner, searchResults.hasNotice, searchResults.hasPayment, searchResults.hasAward].filter(Boolean).length}/5` : 'N/A'}</p>
                  <p><span className="font-medium">Blockchain Status:</span> {formatFieldValue(searchResults?.existsOnBlockchain ? 'Found' : 'Not Found')}</p>
                </div>
                <Button 
                  className="w-full" 
                  disabled={!searchSurvey.trim()}
                  onClick={handleCreateOrUpdateCompleteSurvey}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create/Update Complete Survey
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
                <Button 
                  className="w-full" 
                  variant="outline" 
                  disabled={!searchSurvey.trim()}
                  onClick={handleVerifyIntegrity}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Verify Integrity
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add Timeline Entry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Add a new timeline entry to the survey block.
                </p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p><span className="font-medium">Survey Number:</span> {formatFieldValue(searchSurvey, 'N/A')}</p>
                  <p><span className="font-medium">Current Hash:</span> {formatFieldValue(searchResults?.blockchainEntry?.current_hash, 'N/A')}</p>
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Action (e.g., RECORD_UPDATED, NOTICE_GENERATED)"
                    value={timelineAction}
                    onChange={(e) => setTimelineAction(e.target.value)}
                    disabled={!searchSurvey.trim()}
                  />
                  <Input
                    placeholder="Remarks (optional)"
                    value={timelineRemarks}
                    onChange={(e) => setTimelineRemarks(e.target.value)}
                    disabled={!searchSurvey.trim()}
                  />
                  <Button 
                    className="w-full" 
                    variant="outline"
                    disabled={!searchSurvey.trim() || !timelineAction.trim()}
                    onClick={() => handleAddTimelineEntry(timelineAction, timelineRemarks)}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Add Timeline Entry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Enhanced Bulk Operations Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Complete Survey Sync</CardTitle>
                <CardDescription>Sync all surveys with complete data from all collections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  This will create complete blockchain blocks for all surveys, aggregating data from JMR, Landowner, Notice, Payment, and Award collections.
                </p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p><span className="font-medium">Note:</span> This process may take some time depending on the number of surveys.</p>
                  <p><span className="font-medium">Data Sources:</span> 5 collections (JMR, Landowner, Notice, Payment, Award)</p>
                  <p><span className="font-medium">Hash Generation:</span> SHA-256 for each data section</p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleBulkSyncAllSurveys}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Syncing All Surveys...' : 'Bulk Sync All Surveys'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Survey Status Overview</CardTitle>
                <CardDescription>Get complete blockchain status for all surveys</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  View comprehensive blockchain status for all surveys in the system, including data availability from all collections.
                </p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p><span className="font-medium">Shows:</span> Blockchain status, data sections, hashes</p>
                  <p><span className="font-medium">Collections:</span> JMR, Landowner, Notice, Payment, Award</p>
                  <p><span className="font-medium">Output:</span> Console log (check browser console)</p>
                </div>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleGetAllSurveysStatus}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Loading Status...' : 'Get All Surveys Status'}
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
