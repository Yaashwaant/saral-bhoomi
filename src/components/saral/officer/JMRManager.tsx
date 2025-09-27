import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Upload, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  FileText,
  MapPin,
  Calendar,
  User,
  Hash,
  Ruler,
  Building2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ExactDocumentTable from './ExactDocumentTable';

interface JMRRecord {
  _id?: string;
  serialNo: string;
  owner_name: string;
  survey_number: string;
  sub_division_number: string;
  classification: string;
  area: number; // आकारवंत क्षेत्र (हे. आर.)
  land_record_number?: string; // ७/१२
  sampadit_bhumapan_gat?: string; // संपादित क्षेत्र -> भुमापन गट क्र.
  sampadit_hectare?: number; // संपादित क्षेत्र -> इक्क हेक्टर
  sampadit_are?: number; // संपादित क्षेत्र -> इक्व आर
  structure_details_note?: string; // तपशील -> बांधकाम
  well_details_note?: string; // तपशील -> विहीर/कंपनीका
  tree_details_note?: string; // तपशील -> झाडे
  project: string;
  district: string;
  taluka: string;
  village: string;
  measurement_date?: string;
  remarks: string;
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt?: Date;
  updatedAt?: Date;
}

const JMRManager = () => {
  const [activeTab, setActiveTab] = useState('add');
  const [jmrRecords, setJmrRecords] = useState<JMRRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<JMRRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<JMRRecord | null>(null);

  // Form state
  const [formData, setFormData] = useState<JMRRecord>({
    serialNo: '',
    owner_name: '',
    survey_number: '',
    sub_division_number: '',
    classification: '',
    area: 0,
    land_record_number: '',
    sampadit_bhumapan_gat: '',
    sampadit_hectare: 0,
    sampadit_are: 0,
    structure_details_note: '',
    well_details_note: '',
    tree_details_note: '',
    project: '',
    district: '',
    taluka: '',
    village: '',
    measurement_date: '',
    remarks: '',
    status: 'draft'
  });

  // Search filters
  const [searchFilters, setSearchFilters] = useState({
    project: '',
    district: '',
    taluka: '',
    village: ''
  });

  // Sample data for dropdowns (this would come from API in real implementation)
  const [projects] = useState(['घोळ विकास प्रकल्प', 'नवी मुंबई विकास प्रकल्प', 'पुणे मेट्रो प्रकल्प']);
  const [districts] = useState(['पुणे', 'मुंबई', 'नाशिक', 'औरंगाबाद']);
  const [talukas] = useState(['हवेली', 'मुळशी', 'बारामती', 'पुरंदर']);
  const [villages] = useState(['घोळ', 'कर्हे', 'सुस', 'पिरंगुत', 'हिंजवडी']);

  // Load JMR records on component mount
  useEffect(() => {
    loadJMRRecords();
  }, []);

  // Filter records when search filters change
  useEffect(() => {
    filterRecords();
  }, [searchFilters, jmrRecords]);

  const loadJMRRecords = async () => {
    setLoading(true);
    try {
      // Fetch JMR records from MongoDB
      const response = await fetch('/api/jmr');
      if (response.ok) {
        const data = await response.json();
        setJmrRecords(data);
      } else {
        throw new Error('Failed to fetch JMR records');
      }
    } catch (error) {
      console.error('Error loading JMR records:', error);
      toast({
        title: "Error",
        description: "Failed to load JMR records from MongoDB",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = jmrRecords;

    if (searchFilters.project) {
      filtered = filtered.filter(record => 
        record.project_id?.toLowerCase().includes(searchFilters.project.toLowerCase())
      );
    }
    if (searchFilters.district) {
      filtered = filtered.filter(record => 
        record.district?.toLowerCase().includes(searchFilters.district.toLowerCase())
      );
    }
    if (searchFilters.taluka) {
      filtered = filtered.filter(record => 
        record.taluka?.toLowerCase().includes(searchFilters.taluka.toLowerCase())
      );
    }
    if (searchFilters.village) {
      filtered = filtered.filter(record => 
        record.village?.toLowerCase().includes(searchFilters.village.toLowerCase())
      );
    }
    

    setFilteredRecords(filtered);
  };

  const handleInputChange = (field: keyof JMRRecord, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Map Marathi land type to backend enum
    const mapLandType = (cls: string) => {
      switch (cls) {
        case 'कृषी':
          return 'agricultural';
        case 'अकृषी':
          return 'commercial';
        case 'वन':
          return 'forest';
        default:
          return 'other';
      }
    };

    // Combine संपादित क्षेत्र (hectare + are) => measured_area
    const measured_area = (Number(formData.sampadit_hectare || 0)) + (Number(formData.sampadit_are || 0) / 100);

    // Build backend payload aligned to Mongo schema
    const payload: any = {
      survey_number: formData.survey_number,
      sub_division_number: formData.sub_division_number,
      land_record_number: formData.land_record_number,
      measurement_date: formData.measurement_date,
      measured_area,
      land_type: mapLandType(formData.classification),
      village: formData.village,
      taluka: formData.taluka,
      district: formData.district,
      owner_name: formData.owner_name,
      remarks: formData.remarks,
      status: formData.status,
      // Preserve UI grouping as metadata for future use
      metadata: {
        serialNo: formData.serialNo,
        akarvant: { bhumapan_gat: formData.survey_number, jaminicha_prakar: formData.classification, area_he_ar: formData.area },
        satbara: { land_record_number: formData.land_record_number },
        sampadit: { bhumapan_gat: formData.sampadit_bhumapan_gat, hectare: formData.sampadit_hectare, are: formData.sampadit_are },
      },
      // Minimal details arrays mapping
      structure_details: formData.structure_details_note ? [{ type: 'बांधकाम', description: formData.structure_details_note }] : [],
      well_details: formData.well_details_note ? [{ construction_type: 'विहीर/कंपनीका', value: null }] : [],
      tree_details: formData.tree_details_note ? [{ type: 'झाडे', count: null, value: null }] : [],
    };

    try {
      if (editingRecord) {
        // Update existing record in MongoDB
        const response = await fetch(`/api/jmr/${editingRecord._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const updatedRecord = await response.json();
          const updatedRecords = jmrRecords.map(record => 
            record._id === editingRecord._id ? updatedRecord : record
          );
          setJmrRecords(updatedRecords);
          toast({
            title: "Success",
            description: "JMR record updated successfully in MongoDB"
          });
        } else {
          throw new Error('Failed to update record');
        }
      } else {
        // Add new record to MongoDB
        const response = await fetch('/api/jmr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const newRecord = await response.json();
          setJmrRecords(prev => [...prev, newRecord]);
          toast({
            title: "Success",
            description: "JMR record added successfully to MongoDB"
          });
        } else {
          throw new Error('Failed to add record');
        }
      }

      // Reset form
      setFormData({
        serialNo: '',
        owner_name: '',
        survey_number: '',
        sub_division_number: '',
        classification: '',
        area: 0,
        land_record_number: '',
        sampadit_bhumapan_gat: '',
        sampadit_hectare: 0,
        sampadit_are: 0,
        structure_details_note: '',
        well_details_note: '',
        tree_details_note: '',
        project: '',
        district: '',
        taluka: '',
        village: '',
        measurement_date: '',
        remarks: '',
        status: 'draft'
      });
      setEditingRecord(null);
      setActiveTab('view');
    } catch (error) {
      console.error('Error saving JMR record:', error);
      toast({
        title: "Error",
        description: "Failed to save JMR record to MongoDB",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: JMRRecord) => {
    setFormData(record);
    setEditingRecord(record);
    setActiveTab('add');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const response = await fetch(`/api/jmr/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setJmrRecords(prev => prev.filter(record => record._id !== id));
          toast({
            title: "Success",
            description: "JMR record deleted successfully from MongoDB"
          });
        } else {
          throw new Error('Failed to delete record');
        }
      } catch (error) {
        console.error('Error deleting JMR record:', error);
        toast({
          title: "Error",
          description: "Failed to delete JMR record from MongoDB",
          variant: "destructive"
        });
      }
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('csvFile', file);

      const response = await fetch('/api/jmr/upload-csv', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: `${result.count} JMR records uploaded successfully to MongoDB`
        });
        // Refresh the records
        loadJMRRecords();
      } else {
        throw new Error('Failed to upload CSV');
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast({
        title: "Error",
        description: "Failed to upload CSV file to MongoDB",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'ID', 'Survey Number', 'Owner ID', 'Project ID', 'Officer ID', 'Measured Area', 
      'Land Type', 'Tribal Classification', 'District', 'Taluka', 
      'Village', 'Category', 'Measurement Date', 'Status', 'Remarks'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => [
        record._id, record.survey_number, record.owner_id, record.project_id,
        record.officer_id, record.measured_area, record.land_type, record.tribal_classification,
        record.district, record.taluka, record.village, record.category,
        record.measurement_date, record.status, record.remarks
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jmr_records.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (<div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            JMR (Joint Measurement Record) Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="add" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {editingRecord ? 'Edit Record' : 'Add Record'}
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                CSV Upload
              </TabsTrigger>
              <TabsTrigger value="view" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                View Records
              </TabsTrigger>
            </TabsList>

            <TabsContent value="add" className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project">प्रकल्प नाव</Label>
                    <Input
                      id="project"
                      value={formData.project}
                      onChange={(e) => handleInputChange('project', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="district">जिल्हा</Label>
                    <Input
                      id="district"
                      value={formData.district}
                      onChange={(e) => handleInputChange('district', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="taluka">तालुका</Label>
                    <Input
                      id="taluka"
                      value={formData.taluka}
                      onChange={(e) => handleInputChange('taluka', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="village">गाव</Label>
                    <Input
                      id="village"
                      value={formData.village}
                      onChange={(e) => handleInputChange('village', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="serialNo">अ.क्र.</Label>
                    <Input
                      id="serialNo"
                      value={formData.serialNo}
                      onChange={(e) => handleInputChange('serialNo', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner_name">खातेदाराचे नाव</Label>
                    <Input
                      id="owner_name"
                      value={formData.owner_name}
                      onChange={(e) => handleInputChange('owner_name', e.target.value)}
                      required
                    />
                  </div>

                  {/* आकारवंत प्रमाणे */}
                  <div className="col-span-2">
                    <Label className="text-lg font-bold">आकारवंत प्रमाणे</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label htmlFor="survey_number">भुमापन गट क्र.</Label>
                        <Input
                          id="survey_number"
                          value={formData.survey_number}
                          onChange={(e) => handleInputChange('survey_number', e.target.value)}
                          required
                        />
                        <Label htmlFor="sub_division_number" className="mt-2">उपविभाग क्र.</Label>
                        <Input
                          id="sub_division_number"
                          value={formData.sub_division_number}
                          onChange={(e) => handleInputChange('sub_division_number', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="classification">जमिनीचा प्रकार</Label>
                        <Select value={formData.classification} onValueChange={(value) => handleInputChange('classification', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="वर्गीकरण निवडा" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="कृषी">कृषी</SelectItem>
                            <SelectItem value="अकृषी">अकृषी</SelectItem>
                            <SelectItem value="वन">वन</SelectItem>
                            <SelectItem value="पडीक">पडीक</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="area">क्षेत्र हे. आर. मध्ये</Label>
                        <Input
                          id="area"
                          type="number"
                          value={formData.area}
                          onChange={(e) => handleInputChange('area', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* ७/१२ */}
                  <div className="col-span-2 md:col-span-1">
                    <Label htmlFor="land_record_number">७/१२</Label>
                    <Input
                      id="land_record_number"
                      value={formData.land_record_number || ''}
                      onChange={(e) => handleInputChange('land_record_number', e.target.value)}
                    />
                  </div>

                  {/* संपादित क्षेत्र */}
                  <div className="col-span-2">
                    <Label className="text-lg font-bold">संपादित क्षेत्र</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label htmlFor="sampadit_bhumapan_gat">भुमापन गट क्र.</Label>
                        <Input
                          id="sampadit_bhumapan_gat"
                          value={formData.sampadit_bhumapan_gat || ''}
                          onChange={(e) => handleInputChange('sampadit_bhumapan_gat', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sampadit_hectare">इक्क हेक्टर</Label>
                        <Input
                          id="sampadit_hectare"
                          type="number"
                          value={formData.sampadit_hectare ?? 0}
                          onChange={(e) => handleInputChange('sampadit_hectare', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sampadit_are">इक्व आर</Label>
                        <Input
                          id="sampadit_are"
                          type="number"
                          value={formData.sampadit_are ?? 0}
                          onChange={(e) => handleInputChange('sampadit_are', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="measurement_date">मापन दिनांक</Label>
                    <Input
                      id="measurement_date"
                      type="date"
                      value={formData.measurement_date || ''}
                      onChange={(e) => handleInputChange('measurement_date', e.target.value)}
                    />
                  </div>

                  {/* तपशील */}
                  <div className="col-span-2">
                    <Label className="text-lg font-bold">तपशील</Label>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                      <div>
                        <Label htmlFor="structure_details_note">बांधकाम</Label>
                        <Input
                          id="structure_details_note"
                          value={formData.structure_details_note || ''}
                          onChange={(e) => handleInputChange('structure_details_note', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="well_details_note">विहीर/ कंपनीका</Label>
                        <Input
                          id="well_details_note"
                          value={formData.well_details_note || ''}
                          onChange={(e) => handleInputChange('well_details_note', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tree_details_note">झाडे</Label>
                        <Input
                          id="tree_details_note"
                          value={formData.tree_details_note || ''}
                          onChange={(e) => handleInputChange('tree_details_note', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="remarks">शेरा</Label>
                        <Textarea
                          id="remarks"
                          value={formData.remarks}
                          onChange={(e) => handleInputChange('remarks', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full md:w-auto">
                  {loading ? 'Saving...' : editingRecord ? 'Update Record' : 'Add Record'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>CSV Upload</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="csvFile">Upload CSV File</Label>
                    <Input
                      id="csvFile"
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>CSV Format:</strong></p>
                    <p>Survey Number, Owner ID, Project ID, Officer ID, Measured Area, Land Type, Tribal Classification, District, Taluka, Village, Category, Measurement Date, Status, Remarks</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="view" className="space-y-6">
              {/* Search Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Search Filters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-lg font-bold">स्थान फिल्टर्स (Location Filters)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="searchProject">प्रकल्प (Project)</Label>
                        <Input
                          id="searchProject"
                          placeholder="प्रकल्प शोधा..."
                          value={searchFilters.project}
                          onChange={(e) => setSearchFilters(prev => ({ ...prev, project: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="searchDistrict">जिल्हा (District)</Label>
                        <Input
                          id="searchDistrict"
                          placeholder="जिल्हा शोधा..."
                          value={searchFilters.district}
                          onChange={(e) => setSearchFilters(prev => ({ ...prev, district: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="searchTaluka">तालुका (Taluka)</Label>
                        <Input
                          id="searchTaluka"
                          placeholder="तालुका शोधा..."
                          value={searchFilters.taluka}
                          onChange={(e) => setSearchFilters(prev => ({ ...prev, taluka: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="searchVillage">गाव (Village)</Label>
                        <Input
                          id="searchVillage"
                          placeholder="गाव शोधा..."
                          value={searchFilters.village}
                          onChange={(e) => setSearchFilters(prev => ({ ...prev, village: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchFilters({
                        project: '', district: '', taluka: '', village: ''
                      })}
                    >
                      Clear Filters
                    </Button>
                    <Button onClick={exportToCSV} className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* JMR Records Table */}
              <Card>
                <CardHeader>
                  <CardTitle>JMR Records ({filteredRecords.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <ExactDocumentTable />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default JMRManager;