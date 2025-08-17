import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Workflow, Database, Award, FileText, FolderOpen, Banknote, Hash, CheckCircle, AlertCircle, Eye } from 'lucide-react';

interface WorkflowRecord {
  survey_number: string;
  jmr_status: string;
  award_status: string;
  notice_status: string;
  document_status: string;
  payment_status: string;
  progress_percentage: number;
  current_stage: string;
}

const CompleteWorkflowManager: React.FC = () => {
  const { projects } = useSaral();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [workflowRecords, setWorkflowRecords] = useState<WorkflowRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedProject) {
      generateWorkflowRecords();
    }
  }, [selectedProject]);

  const generateWorkflowRecords = () => {
    // Mock data for demonstration
    const mockRecords: WorkflowRecord[] = [
      {
        survey_number: 'SN001',
        jmr_status: 'approved',
        award_status: 'approved',
        notice_status: 'issued',
        document_status: 'completed',
        payment_status: 'completed',
        progress_percentage: 100,
        current_stage: 'Completed'
      },
      {
        survey_number: 'SN002',
        jmr_status: 'approved',
        award_status: 'approved',
        notice_status: 'issued',
        document_status: 'pending',
        payment_status: 'pending',
        progress_percentage: 75,
        current_stage: 'Documents'
      },
      {
        survey_number: 'SN003',
        jmr_status: 'approved',
        award_status: 'pending',
        notice_status: 'pending',
        document_status: 'pending',
        payment_status: 'pending',
        progress_percentage: 25,
        current_stage: 'Award'
      }
    ];
    
    setWorkflowRecords(mockRecords);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
      case 'issued':
        return 'default';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'JMR': return <Database className="h-4 w-4" />;
      case 'Award': return <Award className="h-4 w-4" />;
      case 'Notice': return <FileText className="h-4 w-4" />;
      case 'Documents': return <FolderOpen className="h-4 w-4" />;
      case 'Payment': return <Banknote className="h-4 w-4" />;
      case 'Completed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const projectOptions = projects.map(p => ({ 
    id: p.id, 
    name: (p as any).projectName || (p as any).name || p.id 
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Complete Workflow Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Project</label>
              <select 
                value={selectedProject} 
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Choose a project</option>
                {projectOptions.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedProject && (
            <div className="space-y-4">
              {workflowRecords.map((record) => (
                <Card key={record.survey_number} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStageIcon(record.current_stage)}
                      <span className="font-medium">Survey {record.survey_number}</span>
                      <Badge variant="outline">{record.current_stage}</Badge>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress: {record.progress_percentage}%</span>
                    </div>
                    <Progress value={record.progress_percentage} className="h-2" />
                  </div>
                  
                  <div className="grid md:grid-cols-5 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span>JMR:</span>
                      <Badge variant={getStatusBadgeVariant(record.jmr_status)} size="sm">
                        {record.jmr_status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      <span>Award:</span>
                      <Badge variant={getStatusBadgeVariant(record.award_status)} size="sm">
                        {record.award_status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Notice:</span>
                      <Badge variant={getStatusBadgeVariant(record.notice_status)} size="sm">
                        {record.notice_status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      <span>Docs:</span>
                      <Badge variant={getStatusBadgeVariant(record.document_status)} size="sm">
                        {record.document_status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      <span>Payment:</span>
                      <Badge variant={getStatusBadgeVariant(record.payment_status)} size="sm">
                        {record.payment_status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!selectedProject && (
            <div className="text-center py-8 text-gray-500">
              Please select a project to view the complete workflow.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteWorkflowManager;
