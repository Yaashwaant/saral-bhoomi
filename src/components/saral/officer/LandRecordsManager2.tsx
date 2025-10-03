import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Database, 
  RefreshCw, 
  Download, 
  Upload, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Search,
  Hash, 
  Shield, 
  AlertTriangle,
  Clock, 
  Plus, 
  Loader2,
  ExternalLink,
  FileText,
  Award
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { config } from '../../../config';
import { LandRecord2 } from '../../models';

// Utility function to safely convert string values to numeric data types
const safeNumericConversion = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return '0';
  }
  
  // If it's already a number, return it as string with proper formatting
  if (typeof value === 'number') {
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  // If it's a string, try to parse it as a number
  if (typeof value === 'string') {
    // Remove any non-numeric characters except decimal point and negative sign
    const cleanedValue = value.replace(/[^\d.-]/g, '');
    const numericValue = parseFloat(cleanedValue);
    
    // Check if the conversion resulted in a valid number
    if (!isNaN(numericValue)) {
      return numericValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }
  
  // If conversion fails, return the original value as string
  return String(value);
};

// Interface for English Land Record Form
interface EnglishLandRecordForm {
  serial_number: number;
  owner_name: string;
  old_survey_number: string;
  new_survey_number: string;
  group_number: string;
  cts_number: string;
  village: string;
  taluka: string;
  district: string;
  land_area_as_per_7_12: number;
  acquired_land_area: number;
  land_type: string;
  land_classification: string;
  approved_rate_per_hectare: number;
  market_value_as_per_acquired_area: number;
  factor_as_per_section_26_2: number;
  land_compensation_as_per_section_26: number;
  structures: number;
  forest_trees: number;
  fruit_trees: number;
  wells_borewells: number;
  total_structures_amount: number;
  total_amount_14_23: number;
  determined_compensation_26: number;
  total_compensation_26_27: number;
  deduction_amount: number;
  final_payable_compensation: number;
  remarks: string;
  compensation_distribution_status: string;
  notice_number: string;
}

const LandRecordsManager2: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useSaral();
  
  // State management - remove project dependency
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [landRecords, setLandRecords] = useState<LandRecord2[]>([]);
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('form');
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LandRecord2>>({});
  const [dynamicColumns, setDynamicColumns] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Blockchain-related state
  const [searchSurvey, setSearchSurvey] = useState('');
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [blockchainError, setBlockchainError] = useState<string | null>(null);
  const [blockchainStatus, setBlockchainStatus] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [surveyOverview, setSurveyOverview] = useState<any[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  
  // Land record form state
  const [landRecordForm, setLandRecordForm] = useState<Partial<LandRecord2>>({
    अ_क्र: '',
    खातेदाराचे_नांव: '',
    जुना_स_नं: '',
    नविन_स_नं: '',
    गट_नंबर: '',
    सी_टी_एस_नं: '',
    Village: '',
    Taluka: '',
    District: '',
    गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर: 0,
    संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर: 0,
    जमिनीचा_प्रकार: '',
    जमिनीचा_प्रकार_शेती_बिनशेती_धारणाधिकार: '',
    मंजुर_केलेला_दर_प्रति_हेक्टर_रक्कम_रुपये: 0,
    संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य_र_रू: 0,
    कलम_26_नुसार_जमिनीचा_मोबदला_9X10: 0,
    एकुण_रक्कम_14_23: 0,
    सोलेशियम_दिलासा_रक्कम: 0,
    निर्धारित_मोबदला_26: 0,
    एकूण_रक्कमेवर_25_वाढीव_मोबदला: 0,
    एकुण_मोबदला_26_27: 0,
    हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम_रुपये: 0,
    मोबदला_वाटप_तपशिल: '',
    project_id: ''
  });

  // English Land record form state
  const [englishLandRecordForm, setEnglishLandRecordForm] = useState<EnglishLandRecordForm>({
    serial_number: 0,
    owner_name: '',
    old_survey_number: '',
    new_survey_number: '',
    group_number: '',
    cts_number: '',
    village: '',
    taluka: '',
    district: '',
    land_area_as_per_7_12: 0,
    acquired_land_area: 0,
    land_type: '',
    land_classification: '',
    approved_rate_per_hectare: 0,
    market_value_as_per_acquired_area: 0,
    factor_as_per_section_26_2: 1,
    land_compensation_as_per_section_26: 0,
    structures: 0,
    forest_trees: 0,
    fruit_trees: 0,
    wells_borewells: 0,
    total_structures_amount: 0,
    total_amount_14_23: 0,
    determined_compensation_26: 0,
    total_compensation_26_27: 0,
    deduction_amount: 0,
    final_payable_compensation: 0,
    remarks: '',
    compensation_distribution_status: 'PENDING',
    notice_number: ''
  });

  // Load land records function
  const loadLandRecords = async () => {
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    setLoading(true);
    try {
      const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
      const response = await fetch(`${config.API_BASE_URL}/landownerrecords-english-complete/${selectedProject}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLandRecords(data.data || []);
      
      // Only show the 30 core fields specified for Land Records Management (serial_number removed for dynamic generation)
      const coreFields = [
        'id', 'owner_name', 'old_survey_number', 'new_survey_number',
        'group_number', 'cts_number', 'village', 'taluka', 'district',
        'land_area_as_per_7_12', 'acquired_land_area', 'land_type', 'land_classification',
        'approved_rate_per_hectare', 'market_value_as_per_acquired_area',
        'factor_as_per_section_26_2', 'land_compensation_as_per_section_26',
        'structures', 'forest_trees', 'fruit_trees', 'wells_borewells',
        'total_structures_amount', 'total_amount_14_23', 'determined_compensation_26',
        'total_compensation_26_27', 'deduction_amount', 'final_payable_compensation',
        'remarks', 'compensation_distribution_status', 'project_id'
      ];
      setDynamicColumns(coreFields);
      
      toast.success(`Loaded ${data.data?.length || 0} land records`);
    } catch (error) {
      console.error('Error loading land records:', error);
      toast.error('Failed to load land records');
    } finally {
      setLoading(false);
    }
  };

  // Set default project and load records when projects are available
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects, selectedProject]);

  // Load records when project changes
  useEffect(() => {
    if (selectedProject) {
      setLandRecordForm(prev => ({ ...prev, project_id: selectedProject }));
      loadLandRecords();
    }
  }, [selectedProject]);

  // Filter land records based on search term
  const filteredLandRecords = landRecords.filter(record => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      record.खातेदाराचे_नांव?.toLowerCase().includes(searchLower) ||
      record.Village?.toLowerCase().includes(searchLower) ||
      record.Taluka?.toLowerCase().includes(searchLower) ||
      record.District?.toLowerCase().includes(searchLower) ||
      record.अ_क्र?.toLowerCase().includes(searchLower) ||
      record.जुना_स_नं?.toLowerCase().includes(searchLower) ||
      record.नविन_स_नं?.toLowerCase().includes(searchLower)
    );
  });
  const handleEdit = (record: LandRecord2) => {
    setEditingRecord(record.id || record._id?.toString()!);
    setEditForm(record);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord || !editForm) return;
    
    setLoading(true);
    try {
      const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      
      if (authToken === 'demo-jwt-token') {
        headers['x-demo-role'] = 'officer';
      }
      
      // Ensure project_id is sent as a string, not an object
      const sanitizedEditForm = { ...editForm };
      if (sanitizedEditForm.project_id && typeof sanitizedEditForm.project_id === 'object') {
        sanitizedEditForm.project_id = (sanitizedEditForm.project_id as any).id || sanitizedEditForm.project_id;
      }
      
      const response = await fetch(`${config.API_BASE_URL}/landownerrecords-english-complete/${editingRecord}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(sanitizedEditForm)
      });

      if (response.ok) {
        toast.success('Land record updated successfully');
        setEditingRecord(null);
        setEditForm({});
        loadLandRecords();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update land record');
      }
    } catch (error) {
      console.error('Error updating land record:', error);
      toast.error('Error updating land record');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditForm({});
  };

  const handleInputChange = (field: keyof LandRecord2, value: any) => {
    setLandRecordForm(prev => ({ ...prev, [field]: value, project_id: selectedProject }));
  };

  // Blockchain handler functions
  const handleSearchSurvey = async () => {
    if (!searchSurvey.trim()) return;
    
    setBlockchainLoading(true);
    setBlockchainError(null);
    
    try {
      const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      
      if (authToken === 'demo-jwt-token') {
        headers['x-demo-role'] = 'officer';
      }
      
      const response = await fetch(`${config.API_BASE_URL}/blockchain/search/${encodeURIComponent(searchSurvey)}`, {
        method: 'GET',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      } else {
        const errorData = await response.json();
        setBlockchainError(errorData.message || 'Failed to search survey');
      }
    } catch (error) {
      console.error('Error searching survey:', error);
      setBlockchainError('Error searching survey');
    } finally {
      setBlockchainLoading(false);
    }
  };

  const loadSurveyOverview = async () => {
    setOverviewLoading(true);
    setBlockchainError(null);
    
    try {
      const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      
      if (authToken === 'demo-jwt-token') {
        headers['x-demo-role'] = 'officer';
      }
      
      // Use landownerrecords-english-complete collection for blockchain operations
      const response = await fetch(`${config.API_BASE_URL}/landownerrecords-english-complete/${selectedProject}`, {
        method: 'GET',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setSurveyOverview(data);
      } else {
        const errorData = await response.json();
        setBlockchainError(errorData.message || 'Failed to load survey overview');
      }
    } catch (error) {
      console.error('Error loading survey overview:', error);
      setBlockchainError('Error loading survey overview');
    } finally {
      setOverviewLoading(false);
    }
  };

  const syncMissingToBlockchain = async () => {
    if (!surveyOverview.length) return;
    
    const missingRecords = surveyOverview.filter(survey => !survey.exists_on_blockchain);
    if (!missingRecords.length) {
      toast.info('All records are already synced to blockchain');
      return;
    }
    
    setSyncProgress({ current: 0, total: missingRecords.length, message: 'Starting sync...' });
    
    try {
      const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      
      if (authToken === 'demo-jwt-token') {
        headers['x-demo-role'] = 'officer';
      }
      
      for (let i = 0; i < missingRecords.length; i++) {
        const record = missingRecords[i];
        setSyncProgress({ 
          current: i + 1, 
          total: missingRecords.length, 
          message: `Syncing ${record.new_survey_number || record.survey_number}...` 
        });
        
        await fetch(`${config.API_BASE_URL}/blockchain/sync`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ surveyNumber: record.new_survey_number || record.survey_number })
        });
        
        // Small delay to prevent overwhelming the blockchain
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast.success(`Successfully synced ${missingRecords.length} records to blockchain`);
      loadSurveyOverview(); // Refresh the overview
    } catch (error) {
      console.error('Error syncing to blockchain:', error);
      setBlockchainError('Error syncing records to blockchain');
    } finally {
      setSyncProgress(null);
    }
  };

  const verifySingleSurvey = async (survey: any) => {
    setBlockchainLoading(true);
    setBlockchainError(null);
    
    try {
      const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      
      if (authToken === 'demo-jwt-token') {
        headers['x-demo-role'] = 'officer';
      }
      
      const surveyNumber = survey.new_survey_number || survey.survey_number;
      const response = await fetch(`${config.API_BASE_URL}/blockchain/verify/${encodeURIComponent(surveyNumber)}`, {
        method: 'GET',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`Verification complete: ${data.message}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Error verifying survey:', error);
      toast.error('Error verifying survey');
    } finally {
      setBlockchainLoading(false);
    }
  };

  const syncSingleSurvey = async (survey: any) => {
    setBlockchainLoading(true);
    setBlockchainError(null);
    
    try {
      const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      
      if (authToken === 'demo-jwt-token') {
        headers['x-demo-role'] = 'officer';
      }
      
      const surveyNumber = survey.new_survey_number || survey.survey_number;
      const response = await fetch(`${config.API_BASE_URL}/blockchain/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ surveyNumber })
      });
      
      if (response.ok) {
        toast.success(`Survey ${surveyNumber} synced to blockchain`);
        loadSurveyOverview(); // Refresh the overview
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing survey:', error);
      toast.error('Error syncing survey');
    } finally {
      setBlockchainLoading(false);
    }
  };

  const handleBulkSync = async () => {
    setBlockchainLoading(true);
    setBlockchainError(null);
    
    try {
      const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      
      if (authToken === 'demo-jwt-token') {
        headers['x-demo-role'] = 'officer';
      }
      
      const response = await fetch(`${config.API_BASE_URL}/blockchain/bulk-sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ projectId: selectedProject })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`Bulk sync initiated: ${data.message}`);
        loadSurveyOverview(); // Refresh the overview
      } else {
        const errorData = await response.json();
        setBlockchainError(errorData.message || 'Bulk sync failed');
      }
    } catch (error) {
      console.error('Error in bulk sync:', error);
      setBlockchainError('Error in bulk sync');
    } finally {
      setBlockchainLoading(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    setBlockchainLoading(true);
    setBlockchainError(null);
    
    try {
      const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      
      if (authToken === 'demo-jwt-token') {
        headers['x-demo-role'] = 'officer';
      }
      
      const response = await fetch(`${config.API_BASE_URL}/blockchain/verify-integrity`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ projectId: selectedProject })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`Integrity verification complete: ${data.message}`);
      } else {
        const errorData = await response.json();
        setBlockchainError(errorData.message || 'Integrity verification failed');
      }
    } catch (error) {
      console.error('Error verifying integrity:', error);
      setBlockchainError('Error verifying integrity');
    } finally {
      setBlockchainLoading(false);
    }
  };

  // Load blockchain status on component mount
  useEffect(() => {
    const loadBlockchainStatus = async () => {
      try {
        const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        };
        
        if (authToken === 'demo-jwt-token') {
          headers['x-demo-role'] = 'officer';
        }
        
        const response = await fetch(`${config.API_BASE_URL}/blockchain/status`, {
          method: 'GET',
          headers
        });
        
        if (response.ok) {
          const data = await response.json();
          setBlockchainStatus(data);
        }
      } catch (error) {
        console.error('Error loading blockchain status:', error);
      }
    };
    
    loadBlockchainStatus();
  }, []);

  const handleEditInputChange = (field: keyof LandRecord2, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      
      if (authToken === 'demo-jwt-token') {
        headers['x-demo-role'] = 'officer';
      }
      
      const response = await fetch(`${config.API_BASE_URL}/landownerrecords-english-complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify(landRecordForm),
      });

      if (response.ok) {
        toast.success('Land record created successfully');
        setLandRecordForm({
          अ_क्र: '',
          खातेदाराचे_नांव: '',
          जुना_स_नं: '',
          नविन_स_नं: '',
          गट_नंबर: '',
          सी_टी_एस_नं: '',
          Village: '',
          Taluka: '',
          District: '',
          गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर: 0,
          संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर: 0,
          जमिनीचा_प्रकार: '',
          जमिनीचा_प्रकार_शेती_बिनशेती_धारणाधिकार: '',
          मंजुर_केलेला_दर_प्रति_हेक्टर_रक्कम_रुपये: 0,
          संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य_र_रू: 0,
          कलम_26_2_नुसार_गावास_लागु_असलेले_गणक_Factor_अ_क्र_5_X_8: 1,
          कलम_26_नुसार_जमिनीचा_मोबदला_9X10: 0,
          बांधकामे: 0,
          वनझाडे: 0,
          फळझाडे: 0,
          विहिरी_बोअरवेल: 0,
          एकुण_रक्कम_रुपये_16_18_20_22: 0,
          एकुण_रक्कम_14_23: 0,
          सोलेशियम_दिलासा_रक्कम: 0,
          निर्धारित_मोबदला_26: 0,
          एकूण_रक्कमेवर_25_वाढीव_मोबदला: 0,
          एकुण_मोबदला_26_27: 0,
          वजावट_रक्कम_रुपये: 0,
          हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम_रुपये: 0,
          शेरा: '',
          मोबदला_वाटप_तपशिल: '',
          project_id: '68da6edf579af093415f639e'
        });
        loadLandRecords();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to create land record');
      }
    } catch (error) {
      console.error('Error creating land record:', error);
      toast.error('Error creating land record');
    } finally {
      setLoading(false);
    }
  };

  // English form handlers
  const handleEnglishInputChange = (field: keyof EnglishLandRecordForm, value: any) => {
    setEnglishLandRecordForm(prev => ({ ...prev, [field]: value }));
  };

  const handleEnglishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    setLoading(true);
    
    try {
      const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      
      if (authToken === 'demo-jwt-token') {
        headers['x-demo-role'] = 'officer';
      }
      
      // Prepare the data with project_id
      const formData = {
        ...englishLandRecordForm,
        project_id: selectedProject
      };
      
      const response = await fetch(`${config.API_BASE_URL}/landowners2-english`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('English land record created successfully');
        // Reset form
        setEnglishLandRecordForm({
          serial_number: 0,
          owner_name: '',
          old_survey_number: '',
          new_survey_number: '',
          group_number: '',
          cts_number: '',
          village: '',
          taluka: '',
          district: '',
          land_area_as_per_7_12: 0,
          acquired_land_area: 0,
          land_type: '',
          land_classification: '',
          approved_rate_per_hectare: 0,
          market_value_as_per_acquired_area: 0,
          factor_as_per_section_26_2: 1,
          land_compensation_as_per_section_26: 0,
          structures: 0,
          forest_trees: 0,
          fruit_trees: 0,
          wells_borewells: 0,
          total_structures_amount: 0,
          total_amount_14_23: 0,
          determined_compensation_26: 0,
          total_compensation_26_27: 0,
          deduction_amount: 0,
          final_payable_compensation: 0,
          remarks: '',
          compensation_distribution_status: 'PENDING',
          notice_number: ''
        });
        loadLandRecords();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to create English land record');
      }
    } catch (error) {
      console.error('Error creating English land record:', error);
      toast.error('Error creating English land record');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!csvFile || !selectedProject) {
      toast.error('Please select a CSV file and project');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('projectId', selectedProject);

    try {
      const authToken = localStorage.getItem('authToken') || 'demo-jwt-token';
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${authToken}`
      };
      
      if (authToken === 'demo-jwt-token') {
        headers['x-demo-role'] = 'officer';
      }
      
      const response = await fetch(`${config.API_BASE_URL}/landownerrecords-english-complete/upload-csv`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`CSV uploaded successfully! ${result.inserted} records created.`);
        setCsvFile(null);
        loadLandRecords();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to upload CSV');
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast.error('Error uploading CSV');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (filteredLandRecords.length === 0) {
      toast.error('No records to export');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(filteredLandRecords);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Land Records');
    
    const filename = `land_records_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    XLSX.writeFile(workbook, filename);
    toast.success(`Exported ${filteredLandRecords.length} records to ${filename}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <Badge className="bg-green-500">{status}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">{status}</Badge>;
      case 'rejected':
      case 'failed':
        return <Badge className="bg-red-500">{status}</Badge>;
      case 'initiated':
        return <Badge className="bg-blue-500">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Land Record Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="project-select">Select Project</Label>
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
            <div>
              <Label htmlFor="search-input">Search Records</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search-input"
                  type="text"
                  placeholder="Search by name, village, survey number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-end gap-2">
              <Button onClick={loadLandRecords} disabled={loading || !selectedProject}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={exportToExcel} disabled={filteredLandRecords.length === 0} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Showing {filteredLandRecords.length} of {landRecords.length} records
              {searchTerm && ` (filtered by "${searchTerm}")`}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="english-form">Create Record</TabsTrigger>
              <TabsTrigger value="upload">Upload CSV</TabsTrigger>
              <TabsTrigger value="list">View Records</TabsTrigger>
              <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
            </TabsList>

            <TabsContent value="english-form" className="space-y-4">
              <form onSubmit={handleEnglishSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="serial_number">Serial Number</Label>
                    <Input
                      id="serial_number"
                      type="number"
                      value={englishLandRecordForm.serial_number}
                      onChange={(e) => handleEnglishInputChange('serial_number', parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner_name">Owner Name</Label>
                    <Input
                      id="owner_name"
                      value={englishLandRecordForm.owner_name}
                      onChange={(e) => handleEnglishInputChange('owner_name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="old_survey_number">Old Survey Number</Label>
                    <Input
                      id="old_survey_number"
                      value={englishLandRecordForm.old_survey_number}
                      onChange={(e) => handleEnglishInputChange('old_survey_number', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new_survey_number">New Survey Number</Label>
                    <Input
                      id="new_survey_number"
                      value={englishLandRecordForm.new_survey_number}
                      onChange={(e) => handleEnglishInputChange('new_survey_number', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="group_number">Group Number</Label>
                    <Input
                      id="group_number"
                      value={englishLandRecordForm.group_number}
                      onChange={(e) => handleEnglishInputChange('group_number', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cts_number">CTS Number</Label>
                    <Input
                      id="cts_number"
                      value={englishLandRecordForm.cts_number}
                      onChange={(e) => handleEnglishInputChange('cts_number', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="village">Village</Label>
                    <Input
                      id="village"
                      value={englishLandRecordForm.village}
                      onChange={(e) => handleEnglishInputChange('village', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="taluka">Taluka</Label>
                    <Input
                      id="taluka"
                      value={englishLandRecordForm.taluka}
                      onChange={(e) => handleEnglishInputChange('taluka', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      value={englishLandRecordForm.district}
                      onChange={(e) => handleEnglishInputChange('district', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="land_area_as_per_7_12">Land Area as per 7/12 (Hectares)</Label>
                    <Input
                      id="land_area_as_per_7_12"
                      type="number"
                      step="0.0001"
                      value={englishLandRecordForm.land_area_as_per_7_12}
                      onChange={(e) => handleEnglishInputChange('land_area_as_per_7_12', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="acquired_land_area">Acquired Land Area (Hectares)</Label>
                    <Input
                      id="acquired_land_area"
                      type="number"
                      step="0.0001"
                      value={englishLandRecordForm.acquired_land_area}
                      onChange={(e) => handleEnglishInputChange('acquired_land_area', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="land_type">Land Type</Label>
                    <Input
                      id="land_type"
                      value={englishLandRecordForm.land_type}
                      onChange={(e) => handleEnglishInputChange('land_type', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="land_classification">Land Classification</Label>
                    <Input
                      id="land_classification"
                      value={englishLandRecordForm.land_classification}
                      onChange={(e) => handleEnglishInputChange('land_classification', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="approved_rate_per_hectare">Approved Rate per Hectare (₹)</Label>
                    <Input
                      id="approved_rate_per_hectare"
                      type="number"
                      step="0.01"
                      value={englishLandRecordForm.approved_rate_per_hectare}
                      onChange={(e) => handleEnglishInputChange('approved_rate_per_hectare', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="market_value_as_per_acquired_area">Market Value as per Acquired Area (₹)</Label>
                    <Input
                      id="market_value_as_per_acquired_area"
                      type="number"
                      step="0.01"
                      value={englishLandRecordForm.market_value_as_per_acquired_area}
                      onChange={(e) => handleEnglishInputChange('market_value_as_per_acquired_area', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="factor_as_per_section_26_2">Factor as per Section 26(2)</Label>
                    <Input
                      id="factor_as_per_section_26_2"
                      type="number"
                      step="0.01"
                      value={englishLandRecordForm.factor_as_per_section_26_2}
                      onChange={(e) => handleEnglishInputChange('factor_as_per_section_26_2', parseFloat(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="land_compensation_as_per_section_26">Land Compensation as per Section 26 (₹)</Label>
                    <Input
                      id="land_compensation_as_per_section_26"
                      type="number"
                      step="0.01"
                      value={englishLandRecordForm.land_compensation_as_per_section_26}
                      onChange={(e) => handleEnglishInputChange('land_compensation_as_per_section_26', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="structures">Structures (₹)</Label>
                    <Input
                      id="structures"
                      type="number"
                      step="0.01"
                      value={englishLandRecordForm.structures}
                      onChange={(e) => handleEnglishInputChange('structures', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="forest_trees">Forest Trees (₹)</Label>
                    <Input
                      id="forest_trees"
                      type="number"
                      step="0.01"
                      value={englishLandRecordForm.forest_trees}
                      onChange={(e) => handleEnglishInputChange('forest_trees', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fruit_trees">Fruit Trees (₹)</Label>
                    <Input
                      id="fruit_trees"
                      type="number"
                      step="0.01"
                      value={englishLandRecordForm.fruit_trees}
                      onChange={(e) => handleEnglishInputChange('fruit_trees', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="wells_borewells">Wells/Borewells (₹)</Label>
                    <Input
                      id="wells_borewells"
                      type="number"
                      step="0.01"
                      value={englishLandRecordForm.wells_borewells}
                      onChange={(e) => handleEnglishInputChange('wells_borewells', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="total_structures_amount">Total Structures Amount (₹)</Label>
                    <Input
                      id="total_structures_amount"
                      type="number"
                      step="0.01"
                      value={englishLandRecordForm.total_structures_amount}
                      onChange={(e) => handleEnglishInputChange('total_structures_amount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="total_amount_14_23">Total Amount (14+23) (₹)</Label>
                    <Input
                      id="total_amount_14_23"
                      type="number"
                      step="0.01"
                      value={englishLandRecordForm.total_amount_14_23}
                      onChange={(e) => handleEnglishInputChange('total_amount_14_23', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="determined_compensation_26">Determined Compensation 26 (₹)</Label>
                    <Input
                      id="determined_compensation_26"
                      type="number"
                      step="0.01"
                      value={englishLandRecordForm.determined_compensation_26}
                      onChange={(e) => handleEnglishInputChange('determined_compensation_26', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="total_compensation_26_27">Total Compensation (26+27) (₹)</Label>
                    <Input
                      id="total_compensation_26_27"
                      type="number"
                      step="0.01"
                      value={englishLandRecordForm.total_compensation_26_27}
                      onChange={(e) => handleEnglishInputChange('total_compensation_26_27', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deduction_amount">Deduction Amount (₹)</Label>
                    <Input
                      id="deduction_amount"
                      type="number"
                      step="0.01"
                      value={englishLandRecordForm.deduction_amount}
                      onChange={(e) => handleEnglishInputChange('deduction_amount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="final_payable_compensation">Final Payable Compensation (₹)</Label>
                    <Input
                      id="final_payable_compensation"
                      type="number"
                      step="0.01"
                      value={englishLandRecordForm.final_payable_compensation}
                      onChange={(e) => handleEnglishInputChange('final_payable_compensation', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="compensation_distribution_status">Compensation Distribution Status</Label>
                    <Select 
                      value={englishLandRecordForm.compensation_distribution_status} 
                      onValueChange={(value) => handleEnglishInputChange('compensation_distribution_status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">PENDING</SelectItem>
                        <SelectItem value="PAID">PAID</SelectItem>
                        <SelectItem value="UNPAID">UNPAID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notice_number">Notice Number</Label>
                    <Input
                      id="notice_number"
                      value={englishLandRecordForm.notice_number}
                      onChange={(e) => handleEnglishInputChange('notice_number', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      value={englishLandRecordForm.remarks}
                      onChange={(e) => handleEnglishInputChange('remarks', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading || !selectedProject}>
                  {loading ? 'Creating...' : 'Create English Land Record'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-file">Upload CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  />
                </div>
                <Button onClick={handleFileUpload} disabled={!csvFile || loading}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              {filteredLandRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? `No land records found matching "${searchTerm}"` : "No land records found for this project"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Owner Name</TableHead>
                        <TableHead>Old Survey Number</TableHead>
                        <TableHead>New Survey Number</TableHead>
                        <TableHead>Group Number</TableHead>
                        <TableHead>CTS Number</TableHead>
                        <TableHead>Village</TableHead>
                        <TableHead>Taluka</TableHead>
                        <TableHead>District</TableHead>
                        <TableHead>Land Area as per 7/12</TableHead>
                        <TableHead>Acquired Land Area</TableHead>
                        <TableHead>Land Type</TableHead>
                        <TableHead>Land Classification</TableHead>
                        <TableHead>Approved Rate per Hectare</TableHead>
                        <TableHead>Market Value as per Acquired Area</TableHead>
                        <TableHead>Factor as per Section 26(2)</TableHead>
                        <TableHead>Land Compensation as per Section 26</TableHead>
                        <TableHead>Structures</TableHead>
                        <TableHead>Forest Trees</TableHead>
                        <TableHead>Fruit Trees</TableHead>
                        <TableHead>Wells/Borewells</TableHead>
                        <TableHead>Total Structures Amount</TableHead>
                        <TableHead>Total Amount (14+23)</TableHead>
                        <TableHead>Determined Compensation 26</TableHead>
                        <TableHead>Total Compensation (26+27)</TableHead>
                        <TableHead>Deduction Amount</TableHead>
                        <TableHead>Final Payable Compensation</TableHead>
                        <TableHead>Remarks</TableHead>
                        <TableHead>Compensation Distribution Status</TableHead>
                        <TableHead>Project ID</TableHead>
                        {dynamicColumns.filter(col => 
                          !['serial_number', 'owner_name', 'old_survey_number', 'new_survey_number', 
                            'group_number', 'cts_number', 'village', 'taluka', 'district', 
                            'land_area_as_per_7_12', 'acquired_land_area', 'land_type', 'land_classification',
                            'approved_rate_per_hectare', 'market_value_as_per_acquired_area',
                            'factor_as_per_section_26_2', 'land_compensation_as_per_section_26',
                            'structures', 'forest_trees', 'fruit_trees', 'wells_borewells',
                            'total_structures_amount', 'total_amount_14_23',
                            'determined_compensation_26', 'total_compensation_26_27',
                            'deduction_amount', 'final_payable_compensation', 'remarks', 
                            'compensation_distribution_status', 'project_id', 'id', '_id', '__v'].includes(col)
                        ).map(col => (
                          <TableHead key={col}>{col.replace(/_/g, ' ').toUpperCase()}</TableHead>
                        ))}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLandRecords.map((record, index) => (
                        <TableRow key={record.id || record._id?.toString()}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.owner_name || ''}
                                onChange={(e) => handleEditInputChange('owner_name', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.owner_name
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.old_survey_number || ''}
                                onChange={(e) => handleEditInputChange('old_survey_number', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.खातेदाराचे_नांव || record.old_survey_number || ''
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.new_survey_number || ''}
                                onChange={(e) => handleEditInputChange('new_survey_number', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.नविन_स_नं || record.new_survey_number || ''
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.group_number || ''}
                                onChange={(e) => handleEditInputChange('group_number', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.गट_नंबर || record.group_number || ''
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.cts_number || ''}
                                onChange={(e) => handleEditInputChange('cts_number', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.सी_टी_एस_नंबर || record.cts_number || ''
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.village || ''}
                                onChange={(e) => handleEditInputChange('village', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.village
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.taluka || ''}
                                onChange={(e) => handleEditInputChange('taluka', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.taluka
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.district || ''}
                                onChange={(e) => handleEditInputChange('district', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.district
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.0001"
                                value={editForm.land_area_as_per_7_12 || ''}
                                onChange={(e) => handleEditInputChange('land_area_as_per_7_12', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.land_area_as_per_7_12)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.0001"
                                value={editForm.acquired_land_area || ''}
                                onChange={(e) => handleEditInputChange('acquired_land_area', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.acquired_land_area)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.land_type || ''}
                                onChange={(e) => handleEditInputChange('land_type', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.land_type
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.land_classification || ''}
                                onChange={(e) => handleEditInputChange('land_classification', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.land_classification
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.approved_rate_per_hectare || ''}
                                onChange={(e) => handleEditInputChange('approved_rate_per_hectare', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.approved_rate_per_hectare)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.market_value_as_per_acquired_area || ''}
                                onChange={(e) => handleEditInputChange('market_value_as_per_acquired_area', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.market_value_as_per_acquired_area)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.factor_as_per_section_26_2 || ''}
                                onChange={(e) => handleEditInputChange('factor_as_per_section_26_2', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.factor_as_per_section_26_2)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.land_compensation_as_per_section_26 || ''}
                                onChange={(e) => handleEditInputChange('land_compensation_as_per_section_26', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.land_compensation_as_per_section_26)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                value={editForm.structures || ''}
                                onChange={(e) => handleEditInputChange('structures', parseInt(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              record.structures
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                value={editForm.forest_trees || ''}
                                onChange={(e) => handleEditInputChange('forest_trees', parseInt(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              record.forest_trees
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                value={editForm.fruit_trees || ''}
                                onChange={(e) => handleEditInputChange('fruit_trees', parseInt(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              record.fruit_trees
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                value={editForm.wells_borewells || ''}
                                onChange={(e) => handleEditInputChange('wells_borewells', parseInt(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              record.wells_borewells
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.total_structures_amount || ''}
                                onChange={(e) => handleEditInputChange('total_structures_amount', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.total_structures_amount)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.total_amount_14_23 || ''}
                                onChange={(e) => handleEditInputChange('total_amount_14_23', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.total_amount_14_23)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.determined_compensation_26 || ''}
                                onChange={(e) => handleEditInputChange('determined_compensation_26', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.determined_compensation_26)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.total_compensation_26_27 || ''}
                                onChange={(e) => handleEditInputChange('total_compensation_26_27', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.total_compensation_26_27)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.deduction_amount || ''}
                                onChange={(e) => handleEditInputChange('deduction_amount', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.deduction_amount)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.final_payable_compensation || ''}
                                onChange={(e) => handleEditInputChange('final_payable_compensation', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              safeNumericConversion(record.final_payable_compensation)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Textarea
                                value={editForm.remarks || ''}
                                onChange={(e) => handleEditInputChange('remarks', e.target.value)}
                                className="h-8 min-h-8"
                                rows={1}
                              />
                            ) : (
                              record.remarks || ''
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <Input
                                value={editForm.compensation_distribution_status || ''}
                                onChange={(e) => handleEditInputChange('compensation_distribution_status', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.compensation_distribution_status
                            )}
                          </TableCell>
                          <TableCell>{record.project_id ? record.project_id.toString() : ''}</TableCell>
                          {dynamicColumns.filter(col => 
                            !['serial_number', 'owner_name', 'old_survey_number', 'new_survey_number', 
                              'group_number', 'cts_number', 'village', 'taluka', 'district', 
                              'land_area_as_per_7_12', 'acquired_land_area', 'land_type', 'land_classification',
                              'approved_rate_per_hectare', 'market_value_as_per_acquired_area',
                              'factor_as_per_section_26_2', 'land_compensation_as_per_section_26',
                              'structures', 'forest_trees', 'fruit_trees', 'wells_borewells',
                              'total_structures_amount', 'total_amount_14_23',
                              'determined_compensation_26', 'total_compensation_26_27',
                              'deduction_amount', 'final_payable_compensation', 'remarks', 
                              'compensation_distribution_status', 'project_id', 'id', '_id', '__v'].includes(col)
                          ).map(col => (
                            <TableCell key={col}>
                              {editingRecord === (record.id || record._id?.toString()) ? (
                                <Input
                                  value={editForm[col] || ''}
                                  onChange={(e) => handleEditInputChange(col as keyof LandRecord2, e.target.value)}
                                  className="h-8"
                                />
                              ) : (
                                String(record[col] || '')
                              )}
                            </TableCell>
                          ))}
                          <TableCell>
                            {editingRecord === (record.id || record._id?.toString()) ? (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleSaveEdit}
                                  disabled={loading}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(record)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Blockchain Tab */}
            <TabsContent value="blockchain" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Blockchain Status Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Blockchain Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {blockchainStatus ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Network:</span>
                          <Badge variant={blockchainStatus.connected ? "default" : "destructive"}>
                            {blockchainStatus.network || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Status:</span>
                          <Badge variant={blockchainStatus.connected ? "default" : "destructive"}>
                            {blockchainStatus.connected ? 'Connected' : 'Disconnected'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Chain ID:</span>
                          <span className="text-sm">{blockchainStatus.chainId || 'N/A'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Database className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">Loading blockchain status...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Survey Search Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Survey Search & Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter survey number..."
                        value={searchSurvey}
                        onChange={(e) => setSearchSurvey(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleSearchSurvey}
                        disabled={blockchainLoading || !searchSurvey.trim()}
                      >
                        {blockchainLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {searchResults && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Database Status:</span>
                          <Badge variant={searchResults.existsInDatabase ? "default" : "secondary"}>
                            {searchResults.existsInDatabase ? 'Found' : 'Not Found'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Blockchain Status:</span>
                          <Badge variant={searchResults.existsOnBlockchain ? "default" : "secondary"}>
                            {searchResults.existsOnBlockchain ? 'On Chain' : 'Not on Chain'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Overall Status:</span>
                          <Badge variant={
                            searchResults.overallStatus === 'synced' ? "default" :
                            searchResults.overallStatus === 'database_only' ? "secondary" :
                            searchResults.overallStatus === 'blockchain_only' ? "outline" : "destructive"
                          }>
                            {searchResults.statusMessage}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Survey Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Survey Overview
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={loadSurveyOverview} disabled={overviewLoading}>
                      {overviewLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Load Overview
                    </Button>
                    <Button onClick={syncMissingToBlockchain} disabled={!surveyOverview.length || syncProgress !== null}>
                      <Plus className="h-4 w-4 mr-2" />
                      Sync Missing
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {syncProgress && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Syncing Progress</span>
                        <span className="text-sm">{syncProgress.current}/{syncProgress.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{syncProgress.message}</p>
                    </div>
                  )}
                  
                  {surveyOverview.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Survey Number</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Village</TableHead>
                            <TableHead>Blockchain Status</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {surveyOverview.slice(0, 50).map((survey, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {survey.new_survey_number || survey.survey_number || 'N/A'}
                              </TableCell>
                              <TableCell>{survey.landowner_name || survey.owner_name || 'N/A'}</TableCell>
                              <TableCell>{survey.village || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  survey.exists_on_blockchain ? "default" : "secondary"
                                }>
                                  {survey.exists_on_blockchain ? 'On Chain' : 'Not on Chain'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {survey.blockchain_last_updated ? 
                                  new Date(survey.blockchain_last_updated).toLocaleDateString() : 
                                  'Never'
                                }
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => verifySingleSurvey(survey)}>
                                    <Shield className="h-3 w-3" />
                                  </Button>
                                  {!survey.exists_on_blockchain && (
                                    <Button size="sm" variant="outline" onClick={() => syncSingleSurvey(survey)}>
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">No survey data loaded. Click "Load Overview" to fetch data.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Blockchain Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Blockchain Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button onClick={handleBulkSync} disabled={blockchainLoading}>
                      {blockchainLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Bulk Sync All Records
                    </Button>
                    <Button onClick={handleVerifyIntegrity} disabled={blockchainLoading} variant="outline">
                      <Shield className="h-4 w-4 mr-2" />
                      Verify Integrity
                    </Button>
                  </div>
                  
                  {blockchainError && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{blockchainError}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LandRecordsManager2;


// Helper functions to calculate solatium and enhanced compensation
const calculateSolatiumAmount = (record: any): number => {
  const determinedCompensation = Number(record.determined_compensation_26) || 0;
  const landCompensation = Number(record.land_compensation_as_per_section_26) || 0;
  return determinedCompensation - landCompensation;
};

const calculateEnhancedCompensation = (record: any): number => {
  const totalCompensation = Number(record.total_compensation_26_27) || 0;
  const determinedCompensation = Number(record.determined_compensation_26) || 0;
  return totalCompensation - determinedCompensation;
};