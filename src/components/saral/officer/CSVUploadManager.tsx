import React, { useState, useRef } from 'react';
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
  Pause
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
  // Extended format fields
  नमुना_7_12_नुसार_जमिनीचे_क्षेत्र?: string;
  संपादित_जमिनीचे_क्षेत्र?: string;
  जमिनीचा_प्रकार?: string;
  नीचा_बिनशेती?: string;
  मंजुर_दर_प्रति_हेक्टर?: string;
  संपादित_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमु?: string;
  कलम_26_2_नुसार_गावा?: string;
  कलम_26_9X10_नुसार_जमिनीचा_मोबदला?: string;
  बांधकामे_संख्या?: string;
  बांधकामे_रक्कम_रुपये?: string;
  वनझाडे_झाडांची_संख्या?: string;
  वनझाडे_झाडांची_रक्कम?: string;
  फळझाडे_झाडांची_संख्या?: string;
  फळझाडे_झाडांची_रक्कम?: string;
  विहिरी_बो_सं?: string;
  विहिरी_बो_रक्कम?: string;
  एकुण_रक्कम_13_15_17_19?: string;
  एकुण_रक्कम_11_20?: string;
  सौ_सोलेशियम_दिलासा_रक्कम?: string;
  निर्धारित_मोबदला_23?: string;
  एकुण_रक्कमेवर_25_वाढीव_मोबदला?: string;
  एकुण_मोबदला_23_24?: string;
  वजावट_हितसंबंधि_ताला_अदा_रक्कम?: string;
  एकुण_मोबदला_रक्कम_रुपये?: string;
  शेरा?: string;
}

const CSVUploadManager = () => {
  const { user } = useAuth();
  const { projects, uploadCSV, landownerRecords } = useSaral();
  const [selectedProject, setSelectedProject] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [csvData, setCsvData] = useState<CSVData[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const translations = {
    marathi: {
      title: 'CSV अपलोड व्यवस्थापन',
      subtitle: 'Parishisht-K फॉर्मेटमध्ये CSV फाईल अपलोड करा',
      selectProject: 'प्रकल्प निवडा',
      uploadFile: 'फाईल अपलोड करा',
      dragDrop: 'फाईल ड्रॅग करा किंवा क्लिक करा',
      supportedFormats: 'समर्थित फॉर्मेट्स: .csv, .xlsx',
      maxSize: 'कमाल आकार: 10MB',
      requiredHeaders: 'आवश्यक हेडर्स:',
      landownerName: 'खातेदाराचे नांव',
      surveyNumber: 'स.नं. / हि.नं. / ग.नं.',
      area: 'क्षेत्र (हे.आर)',
      acquiredArea: 'संपादित क्षेत्र (चौ.मी / हे.आर)',
      rate: 'दर (₹)',
      structuresAmount: 'संरचना, झाडे, विहिरी रक्कम',
      compensationAmount: 'एकूण मोबदला',
      solatium: '100% सोलेशियम',
      finalCompensation: 'अंतिम रक्कम',
      process: 'प्रक्रिया करा',
      cancel: 'रद्द करा',
      preview: 'पूर्वावलोकन',
      validation: 'पडताळणी',
      errors: 'त्रुटी',
      success: 'यशस्वी',
      failed: 'अयशस्वी',
      records: 'नोंदी',
      totalRecords: 'एकूण नोंदी',
      validRecords: 'वैध नोंदी',
      invalidRecords: 'अवैध नोंदी',
      generateNotices: 'नोटीस तयार करा',
      downloadTemplate: 'टेम्पलेट डाउनलोड करा',
      noProjectSelected: 'कृपया प्रकल्प निवडा',
      noFileSelected: 'कृपया फाईल निवडा',
      processing: 'प्रक्रिया करत आहे...',
      uploadSuccess: 'फाईल यशस्वीरित्या अपलोड झाली',
      uploadFailed: 'फाईल अपलोड अयशस्वी',
      validationFailed: 'पडताळणी अयशस्वी',
      noticesGenerated: 'नोटीस यशस्वीरित्या तयार झाल्या'
    },
    english: {
      title: 'CSV Upload Management',
      subtitle: 'Upload CSV file in Parishisht-K format',
      selectProject: 'Select Project',
      uploadFile: 'Upload File',
      dragDrop: 'Drag and drop file or click to browse',
      supportedFormats: 'Supported formats: .csv, .xlsx',
      maxSize: 'Max size: 10MB',
      requiredHeaders: 'Required Headers:',
      landownerName: 'Landowner Name',
      surveyNumber: 'Survey Number',
      area: 'Area (Ha.Ar)',
      acquiredArea: 'Acquired Area (sq.m / Ha.Ar)',
      rate: 'Rate (₹)',
      structuresAmount: 'Structures, Trees, Wells Amount',
      compensationAmount: 'Total Compensation',
      solatium: '100% Solatium',
      finalCompensation: 'Final Amount',
      process: 'Process',
      cancel: 'Cancel',
      preview: 'Preview',
      validation: 'Validation',
      errors: 'Errors',
      success: 'Success',
      failed: 'Failed',
      records: 'Records',
      totalRecords: 'Total Records',
      validRecords: 'Valid Records',
      invalidRecords: 'Invalid Records',
      generateNotices: 'Generate Notices',
      downloadTemplate: 'Download Template',
      noProjectSelected: 'Please select a project',
      noFileSelected: 'Please select a file',
      processing: 'Processing...',
      uploadSuccess: 'File uploaded successfully',
      uploadFailed: 'File upload failed',
      validationFailed: 'Validation failed',
      noticesGenerated: 'Notices generated successfully'
    },
    hindi: {
      title: 'CSV अपलोड प्रबंधन',
      subtitle: 'Parishisht-K फॉर्मेट में CSV फाइल अपलोड करें',
      selectProject: 'परियोजना चुनें',
      uploadFile: 'फाइल अपलोड करें',
      dragDrop: 'फाइल को खींचें और छोड़ें या ब्राउज़ करने के लिए क्लिक करें',
      supportedFormats: 'समर्थित फॉर्मेट: .csv, .xlsx',
      maxSize: 'अधिकतम आकार: 10MB',
      requiredHeaders: 'आवश्यक हेडर:',
      landownerName: 'भूमि मालिक का नाम',
      surveyNumber: 'सर्वेक्षण संख्या',
      area: 'क्षेत्र (हे.आर)',
      acquiredArea: 'अधिग्रहित क्षेत्र (वर्ग मी / हे.आर)',
      rate: 'दर (₹)',
      structuresAmount: 'संरचना, पेड़, कुओं की राशि',
      compensationAmount: 'कुल मुआवजा',
      solatium: '100% सोलेशियम',
      finalCompensation: 'अंतिम राशि',
      process: 'प्रक्रिया करें',
      cancel: 'रद्द करें',
      preview: 'पूर्वावलोकन',
      validation: 'सत्यापन',
      errors: 'त्रुटियां',
      success: 'सफल',
      failed: 'असफल',
      records: 'रिकॉर्ड',
      totalRecords: 'कुल रिकॉर्ड',
      validRecords: 'वैध रिकॉर्ड',
      invalidRecords: 'अमान्य रिकॉर्ड',
      generateNotices: 'नोटिस जनरेट करें',
      downloadTemplate: 'टेम्पलेट डाउनलोड करें',
      noProjectSelected: 'कृपया एक परियोजना चुनें',
      noFileSelected: 'कृपया एक फाइल चुनें',
      processing: 'प्रक्रिया कर रहा है...',
      uploadSuccess: 'फाइल सफलतापूर्वक अपलोड की गई',
      uploadFailed: 'फाइल अपलोड विफल',
      validationFailed: 'सत्यापन विफल',
      noticesGenerated: 'नोटिस सफलतापूर्वक जनरेट किए गए'
    }
  };

  const t = translations[user?.language || 'marathi'];

  const requiredHeaders = [
    'खातेदाराचे_नांव',
    'सर्वे_नं',
    'क्षेत्र',
    'संपादित_क्षेत्र',
    'दर',
    'संरचना_झाडे_विहिरी_रक्कम',
    'एकूण_मोबदला',
    'सोलेशियम_100',
    'अंतिम_रक्कम',
    'village',
    'taluka',
    'district'
  ];

  // Define the new CSV header fields in the correct order
  const extendedHeaders = [
    'खातेदाराचे_नांव',
    'स.नं./हि.नं./ग.नं.',
    'गांव',
    'नमुना_7_12_नुसार_जमिनीचे_क्षेत्र',
    'संपादित_जमिनीचे_क्षेत्र',
    'जमिनीचा_प्रकार',
    'जमिनीचा_प्रकार_शेती_बिनशेती',
    'मंजुर_केलेला_दर',
    'संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य',
    'कलम_26_2_नुसार_गावास_लागु_असलेले_गणक',
    'कलम_26_नुसार_जमिनीचा_मोबदला',
    'बांधकामे_संख्या',
    'बांधकामे_रक्कम',
    'वनझाडे_संख्या',
    'वनझाडे_रक्कम',
    'फळझाडे_संख्या',
    'फळझाडे_रक्कम',
    'विहिरी_संख्या',
    'विहिरी_रक्कम',
    'एकुण_रक्कम_13_15_17_19',
    'एकुण_रक्कम_11_20',
    'सोलेशियम_100',
    'निर्धारित_मोबदला',
    'एकुण_रक्कमेवर_25_वाढीव_मोबदला',
    'एकुण_मोबदला',
    'वजावट_रक्कम',
    'हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम',
    'शेरा',
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size exceeds 10MB limit');
        return;
      }
      
      const validExtensions = ['.csv', '.xlsx'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        toast.error('Invalid file format. Please upload .csv or .xlsx file');
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
      // Simulate CSV processing
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      console.log('CSV Headers found:', headers);
      console.log('Required headers:', requiredHeaders);
      
      // Validate headers - check for both basic and extended formats
      const missingBasicHeaders = requiredHeaders.filter(header => !headers.includes(header));
      const missingExtendedHeaders = extendedHeaders.filter(header => !headers.includes(header));
      
      if (missingBasicHeaders.length > 0 && missingExtendedHeaders.length > 0) {
        setValidationErrors([
          `Missing required headers: ${missingBasicHeaders.join(', ')}`,
          'Please ensure your CSV file has all required columns in the correct format.',
          'You can download the template to see the correct format.',
          'For comprehensive Parishisht-K format, all extended headers are required.'
        ]);
        setIsProcessing(false);
        return;
      }
      
      // Check if this is extended format
      const isExtendedFormat = extendedHeaders.every(header => headers.includes(header));
      console.log('CSV Format detected:', isExtendedFormat ? 'Extended Parishisht-K' : 'Basic');
      
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
      toast.success(t.uploadSuccess);
    } catch (error) {
      toast.error(t.uploadFailed);
      setValidationErrors(['Failed to process CSV file']);
    } finally {
      setIsProcessing(false);
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
    
    if (validationErrors.length > 0) {
      toast.error(t.validationFailed);
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Simulate processing
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      await uploadCSV(selectedProject, uploadedFile);
      toast.success(t.uploadSuccess);
    } catch (error) {
      toast.error(t.uploadFailed);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateNotices = async () => {
    if (!selectedProject) {
      toast.error(t.noProjectSelected);
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Simulate notice generation
      for (let i = 0; i <= 100; i += 20) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      toast.success(t.noticesGenerated);
    } catch (error) {
      toast.error('Failed to generate notices');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const basicTemplate = `खातेदाराचे_नांव,सर्वे_नं,क्षेत्र,संपादित_क्षेत्र,दर,संरचना_झाडे_विहिरी_रक्कम,एकूण_मोबदला,सोलेशियम_100,अंतिम_रक्कम,village,taluka,district
कमळी कमळाकर मंडळ,40,0.1850,0.0504,53100000,0,4010513,4010513,8021026,उंबरपाडा नंदाडे,पालघर,पालघर
राम शामराव पाटील,41,0.2000,0.0600,53100000,50000,4600000,4600000,9200000,उंबरपाडा नंदाडे,पालघर,पालघर`;
    
    const extendedTemplate = `खातेदाराचे_नांव,सर्वे_नं,नमुना_7_12_नुसार_जमिनीचे_क्षेत्र,संपादित_जमिनीचे_क्षेत्र,जमिनीचा_प्रकार,नीचा_बिनशेती,मंजुर_दर_प्रति_हेक्टर,संपादित_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमु,कलम_26_2_नुसार_गावा,कलम_26_9X10_नुसार_जमिनीचा_मोबदला,बांधकामे_संख्या,बांधकामे_रक्कम_रुपये,वनझाडे_झाडांची_संख्या,वनझाडे_झाडांची_रक्कम,फळझाडे_झाडांची_संख्या,फळझाडे_झाडांची_रक्कम,विहिरी_बो_सं,विहिरी_बो_रक्कम,एकुण_रक्कम_13_15_17_19,एकुण_रक्कम_11_20,सौ_सोलेशियम_दिलासा_रक्कम,निर्धारित_मोबदला_23,एकुण_रक्कमेवर_25_वाढीव_मोबदला,एकुण_मोबदला_23_24,वजावट_हितसंबंधि_ताला_अदा_रक्कम,एकुण_मोबदला_रक्कम_रुपये,शेरा,village,taluka,district
कमळी कमळाकर मंडळ,40,0.1850,0.0504,शेती,शेती / वर्ग -1,53100000,4010513,4010513,0,0,0,0,0,0,0,0,0,4010513,4010513,8021026,2005256,10026282,0,10026282,उंबरपाडा नंदाडे,पालघर,पालघर
गंगूबाई गंगाराम परेड,30/4,0.1500,0.0450,शेती,शेती / वर्ग -2,53100000,2389500,2389500,0,0,0,0,0,0,0,0,0,2389500,2389500,4779000,1194750,5973750,0,5973750,उंबरपाडा नंदाडे,पालघर,पालघर`;
    
    // Download extended template by default since it matches your document format
    const blob = new Blob([extendedTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parishisht-k-extended-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Extended Parishisht-K template downloaded successfully');
  };

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

            {/* File Upload */}
            <div className="space-y-2">
              <Label>{t.uploadFile}</Label>
              <div 
                className="border-2 border-dashed border-orange-200 rounded-lg p-6 text-center hover:border-orange-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">{t.dragDrop}</p>
                <p className="text-xs text-gray-500 mt-1">{t.supportedFormats}</p>
                <p className="text-xs text-gray-500">{t.maxSize}</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t.processing}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              <Button 
                onClick={handleProcess}
                disabled={!selectedProject || !uploadedFile || isProcessing}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Play className="h-4 w-4 mr-2" />
                {t.process}
              </Button>
              <Button 
                onClick={handleGenerateNotices}
                disabled={!selectedProject || csvData.length === 0 || isProcessing}
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                {t.generateNotices}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Validation & Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>{t.validation}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Validation Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t.totalRecords}</span>
                <Badge variant="outline">{csvData.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t.validRecords}</span>
                <Badge className="bg-green-100 text-green-700">
                  {csvData.length - validationErrors.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t.invalidRecords}</span>
                <Badge className="bg-red-100 text-red-700">
                  {validationErrors.length}
                </Badge>
              </div>
            </div>

            {/* Errors */}
            {validationErrors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-red-600">{t.errors}</Label>
                <div className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Required Headers */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.requiredHeaders}</Label>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {requiredHeaders.map((header, index) => (
                  <div key={index} className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-gray-600">{header}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Preview */}
      {csvData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <span>{t.preview} ({csvData.length} {t.records})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {extendedHeaders.map((header, idx) => (
                      <TableHead key={idx}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.slice(0, 5).map((row, index) => (
                    <TableRow key={index}>
                      {extendedHeaders.map((header, idx) => (
                        <TableCell key={idx}>{row[header]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {csvData.length > 5 && (
                <p className="text-sm text-gray-500 mt-2">
                  Showing first 5 records of {csvData.length} total records
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CSVUploadManager;