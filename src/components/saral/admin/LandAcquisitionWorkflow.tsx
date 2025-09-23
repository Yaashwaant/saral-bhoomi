import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface WorkflowStage {
  name: string;
  status: 'pending' | 'completed' | 'current';
  description: string;
  icon: React.ReactNode;
}

interface WorkflowData {
  survey_number: string;
  current_stage: string;
  is_completed: boolean;
  project_name: string;
  landowner_name: string;
  compensation_amount: string;
  timestamps: {
    land_records: string;
    payment: string | null;
    ownership: string | null;
  };
  hashes: {
    land_records: string;
    payment: string;
    ownership: string;
  };
}

const LandAcquisitionWorkflow: React.FC = () => {
  const [surveyNumber, setSurveyNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [workflowData, setWorkflowData] = useState<WorkflowData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const workflowStages: WorkflowStage[] = [
    {
      name: 'Land Records Added',
      status: 'pending',
      description: 'Initial land records created and stored on blockchain',
      icon: <Shield className="h-5 w-5" />
    },
    {
      name: 'Payment Generated',
      status: 'pending',
      description: 'Compensation payment slip generated and recorded',
      icon: <CheckCircle className="h-5 w-5" />
    },
    {
      name: 'Ownership Transferred',
      status: 'pending',
      description: 'Land ownership transferred to project',
      icon: <CheckCircle className="h-5 w-5" />
    }
  ];

  const handleCheckWorkflow = async () => {
    if (!surveyNumber.trim()) {
      setError('Please enter a survey number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setWorkflowData(null);

    try {
      const response = await fetch(`/api/data-integrity/workflow/${surveyNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setWorkflowData(data.data);
      } else {
        setError(data.message || 'Failed to retrieve workflow status');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getStageStatus = (stageName: string): 'pending' | 'completed' | 'current' => {
    if (!workflowData) return 'pending';
    
    const stageMap: { [key: string]: number } = {
      'LandRecordsAdded': 1,
      'PaymentGenerated': 2,
      'OwnershipTransferred': 3
    };
    
    const currentStageNum = stageMap[workflowData.current_stage] || 0;
    const stageNum = stageMap[stageName] || 0;
    
    if (stageNum < currentStageNum) return 'completed';
    if (stageNum === currentStageNum) return 'current';
    return 'pending';
  };

  const getStageIcon = (status: 'pending' | 'completed' | 'current') => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'current':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStageBadge = (status: 'pending' | 'completed' | 'current') => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">✅ Completed</Badge>;
      case 'current':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">⏳ In Progress</Badge>;
      default:
        return <Badge variant="secondary">⏸️ Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Land Acquisition Workflow Tracker
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
                onKeyPress={(e) => e.key === 'Enter' && handleCheckWorkflow()}
              />
              <Button 
                onClick={handleCheckWorkflow} 
                disabled={isLoading || !surveyNumber.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check Workflow'
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert          )}

          {workflowData && (
            <div className="space-y-6">
              {/* Survey Information */}
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <h3 className="text-lg font-semibold">
                    Survey: {workflowData.survey_number}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={workflowData.is_completed ? "default" : "secondary"}>
                      {workflowData.is_completed ? '🏁 Workflow Completed' : '🔄 Workflow Active'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Project Name</Label>
                      <p className="text-sm text-muted-foreground">{workflowData.project_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Landowner</Label>
                      <p className="text-sm text-muted-foreground">{workflowData.landowner_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Compensation Amount</Label>
                      <p className="text-sm text-muted-foreground">
                        {workflowData.compensation_amount ? `₹${workflowData.compensation_amount}` : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Current Stage</Label>
                      <p className="text-sm text-muted-foreground">{workflowData.current_stage}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Workflow Stages */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Workflow Progress</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workflowStages.map((stage, index) => {
                      const status = getStageStatus(stage.name);
                      return (
                        <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                          <div className="flex-shrink-0">
                            {getStageIcon(status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{stage.name}</h4>
                              {getStageBadge(status)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {stage.description}
                            </p>
                            {status === 'completed' && workflowData.timestamps[stage.name.toLowerCase().replace(' ', '_') as keyof typeof workflowData.timestamps] && (
                              <p className="text-xs text-green-600">
                                Completed: {new Date(workflowData.timestamps[stage.name.toLowerCase().replace(' ', '_') as keyof typeof workflowData.timestamps]!).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Blockchain Hashes */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Blockchain Verification</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Land Records Hash</Label>
                      <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                        {workflowData.hashes.land_records}
                      </div>
                    </div>
                    {workflowData.hashes.payment && (
                      <div>
                        <Label className="text-sm font-medium">Payment Hash</Label>
                        <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                          {workflowData.hashes.payment}
                        </div>
                      </div>
                    )}
                    {workflowData.hashes.ownership && (
                      <div>
                        <Label className="text-sm font-medium">Ownership Transfer Hash</Label>
                        <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                          {workflowData.hashes.ownership}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About Land Acquisition Workflow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This tool tracks the complete land acquisition process on the blockchain, ensuring 
            transparency and immutability of all critical steps.
          </p>
          <p>
            <strong>Workflow Stages:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li><strong>Land Records Added:</strong> Initial survey data, JMR, award, and land records are hashed and stored</li>
            <li><strong>Payment Generated:</strong> Compensation payment details are recorded on blockchain</li>
            <li><strong>Ownership Transferred:</strong> Final ownership transfer to project is completed</li>
          </ol>
          <p>
            <strong>Benefits:</strong> Each stage creates an immutable record, preventing data tampering 
            and providing a complete audit trail for land acquisition processes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LandAcquisitionWorkflow;
