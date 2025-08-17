import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { FileText, Eye, Download, CheckCircle, AlertCircle, RefreshCw, Printer, Copy } from 'lucide-react';
import { config } from '../../../config';

interface NoticeRecord {
  id?: string;
  survey_number: string;
  project_id: string;
  officer_id: string;
  notice_type: string;
  notice_date: string;
  notice_number: string;
  amount: number;
  land_type: string;
  tribal_classification: string;
  category: string;
  notice_content: string;
  delivery_method: string;
  delivery_status: string;
  notice_status: string;
  expiry_date: string;
  remarks: string;
  blockchain_verified: boolean;
}

interface AwardRecord {
  id: string;
  survey_number: string;
  award_number: string;
  total_amount: number;
  land_type: string;
  tribal_classification: string;
  category: string;
  status: string;
}

const EnhancedNoticeManager: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useSaral();
  
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [noticeRecords, setNoticeRecords] = useState<NoticeRecord[]>([]);
  const [awardRecords, setAwardRecords] = useState<AwardRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('form');
  const [selectedAward, setSelectedAward] = useState<AwardRecord | null>(null);
  const [showAwardSelector, setShowAwardSelector] = useState(false);
  
  const [noticeForm, setNoticeForm] = useState<NoticeRecord>({
    survey_number: '',
    project_id: '',
    officer_id: '',
    notice_type: 'acquisition',
    notice_date: new Date().toISOString().slice(0, 10),
    notice_number: '',
    amount: 0,
    land_type: 'agricultural',
    tribal_classification: 'non-tribal',
    category: 'general',
    notice_content: '',
    delivery_method: 'hand_delivery',
    delivery_status: 'pending',
    notice_status: 'draft',
    expiry_date: '',
    remarks: '',
    blockchain_verified: false
  });

  const API_BASE_URL = config.API_BASE_URL;

  useEffect(() => {
    if (selectedProject) {
      loadNoticeRecords();
      loadAwardRecords();
    }
  }, [selectedProject]);

  const loadNoticeRecords = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/notices/${selectedProject}`);
      if (response.ok) {
        const data = await response.json();
        setNoticeRecords(data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load notice records');
    } finally {
      setLoading(false);
    }
  };

  const loadAwardRecords = async () => {
    if (!selectedProject) return;
    try {
      const response = await fetch(`${API_BASE_URL}/awards/${selectedProject}`);
      if (response.ok) {
        const data = await response.json();
        setAwardRecords(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load award records:', error);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject || !noticeForm.survey_number || !noticeForm.notice_number || !noticeForm.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const noticeData = {
        ...noticeForm,
        project_id: selectedProject,
        officer_id: user?.id || '',
        expiry_date: noticeForm.expiry_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      };

      const response = await fetch(`${API_BASE_URL}/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noticeData),
      });

      if (response.ok) {
        toast.success('Notice record created successfully');
        setNoticeForm({
          survey_number: '',
          project_id: '',
          officer_id: '',
          notice_type: 'acquisition',
          notice_date: new Date().toISOString().slice(0, 10),
          notice_number: '',
          amount: 0,
          land_type: 'agricultural',
          tribal_classification: 'non-tribal',
          category: 'general',
          notice_content: '',
          delivery_method: 'hand_delivery',
          delivery_status: 'pending',
          notice_status: 'draft',
          expiry_date: '',
          remarks: '',
          blockchain_verified: false
        });
        loadNoticeRecords();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create notice record');
      }
    } catch (error) {
      toast.error('Failed to create notice record');
    } finally {
      setLoading(false);
    }
  };

  const selectAwardRecord = (award: AwardRecord) => {
    setNoticeForm(prev => ({
      ...prev,
      survey_number: award.survey_number,
      amount: award.total_amount,
      land_type: award.land_type,
      tribal_classification: award.tribal_classification,
      category: award.category
    }));
    setSelectedAward(award);
    setShowAwardSelector(false);
  };

  const downloadTemplate = () => {
    const headers = ['survey_number', 'notice_type', 'notice_date', 'notice_number', 'amount', 'land_type', 'tribal_classification', 'category', 'delivery_method', 'remarks'];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notice_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const projectOptions = projects.map(p => ({ 
    id: p.id, 
    name: (p as any).projectName || (p as any).name || p.id 
  }));

  const availableAwardRecords = awardRecords.filter(award => 
    award.status === 'approved' && 
    !noticeRecords.some(notice => notice.survey_number === award.survey_number)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Enhanced Notice Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="project">Select Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {projectOptions.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedProject && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="form">Manual Entry</TabsTrigger>
                <TabsTrigger value="csv">CSV Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="form" className="space-y-6">
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  {/* Award Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Award Record</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowAwardSelector(true)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Select from Award Records
                        </Button>
                        {selectedAward && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Selected:</span>
                            <Badge variant="outline">
                              Survey: {selectedAward.survey_number} | 
                              Award: {selectedAward.award_number} | 
                              Amount: ₹{selectedAward.total_amount.toLocaleString()}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        Available award records: {availableAwardRecords.length} 
                        (Approved award records that don't have notices yet)
                      </div>
                    </CardContent>
                  </Card>

                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="survey_number">Survey Number *</Label>
                        <Input
                          id="survey_number"
                          value={noticeForm.survey_number}
                          onChange={(e) => setNoticeForm({ ...noticeForm, survey_number: e.target.value })}
                          required
                          readOnly={!!selectedAward}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notice_number">Notice Number *</Label>
                        <Input
                          id="notice_number"
                          value={noticeForm.notice_number}
                          onChange={(e) => setNoticeForm({ ...noticeForm, notice_number: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notice_date">Notice Date</Label>
                        <Input
                          id="notice_date"
                          type="date"
                          value={noticeForm.notice_date}
                          onChange={(e) => setNoticeForm({ ...noticeForm, notice_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notice_type">Notice Type</Label>
                        <Select value={noticeForm.notice_type} onValueChange={(value) => setNoticeForm({ ...noticeForm, notice_type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="acquisition">Land Acquisition</SelectItem>
                            <SelectItem value="possession">Possession</SelectItem>
                            <SelectItem value="eviction">Eviction</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (₹) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={noticeForm.amount}
                          onChange={(e) => setNoticeForm({ ...noticeForm, amount: parseFloat(e.target.value) || 0 })}
                          required
                          readOnly={!!selectedAward}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="land_type">Land Type</Label>
                        <Select value={noticeForm.land_type} onValueChange={(value) => setNoticeForm({ ...noticeForm, land_type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="agricultural">Agricultural</SelectItem>
                            <SelectItem value="residential">Residential</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="industrial">Industrial</SelectItem>
                            <SelectItem value="forest">Forest</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tribal_classification">Tribal Classification</Label>
                        <Select value={noticeForm.tribal_classification} onValueChange={(value) => setNoticeForm({ ...noticeForm, tribal_classification: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tribal">Tribal</SelectItem>
                            <SelectItem value="non-tribal">Non-Tribal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={noticeForm.category} onValueChange={(value) => setNoticeForm({ ...noticeForm, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="sc">SC</SelectItem>
                            <SelectItem value="st">ST</SelectItem>
                            <SelectItem value="obc">OBC</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Delivery Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Delivery Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="delivery_method">Delivery Method</Label>
                          <Select value={noticeForm.delivery_method} onValueChange={(value) => setNoticeForm({ ...noticeForm, delivery_method: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hand_delivery">Hand Delivery</SelectItem>
                              <SelectItem value="registered_post">Registered Post</SelectItem>
                              <SelectItem value="public_notice">Public Notice</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expiry_date">Expiry Date</Label>
                          <Input
                            id="expiry_date"
                            type="date"
                            value={noticeForm.expiry_date}
                            onChange={(e) => setNoticeForm({ ...noticeForm, expiry_date: e.target.value })}
                            min={noticeForm.notice_date}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notice Content */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Notice Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label htmlFor="notice_content">Custom Notice Content</Label>
                        <Textarea
                          id="notice_content"
                          value={noticeForm.notice_content}
                          onChange={(e) => setNoticeForm({ ...noticeForm, notice_content: e.target.value })}
                          placeholder="Enter custom notice content or leave blank to use auto-generated content..."
                          rows={6}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Additional Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Textarea
                          id="remarks"
                          value={noticeForm.remarks}
                          onChange={(e) => setNoticeForm({ ...noticeForm, remarks: e.target.value })}
                          placeholder="Additional notes or observations..."
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Creating...' : 'Create Notice Record'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="csv" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>CSV Upload for Notice Records</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Button variant="outline" onClick={downloadTemplate}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                      <div className="text-sm text-gray-600">
                        Upload CSV file with notice records for bulk processing
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="csv-upload">Select CSV File</Label>
                      <Input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      />
                    </div>

                    {csvFile && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{csvFile.name}</span>
                          <Badge variant="secondary">{csvFile.size} bytes</Badge>
                        </div>
                        
                        <Button disabled={loading} className="w-full">
                          {loading ? 'Uploading...' : 'Upload CSV'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Notice Records Table */}
          {selectedProject && noticeRecords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Notice Records ({noticeRecords.length})</span>
                  <Button onClick={loadNoticeRecords} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Survey No.</TableHead>
                      <TableHead>Notice No.</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Blockchain</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {noticeRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.survey_number}</TableCell>
                        <TableCell>{record.notice_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {record.notice_type}
                          </Badge>
                        </TableCell>
                        <TableCell>₹{record.amount.toLocaleString()}</TableCell>
                        <TableCell>{new Date(record.notice_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {record.delivery_method.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            record.notice_status === 'issued' ? 'default' : 
                            record.notice_status === 'delivered' ? 'secondary' : 'outline'
                          }>
                            {record.notice_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.blockchain_verified ? (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {!selectedProject && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select a project to start managing notice records.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Award Selector Dialog */}
      <Dialog open={showAwardSelector} onOpenChange={setShowAwardSelector}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Award Record</DialogTitle>
            <DialogDescription>
              Choose an approved award record to create a notice for. Only records without existing notices are shown.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Available Award Records: {availableAwardRecords.length}
            </div>
            
            {availableAwardRecords.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Survey No.</TableHead>
                      <TableHead>Award No.</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Land Type</TableHead>
                      <TableHead>Tribal</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableAwardRecords.map((award) => (
                      <TableRow key={award.id}>
                        <TableCell className="font-medium">{award.survey_number}</TableCell>
                        <TableCell>{award.award_number}</TableCell>
                        <TableCell>₹{award.total_amount.toLocaleString()}</TableCell>
                        <TableCell className="capitalize">{award.land_type}</TableCell>
                        <TableCell>
                          <Badge variant={award.tribal_classification === 'tribal' ? 'default' : 'secondary'}>
                            {award.tribal_classification}
                          </Badge>
                        </TableCell>
                        <TableCell className="uppercase">{award.category}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => selectAwardRecord(award)}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No available award records found. All approved award records already have notices.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedNoticeManager;
