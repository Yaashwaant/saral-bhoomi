import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, 
  DollarSign, 
  RefreshCw, 
  FileText, 
  User, 
  Upload, 
  Circle,
  AlertTriangle,
  ArrowLeft,
  RefreshCw as RefreshIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface TimelineEvent {
  eventType: string;
  ownerId: string;
  landType: string;
  details: string;
  timestamp: Date;
  officer: string;
  eventHash: string;
  eventIndex: number;
}

const SurveyTimeline: React.FC = () => {
  const { surveyNumber } = useParams<{ surveyNumber: string }>();
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentOwner, setCurrentOwner] = useState<string>('');
  const [landType, setLandType] = useState<string>('');

  useEffect(() => {
    if (surveyNumber) {
      loadTimeline(surveyNumber);
    }
  }, [surveyNumber]);

  const loadTimeline = async (surveyNum: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/blockchain/timeline/${surveyNum}`);
      const data = await response.json();

      if (data.success) {
        setTimeline(data.data.timeline || []);
        
        // Set current owner and land type from the latest event
        if (data.data.timeline && data.data.timeline.length > 0) {
          const latestEvent = data.data.timeline[data.data.timeline.length - 1];
          setCurrentOwner(latestEvent.ownerId);
          setLandType(latestEvent.landType);
        }
      } else {
        setError(data.message || 'Failed to load timeline');
      }
    } catch (err) {
      console.error('Failed to load timeline:', err);
      setError('Failed to load timeline. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'SurveyBlockCreated':
        return <Circle className="w-5 h-5 text-blue-500" />;
      case 'AwardDeclared':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'Compensated':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'OwnershipUpdated':
        return <RefreshCw className="w-5 h-5 text-blue-500" />;
      case 'NoticeGenerated':
        return <FileText className="w-5 h-5 text-purple-500" />;
      case 'KYCAssigned':
        return <User className="w-5 h-5 text-indigo-500" />;
      case 'DocumentsUploaded':
        return <Upload className="w-5 h-5 text-orange-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'SurveyBlockCreated':
        return 'bg-blue-100 text-blue-800';
      case 'AwardDeclared':
        return 'bg-yellow-100 text-yellow-800';
      case 'Compensated':
        return 'bg-green-100 text-green-800';
      case 'OwnershipUpdated':
        return 'bg-blue-100 text-blue-800';
      case 'NoticeGenerated':
        return 'bg-purple-100 text-purple-800';
      case 'KYCAssigned':
        return 'bg-indigo-100 text-indigo-800';
      case 'DocumentsUploaded':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType.replace(/([A-Z])/g, ' $1').trim();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshIcon className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => surveyNumber && loadTimeline(surveyNumber)}>
          <RefreshIcon className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Survey History Timeline</h1>
          <p className="text-muted-foreground mt-2">
            Complete chronological record of all changes for survey: {surveyNumber}
          </p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Current Owner Info */}
      {currentOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Current Owner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Owner:</span>
                <p className="text-lg font-semibold">{currentOwner}</p>
              </div>
              <div>
                <span className="font-medium">Survey Number:</span>
                <p className="text-lg font-semibold">{surveyNumber}</p>
              </div>
              <div>
                <span className="font-medium">Land Type:</span>
                <p className="text-lg">{landType}</p>
              </div>
              <div>
                <span className="font-medium">Total Events:</span>
                <p className="text-lg">{timeline.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Events</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Circle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No timeline events found for this survey</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Vertical timeline line */}
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300" />
                
                {timeline.map((event, index) => (
                  <div key={index} className="flex gap-4 relative">
                    {/* Timeline icon */}
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center">
                        {getEventIcon(event.eventType)}
                      </div>
                    </div>
                    
                    {/* Event card */}
                    <Card className="flex-1">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge className={getEventColor(event.eventType)}>
                            {formatEventType(event.eventType)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Owner:</span>
                            <p className="text-gray-600">{event.ownerId}</p>
                          </div>
                          <div>
                            <span className="font-medium">Survey Number:</span>
                            <p className="text-gray-600">{event.surveyNumber}</p>
                          </div>
                          <div>
                            <span className="font-medium">Land Type:</span>
                            <p className="text-gray-600">{event.landType}</p>
                          </div>
                          <div>
                            <span className="font-medium">Event Index:</span>
                            <p className="text-gray-600">{event.eventIndex}</p>
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium">Details:</span>
                          <p className="text-sm text-gray-600 mt-1">{event.details}</p>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Event Hash:</span>
                          <p className="font-mono break-all">{event.eventHash}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button 
          variant="outline" 
          onClick={() => surveyNumber && loadTimeline(surveyNumber)}
        >
          <RefreshIcon className="w-4 h-4 mr-2" />
          Refresh Timeline
        </Button>
        <Button 
          variant="outline"
          onClick={() => window.open(`/admin/blockchain/search/${surveyNumber}`, '_blank')}
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Verify Integrity
        </Button>
      </div>

      {/* Timeline Legend */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-gray-800">Timeline Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-blue-500" />
              <span>Survey Block Created</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>Award Declared</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span>Compensated</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-500" />
              <span>Ownership Updated</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" />
              <span>Notice Generated</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              <span>KYC Assigned</span>
            </div>
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-orange-500" />
              <span>Documents Uploaded</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SurveyTimeline;
