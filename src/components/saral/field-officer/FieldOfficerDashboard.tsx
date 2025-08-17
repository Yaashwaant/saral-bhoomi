import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle, Clock, AlertCircle, Eye, Download, UserCheck } from 'lucide-react';
import { config } from '../../../config';

interface KYCAssignment {
  id: string;
  survey_number: string;
  landowner_name: string;
  area: number;
  village: string;
  taluka: string;
  district: string;
  total_compensation: number;
  is_tribal: boolean;
  tribal_certificate_no?: string;
  tribal_lag?: string;
  kyc_status: 'assigned' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  assigned_at: Date;
  assignment_notes?: string;
  documents_uploaded: boolean;
  project_id: string;
  project_name: string;
}

interface DocumentUpload {
  document_type: string;
  file: File;
  notes?: string;
}

const FieldOfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useSaral();
  
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [kycAssignments, setKycAssignments] = useState<KYCAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<KYCAssignment | null>(null);
  const [isDocumentUploadOpen, setIsDocumentUploadOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('assignments');
  
  const [documentType, setDocumentType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [kycNotes, setKycNotes] = useState('');
  const [kycStatus, setKycStatus] = useState<'in_progress' | 'completed' | 'approved' | 'rejected'>('in_progress');
  
  const API_BASE_URL = config.API_BASE_URL;

  useEffect(() => {
    if (selectedProject) {
      loadKYCAssignments();
    }
  }, [selectedProject]);

  const loadKYCAssignments = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      // Load KYC assignments for this field officer
      const response = await fetch(`${API_BASE_URL}/agents/assignments/${user?.id || 'demo-field-officer'}?project_id=${selectedProject}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setKycAssignments(data.data);
        }
      } else {
        // Fallback: load all assigned KYC records for the project
        const fallbackResponse = await fetch(`${API_BASE_URL}/landowners/${selectedProject}`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.data) {
            const assignedRecords = fallbackData.data
              .filter((record: any) => record.kyc_status === 'assigned' || record.kyc_status === 'in_progress')
              .map((record: any) => ({
                id: record._id || record.id,
                survey_number: record.survey_number,
                landowner_name: record.landowner_name,
                area: record.area || 0,
                village: record.village,
                taluka: record.taluka,
                district: record.district,
                total_compensation: record.total_compensation || 0,
                is_tribal: record.is_tribal || false,
                tribal_certificate_no: record.tribal_certificate_no,
                tribal_lag: record.tribal_lag,
                kyc_status: record.kyc_status || 'assigned',
                assigned_at: record.assigned_at ? new Date(record.assigned_at) : new Date(),
                assignment_notes: record.assignment_notes,
                documents_uploaded: record.documents_uploaded || false,
                project_id: record.project_id,
                project_name: projects.find(p => p.id === record.project_id)?.projectName || 'Unknown Project'
              }));
            setKycAssignments(assignedRecords);
          }
        }
      }
    } catch (error) {
      console.error('Error loading KYC assignments:', error);
      toast.error('Error loading KYC assignments');
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async () => {
    if (!selectedAssignment || !documentType || !selectedFile) {
      toast.error('Please select document type and file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('survey_number', selectedAssignment.survey_number);
      formData.append('document_type', documentType);
      formData.append('project_id', selectedAssignment.project_id);
      formData.append('notes', uploadNotes);

      const response = await fetch(`${API_BASE_URL}/documents/field-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-jwt-token'}`
        },
        body: formData
      });

      if (response.ok) {
        toast.success('Document uploaded successfully');
        setIsDocumentUploadOpen(false);
        setSelectedFile(null);
        setDocumentType('');
        setUploadNotes('');
        loadKYCAssignments();
        
        // Record blockchain event
        await recordBlockchainEvent(selectedAssignment.survey_number, 'DOCUMENT_UPLOADED', {
          document_type: documentType,
          field_officer_id: user?.id || 'demo-field-officer'
        });
      } else {
        toast.error('Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Error uploading document');
    } finally {
      setLoading(false);
    }
  };

  const updateKYCStatus = async () => {
    if (!selectedAssignment) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/landowners/${selectedAssignment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-jwt-token'}`
        },
        body: JSON.stringify({
          kyc_status: kycStatus,
          kyc_notes: kycNotes,
          kyc_completed_at: kycStatus === 'completed' || kycStatus === 'approved' ? new Date() : null,
          kyc_completed_by: user?.id || 'demo-field-officer'
        })
      });

      if (response.ok) {
        toast.success('KYC status updated successfully');
        setIsDetailsOpen(false);
        setKycNotes('');
        setKycStatus('in_progress');
        loadKYCAssignments();
        
        // Record blockchain event
        await recordBlockchainEvent(selectedAssignment.survey_number, 'KYC_STATUS_UPDATED', {
          new_status: kycStatus,
          notes: kycNotes,
          field_officer_id: user?.id || 'demo-field-officer'
        });
      } else {
        toast.error('Failed to update KYC status');
      }
    } catch (error) {
      console.error('Error updating KYC status:', error);
      toast.error('Error updating KYC status');
    } finally {
      setLoading(false);
    }
  };

  const recordBlockchainEvent = async (surveyNumber: string, eventType: string, metadata: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/blockchain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-jwt-token'}`
        },
        body: JSON.stringify({
          survey_number: surveyNumber,
          event_type: eventType,
          officer_id: user?.id || 'demo-field-officer',
          metadata: metadata,
          project_id: selectedProject
        })
      });

      if (response.ok) {
        console.log('Blockchain event recorded successfully');
      }
    } catch (error) {
      console.error('Error recording blockchain event:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels = {
      aadhaar: 'Aadhaar Card',
      pan: 'PAN Card',
      voter_id: 'Voter ID',
      '7_12_extract': '7/12 Extract',
      bank_passbook: 'Bank Passbook',
      photo: 'Photo',
      tribal_certificate: 'Tribal Certificate',
      land_documents: 'Land Documents'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Field Officer KYC Portal</CardTitle>
          <CardDescription>
            Manage KYC assignments and upload required documents for land acquisition verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="project">Select Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedProject && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assignments">KYC Assignments</TabsTrigger>
            <TabsTrigger value="documents">Document Management</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>KYC Assignments ({kycAssignments.length})</CardTitle>
                <CardDescription>
                  View assigned KYC tasks and manage verification process
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading assignments...</div>
                ) : kycAssignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No KYC assignments found for this project
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Survey No</TableHead>
                        <TableHead>Owner Name</TableHead>
                        <TableHead>Village</TableHead>
                        <TableHead>Area (Ha)</TableHead>
                        <TableHead>Compensation</TableHead>
                        <TableHead>Tribal Status</TableHead>
                        <TableHead>KYC Status</TableHead>
                        <TableHead>Assigned Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kycAssignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">{assignment.survey_number}</TableCell>
                          <TableCell>{assignment.landowner_name}</TableCell>
                          <TableCell>{assignment.village}</TableCell>
                          <TableCell>{assignment.area}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">
                              ₹{(assignment.total_compensation / 100000).toFixed(1)}L
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {assignment.is_tribal ? (
                              <div className="flex flex-col items-start">
                                <Badge variant="outline" className="text-orange-600">Tribal</Badge>
                                <span className="text-xs text-gray-600 mt-1">
                                  Cert: {assignment.tribal_certificate_no || assignment.tribal_lag || 'NA'}
                                </span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-gray-600">Non-Tribal</Badge>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(assignment.kyc_status)}</TableCell>
                          <TableCell>{new Date(assignment.assigned_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  setIsDetailsOpen(true);
                                }}
                                title="View Details"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  setIsDocumentUploadOpen(true);
                                }}
                                title="Upload Documents"
                              >
                                <Upload className="h-3 w-3" />
                              </Button>
                              {assignment.kyc_status === 'assigned' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAssignment(assignment);
                                    setKycStatus('in_progress');
                                    setIsDetailsOpen(true);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Start KYC
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Document Management</CardTitle>
                <CardDescription>
                  Track uploaded documents and manage KYC verification status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {kycAssignments.map((assignment) => (
                    <div key={assignment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{assignment.survey_number} - {assignment.landowner_name}</h4>
                          <p className="text-sm text-gray-600">{assignment.village}, {assignment.taluka}</p>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(assignment.kyc_status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setIsDocumentUploadOpen(true);
                            }}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Upload
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Area:</strong> {assignment.area} Hectares</div>
                        <div><strong>Compensation:</strong> ₹{(assignment.total_compensation / 100000).toFixed(1)}L</div>
                        <div><strong>Assigned:</strong> {new Date(assignment.assigned_at).toLocaleDateString()}</div>
                        <div><strong>Documents:</strong> {assignment.documents_uploaded ? 'Uploaded' : 'Pending'}</div>
                      </div>
                      
                      {assignment.assignment_notes && (
                        <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                          <strong>Assignment Notes:</strong> {assignment.assignment_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Document Upload Dialog */}
      <Dialog open={isDocumentUploadOpen} onOpenChange={setIsDocumentUploadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload KYC Documents</DialogTitle>
            <DialogDescription>
              Upload required documents for {selectedAssignment?.landowner_name} (Survey: {selectedAssignment?.survey_number})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                    <SelectItem value="pan">PAN Card</SelectItem>
                    <SelectItem value="voter_id">Voter ID</SelectItem>
                    <SelectItem value="7_12_extract">7/12 Extract</SelectItem>
                    <SelectItem value="bank_passbook">Bank Passbook</SelectItem>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="tribal_certificate">Tribal Certificate</SelectItem>
                    <SelectItem value="land_documents">Land Documents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>File Upload</Label>
                <Input 
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Upload Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes about this document"
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDocumentUploadOpen(false)}>
                Cancel
              </Button>
              <Button onClick={uploadDocument} disabled={!documentType || !selectedFile || loading}>
                <Upload className="h-3 w-3 mr-1" />
                Upload Document
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* KYC Details & Status Update Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>KYC Details & Status Update</DialogTitle>
            <DialogDescription>
              Review details and update KYC verification status for {selectedAssignment?.landowner_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAssignment && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Survey Number:</strong> {selectedAssignment.survey_number}</div>
                  <div><strong>Landowner:</strong> {selectedAssignment.landowner_name}</div>
                  <div><strong>Village:</strong> {selectedAssignment.village}</div>
                  <div><strong>Taluka:</strong> {selectedAssignment.taluka}</div>
                  <div><strong>Area:</strong> {selectedAssignment.area} Hectares</div>
                  <div><strong>Compensation:</strong> ₹{(selectedAssignment.total_compensation / 100000).toFixed(1)}L</div>
                  <div><strong>Tribal Status:</strong> {selectedAssignment.is_tribal ? 'Yes' : 'No'}</div>
                  <div><strong>Current Status:</strong> {getStatusBadge(selectedAssignment.kyc_status)}</div>
                </div>
                
                {selectedAssignment.assignment_notes && (
                  <div className="mt-3 p-2 bg-blue-50 rounded">
                    <strong>Assignment Notes:</strong> {selectedAssignment.assignment_notes}
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Update KYC Status</Label>
              <Select value={kycStatus} onValueChange={setKycStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>KYC Notes</Label>
              <Textarea
                placeholder="Add verification notes, findings, or reasons for status change"
                value={kycNotes}
                onChange={(e) => setKycNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateKYCStatus} disabled={loading}>
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FieldOfficerDashboard;
