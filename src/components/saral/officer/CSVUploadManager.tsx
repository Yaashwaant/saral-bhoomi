import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Eye,
  Trash2,
  Play,
  Pause,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface CSVData {
  खातेदाराचे_नांव: string;
  सर्वे_नं: string;
  क्षेत्र?: string;
  संपादित_क्षेत्र?: string;
  दर?: string;
  संरचना_झाडे_विहिरी_रक्कम?: string;
  एकूण_मोबदला?: string;
  सोलेशियम_100?: string;
  अंतिम_रक्कम?: string;
  village: string;
  taluka: string;
  district: string;
}

const CSVUploadManager = () => {
  const { user } = useAuth();
  const { projects = [], uploadCSV, landownerRecords = [] } = useSaral();
  const [selectedProject, setSelectedProject] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [csvData, setCsvData] = useState<CSVData[]>([]);
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New state for agent assignment
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [generateNotices, setGenerateNotices] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const translations = {
    marathi: {
      title: 'CSV अपलोड व्यवस्थापन',
      subtitle: 'Parishisht-K फॉर्मेटमध्ये CSV फाईल अपलोड करा',
      selectProject: 'प्रकल्प निवडा',
      uploadFile: 'फाईल अपलोड करा',
      dragDrop: 'फाईल ड्रॅग करा किंवा क्लिक करा',
      supportedFormats: 'समर्थित फॉर्मेट्स: .csv, .xlsx',
      maxSize: 'कमाल आकार: 10MB',
      downloadTemplate: 'टेम्पलेट डाउनलोड करा',
      generateNotices: 'नोटीस तयार करा',
      assignAgent: 'एजंट नियुक्त करा',
      selectAgent: 'एजंट निवडा',
      optionalAssignment: 'ऐच्छिक नियुक्ती',
      process: 'प्रक्रिया करा',
      processing: 'प्रक्रिया करत आहे...',
      uploadSuccess: 'फाईल यशस्वीरित्या अपलोड झाली',
      uploadFailed: 'फाईल अपलोड अयशस्वी',
      noProjectSelected: 'कृपया प्रकल्प निवडा',
      noFileSelected: 'कृपया फाईल निवडा'
    },
    english: {
      title: 'CSV Upload Management',
      subtitle: 'Upload CSV file in Parishisht-K format',
      selectProject: 'Select Project',
      uploadFile: 'Upload File',
      dragDrop: 'Drag and drop file or click to browse',
      supportedFormats: 'Supported formats: .csv, .xlsx',
      maxSize: 'Max size: 10MB',
      downloadTemplate: 'Download Template',
      generateNotices: 'Generate Notices',
      assignAgent: 'Assign Agent',
      selectAgent: 'Select Agent',
      optionalAssignment: 'Optional Assignment',
      process: 'Process',
      processing: 'Processing...',
      uploadSuccess: 'File uploaded successfully',
      uploadFailed: 'File upload failed',
      noProjectSelected: 'Please select a project',
      noFileSelected: 'Please select a file'
    }
  };

  // Safe translation access with fallback
  const t = translations?.[user?.language || 'marathi'] || translations.english;

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  const loadAgents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/agents/list`);
      const data = await response.json();
      if (data.success) {
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error('Error loading agents:', err);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size exceeds 10MB limit');
        return;
      }
      
      const validExtensions = ['.csv'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        toast.error('Invalid file format. Please upload a .csv file');
        return;
      }
      
      setUploadedFile(file);
      processCSVFile(file);
    }
  };

  const processCSVFile = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Read the actual CSV file
      const text = await file.text();
      setCsvRawText(text);
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      console.log('CSV Headers found:', headers);
      
      // Parse CSV data
      const data: CSVData[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          data.push(row);
        }
        setProgress((i / lines.length) * 100);
      }
      
      setCsvData(data);
      setValidationErrors([]);
      toast.success(`CSV file processed successfully - ${data.length} records found`);
    } catch (error) {
      console.error('Error processing CSV:', error);
      toast.error('Error processing CSV file');
      setValidationErrors(['Failed to process CSV file']);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleProcess = async () => {
    if (!selectedProject) {
      toast.error(t.noProjectSelected);
      return;
    }
    
    if (!uploadedFile) {
      toast.error(t.noFileSelected);
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/csv/ingest/${selectedProject}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent: csvRawText,
          assignToAgent: !!selectedAgent,
          agentId: selectedAgent || undefined,
          generateNotice: !!generateNotices,
          overwrite: true
        })
      });

      let data: any = { success: false };
      try {
        data = await response.json();
      } catch (_) {
        // Non-JSON response
      }
      
      if (response.ok && data.success) {
        toast.success(t.uploadSuccess);
        setCsvData([]);
        setCsvRawText('');
        setUploadedFile(null);
        setSelectedProject('');
        setSelectedAgent('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast.error(data.message || `Upload failed (${response.status})`);
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast.error(t.uploadFailed);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `खातेदाराचे_नांव,सर्वे_नं,गांव,नमुना_7_12_नुसार_जमिनीचे_क्षेत्र,संपादित_जमिनीचे_क्षेत्र,जमिनीचा_प्रकार,जमिनीचा_प्रकार_शेती_बिनशेती,मंजुर_केलेला_दर,संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य,कलम_26_2_नुसार_गावास_लागु_असलेले_गणक,कलम_26_नुसार_जमिनीचा_मोबदला,बांधकामे_संख्या,बांधकामे_रक्कम,वनझाडे_संख्या,वनझाडे_रक्कम,फळझाडे_संख्या,फळझाडे_रक्कम,विहिरी_संख्या,विहिरी_रक्कम,एकुण_रक्कम_13_15_17_19,एकुण_रक्कम_11_20,सोलेशियम_100,निर्धारित_मोबदला,एकुण_रक्कमेवर_25_वाढीव_मोबदला,एकुण_मोबदला,वजावट_रक्कम,हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम,शेरा,village,taluka,district
राजेश पाटील,123,नांदे,2.5,1.2,शेती,शेती / वर्ग -1,53100000,63600000,63600000,63600000,2,50000,5,25000,3,15000,1,10000,100000,63600000,6360000,69960000,17490000,87450000,0,87450000,नांदे,पालघर,पालघर
प्रिया शर्मा,124,नांदे,1.8,0.9,शेती,शेती / वर्ग -2,53100000,47790000,47790000,47790000,1,30000,3,15000,2,10000,0,0,55000,47790000,4779000,52569000,13142250,65711250,0,65711250,नांदे,पालघर,पालघर
अमित पटेल,125,नांदे,3.2,1.5,शेती,शेती / वर्ग -1,53100000,79650000,79650000,79650000,3,75000,8,40000,5,25000,2,20000,160000,79650000,7965000,87615000,21903750,109518750,0,109518750,नांदे,पालघर,पालघर
सुनीता वर्मा,126,नांदे,2.0,1.0,बिनशेती,बिनशेती / वर्ग -1,53100000,53100000,53100000,53100000,1,40000,2,12000,1,8000,0,0,60000,53100000,5310000,58410000,14602500,73012500,0,73012500,नांदे,पालघर,पालघर
रमेश कुमार,127,नांदे,1.5,0.8,शेती,शेती / वर्ग -3,53100000,42480000,42480000,42480000,0,0,1,5000,1,5000,0,0,10000,42480000,4248000,46728000,11682000,58410000,0,58410000,नांदे,पालघर,पालघर`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parishisht-k-complete-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Complete Parishisht-K template downloaded successfully');
  };

  // Load agents on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await loadAgents();
      } catch (err) {
        console.error('Error initializing component:', err);
        setError('Failed to load component data');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeComponent();
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading CSV Upload Manager...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>
        <Button onClick={downloadTemplate} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {t.downloadTemplate}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-orange-600" />
              <span>{t.uploadFile}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label htmlFor="project">{t.selectProject}</Label>
              {projects && projects.length > 0 ? (
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {(projects || []).map((project, index) => (
                      <SelectItem 
                        key={project?.id || project?._id || `project-${index}`} 
                        value={String(project?.id || project?._id || index)}
                      >
                        {project?.projectName || 'Unknown Project'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                  Loading projects...
                </div>
              )}
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">{t.uploadFile}</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-sm text-gray-500">Supported format: .csv</p>
              <p className="text-sm text-gray-500">{t.maxSize}</p>
            </div>

            {/* Notice Generation Option */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="generateNotices"
                checked={generateNotices}
                onChange={(e) => setGenerateNotices(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="generateNotices">{t.generateNotices}</Label>
            </div>

            {/* Agent Assignment Option */}
            {agents && agents.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="agent">{t.selectAgent}</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.optionalAssignment} />
                  </SelectTrigger>
                  <SelectContent>
                    {(agents || []).map((agent, index) => (
                      <SelectItem 
                        key={agent?._id || agent?.id || `agent-${index}`} 
                        value={String(agent?._id || agent?.id || index)}
                      >
                        {agent?.name || 'Unknown Agent'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Process Button */}
            <Button 
              onClick={handleProcess}
              disabled={isProcessing || !selectedProject || !uploadedFile || (csvData || []).length === 0}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t.processing}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Generate Notices
                </>
              )}
            </Button>

            {/* Progress Bar */}
            {isProcessing && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-600">{progress}% Complete</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <span>Preview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {csvData && csvData.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-green-600">
                    {(csvData || []).length} Records
                  </Badge>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {csvData && csvData.length > 0 && Object.keys(csvData[0]).slice(0, 6).map((header, index) => (
                          <TableHead key={index}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(csvData || []).slice(0, 10).map((row, index) => (
                        <TableRow key={index}>
                          {Object.keys(row).slice(0, 6).map((header, idx) => (
                            <TableCell key={idx}>{row[header] || ''}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {csvData && csvData.length > 10 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Showing first 10 records of {csvData.length} total records
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No CSV data to preview</p>
                <p className="text-sm text-gray-400">Upload a CSV file to see the preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CSVUploadManager;