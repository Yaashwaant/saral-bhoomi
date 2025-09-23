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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Upload, 
  FileText, 
  Plus, 
  Eye, 
  Download, 
  CheckCircle, 
  AlertCircle,
  Database,
  Hash,
  RefreshCw
} from 'lucide-react';
import { config } from '../../../config';

interface JMRRecord {
  id?: string;
  survey_number: string;
  project_id: string;
  officer_id: string;
  measurement_date: string;
  measured_area: number;
  land_type: string;
  tribal_classification: string;
  category: string;
  structure_details: Array<{
    type: string;
    description: string;
    area: number;
    value: number;
  }>;
  tree_details: Array<{
    type: string;
    count: number;
    age: number;
    value: number;
  }>;
  well_details: Array<{
    depth: number;
    diameter: number;
    construction_type: string;
    value: number;
  }>;
  total_structure_value: number;
  total_tree_value: number;
  total_well_value: number;
  remarks: string;
  status: string;
  blockchain_verified: boolean;
  blockchain_hash?: string;
  blockchain_timestamp?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

const EnhancedJMRManager: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useSaral();
  
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [jmrRecords, setJmrRecords] = useState<JMRRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('form');
  
  // Form state
  const [jmrForm, setJmrForm] = useState<JMRRecord>({
    survey_number: '',
    project_id: '',
    officer_id: '',
    measurement_date: new Date().toISOString().slice(0, 10),
    measured_area: 0,
    land_type: 'agricultural',
    tribal_classification: 'non-tribal',
    category: 'general',
    structure_details: [],
    tree_details: [],
    well_details: [],
    total_structure_value: 0,
    total_tree_value: 0,
    total_well_value: 0,
    remarks: '',
    status: 'draft',
    blockchain_verified: false
  });

  const [structureForm, setStructureForm] = useState({
    type: '',
    description: '',
    area: 0,
    value: 0
  });

  const [treeForm, setTreeForm] = useState({
    type: '',
    count: 0,
    age: 0,
    value: 0
  });

  const [wellForm, setWellForm] = useState({
    depth: 0,
    diameter: 0,
    construction_type: '',
    value: 0
  });

  const API_BASE_URL = config.API_BASE_URL;

  useEffect(() => {
    if (selectedProject) {
      loadJMRRecords();
    }
  }, [selectedProject]);

  const loadJMRRecords = async () => {
    if (!selectedProject) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/jmr/${selectedProject}`);
      if (response.ok) {
        const data = await response.json();
        setJmrRecords(data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load JMR records');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    if (!jmrForm.survey_number || !jmrForm.measured_area) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const jmrData = {
        ...jmrForm,
        project_id: selectedProject,
        officer_id: user?.id || '',
        total_structure_value: jmrForm.structure_details.reduce((sum, item) => sum + item.value, 0),
        total_tree_value: jmrForm.tree_details.reduce((sum, item) => sum + item.value, 0),
        total_well_value: jmrForm.well_details.reduce((sum, item) => sum + item.value, 0)
      };

      const response = await fetch(`${API_BASE_URL}/jmr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jmrData),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('JMR record created successfully');
        
        // Reset form
        setJmrForm({
          survey_number: '',
          project_id: '',
          officer_id: '',
          measurement_date: new Date().toISOString().slice(0, 10),
          measured_area: 0,
          land_type: 'agricultural',
          tribal_classification: 'non-tribal',
          category: 'general',
          structure_details: [],
          tree_details: [],
          well_details: [],
          total_structure_value: 0,
          total_tree_value: 0,
          total_well_value: 0,
          remarks: '',
          status: 'draft',
          blockchain_verified: false
        });
        
        // Reload records
        loadJMRRecords();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create JMR record');
      }
    } catch (error) {
      toast.error('Failed to create JMR record');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile || !selectedProject) {
      toast.error('Please select a CSV file and project');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('csv', csvFile);
      formData.append('project_id', selectedProject);
      formData.append('officer_id', user?.id || '');

      const response = await fetch(`${API_BASE_URL}/csv/upload-jmr`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully uploaded ${result.uploaded} JMR records`);
        setCsvFile(null);
        setCsvPreview([]);
        loadJMRRecords();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to upload CSV');
      }
    } catch (error) {
      toast.error('Failed to upload CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      previewCsv(file);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  const previewCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      const preview = lines.slice(1, 6).map(line => {
        const values = line.split(',');
        const row: any = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || '';
        });
        return row;
      });
      setCsvPreview(preview);
    };
    reader.readAsText(file);
  };

  const addStructure = () => {
    if (structureForm.type && structureForm.description) {
      setJmrForm(prev => ({
        ...prev,
        structure_details: [...prev.structure_details, { ...structureForm }]
      }));
      setStructureForm({ type: '', description: '', area: 0, value: 0 });
    }
  };

  const addTree = () => {
    if (treeForm.type) {
      setJmrForm(prev => ({
        ...prev,
        tree_details: [...prev.tree_details, { ...treeForm }]
      }));
      setTreeForm({ type: '', count: 0, age: 0, value: 0 });
    }
  };

  const addWell = () => {
    if (wellForm.construction_type) {
      setJmrForm(prev => ({
        ...prev,
        well_details: [...prev.well_details, { ...wellForm }]
      }));
      setWellForm({ depth: 0, diameter: 0, construction_type: '', value: 0 });
    }
  };

  const removeStructure = (index: number) => {
    setJmrForm(prev => ({
      ...prev,
      structure_details: prev.structure_details.filter((_, i) => i !== index)
    }));
  };

  const removeTree = (index: number) => {
    setJmrForm(prev => ({
      ...prev,
      tree_details: prev.tree_details.filter((_, i) => i !== index)
    }));
  };

  const removeWell = (index: number) => {
    setJmrForm(prev => ({
      ...prev,
      well_details: prev.well_details.filter((_, i) => i !== index)
    }));
  };

  const downloadTemplate = () => {
    const headers = [
      'survey_number',
      'measured_area',
      'land_type',
      'tribal_classification',
      'category',
      'remarks'
    ];
    
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jmr_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
            <Database className="h-5 w-5" />
            Enhanced JMR Management
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
                          value={jmrForm.survey_number}
                          onChange={(e) => setJmrForm({ ...jmrForm, survey_number: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="measured_area">Measured Area (Ha) *</Label>
                        <Input
                          id="measured_area"
                          type="number"
                          step="0.01"
                          value={jmrForm.measured_area}
                          onChange={(e) => setJmrForm({ ...jmrForm, measured_area: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="land_type">Land Type</Label>
                        <Select value={jmrForm.land_type} onValueChange={(value) => setJmrForm({ ...jmrForm, land_type: value })}>
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
                        <Select value={jmrForm.tribal_classification} onValueChange={(value) => setJmrForm({ ...jmrForm, tribal_classification: value })}>
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
                        <Select value={jmrForm.category} onValueChange={(value) => setJmrForm({ ...jmrForm, category: value })}>
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
                      <div className="space-y-2">
                        <Label htmlFor="measurement_date">Measurement Date</Label>
                        <Input
                          id="measurement_date"
                          type="date"
                          value={jmrForm.measurement_date}
                          onChange={(e) => setJmrForm({ ...jmrForm, measurement_date: e.target.value })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Structure Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Structure Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-4 gap-4">
                        <Input
                          placeholder="Type"
                          value={structureForm.type}
                          onChange={(e) => setStructureForm({ ...structureForm, type: e.target.value })}
                        />
                        <Input
                          placeholder="Description"
                          value={structureForm.description}
                          onChange={(e) => setStructureForm({ ...structureForm, description: e.target.value })}
                        />
                        <Input
                          type="number"
                          placeholder="Area"
                          value={structureForm.area}
                          onChange={(e) => setStructureForm({ ...structureForm, area: parseFloat(e.target.value) || 0 })}
                        />
                        <Input
                          type="number"
                          placeholder="Value"
                          value={structureForm.value}
                          onChange={(e) => setStructureForm({ ...structureForm, value: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <Button type="button" onClick={addStructure} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Structure
                      </Button>
                      
                      {jmrForm.structure_details.length > 0 && (
                        <div className="space-y-2">
                          <Label>Added Structures:</Label>
                          {jmrForm.structure_details.map((structure, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span>{structure.type} - {structure.description} (Area: {structure.area}, Value: ₹{structure.value})</span>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeStructure(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tree Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Tree Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-4 gap-4">
                        <Input
                          placeholder="Type"
                          value={treeForm.type}
                          onChange={(e) => setTreeForm({ ...treeForm, type: e.target.value })}
                        />
                        <Input
                          type="number"
                          placeholder="Count"
                          value={treeForm.count}
                          onChange={(e) => setTreeForm({ ...treeForm, count: parseInt(e.target.value) || 0 })}
                        />
                        <Input
                          type="number"
                          placeholder="Age (years)"
                          value={treeForm.age}
                          onChange={(e) => setTreeForm({ ...treeForm, age: parseInt(e.target.value) || 0 })}
                        />
                        <Input
                          type="number"
                          placeholder="Value"
                          value={treeForm.value}
                          onChange={(e) => setTreeForm({ ...treeForm, value: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <Button type="button" onClick={addTree} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Tree
                      </Button>
                      
                      {jmrForm.tree_details.length > 0 && (
                        <div className="space-y-2">
                          <Label>Added Trees:</Label>
                          {jmrForm.tree_details.map((tree, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span>{tree.type} - Count: {tree.count}, Age: {tree.age} years, Value: ₹{tree.value}</span>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeTree(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Well Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Well Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-4 gap-4">
                        <Input
                          type="number"
                          placeholder="Depth (ft)"
                          value={wellForm.depth}
                          onChange={(e) => setWellForm({ ...wellForm, depth: parseFloat(e.target.value) || 0 })}
                        />
                        <Input
                          type="number"
                          placeholder="Diameter (ft)"
                          value={wellForm.diameter}
                          onChange={(e) => setWellForm({ ...wellForm, diameter: parseFloat(e.target.value) || 0 })}
                        />
                        <Input
                          placeholder="Construction Type"
                          value={wellForm.construction_type}
                          onChange={(e) => setWellForm({ ...wellForm, construction_type: e.target.value })}
                        />
                        <Input
                          type="number"
                          placeholder="Value"
                          value={wellForm.value}
                          onChange={(e) => setWellForm({ ...wellForm, value: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <Button type="button" onClick={addWell} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Well
                      </Button>
                      
                      {jmrForm.well_details.length > 0 && (
                        <div className="space-y-2">
                          <Label>Added Wells:</Label>
                          {jmrForm.well_details.map((well, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span>Depth: {well.depth}ft, Diameter: {well.diameter}ft, Type: {well.construction_type}, Value: ₹{well.value}</span>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeWell(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Remarks */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Textarea
                          id="remarks"
                          value={jmrForm.remarks}
                          onChange={(e) => setJmrForm({ ...jmrForm, remarks: e.target.value })}
                          placeholder="Additional notes or observations..."
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Creating...' : 'Create JMR Record'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="csv" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>CSV Upload for JMR Records</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Button variant="outline" onClick={downloadTemplate}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                      <div className="text-sm text-gray-600">
                        Upload CSV file with JMR records for bulk processing
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="csv-upload">Select CSV File</Label>
                      <Input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleCsvFileChange}
                      />
                    </div>

                    {csvFile && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{csvFile.name}</span>
                          <Badge variant="secondary">{csvFile.size} bytes</Badge>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button onClick={() => setShowCsvPreview(!showCsvPreview)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                          <Button onClick={handleCsvUpload} disabled={loading}>
                            {loading ? 'Uploading...' : 'Upload CSV'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {showCsvPreview && csvPreview.length > 0 && (
                      <div className="space-y-2">
                        <Label>CSV Preview (First 5 rows):</Label>
                        <div className="border rounded p-2 bg-gray-50">
                          <pre className="text-sm overflow-x-auto">
                            {JSON.stringify(csvPreview, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* JMR Records Table */}
          {selectedProject && jmrRecords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>JMR Records ({jmrRecords.length})</span>
                  <Button onClick={loadJMRRecords} variant="outline" size="sm">
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
                      <TableHead>Area (Ha)</TableHead>
                      <TableHead>Land Type</TableHead>
                      <TableHead>Tribal</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Blockchain</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jmrRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.survey_number}</TableCell>
                        <TableCell>{record.measured_area}</TableCell>
                        <TableCell className="capitalize">{record.land_type}</TableCell>
                        <TableCell>
                          <Badge variant={record.tribal_classification === 'tribal' ? 'default' : 'secondary'}>
                            {record.tribal_classification}
                          </Badge>
                        </TableCell>
                        <TableCell className="uppercase">{record.category}</TableCell>
                        <TableCell>
                          <Badge variant={record.status === 'approved' ? 'default' : 'secondary'}>
                            {record.status}
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
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
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
                Please select a project to start managing JMR records.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedJMRManager;
