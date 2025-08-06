import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  kycStatus: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  assignedAt: string;
  projectId?: {
    projectName: string;
    pmisCode: string;
  };
}

const API_BASE_URL = 'http://localhost:5000/api';

const SimpleAgentDashboard: React.FC = () => {
  const [records, setRecords] = useState<LandownerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<LandownerRecord | null>(null);
  const [kycStatus, setKycStatus] = useState<string>('');
  const [kycNotes, setKycNotes] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Load assigned records
  const loadAssignedRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/agents/assigned`);
      const data = await response.json();
      
      if (data.success) {
        setRecords(data.records || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to load assigned records",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading records:', error);
      toast({
        title: "Error",
        description: "Failed to load assigned records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Update KYC status
  const updateKYCStatus = async () => {
    if (!selectedRecord || !kycStatus) return;

    try {
      const response = await fetch(`${API_BASE_URL}/agents/kyc-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          landownerId: selectedRecord._id,
          kycStatus,
          notes: kycNotes
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "KYC status updated successfully"
        });
        
        // Update local state
        setRecords(prev => prev.map(record => 
          record._id === selectedRecord._id 
            ? { ...record, kycStatus: kycStatus as any }
            : record
        ));
        
        setIsDialogOpen(false);
        setSelectedRecord(null);
        setKycStatus('');
        setKycNotes('');
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update KYC status",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating KYC status:', error);
      toast({
        title: "Error",
        description: "Failed to update KYC status",
        variant: "destructive"
      });
    }
  };

  // Get status badge color
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

  useEffect(() => {
    loadAssignedRecords();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading assigned records...</div>
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
          <h1 className="text-3xl font-bold">Agent Dashboard</h1>
          <p className="text-muted-foreground">Welcome, Rajesh! Here are your assigned landowner records.</p>
        </div>
        <Button onClick={loadAssignedRecords} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {records.filter(r => r.kycStatus === 'pending').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {records.filter(r => r.kycStatus === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {records.filter(r => r.kycStatus === 'completed' || r.kycStatus === 'approved').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Landowner Records</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No records assigned yet.
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
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Assigned Date</TableHead>
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
                    <TableCell>{getStatusBadge(record.kycStatus)}</TableCell>
                    <TableCell>
                      {new Date(record.assignedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRecord(record)}
                          >
                            Update KYC
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update KYC Status</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Landowner</label>
                              <p className="text-sm text-muted-foreground">
                                {selectedRecord?.खातेदाराचे_नांव} (Survey: {selectedRecord?.सर्वे_नं})
                              </p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">KYC Status</label>
                              <Select value={kycStatus} onValueChange={setKycStatus}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="approved">Approved</SelectItem>
                                  <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Notes</label>
                              <Textarea
                                placeholder="Add any notes about the KYC process..."
                                value={kycNotes}
                                onChange={(e) => setKycNotes(e.target.value)}
                              />
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsDialogOpen(false);
                                  setSelectedRecord(null);
                                  setKycStatus('');
                                  setKycNotes('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button onClick={updateKYCStatus}>
                                Update Status
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
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

export default SimpleAgentDashboard; 