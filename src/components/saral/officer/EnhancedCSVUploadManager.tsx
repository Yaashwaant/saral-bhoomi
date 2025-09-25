import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Download,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useSaral } from '@/contexts/SaralContext';
import * as XLSX from 'xlsx';
import { config } from '../../../config';

interface UploadResult {
  success: boolean;
  message: string;
  data?: {
    total_rows: number;
    processed: number;
    saved: number;
    errors: number;
    error_details?: Array<{
      row?: number;
      survey_number?: string;
      error: string;
    }>;
    file_type: 'CSV' | 'Excel';
    new_format_detected: boolean;
  };
}

interface PreviewData {
  headers: string[];
  rows: any[][];
  detectedFormat: 'legacy' | 'new_marathi' | 'mixed';
  fieldMappings: { [key: string]: string };
}

const EnhancedCSVUploadManager: React.FC = () => {
  const { projects } = useSaral();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Field mappings for different formats
  const LEGACY_MARATHI_FIELDS = [
    'खातेदाराचे_नांव', 'सर्वे_नं', 'क्षेत्र', 'संपादित_क्षेत्र', 'दर', 
    'संरचना_झाडे_विहिरी_रक्कम', 'एकूण_मोबदला', 'सोलेशियम_100', 'अंतिम_रक्कम'
  ];

  const NEW_MARATHI_FIELDS = [
    'खातेदाराचे नांव', 'जुना स.नं.', 'नविन स.नं.', 'गट नंबर', 'सी.टी.एस. नंबर',
    'गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)', 'संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)',
    'मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये', 'हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)'
  ];

  const detectFormat = (headers: string[]): 'legacy' | 'new_marathi' | 'mixed' => {
    const legacyCount = headers.filter(h => LEGACY_MARATHI_FIELDS.includes(h)).length;
    const newCount = headers.filter(h => NEW_MARATHI_FIELDS.some(nf => h.includes(nf.split(' ')[0]))).length;
    
    if (newCount > legacyCount) return 'new_marathi';
    if (legacyCount > 0) return 'legacy';
    return 'mixed';
  };

  const generateFieldMappings = (headers: string[], format: string): { [key: string]: string } => {
    const mappings: { [key: string]: string } = {};
    
    headers.forEach(header => {
      if (format === 'new_marathi') {
        // Map new Marathi fields
        if (header.includes('खातेदाराचे नांव')) mappings[header] = 'landowner_name';
        else if (header.includes('नविन स.नं.')) mappings[header] = 'survey_number';
        else if (header.includes('जुना स.नं.')) mappings[header] = 'old_survey_number';
        else if (header.includes('गट नंबर')) mappings[header] = 'group_number';
        else if (header.includes('सी.टी.एस. नंबर')) mappings[header] = 'cts_number';
        else if (header.includes('गांव नमुना 7/12')) mappings[header] = 'total_area_village_record';
        else if (header.includes('संपादित जमिनीचे क्षेत्र')) mappings[header] = 'acquired_area_sqm_hectare';
        else if (header.includes('मंजुर केलेला दर')) mappings[header] = 'approved_rate_per_hectare';
        else if (header.includes('हितसंबंधिताला अदा करावयाची')) mappings[header] = 'final_payable_amount';
        else if (header.includes('सोलेशियम')) mappings[header] = 'solatium_100_percent';
        else mappings[header] = header;
      } else {
        // Legacy mappings
        mappings[header] = header;
      }
    });
    
    return mappings;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      toast.error('Please select a CSV or Excel file');
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);
    
    // Generate preview
    try {
      const preview = await generatePreview(selectedFile);
      setPreviewData(preview);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Error reading file for preview');
    }
  };

  const generatePreview = async (file: File): Promise<PreviewData> => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      const isExcel = ['.xlsx', '.xls'].includes(fileExtension);

      if (isExcel) {
        // Read Excel file
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON starting from row 4 (0-indexed row 3)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              range: 3, 
              header: 1,
              defval: '',
              raw: false
            });

            if (jsonData.length === 0) {
              reject(new Error('Excel file appears to be empty'));
              return;
            }

            const headers = jsonData[0] as string[];
            const rows = jsonData.slice(1, 6) as any[][]; // First 5 data rows
            
            const format = detectFormat(headers);
            const fieldMappings = generateFieldMappings(headers, format);

            resolve({
              headers: headers.filter(h => h && h.trim() !== ''),
              rows: rows.filter(row => row.some(cell => cell && cell.toString().trim() !== '')),
              detectedFormat: format,
              fieldMappings
            });
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Error reading Excel file'));
        reader.readAsArrayBuffer(file);
      } else {
        // Read CSV file
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) {
              reject(new Error('CSV file appears to be empty'));
              return;
            }

            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const rows = lines.slice(1, 6).map(line => 
              line.split(',').map(cell => cell.trim().replace(/"/g, ''))
            );
            
            const format = detectFormat(headers);
            const fieldMappings = generateFieldMappings(headers, format);

            resolve({
              headers,
              rows: rows.filter(row => row.some(cell => cell.trim() !== '')),
              detectedFormat: format,
              fieldMappings
            });
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Error reading CSV file'));
        reader.readAsText(file);
      }
    });
  };

  const handleUpload = async () => {
    if (!file || !selectedProject) {
      toast.error('Please select a project and file');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('overwrite', overwrite.toString());

      const response = await fetch(`${config.API_BASE_URL}/api/csv/upload-enhanced/${selectedProject}`, {
        method: 'POST',
        body: formData,
      });

      const result: UploadResult = await response.json();
      setUploadResult(result);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
      setUploadResult({
        success: false,
        message: 'Upload failed due to network error'
      });
    } finally {
      setUploading(false);
    }
  };

  const getFormatBadge = (format: string) => {
    switch (format) {
      case 'new_marathi':
        return <Badge variant="default" className="bg-green-500">New Marathi Format</Badge>;
      case 'legacy':
        return <Badge variant="secondary">Legacy Format</Badge>;
      case 'mixed':
        return <Badge variant="outline">Mixed Format</Badge>;
      default:
        return <Badge variant="outline">Unknown Format</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Enhanced File Upload (CSV & Excel Support)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Project Selection */}
          <div>
            <Label htmlFor="project-select">Select Project</Label>
            <select
              id="project-select"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.projectName}
                </option>
              ))}
            </select>
          </div>

          {/* File Selection */}
          <div>
            <Label htmlFor="file-input">Select CSV or Excel File</Label>
            <Input
              id="file-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            {file && (
              <div className="mt-2 flex items-center space-x-2">
                {file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? (
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                ) : (
                  <FileText className="h-4 w-4 text-blue-600" />
                )}
                <span className="text-sm text-gray-600">{file.name}</span>
                <span className="text-xs text-gray-400">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="overwrite"
              checked={overwrite}
              onCheckedChange={(checked) => setOverwrite(checked as boolean)}
            />
            <Label htmlFor="overwrite" className="text-sm">
              Overwrite existing records with same survey number
            </Label>
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!file || !selectedProject || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* File Preview */}
      {showPreview && previewData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>File Preview</span>
              </div>
              {getFormatBadge(previewData.detectedFormat)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Detected format: <strong>{previewData.detectedFormat}</strong>. 
                  Showing first 5 rows of data.
                </AlertDescription>
              </Alert>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewData.headers.slice(0, 8).map((header, index) => (
                        <TableHead key={index} className="text-xs">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.rows.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {row.slice(0, 8).map((cell, cellIndex) => (
                          <TableCell key={cellIndex} className="text-xs">
                            {cell || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Results */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {uploadResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span>Upload Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className={uploadResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertDescription>{uploadResult.message}</AlertDescription>
              </Alert>

              {uploadResult.data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{uploadResult.data.total_rows}</div>
                    <div className="text-sm text-gray-600">Total Rows</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{uploadResult.data.saved}</div>
                    <div className="text-sm text-gray-600">Saved</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{uploadResult.data.errors}</div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm font-bold text-purple-600">{uploadResult.data.file_type}</div>
                    <div className="text-sm text-gray-600">File Type</div>
                  </div>
                </div>
              )}

              {uploadResult.data?.error_details && uploadResult.data.error_details.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Error Details:</h4>
                  <div className="max-h-40 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row/Survey</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uploadResult.data.error_details.map((error, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-sm">
                              {error.row || error.survey_number || 'Unknown'}
                            </TableCell>
                            <TableCell className="text-sm text-red-600">
                              {error.error}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedCSVUploadManager;
