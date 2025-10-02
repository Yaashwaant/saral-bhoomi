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
import { Autocomplete } from '@/components/ui/autocomplete';
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
import { config } from '@/config';
import ExactDocumentTable from './ExactDocumentTable';
import PDFUploadManager from './PDFUploadManager';

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
  forest_land_area?: number; // वन जमीन क्षेत्र (हे.)
  agricultural_land_area?: number; // कृषी जमीन क्षेत्र (हे.)
  non_agricultural_land_area?: number; // अकृषी जमीन क्षेत्र (हे.)
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
  console.log('JMRManager component rendering');
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
    forest_land_area: 0,
    agricultural_land_area: 0,
    non_agricultural_land_area: 0,
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
    console.log('Component mounted, loading JMR records...');
    loadJMRRecords();
  }, []);

  // Filter records when search filters change
  useEffect(() => {
    console.log('Search filters or jmrRecords changed, filtering records...');
    console.log('jmrRecords type:', typeof jmrRecords);
    console.log('jmrRecords is array:', Array.isArray(jmrRecords));
    console.log('jmrRecords length:', jmrRecords?.length);
    filterRecords();
  }, [searchFilters, jmrRecords]);

  const loadJMRRecords = async () => {
    setLoading(true);
    try {
      console.log('Loading JMR records...');
      
      // Sample data for testing when API is not available
      const sampleData: JMRRecord[] = [
        {
          _id: '1',
          serialNo: '001',
          owner_name: 'जॉन डोे',
          survey_number: '123',
          sub_division_number: 'A',
          classification: 'कृषी',
          area: 2.5,
          land_record_number: '712/ABC',
          sampadit_bhumapan_gat: '456',
          sampadit_hectare: 1.2,
          sampadit_are: 30,
          structure_details_note: 'घर',
          well_details_note: 'विहीर',
          tree_details_note: 'मango झाडे',
          project: 'घोळ विकास प्रकल्प',
          district: 'पुणे',
          taluka: 'हवेली',
          village: 'घोळ',
          measurement_date: '2024-01-15',
          remarks: 'चांगला प्रकल्प',
          status: 'approved',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15')
        },
        {
          _id: '2',
          serialNo: '002',
          owner_name: 'जेन स्मिथ',
          survey_number: '456',
          sub_division_number: 'B',
          classification: 'अकृषी',
          area: 1.8,
          land_record_number: '712/DEF',
          project: 'नवी मुंबई विकास प्रकल्प',
          district: 'मुंबई',
          taluka: 'अंधेरी',
          village: 'वर्सोवा',
          measurement_date: '2024-02-20',
          remarks: 'उत्कृष्ट स्थान',
          status: 'submitted'
        }
      ];
      
      console.log('Using sample data:', sampleData.length);
      setJmrRecords(sampleData);
      
      // Try to fetch from API if available
      try {
        const response = await fetch(`${config.API_BASE_URL}/jmr`);
        if (response.ok) {
          const data = await response.json();
          console.log('API data loaded:', data.length);
          setJmrRecords(data);
        }
      } catch (apiError) {
        console.log('API not available, using sample data');
      }
    } catch (error) {
      console.error('Error loading JMR records:', error);
      toast({
        title: "Error",
        description: "Failed to load JMR records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    console.log('Filtering records:', { 
      totalRecords: jmrRecords.length, 
      searchFilters,
      sampleRecord: jmrRecords[0] 
    });
    
    // Ensure jmrRecords is an array before filtering
    if (!Array.isArray(jmrRecords)) {
      console.error('jmrRecords is not an array:', jmrRecords);
      setFilteredRecords([]);
      return;
    }
    
    let filtered = jmrRecords;

    if (searchFilters.project) {
      filtered = filtered.filter(record => {
        const projectMatch = record.project?.toLowerCase().includes(searchFilters.project.toLowerCase());
        console.log('Project filter check:', { 
          recordProject: record.project, 
          searchProject: searchFilters.project, 
          match: projectMatch 
        });
        return projectMatch;
      });
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
    
    console.log('Filtered records count:', filtered.length);
    setFilteredRecords(filtered);
  };

  const handleInputChange = (field: keyof JMRRecord, value: string) => {
    try {
      console.log('JMRManager handleInputChange:', { field, value })
      setFormData(prev => {
        const newFormData = {
          ...prev,
          [field]: value
        }
        console.log('New formData:', newFormData)
        return newFormData
      })
    } catch (error) {
      console.error('Error in JMRManager handleInputChange:', error)
    }
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
      // New land type area fields
      forest_land_area: Number(formData.forest_land_area || 0),
      agricultural_land_area: Number(formData.agricultural_land_area || 0),
      non_agricultural_land_area: Number(formData.non_agricultural_land_area || 0),
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
        const response = await fetch(`${config.API_BASE_URL}/jmr/${editingRecord._id}`, {
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
        const response = await fetch(`${config.API_BASE_URL}/jmr`, {
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
        const response = await fetch(`${config.API_BASE_URL}/jmr/${id}`, {
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

      const response = await fetch(`${config.API_BASE_URL}/jmr/upload-csv`, {
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

  return (
    <div className="space-y-6">
      {console.log('Rendering JMRManager with activeTab:', activeTab, 'filteredRecords:', filteredRecords.length)}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            JMR (Joint Measurement Record) Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => {
            console.log('Tab changing from', activeTab, 'to', value);
            setActiveTab(value);
          }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="add" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {editingRecord ? 'Edit Record' : 'Add Record'}
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                PDF Upload
              </TabsTrigger>
              <TabsTrigger value="view" className="flex items-center gap-2" onClick={() => console.log('View Records tab clicked!')}>
                <Search className="h-4 w-4" />
                View Records
              </TabsTrigger>
            </TabsList>

            <TabsContent value="add" className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project">प्रकल्प नाव</Label>
                    <Autocomplete
                      options={projects}
                      value={formData.project}
                      onChange={(value) => handleInputChange('project', value)}
                      placeholder="प्रकल्प निवडा..."
                      emptyText="कोणताही प्रकल्प सापडला नाही"
                    />
                  </div>
                  <div>
                    <Label htmlFor="district">जिल्हा</Label>
                    <Autocomplete
                      options={districts}
                      value={formData.district}
                      onChange={(value) => handleInputChange('district', value)}
                      placeholder="जिल्हा निवडा..."
                      emptyText="कोणताही जिल्हा सापडला नाही"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taluka">तालुका</Label>
                    <Autocomplete
                      options={talukas}
                      value={formData.taluka}
                      onChange={(value) => handleInputChange('taluka', value)}
                      placeholder="तालुका निवडा..."
                      emptyText="कोणताही तालुका सापडला नाही"
                    />
                  </div>
                  <div>
                    <Label htmlFor="village">गाव</Label>
                    <Autocomplete
                      options={villages}
                      value={formData.village}
                      onChange={(value) => handleInputChange('village', value)}
                      placeholder="गाव निवडा..."
                      emptyText="कोणताही गाव सापडले नाही"
                    />
                  </div>

                  {/* संपादित जमिनीचे प्रकार */}
                  <div className="col-span-2">
                    <Label className="text-lg font-bold">संपादित जमिनीचे प्रकार (हेक्टरमध्ये)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label htmlFor="forest_land_area">वन जमीन क्षेत्र (हे.)</Label>
                        <Input
                          id="forest_land_area"
                          type="number"
                          step="0.01"
                          value={formData.forest_land_area ?? 0}
                          onChange={(e) => handleInputChange('forest_land_area', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="agricultural_land_area">कृषी जमीन क्षेत्र (हे.)</Label>
                        <Input
                          id="agricultural_land_area"
                          type="number"
                          step="0.01"
                          value={formData.agricultural_land_area ?? 0}
                          onChange={(e) => handleInputChange('agricultural_land_area', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="non_agricultural_land_area">अकृषी जमीन क्षेत्र (हे.)</Label>
                        <Input
                          id="non_agricultural_land_area"
                          type="number"
                          step="0.01"
                          value={formData.non_agricultural_land_area ?? 0}
                          onChange={(e) => handleInputChange('non_agricultural_land_area', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
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
              <PDFUploadManager 
                onUploadSuccess={(data) => {
                  console.log('PDF uploaded successfully:', data);
                  toast({
                    title: "PDF Upload Successful",
                    description: `PDF uploaded for project: ${data.project}`
                  });
                  // Optionally refresh records or update state
                  loadJMRRecords();
                }}
              />
            </TabsContent>

            <TabsContent value="view" className="space-y-6">
              {/* Debug info */}
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                Debug: Active tab is {activeTab}, Filtered records: {filteredRecords.length}
              </div>
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
                        <Autocomplete
                          options={projects}
                          value={searchFilters.project}
                          onChange={(value) => {
                        try {
                          console.log('Search filter project change:', value)
                          setSearchFilters(prev => ({ ...prev, project: value }))
                        } catch (error) {
                          console.error('Error updating project filter:', error)
                        }
                      }}
                          placeholder="प्रकल्प निवडा..."
                          emptyText="कोणताही प्रकल्प सापडला नाही"
                        />
                      </div>
                      <div>
                        <Label htmlFor="searchDistrict">जिल्हा (District)</Label>
                        <Autocomplete
                          options={districts}
                          value={searchFilters.district}
                          onChange={(value) => {
                        try {
                          console.log('Search filter district change:', value)
                          setSearchFilters(prev => ({ ...prev, district: value }))
                        } catch (error) {
                          console.error('Error updating district filter:', error)
                        }
                      }}
                           placeholder="जिल्हा निवडा..."
                           emptyText="कोणताही जिल्हा सापडला नाही"
                         />
                       </div>
                       <div>
                         <Label htmlFor="searchTaluka">तालुका</Label>
                         <Autocomplete
                           options={talukas}
                           value={searchFilters.taluka}
                           onChange={(value) => {
                        try {
                          console.log('Search filter taluka change:', value)
                          setSearchFilters(prev => ({ ...prev, taluka: value }))
                        } catch (error) {
                          console.error('Error updating taluka filter:', error)
                        }
                      }}
                           placeholder="तालुका निवडा..."
                           emptyText="कोणताही तालुका सापडला नाही"
                         />
                       </div>
                       <div>
                         <Label htmlFor="searchVillage">गाव</Label>
                         <Autocomplete
                           options={villages}
                           value={searchFilters.village}
                           onChange={(value) => {
                        try {
                          console.log('Search filter village change:', value)
                          setSearchFilters(prev => ({ ...prev, village: value }))
                        } catch (error) {
                          console.error('Error updating village filter:', error)
                        }
                      }}
                          placeholder="गाव निवडा..."
                          emptyText="कोणताही गाव सापडले नाही"
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
                  <CardTitle>JMR Records ({Array.isArray(filteredRecords) ? filteredRecords.length : 'Invalid data'})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    {console.log('Rendering ExactDocumentTable with filteredRecords:', filteredRecords)}
                    {console.log('Is filteredRecords array:', Array.isArray(filteredRecords))}
                    <ExactDocumentTable records={filteredRecords} />
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