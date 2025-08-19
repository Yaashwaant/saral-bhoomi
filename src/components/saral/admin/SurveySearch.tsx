import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, CheckCircle, AlertTriangle, XCircle, Eye, History } from 'lucide-react';
import { toast } from 'sonner';

interface SurveySearchResult {
  surveyNumber: string;
  existsOnBlockchain: boolean;
  integrityStatus: {
    isIntegrityValid: boolean;
    lastChecked: Date | null;
    compromiseReason: string;
  };
  timelineCount: number;
}

const SurveySearch: React.FC = () => {
  const [surveyNumber, setSurveyNumber] = useState('');
  const [searchResults, setSearchResults] = useState<SurveySearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!surveyNumber.trim()) {
      toast.error('Please enter a survey number');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/blockchain/search/${surveyNumber.trim()}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
        toast.success('Survey search completed');
      } else {
        setError(data.message || 'Failed to search survey');
        setSearchResults(null);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search survey. Please try again.');
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
          <Search className="w-8 h-8" />
          Survey Number Lookup
        </h1>
        <p className="text-muted-foreground mt-2">
          Search for survey details and view complete ledger history
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Search Survey Records</CardTitle>
          <CardDescription>
            Enter a survey number to view blockchain status and integrity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter survey number (e.g., SN-2024-001)"
              value={surveyNumber}
              onChange={(e) => setSurveyNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="w-4 h-4 mr-2" />
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchResults && (
        <div className="space-y-4">
          {/* Current Survey Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Survey Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Survey Number:</span>
                  <p className="text-lg font-semibold">{searchResults.surveyNumber}</p>
                </div>
                <div>
                  <span className="font-medium">Blockchain Status:</span>
                  <Badge 
                    variant={searchResults.existsOnBlockchain ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {searchResults.existsOnBlockchain ? 'On Blockchain' : 'Not on Blockchain'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Timeline Events:</span>
                  <p className="text-lg">{searchResults.timelineCount}</p>
                </div>
                <div>
                  <span className="font-medium">Last Checked:</span>
                  <p className="text-sm text-muted-foreground">
                    {searchResults.integrityStatus.lastChecked 
                      ? new Date(searchResults.integrityStatus.lastChecked).toLocaleString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Blockchain Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              {searchResults.integrityStatus.isIntegrityValid ? (
                <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Blockchain Verified - Records Authentic</span>
                  </div>
                  <p className="text-green-700 mt-1">
                    All survey entries passed integrity checks. No tampering detected.
                  </p>
                </div>
              ) : (
                <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold">▲ Blockchain Integrity Compromised</span>
                  </div>
                  <p className="text-red-700 mt-1">
                    {searchResults.integrityStatus.compromiseReason || 'One or more entries have been tampered with. Hash verification failed.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button 
              variant="outline" 
              onClick={() => window.open(`/admin/blockchain/timeline/${searchResults.surveyNumber}`, '_blank')}
            >
              <History className="w-4 h-4 mr-2" />
              View Timeline
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open(`/admin/blockchain/integrity/${searchResults.surveyNumber}`, '_blank')}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Verify Integrity
            </Button>
          </div>
        </div>
      )}

      {/* Search Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Search Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• Enter the exact survey number as recorded in your system</li>
            <li>• Survey numbers are case-sensitive</li>
            <li>• Use the format: SN-YYYY-XXX or your custom format</li>
            <li>• Check the timeline to see all changes made to this survey</li>
            <li>• Verify integrity to ensure data hasn't been tampered with</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SurveySearch;
