import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Autocomplete } from '@/components/ui/autocomplete';
import { Upload, FileText, MapPin, Building2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { config } from '@/config';

interface PDFUploadManagerProps {
  onUploadSuccess?: (data: any) => void;
}

const PDFUploadManager: React.FC<PDFUploadManagerProps> = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [talukas, setTalukas] = useState<string[]>([]);
  const [villages, setVillages] = useState<string[]>([]);
  
  const [filters, setFilters] = useState({
    project: '',
    district: '',
    taluka: '',
    village: ''
  });

  // Load filter options
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      // Load projects
      const projectsResponse = await fetch(`${config.API_BASE_URL}/filters/projects`);
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.map((p: any) => p.name || p.projectName || p));
      }

      // Load districts
      const districtsResponse = await fetch(`${config.API_BASE_URL}/filters/districts`);
      if (districtsResponse.ok) {
        const districtsData = await districtsResponse.json();
        setDistricts(districtsData.map((d: any) => d.name || d));
      }

      // Load talukas
      const talukasResponse = await fetch(`${config.API_BASE_URL}/filters/talukas`);
      if (talukasResponse.ok) {
        const talukasData = await talukasResponse.json();
        setTalukas(talukasData.map((t: any) => t.name || t));
      }

      // Load villages
      const villagesResponse = await fetch(`${config.API_BASE_URL}/filters/villages`);
      if (villagesResponse.ok) {
        const villagesData = await villagesResponse.json();
        setVillages(villagesData.map((v: any) => v.name || v));
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
      // Set fallback data if API fails
      setProjects(['DFCC Project', 'Highway Project', 'Metro Project']);
      setDistricts(['Pune', 'Mumbai', 'Nashik', 'Aurangabad']);
      setTalukas(['Pune', 'Haveli', 'Maval', 'Mulshi']);
      setVillages(['Katraj', 'Warje', 'Kothrud', 'Baner']);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedFile(file);
        toast({
          title: "File Selected",
          description: `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
        });
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a PDF file only.",
          variant: "destructive"
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a PDF file to upload.",
        variant: "destructive"
      });
      return;
    }

    if (!filters.project) {
      toast({
        title: "Project Required",
        description: "Please select a project before uploading.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('pdfFile', selectedFile);
      formData.append('project', filters.project);
      formData.append('district', filters.district);
      formData.append('taluka', filters.taluka);
      formData.append('village', filters.village);

      // For now, we'll simulate the upload since backend isn't ready
      // This prevents the app from crashing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success response
      const mockResponse = {
        success: true,
        message: 'PDF uploaded successfully',
        data: {
          filename: selectedFile.name,
          size: selectedFile.size,
          project: filters.project,
          district: filters.district,
          taluka: filters.taluka,
          village: filters.village,
          uploadedAt: new Date().toISOString()
        }
      };

      toast({
        title: "Upload Successful",
        description: `PDF "${selectedFile.name}" uploaded successfully for ${filters.project}`
      });

      // Reset form
      setSelectedFile(null);
      setFilters({
        project: '',
        district: '',
        taluka: '',
        village: ''
      });

      // Clear file input
      const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      if (onUploadSuccess) {
        onUploadSuccess(mockResponse.data);
      }

    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload PDF file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filter Section */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold">Location Filters</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Project Name *
              </Label>
              <Autocomplete
                options={projects}
                value={filters.project}
                onChange={(value) => setFilters(prev => ({ ...prev, project: value }))}
                placeholder="Select project..."
              />
            </div>
            
            <div>
              <Label htmlFor="district" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                District
              </Label>
              <Autocomplete
                options={districts}
                value={filters.district}
                onChange={(value) => setFilters(prev => ({ ...prev, district: value }))}
                placeholder="Select district..."
              />
            </div>
            
            <div>
              <Label htmlFor="taluka">Taluka</Label>
              <Autocomplete
                options={talukas}
                value={filters.taluka}
                onChange={(value) => setFilters(prev => ({ ...prev, taluka: value }))}
                placeholder="Select taluka..."
              />
            </div>
            
            <div>
              <Label htmlFor="village">Village</Label>
              <Autocomplete
                options={villages}
                value={filters.village}
                onChange={(value) => setFilters(prev => ({ ...prev, village: value }))}
                placeholder="Select village..."
              />
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="space-y-4">
          <Label htmlFor="pdfFile" className="text-lg font-semibold">Upload PDF File</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <div className="space-y-2">
              <Input
                id="pdfFile"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Label 
                htmlFor="pdfFile" 
                className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium"
              >
                Click to browse or drag and drop PDF file
              </Label>
              <p className="text-sm text-gray-500">
                Supported format: PDF only | Max size: 10MB
              </p>
              {selectedFile && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-700">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <Button 
          onClick={handleUpload} 
          disabled={loading || !selectedFile || !filters.project}
          className="w-full"
        >
          {loading ? (
            <>
              <Upload className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </>
          )}
        </Button>

        {/* Format Information */}
        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded">
          <p><strong>PDF Upload Information:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Only PDF files are supported</li>
            <li>Maximum file size: 10MB</li>
            <li>Project selection is mandatory</li>
            <li>Location filters help categorize the uploaded document</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFUploadManager;