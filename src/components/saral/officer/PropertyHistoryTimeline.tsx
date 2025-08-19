import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Search,
  Hash,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  User,
  FileText,
  Award,
  Banknote,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  eventType: string;
  timestamp: Date;
  officer: string;
  metadata: any;
  dataHash: string;
  currentHash: string;
  previousHash: string;
}

interface SurveyData {
  surveyNumber: string;
  ownerId: string;
  landType: string;
  landArea: string;
  location: string;
  projectDetails: string;
  lastUpdated: Date;
  isActive: boolean;
}

interface BlockchainVerification {
  isValid: boolean;
  reason: string;
  blockchainData?: SurveyData;
  timelineData?: TimelineEvent[];
  currentHash?: string;
}

const PropertyHistoryTimeline: React.FC = () => {
  const [surveyNumber, setSurveyNumber] = useState('');
  const [searchResults, setSearchResults] = useState<SurveyData | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [blockchainVerification, setBlockchainVerification] = useState<BlockchainVerification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!surveyNumber.trim()) {
      toast.error('Please enter a survey number');
      return;
    }

    setIsSearching(true);
    setIsLoading(true);

    try {
      // Search for survey data
      const response = await fetch(`/api/blockchain/ledger/${surveyNumber}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data);
        setTimelineEvents(data.timeline || []);
        setBlockchainVerification(data.integrity || null);
      } else {
        toast.error('Survey number not found');
        setSearchResults(null);
        setTimelineEvents([]);
        setBlockchainVerification(null);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search for survey number');
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'Award_Declared':
        return <Award className="h-5 w-5 text-yellow-500" />;
      case 'Notice_Generated':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'Payment_Released':
        return <Banknote className="h-5 w-5 text-green-500" />;
      case 'JMR_Measurement_Uploaded':
        return <MapPin className="h-5 w-5 text-purple-500" />;
      case 'Ownership_Updated':
        return <User className="h-5 w-5 text-indigo-500" />;
      case 'Compensated':
        return <Banknote className="h-5 w-5 text-emerald-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'Award_Declared':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Notice_Generated':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Payment_Released':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'JMR_Measurement_Uploaded':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Ownership_Updated':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Compensated':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(timestamp);
  };

  const truncateHash = (hash: string, length: number = 16) => {
    if (!hash) return 'N/A';
    return hash.length > length ? `${hash.substring(0, length)}...` : hash;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Property History Timeline</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Search for property details and view complete ledger history with blockchain verification
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Property Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="surveyNumber">Property Number</Label>
                <Input
                  id="surveyNumber"
                  placeholder="Enter property number (e.g., PR-001)"
                  value={surveyNumber}
                  onChange={(e) => setSurveyNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {isLoading && (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-purple-600" />
              <p className="text-gray-600">Loading property information...</p>
            </CardContent>
          </Card>
        )}

        {searchResults && !isLoading && (
          <>
            {/* Current Owner Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Current Owner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{searchResults.ownerId}</p>
                      <p className="text-sm text-gray-600">Property Number: {searchResults.surveyNumber}</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Land Type:</span> {searchResults.landType}</div>
                    <div><span className="font-medium">Land Area:</span> {searchResults.landArea}</div>
                    <div><span className="font-medium">Location:</span> {searchResults.location}</div>
                    <div><span className="font-medium">Last Updated:</span> {formatTimestamp(searchResults.lastUpdated)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Blockchain Verification Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-4" />
                  Blockchain Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                {blockchainVerification?.isValid ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Blockchain Verified - Records Authentic</strong><br />
                      All {timelineEvents.length} survey entries passed integrity checks. No tampering detected.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Blockchain Integrity Compromised</strong><br />
                      One or more entries have been tampered with. Hash verification failed.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Property History Timeline Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-4" />
                  Property History Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timelineEvents.length > 0 ? (
                  <div className="space-y-6">
                    {timelineEvents.map((event, index) => (
                      <div key={event.id} className="flex gap-4">
                        {/* Timeline Line */}
                        <div className="flex flex-col items-center">
                          <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                            {getEventIcon(event.eventType)}
                          </div>
                          {index < timelineEvents.length - 1 && (
                            <div className="w-0.5 h-16 bg-purple-200 mt-2"></div>
                          )}
                        </div>

                        {/* Event Card */}
                        <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className="flex items-start justify-between mb-3">
                            <Badge className={`${getEventColor(event.eventType)}`}>
                              {event.eventType.replace(/_/g, ' ')}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatTimestamp(event.timestamp)}
                            </span>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">Owner:</span> {event.metadata?.ownerId || 'N/A'}</div>
                            <div><span className="font-medium">Survey Number:</span> {event.metadata?.surveyNumber || searchResults.surveyNumber}</div>
                            <div><span className="font-medium">Land Type:</span> {event.metadata?.landType || searchResults.landType}</div>
                            
                            {event.metadata?.details && (
                              <div className="mt-3 p-3 bg-gray-50 rounded border">
                                <span className="font-medium">Details:</span>
                                <p className="text-gray-700 mt-1">{event.metadata.details}</p>
                              </div>
                            )}

                            {/* Hash Information */}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="grid md:grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="font-medium">Data Hash:</span>
                                  <span className="font-mono ml-2 text-purple-600">
                                    {truncateHash(event.dataHash)}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium">Block Hash:</span>
                                  <span className="font-mono ml-2 text-blue-600">
                                    {truncateHash(event.currentHash)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No timeline events found for this property</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!searchResults && !isLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Enter a property number above to view its history and timeline</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PropertyHistoryTimeline;
