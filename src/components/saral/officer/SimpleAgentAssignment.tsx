import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface LandownerRecord {
  _id: string;
  खातेदाराचे_नांव: string;
  सर्वे_नं: string;
  क्षेत्र: string;
  एकूण_मोबदला: string;
  village: string;
  taluka: string;
  district: string;
  assignedAgent?: string;
  assignedAt?: string;
  kycStatus: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
}

interface Agent {
  _id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

const SimpleAgentAssignment: React.FC = () => {
  const [records, setRecords] = useState<LandownerRecord[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<LandownerRecord | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  // Load landowner records (only from CSV uploads with notices)
  const loadRecords = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/landowners/list`);
      const data = await response.json();
      
      if (data.success) {
        // Filter records that have notices generated (from CSV uploads)
        const recordsWithNotices = (data.records || []).filter((record: any) => 
          record.noticeGenerated || record.noticeNumber
        );
        setRecords(recordsWithNotices);
        console.log('Loaded records with notices:', recordsWithNotices.length);
      } else {
        toast({
          title: "Error",
          description: "Failed to load landowner records",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading records:', error);
      toast({
        title: "Error",
        description: "Failed to load landowner records",
        variant: "destructive"
      });
    }
  };

  // Load agents
  const loadAgents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/agents/list`);
      const data = await response.json();
      
      if (data.success) {
        setAgents(data.agents || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to load agents",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      toast({
        title: "Error",
        description: "Failed to load agents",
        variant: "destructive"
      });
    }
  };

  // Assign agent
  const assignAgent = async () => {
    if (!selectedRecord || !selectedAgent) return;

    try {
      setIsAssigning(true);
      const response = await fetch(`${API_BASE_URL}/agents/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          landownerId: selectedRecord._id,
          agentId: selectedAgent
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Agent assigned successfully"
        });
        
        // Update local state
        setRecords(prev => prev.map(record => 
          record._id === selectedRecord._id 
            ? { 
                ...record, 
                assignedAgent: selectedAgent,
                assignedAt: new Date().toISOString(),
                kycStatus: 'pending'
              }
            : record
        ));
        
        setSelectedRecord(null);
        setSelectedAgent('');
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to assign agent",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast({
        title: "Error",
        description: "Failed to assign agent",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="default">In Progress</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get assignment status
  const getAssignmentStatus = (record: LandownerRecord) => {
    if (record.assignedAgent) {
      const agent = agents.find(a => a._id === record.assignedAgent);
      return (
        <div className="space-y-1">
          <Badge variant="default" className="bg-blue-500">
            Assigned to {agent?.name || 'Unknown'}
          </Badge>
          <div className="text-xs text-muted-foreground">
            {record.assignedAt ? new Date(record.assignedAt).toLocaleDateString() : ''}
          </div>
        </div>
      );
    }
    return <Badge variant="outline">Unassigned</Badge>;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadRecords(), loadAgents()]);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agent Assignment</h1>
          <p className="text-muted-foreground">Assign CSV-uploaded landowner records (with notices) to agents for KYC processing.</p>
        </div>
        <Button onClick={() => { loadRecords(); loadAgents(); }} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {records.filter(r => r.assignedAgent).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {records.filter(r => !r.assignedAgent).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Dialog */}
      {selectedRecord && (
        <Card>
          <CardHeader>
            <CardTitle>Assign Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Landowner</label>
              <p className="text-sm text-muted-foreground">
                {selectedRecord.खातेदाराचे_नांव} (Survey: {selectedRecord.सर्वे_नं})
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium">Select Agent</label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent._id} value={agent._id}>
                      {agent.name} - {agent.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRecord(null);
                  setSelectedAgent('');
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={assignAgent}
                disabled={!selectedAgent || isAssigning}
              >
                {isAssigning ? 'Assigning...' : 'Assign Agent'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Landowner Records</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No landowner records found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Landowner Name</TableHead>
                  <TableHead>Survey No.</TableHead>
                  <TableHead>Village</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Compensation</TableHead>
                  <TableHead>Notice Status</TableHead>
                  <TableHead>Assignment Status</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell className="font-medium">
                      {record.खातेदाराचे_नांव}
                    </TableCell>
                    <TableCell>{record.सर्वे_नं}</TableCell>
                    <TableCell>{record.village}</TableCell>
                    <TableCell>{record.क्षेत्र}</TableCell>
                    <TableCell>₹{record.एकूण_मोबदला}</TableCell>
                    <TableCell>
                      {record.noticeGenerated ? (
                        <Badge variant="default" className="bg-green-500">
                          Notice Generated
                        </Badge>
                      ) : (
                        <Badge variant="outline">No Notice</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getAssignmentStatus(record)}</TableCell>
                    <TableCell>{getStatusBadge(record.kycStatus)}</TableCell>
                    <TableCell>
                      {!record.assignedAgent ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRecord(record)}
                        >
                          Assign Agent
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRecord(record)}
                        >
                          Reassign
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleAgentAssignment; 