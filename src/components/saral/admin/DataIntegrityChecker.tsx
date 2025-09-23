import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface IntegrityResult {
  survey_number: string;
  current_hash: string;
  blockchain_hash: string;
  is_tampered: boolean;
  message: string;
  timestamp: string;
}

const DataIntegrityChecker: React.FC = () => {
  const [surveyNumber, setSurveyNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<IntegrityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyIntegrity = async () => {
    if (!surveyNumber.trim()) {
      setError('Please enter a survey number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/data-integrity/verify/${surveyNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message || 'Failed to verify integrity');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (isTampered: boolean) => {
    if (isTampered) {
      return <ShieldAlert className="h-6 w-6 text-red-500" />;
    }
    return <ShieldCheck className="h-6 w-6 text-green-500" />;
  };

  const getStatusBadge = (isTampered: boolean) => {
    if (isTampered) {
      return <Badge variant="destructive">⚠️ Data Tampered</Badge>;
    }
    return <Badge variant="default">✅ Integrity Verified</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Data Integrity Checker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="surveyNumber">Survey Number</Label>
            <div className="flex gap-2">
              <Input
                id="surveyNumber"
                placeholder="Enter survey number (e.g., SUR001)"
                value={surveyNumber}
                onChange={(e) => setSurveyNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleVerifyIntegrity()}
              />
              <Button 
                onClick={handleVerifyIntegrity} 
                disabled={isLoading || !surveyNumber.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Integrity'
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Card className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Survey: {result.survey_number}
                  </h3>
                  {getStatusIcon(result.is_tampered)}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(result.is_tampered)}
                  <span className="text-sm text-muted-foreground">
                    {result.timestamp}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Current Hash</Label>
                    <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                      {result.current_hash}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Blockchain Hash</Label>
                    <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                      {result.blockchain_hash}
                    </div>
                  </div>
                </div>
                
                <Alert variant={result.is_tampered ? "destructive" : "default"}>
                  <AlertDescription className="font-medium">
                    {result.message}
                  </AlertDescription>
                </Alert>

                <div className="text-sm text-muted-foreground">
                  <p><strong>How it works:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Current database data is hashed using SHA-256</li>
                    <li>Hash is compared with the one stored on blockchain</li>
                    <li>If hashes don't match, data tampering is detected</li>
                    <li>This prevents unauthorized database modifications</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About Data Integrity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This tool helps detect if land record data has been tampered with by comparing 
            the current database hash with the original hash stored on the blockchain.
          </p>
          <p>
            <strong>When to use:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Before processing important land transactions</li>
            <li>During audit and compliance checks</li>
            <li>When investigating data discrepancies</li>
            <li>Regular integrity monitoring</li>
          </ul>
          <p>
            <strong>Note:</strong> This only detects tampering, it doesn't prevent it. 
            The blockchain serves as an immutable audit trail.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataIntegrityChecker;
