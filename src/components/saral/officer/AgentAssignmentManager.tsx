import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaral } from '@/contexts/SaralContext';
import { toast } from 'sonner';
import { 
  UserCheck, 
  Users, 
  FileText, 
  MapPin, 
  IndianRupee,
  Calendar,
  Phone,
  Building2,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  area: string;
  specialization: string[];
  currentWorkload: number;
  maxCapacity: number;
  rating: number;
  isActive: boolean;
}

interface AssignmentRequest {
  id: string;
  landownerId: string;
  landownerName: string;
  noticeNumber: string;
  village: string;
  compensationAmount: number;
  priority: 'high' | 'medium' | 'low';
  urgency: 'urgent' | 'normal' | 'low';
  requiredSkills: string[];
  estimatedDuration: number; // in days
}

const AgentAssignmentManager: React.FC = () => {
  const { 
    landownerRecords, 
    assignAgentWithNotice, 
    getAssignedRecordsWithNotices 
  } = useSaral();
  
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: '4',
      name: 'राजेश पाटील',
      phone: '+91 9876543210',
      email: 'rajesh.patil@saral.gov.in',
      area: 'उंबरपाडा तालुका',
      specialization: ['Document Collection', 'KYC Verification', 'Rural Communication'],
      currentWorkload: 3,
      maxCapacity: 15,
      rating: 4.8,
      isActive: true
    },
    {
      id: '5',
      name: 'सुनील कांबळे',
      phone: '+91 9876543211',
      email: 'sunil.kambale@saral.gov.in',
      area: 'उंबरपाडा तालुका',
      specialization: ['Legal Documentation', 'Bank Coordination', 'Language Translation'],
      currentWorkload: 2,
      maxCapacity: 12,
      rating: 4.9,
      isActive: true
    },
    {
      id: '6',
      name: 'महेश देशमुख',
      phone: '+91 9876543212',
      email: 'mahesh.deshmukh@saral.gov.in',
      area: 'उंबरपाडा तालुका',
      specialization: ['Field Verification', 'Elderly Assistance', 'Technical Support'],
      currentWorkload: 4,
      maxCapacity: 10,
      rating: 4.7,
      isActive: true
    },
    {
      id: '7',
      name: 'विठ्ठल जाधव',
      phone: '+91 9876543213',
      email: 'vithal.jadhav@saral.gov.in',
      area: 'उंबरपाडा तालुका',
      specialization: ['Document Collection', 'Field Verification', 'KYC Processing'],
      currentWorkload: 1,
      maxCapacity: 15,
      rating: 4.6,
      isActive: true
    },
    {
      id: '8',
      name: 'रामराव पवार',
      phone: '+91 9876543214',
      email: 'ramrao.pawar@saral.gov.in',
      area: 'उंबरपाडा तालुका',
      specialization: ['Rural Communication', 'Technical Support', 'Bank Coordination'],  
      currentWorkload: 5,
      maxCapacity: 12,
      rating: 4.5,
      isActive: true
    }
  ]);

  const [assignmentRequests, setAssignmentRequests] = useState<AssignmentRequest[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AssignmentRequest | null>(null);
  const [bulkAssignMode, setBulkAssignMode] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  useEffect(() => {
    loadPendingAssignments();
  }, [landownerRecords]);

  const loadPendingAssignments = () => {
    // Convert landowner records to assignment requests
    const pendingRecords = landownerRecords.filter(record => 
      record.noticeGenerated && !record.assignedAgent
    );

    const requests: AssignmentRequest[] = pendingRecords.map(record => ({
      id: record.id,
      landownerId: record.id,
      landownerName: record['खातेदाराचे_नांव'] || 'Unknown',
      noticeNumber: record.noticeNumber || 'N/A',
      village: record['गांव'] || 'Unknown',
      compensationAmount: parseFloat(record['हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम'] || '0'),
      priority: record.compensationAmount > 500000 ? 'high' : 
               record.compensationAmount > 200000 ? 'medium' : 'low',
      urgency: 'normal',
      requiredSkills: ['Document Collection', 'KYC Verification'],
      estimatedDuration: 7
    }));

    setAssignmentRequests(requests);
  };

  const calculateAgentSuitability = (agent: Agent, request: AssignmentRequest) => {
    let score = 0;
    const factors: string[] = [];

    // Workload factor (higher score for lower workload)
    const workloadRatio = agent.currentWorkload / agent.maxCapacity;
    if (workloadRatio < 0.5) {
      score += 30;
      factors.push('Low workload');
    } else if (workloadRatio < 0.8) {
      score += 20;
      factors.push('Moderate workload');
    } else {
      score += 10;
      factors.push('High workload');
    }

    // Skill match factor
    const skillMatches = request.requiredSkills.filter(skill => 
      agent.specialization.some(spec => spec.toLowerCase().includes(skill.toLowerCase()))
    ).length;
    score += skillMatches * 15;
    if (skillMatches > 0) {
      factors.push(`${skillMatches} skill matches`);
    }

    // Rating factor
    score += agent.rating * 10;
    factors.push(`${agent.rating}/5 rating`);

    // Priority factor
    if (request.priority === 'high') {
      score += 10;
    }

    return { score, factors };
  };

  const getRecommendedAgent = (request: AssignmentRequest) => {
    const availableAgents = agents.filter(agent => 
      agent.isActive && agent.currentWorkload < agent.maxCapacity
    );

    if (availableAgents.length === 0) return null;

    const agentScores = availableAgents.map(agent => ({
      agent,
      ...calculateAgentSuitability(agent, request)
    }));

    agentScores.sort((a, b) => b.score - a.score);
    return agentScores[0];
  };

  const handleAssignAgent = async (agentId: string, requestId: string) => {
    try {
      const request = assignmentRequests.find(r => r.id === requestId);
      const agent = agents.find(a => a.id === agentId);
      
      if (!request || !agent) {
        toast.error('Request or agent not found');
        return;
      }

      const landowner = landownerRecords.find(r => r.id === request.landownerId);
      if (!landowner) {
        toast.error('Landowner record not found');
        return;
      }

      await assignAgentWithNotice(request.landownerId, agentId, {
        noticeNumber: request.noticeNumber,
        noticeDate: landowner.noticeDate || new Date(),
        noticeContent: landowner.noticeContent || ''
      });

      // Update agent workload
      setAgents(prev => prev.map(a => 
        a.id === agentId 
          ? { ...a, currentWorkload: a.currentWorkload + 1 }
          : a
      ));

      // Remove from assignment requests
      setAssignmentRequests(prev => prev.filter(r => r.id !== requestId));

      toast.success(`Assigned ${request.landownerName} to ${agent.name} for KYC processing`);
      setShowAssignmentDialog(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Assignment failed:', error);
      toast.error('Failed to assign agent');
    }
  };

  const handleBulkAssignment = async () => {
    if (selectedRequests.length === 0) {
      toast.error('Please select requests to assign');
      return;
    }

    try {
      for (const requestId of selectedRequests) {
        const request = assignmentRequests.find(r => r.id === requestId);
        if (!request) continue;

        const recommendation = getRecommendedAgent(request);
        if (!recommendation) {
          toast.warning(`No available agent for ${request.landownerName}`);
          continue;
        }

        await handleAssignAgent(recommendation.agent.id, requestId);
      }

      toast.success(`Bulk assigned ${selectedRequests.length} requests`);
      setSelectedRequests([]);
      setBulkAssignMode(false);
    } catch (error) {
      console.error('Bulk assignment failed:', error);
      toast.error('Bulk assignment failed');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWorkloadColor = (ratio: number) => {
    if (ratio < 0.5) return 'text-green-600';
    if (ratio < 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Agent Assignment Manager
          </CardTitle>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Manage KYC agent assignments for notice-based processing
            </p>
            <div className="flex gap-2">
              <Button
                variant={bulkAssignMode ? "default" : "outline"}
                size="sm"
                onClick={() => setBulkAssignMode(!bulkAssignMode)}
              >
                {bulkAssignMode ? 'Exit Bulk Mode' : 'Bulk Assign'}
              </Button>
              {bulkAssignMode && selectedRequests.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleBulkAssignment}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Assign Selected ({selectedRequests.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Agent Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {agents.filter(a => a.isActive).map(agent => {
          const workloadRatio = agent.currentWorkload / agent.maxCapacity;
          return (
            <Card key={agent.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                    <p className="text-sm text-gray-600">{agent.area}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    ⭐ {agent.rating}/5
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Workload:</span>
                    <span className={`text-sm font-medium ${getWorkloadColor(workloadRatio)}`}>
                      {agent.currentWorkload}/{agent.maxCapacity}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        workloadRatio < 0.5 ? 'bg-green-500' : 
                        workloadRatio < 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(workloadRatio * 100, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-1 mt-2">
                    <Phone className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-500">{agent.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pending Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pending Agent Assignments ({assignmentRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignmentRequests.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-500">No pending assignments at the moment.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {bulkAssignMode && (
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedRequests.length === assignmentRequests.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRequests(assignmentRequests.map(r => r.id));
                          } else {
                            setSelectedRequests([]);
                          }
                        }}
                      />
                    </TableHead>
                  )}
                  <TableHead>Landowner</TableHead>
                  <TableHead>Notice</TableHead>
                  <TableHead>Village</TableHead>
                  <TableHead>Compensation</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Recommended Agent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignmentRequests.map((request) => {
                  const recommendation = getRecommendedAgent(request);
                  return (
                    <TableRow key={request.id}>
                      {bulkAssignMode && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedRequests.includes(request.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRequests(prev => [...prev, request.id]);
                              } else {
                                setSelectedRequests(prev => prev.filter(id => id !== request.id));
                              }
                            }}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.landownerName}</div>
                          <div className="text-sm text-gray-500">ID: {request.landownerId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-mono">{request.noticeNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          <span className="text-sm">{request.village}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-3 w-3 text-green-600" />
                          <span className="text-sm font-medium">
                            {formatCurrency(request.compensationAmount)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadgeColor(request.priority)}>
                          {request.priority.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {recommendation ? (
                          <div className="text-sm">
                            <div className="font-medium">{recommendation.agent.name}</div>
                            <div className="text-xs text-gray-500">
                              Score: {recommendation.score}/100
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-red-600">No available agent</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowAssignmentDialog(true);
                            }}
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            Assign
                          </Button>
                          {recommendation && (
                            <Button
                              size="sm"
                              onClick={() => handleAssignAgent(recommendation.agent.id, request.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Assign Agent for KYC Processing</DialogTitle>
            <DialogDescription>
              Select the best agent for {selectedRequest?.landownerName}'s KYC processing
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Assignment Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Landowner:</span>
                    <span className="ml-2 font-medium">{selectedRequest.landownerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Notice:</span>
                    <span className="ml-2 font-mono">{selectedRequest.noticeNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Village:</span>
                    <span className="ml-2">{selectedRequest.village}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Compensation:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {formatCurrency(selectedRequest.compensationAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Agent Selection */}
              <div className="space-y-4">
                <h4 className="font-medium">Available Agents</h4>
                <div className="grid gap-4">
                  {agents.filter(a => a.isActive).map(agent => {
                    const suitability = calculateAgentSuitability(agent, selectedRequest);
                    const workloadRatio = agent.currentWorkload / agent.maxCapacity;
                    const isOverloaded = workloadRatio >= 1;
                    
                    return (
                      <div 
                        key={agent.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          isOverloaded 
                            ? 'border-gray-200 bg-gray-50 opacity-60' 
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                        onClick={() => {
                          if (!isOverloaded) {
                            handleAssignAgent(agent.id, selectedRequest.id);
                          }
                        }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h5 className="font-medium">{agent.name}</h5>
                            <p className="text-sm text-gray-600">{agent.area}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">{agent.phone}</span>
                              <Badge variant="outline" className="text-xs">
                                ⭐ {agent.rating}/5
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              Suitability: {suitability.score}/100
                            </div>
                            <div className={`text-xs ${getWorkloadColor(workloadRatio)}`}>
                              Workload: {agent.currentWorkload}/{agent.maxCapacity}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-xs text-gray-600">
                            <strong>Specializations:</strong> {agent.specialization.join(', ')}
                          </div>
                          <div className="text-xs text-gray-600">
                            <strong>Match Factors:</strong> {suitability.factors.join(', ')}
                          </div>
                        </div>
                        
                        {isOverloaded && (
                          <div className="mt-2 text-xs text-red-600 font-medium">
                            Agent at full capacity
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAssignmentDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentAssignmentManager;