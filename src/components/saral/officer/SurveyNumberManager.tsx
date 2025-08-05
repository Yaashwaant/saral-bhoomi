import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSaral } from '@/contexts/SaralContext';
import { toast } from 'sonner';
import { Search, Filter, FileText, Send, Eye, Download, MapPin, User, Calculator } from 'lucide-react';

interface SurveyFilter {
  village?: string;
  taluka?: string;
  district?: string;
  compensationRange?: 'low' | 'medium' | 'high';
  kycStatus?: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  noticeGenerated?: boolean;
}

const SurveyNumberManager: React.FC = () => {
  const { projects, landownerRecords, updateLandownerRecord } = useSaral();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [filters, setFilters] = useState<SurveyFilter>({});
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);

  // Get unique values for filters
  const villages = [...new Set(landownerRecords.map(r => r.village))];
  const talukas = [...new Set(landownerRecords.map(r => r.taluka))];
  const districts = [...new Set(landownerRecords.map(r => r.district))];

  useEffect(() => {
    if (selectedProject) {
      const projectRecords = landownerRecords.filter(r => r.projectId === selectedProject);
      let filtered = projectRecords;

      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(record =>
          record.सर्वे_नं.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.खातेदाराचे_नांव.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.village.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply other filters
      if (filters.village) {
        filtered = filtered.filter(r => r.village === filters.village);
      }
      if (filters.taluka) {
        filtered = filtered.filter(r => r.taluka === filters.taluka);
      }
      if (filters.district) {
        filtered = filtered.filter(r => r.district === filters.district);
      }
      if (filters.kycStatus) {
        filtered = filtered.filter(r => r.kycStatus === filters.kycStatus);
      }
      if (filters.noticeGenerated !== undefined) {
        filtered = filtered.filter(r => r.noticeGenerated === filters.noticeGenerated);
      }
      if (filters.compensationRange) {
        filtered = filtered.filter(r => {
          const amount = parseFloat(r.अंतिम_रक्कम);
          switch (filters.compensationRange) {
            case 'low': return amount < 5000000;
            case 'medium': return amount >= 5000000 && amount < 10000000;
            case 'high': return amount >= 10000000;
            default: return true;
          }
        });
      }

      setFilteredRecords(filtered);
    }
  }, [selectedProject, searchTerm, filters, landownerRecords]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(filteredRecords.map(r => r.id));
    } else {
      setSelectedRecords([]);
    }
  };

  const handleSelectRecord = (recordId: string, checked: boolean) => {
    if (checked) {
      setSelectedRecords(prev => [...prev, recordId]);
    } else {
      setSelectedRecords(prev => prev.filter(id => id !== recordId));
    }
  };

  const generateNotices = async () => {
    if (selectedRecords.length === 0) {
      toast.error('Please select at least one survey number');
      return;
    }

    try {
      for (const recordId of selectedRecords) {
        await updateLandownerRecord(recordId, { noticeGenerated: true });
      }
      toast.success(`Generated notices for ${selectedRecords.length} survey numbers`);
      setSelectedRecords([]);
    } catch (error) {
      toast.error('Failed to generate notices');
    }
  };

  const assignToAgent = async (recordId: string) => {
    try {
      await updateLandownerRecord(recordId, { 
        assignedAgent: 'agent@saral.gov.in',
        kycStatus: 'in_progress'
      });
      toast.success('Assigned to agent successfully');
    } catch (error) {
      toast.error('Failed to assign to agent');
    }
  };

  const getCompensationRange = (amount: string) => {
    const num = parseFloat(amount);
    if (num < 5000000) return 'low';
    if (num < 10000000) return 'medium';
    return 'high';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompensationColor = (range: string) => {
    switch (range) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Survey Number Management
          </CardTitle>
          <CardDescription>
            Filter and manage survey numbers for notice generation and agent assignment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project">Select Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.projectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Survey Numbers</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by survey number, owner name, or village..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Village</Label>
              <Select value={filters.village || ''} onValueChange={(value) => setFilters(prev => ({ ...prev, village: value || undefined }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All villages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All villages</SelectItem>
                  {villages.map(village => (
                    <SelectItem key={village} value={village}>
                      {village}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>KYC Status</Label>
              <Select value={filters.kycStatus || ''} onValueChange={(value) => setFilters(prev => ({ ...prev, kycStatus: value as any || undefined }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Compensation Range</Label>
              <Select value={filters.compensationRange || ''} onValueChange={(value) => setFilters(prev => ({ ...prev, compensationRange: value as any || undefined }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All ranges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All ranges</SelectItem>
                  <SelectItem value="low">Low (&lt; ₹50L)</SelectItem>
                  <SelectItem value="medium">Medium (₹50L - ₹1Cr)</SelectItem>
                  <SelectItem value="high">High (&gt; ₹1Cr)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={generateNotices} disabled={selectedRecords.length === 0}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Notices ({selectedRecords.length})
            </Button>
            <Button variant="outline" onClick={() => setFilters({})}>
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Survey Numbers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Numbers ({filteredRecords.length})</CardTitle>
          <CardDescription>
            Select survey numbers to generate notices or assign to agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Survey No</TableHead>
                <TableHead>Owner Name</TableHead>
                <TableHead>Village</TableHead>
                <TableHead>Area (Ha)</TableHead>
                <TableHead>Compensation</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead>Notice</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRecords.includes(record.id)}
                      onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{record.सर्वे_नं}</TableCell>
                  <TableCell>{record.खातेदाराचे_नांव}</TableCell>
                  <TableCell>{record.village}</TableCell>
                  <TableCell>{record.क्षेत्र}</TableCell>
                  <TableCell>
                    <Badge className={getCompensationColor(getCompensationRange(record.अंतिम_रक्कम))}>
                      ₹{(parseFloat(record.अंतिम_रक्कम) / 100000).toFixed(1)}L
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(record.kycStatus)}>
                      {record.kycStatus.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {record.noticeGenerated ? (
                      <Badge variant="outline" className="text-green-600">
                        Generated
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => assignToAgent(record.id)}
                        disabled={record.assignedAgent}
                      >
                        <User className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SurveyNumberManager; 