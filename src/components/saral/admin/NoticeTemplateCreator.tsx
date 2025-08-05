import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSaral } from '@/contexts/SaralContext';
import { toast } from 'sonner';
import { FileText, Plus, Save, Download, Upload } from 'lucide-react';

interface NoticeTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  projectId: string;
  createdAt: Date;
}

interface CSVField {
  name: string;
  displayName: string;
  type: 'text' | 'number' | 'date' | 'currency';
}

const NoticeTemplateCreator: React.FC = () => {
  const { projects, landownerRecords } = useSaral();
  const [templates, setTemplates] = useState<NoticeTemplate[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [csvFields, setCSVFields] = useState<CSVField[]>([]);
  const [selectedField, setSelectedField] = useState<string>('');

  // Demo CSV fields based on Parishisht-K format
  const demoCSVFields: CSVField[] = [
    { name: 'SURVEY_NO', displayName: 'Survey Number', type: 'text' },
    { name: 'VILLAGE_NAME', displayName: 'Village Name', type: 'text' },
    { name: 'TALUKA_NAME', displayName: 'Taluka Name', type: 'text' },
    { name: 'DISTRICT_NAME', displayName: 'District Name', type: 'text' },
    { name: 'OWNER_NAME', displayName: 'Owner Name', type: 'text' },
    { name: 'FATHER_NAME', displayName: 'Father Name', type: 'text' },
    { name: 'ADDRESS', displayName: 'Address', type: 'text' },
    { name: 'AREA_ACRES', displayName: 'Area (Acres)', type: 'number' },
    { name: 'AREA_SQ_METERS', displayName: 'Area (Sq Meters)', type: 'number' },
    { name: 'COMPENSATION_AMOUNT', displayName: 'Compensation Amount', type: 'currency' },
    { name: 'NOTICE_NUMBER', displayName: 'Notice Number', type: 'text' },
    { name: 'PROJECT_NAME', displayName: 'Project Name', type: 'text' },
    { name: 'DATE', displayName: 'Date', type: 'date' },
    { name: 'MOBILE_NUMBER', displayName: 'Mobile Number', type: 'text' },
    { name: 'EMAIL', displayName: 'Email', type: 'text' },
    { name: 'ACCOUNT_NUMBER', displayName: 'Account Number', type: 'text' },
    { name: 'IFSC_CODE', displayName: 'IFSC Code', type: 'text' },
    { name: 'BANK_NAME', displayName: 'Bank Name', type: 'text' },
    { name: 'BRANCH_NAME', displayName: 'Branch Name', type: 'text' }
  ];

  useEffect(() => {
    setCSVFields(demoCSVFields);
  }, []);

  const addVariable = () => {
    if (selectedField) {
      const field = csvFields.find(f => f.name === selectedField);
      if (field) {
        const variable = `[${field.name}]`;
        setTemplateContent(prev => prev + variable);
        setSelectedField('');
      }
    }
  };

  const saveTemplate = () => {
    if (!templateName.trim() || !templateContent.trim() || !selectedProject) {
      toast.error('Please fill all required fields');
      return;
    }

    const newTemplate: NoticeTemplate = {
      id: Date.now().toString(),
      name: templateName,
      content: templateContent,
      variables: extractVariables(templateContent),
      projectId: selectedProject,
      createdAt: new Date()
    };

    setTemplates(prev => [...prev, newTemplate]);
    setTemplateName('');
    setTemplateContent('');
    toast.success('Notice template saved successfully');
  };

  const extractVariables = (content: string): string[] => {
    const regex = /\[([^\]]+)\]/g;
    const matches = content.match(regex);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  const downloadTemplate = (template: NoticeTemplate) => {
    const project = projects.find(p => p.id === template.projectId);
    const sampleData = landownerRecords.find(r => r.projectId === template.projectId);
    
    let sampleContent = template.content;
    
    // Replace variables with sample data
    if (sampleData) {
      sampleContent = sampleContent
        .replace(/\[SURVEY_NO\]/g, sampleData.सर्वे_नं)
        .replace(/\[VILLAGE_NAME\]/g, sampleData.village)
        .replace(/\[TALUKA_NAME\]/g, sampleData.taluka)
        .replace(/\[DISTRICT_NAME\]/g, sampleData.district)
        .replace(/\[OWNER_NAME\]/g, sampleData.खातेदाराचे_नांव)
        .replace(/\[COMPENSATION_AMOUNT\]/g, sampleData.अंतिम_रक्कम)
        .replace(/\[PROJECT_NAME\]/g, project?.projectName || 'Sample Project')
        .replace(/\[DATE\]/g, new Date().toLocaleDateString())
        .replace(/\[NOTICE_NUMBER\]/g, 'NOTICE-2024-001');
    }

    const blob = new Blob([sampleContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name}-sample.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notice Template Creator
          </CardTitle>
          <CardDescription>
            Create notice templates with variables from CSV data. Use the variable selector to add dynamic fields.
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

          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="templateName">Template Name</Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name"
            />
          </div>

          {/* Variable Selector */}
          <div className="space-y-2">
            <Label>Add Variables</Label>
            <div className="flex gap-2">
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a CSV field" />
                </SelectTrigger>
                <SelectContent>
                  {csvFields.map(field => (
                    <SelectItem key={field.name} value={field.name}>
                      {field.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addVariable} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Available Variables */}
          <div className="space-y-2">
            <Label>Available Variables</Label>
            <div className="flex flex-wrap gap-2">
              {csvFields.map(field => (
                <Badge key={field.name} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground" onClick={() => setSelectedField(field.name)}>
                  {field.displayName}
                </Badge>
              ))}
            </div>
          </div>

          {/* Template Content */}
          <div className="space-y-2">
            <Label htmlFor="templateContent">Template Content</Label>
            <Textarea
              id="templateContent"
              value={templateContent}
              onChange={(e) => setTemplateContent(e.target.value)}
              placeholder="Enter your notice template content. Use variables like [OWNER_NAME], [COMPENSATION_AMOUNT], etc."
              rows={10}
              className="font-mono"
            />
          </div>

          {/* Save Button */}
          <Button onClick={saveTemplate} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </CardContent>
      </Card>

      {/* Saved Templates */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Templates</CardTitle>
            <CardDescription>
              Your saved notice templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {templates.map(template => {
                const project = projects.find(p => p.id === template.projectId);
                return (
                  <div key={template.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Project: {project?.projectName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created: {template.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTemplate(template)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Sample
                      </Button>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Variables Used:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map(variable => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NoticeTemplateCreator; 