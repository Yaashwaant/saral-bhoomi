import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Hash, 
  Shield, 
  Eye, 
  Clock, 
  User, 
  MapPin, 
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Download,
  RefreshCw,
  ArrowLeft,
  ExternalLink
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

interface PropertyInfo {
  survey_number: string;
  current_owner?: string;
  land_type?: string;
  village?: string;
  taluka?: string;
  district?: string;
  total_area?: number;
}

interface TimelineEntry {
  id: number;
  event_type: string;
  timestamp: string;
  officer: string;
  details: string;
  status: 'success' | 'warning' | 'error' | 'info';
  metadata: any;
  blockchain_hash: string;
  is_valid: boolean;
}

const PropertyHistoryTimeline: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyInfo, setPropertyInfo] = useState<PropertyInfo | null>(null);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [integrityStatus, setIntegrityStatus] = useState<'verified' | 'compromised' | 'unknown'>('unknown');

  // Search for property by survey number
  const searchProperty = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a survey number');
      return;
    }

    setLoading(true);
    try {
      // Fetch blockchain ledger for the survey number
      const response = await fetch(`/api/blockchain/ledger/${searchTerm.trim()}`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.data.entries && data.data.entries.length > 0) {
          const entries = data.data.entries;
          
          // Extract property information from the first entry
          const firstEntry = entries[0];
          setPropertyInfo({
            survey_number: firstEntry.survey_number,
            land_type: firstEntry.metadata?.land_type || 'Unknown',
            village: firstEntry.metadata?.village || 'Unknown',
            taluka: firstEntry.metadata?.taluka || 'Unknown',
            district: firstEntry.metadata?.district || 'Unknown',
            total_area: firstEntry.metadata?.measured_area || 0
          });

          // Transform entries into timeline format
          const timelineData: TimelineEntry[] = entries.map((entry: BlockchainEntry, index: number) => {
            let status: 'success' | 'warning' | 'error' | 'info' = 'info';
            let details = '';

            // Determine status and details based on event type
            switch (entry.event_type) {
              case 'JMR_Measurement_Uploaded':
                status = 'success';
                details = `JMR measurement completed. Area: ${entry.metadata?.measured_area || 'N/A'} acres, Type: ${entry.metadata?.land_type || 'N/A'}`;
                break;
              case 'Notice_Generated':
                status = 'info';
                details = `Notice generated for land acquisition. Amount: ₹${entry.metadata?.amount || 'N/A'}`;
                break;
              case 'Payment_Slip_Created':
                status = 'warning';
                details = `Payment slip created. Status: ${entry.metadata?.status || 'Pending'}`;
                break;
              case 'Payment_Released':
                status = 'success';
                details = `Payment released successfully. Amount: ₹${entry.metadata?.amount || 'N/A'}`;
                break;
              case 'Payment_Failed':
                status = 'error';
                details = `Payment failed. Reason: ${entry.metadata?.failure_reason || 'Unknown'}`;
                break;
              case 'Ownership_Updated':
                status = 'info';
                details = `Ownership updated. New owner: ${entry.metadata?.new_owner || 'N/A'}`;
                break;
              case 'Award_Declared':
                status = 'success';
                details = `Land acquisition award declared. Amount: ₹${entry.metadata?.award_amount || 'N/A'}`;
                break;
              case 'Compensated':
                status = 'success';
                details = `Compensation completed. Amount: ₹${entry.metadata?.compensation_amount || 'N/A'}`;
                break;
              default:
                status = 'info';
                details = entry.remarks || 'Event recorded';
            }

            return {
              id: entry.id,
              event_type: entry.event_type,
              timestamp: entry.timestamp,
              officer: entry.officer?.name || `Officer ID: ${entry.officer_id}`,
              details,
              status,
              metadata: entry.metadata,
              blockchain_hash: entry.current_hash,
              is_valid: entry.is_valid
            };
          });

          setTimelineEntries(timelineData);
          
          // Check integrity status
          const validEntries = timelineData.filter(entry => entry.is_valid);
          if (validEntries.length === timelineData.length) {
            setIntegrityStatus('verified');
          } else if (validEntries.length === 0) {
            setIntegrityStatus('compromised');
          } else {
            setIntegrityStatus('compromised');
          }

          toast.success(`Found ${timelineData.length} blockchain entries for survey ${searchTerm}`);
        } else {
          setPropertyInfo(null);
          setTimelineEntries([]);
          setIntegrityStatus('unknown');
          toast.info(`No blockchain entries found for survey ${searchTerm}`);
        }
      } else {
        toast.error('Failed to fetch property history');
      }
    } catch (error) {
      console.error('Search property error:', error);
      toast.error('Failed to search property');
    } finally {
      setLoading(false);
    }
  };

  // Verify blockchain integrity for the property
  const verifyIntegrity = async () => {
    if (!propertyInfo?.survey_number) return;

    try {
      const response = await fetch(`/api/blockchain/verify/${propertyInfo.survey_number}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data.chain_valid) {
          setIntegrityStatus('verified');
          toast.success('Blockchain integrity verified successfully');
        } else {
          setIntegrityStatus('compromised');
          toast.error('Blockchain integrity compromised');
        }
        
        // Refresh timeline data
        searchProperty();
      } else {
        toast.error('Failed to verify blockchain integrity');
      }
    } catch (error) {
      console.error('Integrity verification failed:', error);
      toast.error('Failed to verify blockchain integrity');
    }
  };

  // Export property history
  const exportHistory = async () => {
    if (!propertyInfo?.survey_number) return;

    try {
      const csvData = [
        ['Survey Number', 'Event Type', 'Timestamp', 'Officer', 'Details', 'Status', 'Blockchain Hash'],
        ...timelineEntries.map(entry => [
          propertyInfo.survey_number,
          entry.event_type,
          entry.timestamp,
          entry.officer,
          entry.details,
          entry.status,
          entry.blockchain_hash
        ])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `property-history-${propertyInfo.survey_number}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Property history exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export property history');
    }
  };

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-blue-600" />;
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Property History Timeline</h1>
          <p className="text-muted-foreground">
            View complete blockchain ledger for any survey number
          </p>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Property Records</CardTitle>
          <CardDescription>
            Enter a survey number to view its complete blockchain history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="surveyNumber">Survey Number</Label>
              <Input
                id="surveyNumber"
                placeholder="Enter survey number (e.g., SY-2024-001)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchProperty()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={searchProperty} disabled={loading}>
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Information */}
      {propertyInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Property Information</CardTitle>
            <CardDescription>
              Survey Number: {propertyInfo.survey_number}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Village</p>
                  <p className="text-sm text-muted-foreground">{propertyInfo.village}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Taluka</p>
                  <p className="text-sm text-muted-foreground">{propertyInfo.taluka}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">District</p>
                  <p className="text-sm text-muted-foreground">{propertyInfo.district}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Land Type</p>
                  <p className="text-sm text-muted-foreground">{propertyInfo.land_type}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blockchain Integrity Status */}
      {propertyInfo && (
        <Alert className={integrityStatus === 'verified' ? 'border-green-500' : 'border-red-500'}>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Blockchain Verification:</strong> {
              integrityStatus === 'verified' 
                ? 'All entries passed integrity checks. No tampering detected.' 
                : integrityStatus === 'compromised'
                ? 'One or more entries have been tampered with. Hash verification failed.'
                : 'Verification status unknown.'
            }
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={verifyIntegrity}
            >
              <Shield className="h-4 w-4 mr-2" />
              Verify Integrity
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Timeline */}
      {timelineEntries.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Property History Timeline</CardTitle>
                <CardDescription>
                  {timelineEntries.length} blockchain entries showing complete property lifecycle
                </CardDescription>
              </div>
              <Button onClick={exportHistory} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export History
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {timelineEntries.map((entry, index) => (
                <div key={entry.id} className="flex space-x-4">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm"></div>
                    {index < timelineEntries.length - 1 && (
                      <div className="w-0.5 h-16 bg-gray-300 mt-2"></div>
                    )}
                  </div>

                  {/* Entry Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(entry.status)}
                        <Badge variant={getStatusBadgeVariant(entry.status)}>
                          {entry.event_type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{entry.officer}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{entry.details}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-mono text-muted-foreground">
                            {entry.blockchain_hash.substring(0, 16)}...
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant={entry.is_valid ? "default" : "destructive"}>
                            {entry.is_valid ? "Valid" : "Invalid"}
                          </Badge>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedEntry(entry)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Blockchain Entry Details</DialogTitle>
                                <DialogDescription>
                                  Detailed information for {entry.event_type}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Event Type</Label>
                                    <p className="text-sm text-muted-foreground">{entry.event_type}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Timestamp</Label>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(entry.timestamp).toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Officer</Label>
                                    <p className="text-sm text-muted-foreground">{entry.officer}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Status</Label>
                                    <Badge variant={entry.is_valid ? "default" : "destructive"}>
                                      {entry.is_valid ? "Valid" : "Invalid"}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium">Details</Label>
                                  <p className="text-sm text-muted-foreground">{entry.details}</p>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium">Blockchain Hash</Label>
                                  <p className="text-xs font-mono text-muted-foreground break-all">
                                    {entry.blockchain_hash}
                                  </p>
                                </div>
                                
                                {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                                  <div>
                                    <Label className="text-sm font-medium">Metadata</Label>
                                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                                      {JSON.stringify(entry.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {propertyInfo && timelineEntries.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No blockchain entries found for this property</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertyHistoryTimeline;
