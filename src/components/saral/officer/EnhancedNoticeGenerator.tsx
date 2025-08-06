import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSaral } from '@/contexts/SaralContext';
import { NoticeGenerationService } from '@/services/NoticeGenerationService';
import { toast } from 'sonner';
import { 
  FileText, 
  Download, 
  Eye, 
  Printer, 
  Upload, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Languages,
  MapPin,
  User,
  Calculator,
  Banknote
} from 'lucide-react';
import {
  NoticeTemplate,
  GeneratedNotice,
  CSVFieldMapping,
  NoticeGenerationConfig,
  EnhancedLandownerRecord,
  RequiredDocument
} from '@/types/notice';

interface EnhancedNoticeGeneratorProps {
  projectId?: string;
}

const EnhancedNoticeGenerator: React.FC<EnhancedNoticeGeneratorProps> = ({ projectId }) => {
  const { projects } = useSaral();
  const noticeService = NoticeGenerationService.getInstance();

  // State management
  const [selectedProject, setSelectedProject] = useState<string>(projectId || '');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [fieldMappings, setFieldMappings] = useState<CSVFieldMapping[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [generatedNotices, setGeneratedNotices] = useState<GeneratedNotice[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState<'marathi' | 'hindi' | 'english'>('marathi');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [issuedNotices, setIssuedNotices] = useState<GeneratedNotice[]>([]);
  const [fieldAgents, setFieldAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [isAssigningAgent, setIsAssigningAgent] = useState(false);
  const [showAddAgentDialog, setShowAddAgentDialog] = useState(false);
  const [newAgentData, setNewAgentData] = useState({ name: '', phone: '', area: '' });

  // Demo field agents
  const demoFieldAgents = [
    { id: '4', name: 'राजेश पाटील', phone: '9876543210', area: 'उंबरपाडा' },
    { id: '5', name: 'सुनील कांबळे', phone: '9876543211', area: 'उंबरपाडा' },
    { id: '6', name: 'महेश देशमुख', phone: '9876543212', area: 'उंबरपाडा' },
    { id: '7', name: 'विठ्ठल जाधव', phone: '9876543213', area: 'उंबरपाडा' },
    { id: '8', name: 'रामराव पवार', phone: '9876543214', area: 'उंबरपाडा' }
  ];

  // Demo templates
  const demoTemplates: NoticeTemplate[] = [
    {
      id: 'template-1',
      name: 'Standard Land Acquisition Notice',
      content: `महाराष्ट्र शासन
उपजिल्हाधिकारी (भूसंपादन) सुर्या प्रकल्प, डहाणू यांचे कार्यालय
पत्र व्यवहाराचा पत्ता-: इराणी रोड, आय.डी. बी. आय. बँकेच्या समोर, ता. डहाणू जि.पालघर
दुरध्वनी क्रमांक ०२५२८-२२०१८० Email ID :desplandacquisition@gmail.com
जा.क्र./भूसंपादन/रेल्वे उड्डाणपूल प्रकल्प/कावि-[PROJECT_CODE]

नोटीस:-
प्रति,
दिनांक:-[CURRENT_DATE]

भूमिसंपादन, पुनर्वसन व पुनर्स्थापना करताना वाजवी भरपाई मिळण्याचा व पारदर्शकतेचा हक्क अधिनियम २०१३, च्या १९(१) २७,२९,३० च्या नोटीसनुसार [PROJECT_NAME] प्रकल्पाकरिता भुसंपादन (निवाडा क्र.11/2022)

[OWNER_NAME]
रा. [VILLAGE] ता. [TALUKA], जि.[DISTRICT]

याव्दारे आपणांस नोटीस देण्यात येते की, मौजे [VILLAGE], ता.[TALUKA] जि.[DISTRICT] येथिल खालील वर्णनाची जमिन [PROJECT_NAME] प्रकल्पाकरिता संपादित करण्यात आले असुन भुमिसंपादन पुनर्वसन व पुनर्स्थापना करताना वाजवी भरपाई मिळण्याचा व पारदर्शकतेचा हक्क अधिनियम २०१३ च्या १९(१) नुसार केलेली आहे.

जमिनीचा तपशिल खालीलप्रमाणे आहे.

स.नं/ग.नं /सी.टी.एस. नं | संपादीत जमिनीचे क्षेत्र (हे. आर) | जमिनीचा प्रकार | मंजुर केलेला जमिनीचा दर | येणारा मोबदला | सोलेशियम | एकूण मोबदला
[SURVEY_NUMBER] | [ACQUIRED_AREA] | शेती | [RATE] | [COMPENSATION_AMOUNT] | [SOLATIUM] | [FINAL_AMOUNT]

ठिकाण - [DISTRICT] दिनांक-[CURRENT_DATE]

(संजीव जाधवर)
सक्षम प्राधिकारी
[PROJECT_NAME] प्रकल्प, तथा
उपजिल्हाधिकारी (भूसंपादन), सुर्या प्रकल्प डहाणू`,
      variables: ['SURVEY_NUMBER', 'OWNER_NAME', 'VILLAGE', 'TALUKA', 'DISTRICT', 'AREA', 'ACQUIRED_AREA', 'RATE', 'COMPENSATION_AMOUNT', 'SOLATIUM', 'FINAL_AMOUNT', 'PROJECT_NAME', 'PROJECT_CODE'],
      projectId: selectedProject,
      language: 'marathi',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin'
    }
  ];

  // Default field mappings
  const defaultFieldMappings: CSVFieldMapping[] = [
    { csvField: 'स.नं./हि.नं./ग.नं.', templateVariable: 'SURVEY_NUMBER', dataType: 'text', isRequired: true },
    { csvField: 'खातेदाराचे_नांव', templateVariable: 'OWNER_NAME', dataType: 'text', isRequired: true },
    { csvField: 'गांव', templateVariable: 'VILLAGE', dataType: 'text', isRequired: true },
    { csvField: 'taluka', templateVariable: 'TALUKA', dataType: 'text', isRequired: true },
    { csvField: 'district', templateVariable: 'DISTRICT', dataType: 'text', isRequired: true },
    { csvField: 'नमुना_7_12_नुसार_जमिनीचे_क्षेत्र', templateVariable: 'AREA', dataType: 'number', isRequired: true },
    { csvField: 'संपादित_जमिनीचे_क्षेत्र', templateVariable: 'ACQUIRED_AREA', dataType: 'number', isRequired: true },
    { csvField: 'मंजुर_केलेला_दर', templateVariable: 'RATE', dataType: 'currency', isRequired: true },
    { csvField: 'कलम_26_नुसार_जमिनीचा_मोबदला', templateVariable: 'COMPENSATION_AMOUNT', dataType: 'currency', isRequired: true },
    { csvField: 'सोलेशियम_100', templateVariable: 'SOLATIUM', dataType: 'currency', isRequired: true },
    { csvField: 'हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम', templateVariable: 'FINAL_AMOUNT', dataType: 'currency', isRequired: true }
  ];

  // Add this mapping for new CSV headers to template variables
  const autoFieldMapping: Record<string, string> = {
    'खातेदाराचे_नांव': 'OWNER_NAME',
    'स.नं./हि.नं./ग.नं.': 'SURVEY_NUMBER',
    'गांव': 'VILLAGE',
    'नमुना_7_12_नुसार_जमिनीचे_क्षेत्र': 'AREA',
    'संपादित_जमिनीचे_क्षेत्र': 'ACQUIRED_AREA',
    'मंजुर_केलेला_दर': 'RATE',
    'कलम_26_नुसार_जमिनीचा_मोबदला': 'COMPENSATION_AMOUNT',
    'सोलेशियम_100': 'SOLATIUM',
    'हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम': 'FINAL_AMOUNT',
    'taluka': 'TALUKA',
    'district': 'DISTRICT',
    // Add more as needed
  };

  useEffect(() => {
    if (selectedProject) {
      setFieldMappings(defaultFieldMappings.map(mapping => ({ ...mapping })));
    }
  }, [selectedProject]);

  // Handle CSV file upload
  const handleCSVUpload = async (file: File) => {
    try {
      setCsvFile(file);
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      setCsvHeaders(headers);

      // Auto-map template variables to CSV headers
      const template = demoTemplates.find(t => t.id === selectedTemplate) || demoTemplates[0];
      const newMappings = template.variables.map(variable => {
        // Find the CSV header that maps to this template variable
        const csvField = Object.keys(autoFieldMapping).find(
          key => autoFieldMapping[key] === variable
        );
        return {
          csvField: csvField || '',
          templateVariable: variable,
          dataType: 'text',
          isRequired: true
        };
      });
      setFieldMappings(newMappings);

      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        row.id = `record-${index}`;
        return row;
      }).filter(row => Object.values(row).some(val => val !== ''));

      setCsvData(data);
      toast.success(`CSV uploaded successfully with ${data.length} records`);
    } catch (error) {
      toast.error('Failed to parse CSV file');
      console.error('CSV parsing error:', error);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = demoTemplates.find(t => t.id === templateId);
    if (template) {
      // Auto-map fields based on template variables
      const newMappings = template.variables.map(variable => {
        const existingMapping = fieldMappings.find(m => m.templateVariable === variable);
        return existingMapping || {
          csvField: '',
          templateVariable: variable,
          dataType: 'text',
          isRequired: true
        };
      });
      setFieldMappings(newMappings);
    }
  };

  // Handle field mapping update
  const handleFieldMappingUpdate = (index: number, field: string) => {
    const newMappings = [...fieldMappings];
    newMappings[index].csvField = field;
    setFieldMappings(newMappings);
  };

  // Handle record selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(csvData.map(r => r.id));
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

  // Generate notices
  const generateNotices = async () => {
    if (selectedRecords.length === 0) {
      toast.error('Please select at least one record');
      return;
    }

    if (!selectedTemplate) {
      toast.error('Please select a notice template');
      return;
    }

    const template = demoTemplates.find(t => t.id === selectedTemplate);
    if (!template) {
      toast.error('Selected template not found');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setErrors([]);

    try {
      // Convert CSV data to EnhancedLandownerRecord format
      const records: EnhancedLandownerRecord[] = selectedRecords.map(recordId => {
        const csvRecord = csvData.find(r => r.id === recordId);
        if (!csvRecord) throw new Error(`Record ${recordId} not found`);

        return {
          id: recordId,
          projectId: selectedProject,
          surveyNumber: csvRecord['स.नं./हि.नं./ग.नं.'] || '',
          landownerName: csvRecord['खातेदाराचे_नांव'] || '',
          area: parseFloat(csvRecord['नमुना_7_12_नुसार_जमिनीचे_क्षेत्र']) || 0,
          acquiredArea: parseFloat(csvRecord['संपादित_जमिनीचे_क्षेत्र']) || 0,
          rate: parseFloat(csvRecord['मंजुर_केलेला_दर']) || 0,
          compensationAmount: parseFloat(csvRecord['कलम_26_नुसार_जमिनीचा_मोबदला']) || 0,
          solatium: parseFloat(csvRecord['सोलेशियम_100']) || 0,
          finalAmount: parseFloat(csvRecord['हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम']) || 0,
          village: csvRecord['गांव'] || '',
          taluka: csvRecord['taluka'] || '',
          district: csvRecord['district'] || '',
          noticeStatus: 'pending',
          documentsRequired: 12,
          documentsUploaded: 0,
          documentsVerified: 0,
          kycStatus: 'pending',
          paymentStatus: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'current-user',
          updatedBy: 'current-user'
        };
      });

      // Configuration for notice generation
      const config: NoticeGenerationConfig = {
        projectId: selectedProject,
        templateId: selectedTemplate,
        fieldMappings,
        autoAssignAgent: true,
        deliveryMethod: 'agent',
        language: currentLanguage
      };

      // Generate notices
      const result = await noticeService.generateNotices(config, records, template);
      
      if (result.success) {
        // Auto-assign agents to generated notices
        const noticesWithAgents = result.generatedNotices.map(notice => {
          // Get available agents (including demo agents and newly added ones)
          const allAgents = [...demoFieldAgents, ...fieldAgents];
          if (allAgents.length === 0) {
            return notice;
          }
          
          // Randomly assign an agent
          const randomAgent = allAgents[Math.floor(Math.random() * allAgents.length)];
          
          return {
            ...notice,
            assignedAgent: {
              id: randomAgent.id,
              name: randomAgent.name,
              phone: randomAgent.phone,
              area: randomAgent.area,
              assignedAt: new Date()
            },
            status: 'assigned' // Mark as assigned immediately
          };
        });

        setGeneratedNotices(prev => [...prev, ...noticesWithAgents]);
        toast.success(`Generated ${result.noticesGenerated} notices and assigned agents successfully`);
        setSelectedRecords([]);
      } else {
        setErrors(result.errors.map(e => e.message));
        toast.error(`Generated ${result.noticesGenerated} notices, ${result.noticesFailed} failed`);
      }
    } catch (error) {
      toast.error('Failed to generate notices');
      console.error('Notice generation error:', error);
      console.error('Error details:', {
        selectedRecords,
        selectedTemplate,
        csvData: csvData.length,
        fieldMappings,
        template: template?.variables
      });
    } finally {
      setIsGenerating(false);
      setProgress(100);
    }
  };

  // Preview notice
  const previewNotice = (recordId: string) => {
    const record = csvData.find(r => r.id === recordId);
    const template = demoTemplates.find(t => t.id === selectedTemplate);
    
    if (!record || !template) {
      toast.error('Unable to preview notice');
      return;
    }

    // Generate preview content
    let content = template.content;
    fieldMappings.forEach(mapping => {
      const value = record[mapping.csvField];
      if (value !== undefined) {
        content = content.replace(new RegExp(`\\[${mapping.templateVariable}\\]`, 'g'), String(value));
      }
    });

    setPreviewContent(content);
    setIsPreviewOpen(true);
  };

  // Download notice
  const downloadNotice = (notice: GeneratedNotice) => {
    const blob = new Blob([notice.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notice-${notice.noticeNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Print notice
  const printNotice = (notice: GeneratedNotice) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Land Acquisition Notice</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .notice-content { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <div class="notice-content">${notice.content}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Assign field agent to notice
  const assignFieldAgent = async (noticeId: string, agentId: string) => {
    try {
      setIsAssigningAgent(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find the agent details
      const agent = [...demoFieldAgents, ...fieldAgents].find(a => a.id === agentId);
      if (!agent) {
        toast.error('Agent not found');
        return;
      }
      
      setIssuedNotices(prev => prev.map(notice => 
        notice.id === noticeId 
          ? { 
              ...notice, 
              assignedAgent: {
                id: agent.id,
                name: agent.name,
                phone: agent.phone,
                area: agent.area,
                assignedAt: new Date()
              }, 
              status: 'assigned' 
            }
          : notice
      ));
      
      toast.success('Field agent assigned successfully');
    } catch (error) {
      toast.error('Failed to assign field agent');
    } finally {
      setIsAssigningAgent(false);
    }
  };

  // Issue notice (move from generated to issued)
  const issueNotice = async (noticeId: string) => {
    try {
      const notice = generatedNotices.find(n => n.id === noticeId);
      if (!notice) return;

      // If notice already has an assigned agent, use that; otherwise randomly assign
      let assignedAgent = notice.assignedAgent;
      if (!assignedAgent) {
        const allAgents = [...demoFieldAgents, ...fieldAgents];
        if (allAgents.length > 0) {
          const randomAgent = allAgents[Math.floor(Math.random() * allAgents.length)];
          assignedAgent = {
            id: randomAgent.id,
            name: randomAgent.name,
            phone: randomAgent.phone,
            area: randomAgent.area,
            assignedAt: new Date()
          };
        }
      }
      
      // Move notice from generated to issued
      const issuedNotice = { 
        ...notice, 
        status: 'issued', 
        issuedDate: new Date(),
        noticeNumber: `NOTICE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assignedAgent: assignedAgent
      };
      
      setIssuedNotices(prev => [...prev, issuedNotice]);
      setGeneratedNotices(prev => prev.filter(n => n.id !== noticeId));
      
      // Save to localStorage
      localStorage.setItem('issued_notices', JSON.stringify([...issuedNotices, issuedNotice]));
      
      toast.success(`Notice issued successfully${assignedAgent ? ` and assigned to ${assignedAgent.name}` : ''}`);
    } catch (error) {
      toast.error('Failed to issue notice');
    }
  };

  // Load issued notices from storage
  const loadIssuedNotices = () => {
    const stored = localStorage.getItem('issued_notices');
    if (stored) {
      setIssuedNotices(JSON.parse(stored));
    }
  };

  // Add new field agent
  const addFieldAgent = (agentData: { name: string; phone: string; area: string }) => {
    const newAgent = {
      id: `agent-${Date.now()}`,
      ...agentData
    };
    setFieldAgents(prev => [...prev, newAgent]);
    toast.success('Field agent added successfully');
  };

  // Get assigned notices for an agent
  const getAssignedNotices = (agentId: string) => {
    return issuedNotices.filter(notice => notice.assignedAgent?.id === agentId);
  };

  // Get agent statistics
  const getAgentStats = (agentId: string) => {
    const assignedNotices = getAssignedNotices(agentId);
    return {
      totalAssigned: assignedNotices.length,
      pendingDelivery: assignedNotices.filter(n => n.status === 'issued').length,
      delivered: assignedNotices.filter(n => n.status === 'delivered').length,
      completed: assignedNotices.filter(n => n.status === 'completed').length
    };
  };

  // Update notice status
  const updateNoticeStatus = async (noticeId: string, newStatus: 'delivered' | 'completed') => {
    try {
      setIssuedNotices(prev => prev.map(notice => 
        notice.id === noticeId 
          ? { ...notice, status: newStatus, updatedAt: new Date() }
          : notice
      ));
      
      // Update localStorage
      const updatedNotices = issuedNotices.map(notice => 
        notice.id === noticeId 
          ? { ...notice, status: newStatus, updatedAt: new Date() }
          : notice
      );
      localStorage.setItem('issued_notices', JSON.stringify(updatedNotices));
      
      toast.success(`Notice status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update notice status');
    }
  };

  // Demo function to create sample issued notices with random assignments
  const createDemoNotices = () => {
    const demoNotices = [
      {
        id: 'demo-1',
        landownerId: 'रामचंद्र शिवाजी पाटील',
        projectId: selectedProject,
        templateId: 'template-1',
        noticeNumber: 'NOTICE-2024-001',
        noticeDate: new Date('2024-08-01'),
        content: 'Sample notice content for demonstration',
        status: 'issued' as const,
        issuedDate: new Date('2024-08-01'),
        assignedAgent: {
          id: 'agent-1',
          name: 'राजेश पाटील',
          phone: '9876543210',
          area: 'उंबरपाडा',
          assignedAt: new Date('2024-08-01')
        }
      },
      {
        id: 'demo-2',
        landownerId: 'सुनीता देवीराव कांबळे',
        projectId: selectedProject,
        templateId: 'template-1',
        noticeNumber: 'NOTICE-2024-002',
        noticeDate: new Date('2024-08-02'),
        content: 'Sample notice content for demonstration',
        status: 'delivered' as const,
        issuedDate: new Date('2024-08-02'),
        assignedAgent: {
          id: 'agent-2',
          name: 'सुनील कांबळे',
          phone: '9876543211',
          area: 'उंबरपाडा',
          assignedAt: new Date('2024-08-02')
        }
      },
      {
        id: 'demo-3',
        landownerId: 'महादेव बाळासाहेब देशमुख',
        projectId: selectedProject,
        templateId: 'template-1',
        noticeNumber: 'NOTICE-2024-003',
        noticeDate: new Date('2024-08-03'),
        content: 'Sample notice content for demonstration',
        status: 'completed' as const,
        issuedDate: new Date('2024-08-03'),
        assignedAgent: {
          id: 'agent-3',
          name: 'महेश देशमुख',
          phone: '9876543212',
          area: 'उंबरपाडा',
          assignedAt: new Date('2024-08-03')
        }
      },
      {
        id: 'demo-4',
        landownerId: 'लक्ष्मीबाई विठ्ठलराव जाधव',
        projectId: selectedProject,
        templateId: 'template-1',
        noticeNumber: 'NOTICE-2024-004',
        noticeDate: new Date('2024-08-04'),
        content: 'Sample notice content for demonstration',
        status: 'issued' as const,
        issuedDate: new Date('2024-08-04'),
        assignedAgent: {
          id: 'agent-4',
          name: 'विठ्ठल जाधव',
          phone: '9876543213',
          area: 'उंबरपाडा',
          assignedAt: new Date('2024-08-04')
        }
      }
    ];

    setIssuedNotices(demoNotices);
    localStorage.setItem('issued_notices', JSON.stringify(demoNotices));
    toast.success('Demo notices created successfully');
  };

  // Load field agents and issued notices on component mount
  useEffect(() => {
    setFieldAgents(demoFieldAgents);
    loadIssuedNotices();
  }, []);

  // Helper function to render owners as a list
  const renderOwners = (owners: string) => {
    if (!owners) return '';
    return owners.split('/').map((name, idx) => <div key={idx}>{name.trim()}</div>);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Enhanced Notice Generator
          </CardTitle>
          <CardDescription>
            Upload CSV data, configure field mappings, and generate personalized notices automatically
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">CSV Upload</TabsTrigger>
          <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
          <TabsTrigger value="template">Template Selection</TabsTrigger>
          <TabsTrigger value="generate">Generate Notices</TabsTrigger>
          <TabsTrigger value="results">Generated Notices</TabsTrigger>
          <TabsTrigger value="issued">Issued Notice List</TabsTrigger>
        </TabsList>

        {/* CSV Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV Data</CardTitle>
              <CardDescription>
                Upload your CSV file containing landowner records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Project Selection</Label>
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

              <div className="space-y-2">
                <Label>CSV File Upload</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCSVUpload(file);
                    }}
                    className="hidden"
                    id="csv-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('csv-upload')?.click()}
                  >
                    Choose File
                  </Button>
                </div>
              </div>

              {csvFile && (
                <div className="space-y-2">
                  <Label>Uploaded File</Label>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{csvFile.name}</span>
                    <Badge variant="secondary">{csvData.length} records</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Field Mapping Tab */}
        <TabsContent value="mapping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Field Mapping Configuration</CardTitle>
              <CardDescription>
                Map CSV columns to notice template variables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Variable</TableHead>
                    <TableHead>CSV Field</TableHead>
                    <TableHead>Data Type</TableHead>
                    <TableHead>Required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fieldMappings.map((mapping, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {mapping.templateVariable}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping.csvField}
                          onValueChange={(value) => handleFieldMappingUpdate(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select CSV field" />
                          </SelectTrigger>
                          <SelectContent>
                            {csvHeaders.map(header => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{mapping.dataType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Checkbox checked={mapping.isRequired} disabled />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Template Selection Tab */}
        <TabsContent value="template" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notice Template Selection</CardTitle>
              <CardDescription>
                Choose a notice template and configure language settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Language Selection</Label>
                <div className="flex gap-2">
                  {['marathi', 'hindi', 'english'].map(lang => (
                    <Button
                      key={lang}
                      variant={currentLanguage === lang ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentLanguage(lang as any)}
                    >
                      <Languages className="h-4 w-4 mr-2" />
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select Template</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a notice template" />
                  </SelectTrigger>
                  <SelectContent>
                    {demoTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (
                <div className="space-y-2">
                  <Label>Template Preview</Label>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">
                      {demoTemplates.find(t => t.id === selectedTemplate)?.content}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generate Notices Tab */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Notices</CardTitle>
              <CardDescription>
                Select records and generate personalized notices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isGenerating && (
                <div className="space-y-2">
                  <Label>Generating Notices...</Label>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={generateNotices} 
                  disabled={selectedRecords.length === 0 || isGenerating}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Notices ({selectedRecords.length})
                </Button>
              </div>

                             {/* Field Agent Management */}
               <Card>
                 <CardHeader>
                   <CardTitle className="text-lg">Field Agent Management</CardTitle>
                   <CardDescription>
                     Manage field agents for notice delivery and follow-up
                   </CardDescription>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setShowAddAgentDialog(true)}
                     className="mt-2"
                   >
                     <User className="h-4 w-4 mr-2" />
                     Add New Agent
                   </Button>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {[...demoFieldAgents, ...fieldAgents].map(agent => {
                         const stats = getAgentStats(agent.id);
                         const assignedNotices = getAssignedNotices(agent.id);
                         
                         return (
                           <div key={agent.id} className="border rounded-lg p-4">
                             <div className="flex items-center justify-between mb-3">
                               <div>
                                 <h4 className="font-medium">{agent.name}</h4>
                                 <p className="text-sm text-gray-600">{agent.phone}</p>
                                 <p className="text-xs text-gray-500">Area: {agent.area}</p>
                               </div>
                               <Badge variant="outline">Active</Badge>
                             </div>
                             
                             {/* Agent Statistics */}
                             <div className="grid grid-cols-2 gap-2 mb-3">
                               <div className="text-center p-2 bg-blue-50 rounded">
                                 <div className="text-lg font-bold text-blue-600">{stats.totalAssigned}</div>
                                 <div className="text-xs text-blue-500">Total Assigned</div>
                               </div>
                               <div className="text-center p-2 bg-yellow-50 rounded">
                                 <div className="text-lg font-bold text-yellow-600">{stats.pendingDelivery}</div>
                                 <div className="text-xs text-yellow-500">Pending</div>
                               </div>
                             </div>
                             
                             {/* Recent Assigned Notices */}
                             {assignedNotices.length > 0 && (
                               <div className="space-y-2">
                                 <p className="text-xs font-medium text-gray-600">Recent Assignments:</p>
                                 <div className="space-y-1">
                                   {assignedNotices.slice(0, 3).map(notice => (
                                     <div key={notice.id} className="flex items-center justify-between text-xs p-1 bg-gray-50 rounded">
                                       <span className="truncate">{notice.noticeNumber}</span>
                                       <Badge variant="outline" className="text-xs">
                                         {notice.status}
                                       </Badge>
                                     </div>
                                   ))}
                                   {assignedNotices.length > 3 && (
                                     <p className="text-xs text-gray-500 text-center">
                                       +{assignedNotices.length - 3} more
                                     </p>
                                   )}
                                 </div>
                               </div>
                             )}
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 </CardContent>
               </Card>

              {csvData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Select Records</Label>
                    <Checkbox
                      checked={selectedRecords.length === csvData.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Survey No</TableHead>
                          <TableHead>Owner Name</TableHead>
                          <TableHead>Village</TableHead>
                          <TableHead>Area</TableHead>
                          <TableHead>Compensation</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedRecords.includes(record.id)}
                                onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {record[fieldMappings.find(m => m.templateVariable === 'SURVEY_NUMBER')?.csvField || 'स.नं./हि.नं./ग.नं.']}
                            </TableCell>
                            <TableCell>
                              {renderOwners(record[fieldMappings.find(m => m.templateVariable === 'OWNER_NAME')?.csvField || 'खातेदाराचे नांव'])}
                            </TableCell>
                            <TableCell>
                              {record[fieldMappings.find(m => m.templateVariable === 'VILLAGE')?.csvField || 'गांव']}
                            </TableCell>
                            <TableCell>
                              {record[fieldMappings.find(m => m.templateVariable === 'AREA')?.csvField || 'नमुना_7_12_नुसार_जमिनीचे_क्षेत्र']}
                            </TableCell>
                            <TableCell>
                              <Badge>
                                ₹{(parseFloat(record[fieldMappings.find(m => m.templateVariable === 'FINAL_AMOUNT')?.csvField || 'अंतिम_रक्कम']) / 100000).toFixed(1)}L
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => previewNotice(record.id)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Notices</CardTitle>
              <CardDescription>
                View and manage generated notices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedNotices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Notice Number</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Agent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generatedNotices.map((notice) => (
                      <TableRow key={notice.id}>
                        <TableCell className="font-medium">{notice.noticeNumber}</TableCell>
                        <TableCell>{notice.landownerId}</TableCell>
                        <TableCell>{notice.noticeDate.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={
                            notice.status === 'generated' ? 'bg-green-100 text-green-800' :
                            notice.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                            notice.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {notice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {notice.assignedAgent ? (
                            <div className="space-y-1">
                              <span className="text-sm font-medium">{notice.assignedAgent.name}</span>
                              <span className="text-xs text-gray-500">{notice.assignedAgent.phone}</span>
                              <span className="text-xs text-gray-400">{notice.assignedAgent.area}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadNotice(notice)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => printNotice(notice)}
                            >
                              <Printer className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => issueNotice(notice.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Issue Notice
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No notices generated yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issued Notice List Tab */}
        <TabsContent value="issued" className="space-y-4">
          <Card>
                         <CardHeader>
               <CardTitle>Issued Notice List</CardTitle>
               <CardDescription>
                 View and manage all issued notices with field agent assignments
               </CardDescription>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={createDemoNotices}
                 className="mt-2"
               >
                 <FileText className="h-4 w-4 mr-2" />
                 Create Demo Notices
               </Button>
             </CardHeader>
            <CardContent>
              {issuedNotices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Notice Number</TableHead>
                      <TableHead>Landowner</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Agent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issuedNotices.map((notice) => (
                      <TableRow key={notice.id}>
                        <TableCell className="font-medium">{notice.noticeNumber}</TableCell>
                        <TableCell>{notice.landownerId}</TableCell>
                        <TableCell>{notice.issuedDate?.toLocaleDateString() || notice.noticeDate.toLocaleDateString()}</TableCell>
                                                 <TableCell>
                           <Badge className={
                             notice.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                             notice.status === 'delivered' ? 'bg-yellow-100 text-yellow-800' :
                             notice.status === 'completed' ? 'bg-green-100 text-green-800' :
                             notice.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                             'bg-gray-100 text-gray-800'
                           }>
                             {notice.status}
                           </Badge>
                         </TableCell>
                                                 <TableCell>
                           {notice.assignedAgent ? (
                             <div className="space-y-1">
                               <span className="text-sm font-medium">{notice.assignedAgent.name}</span>
                               <span className="text-xs text-gray-500">{notice.assignedAgent.phone}</span>
                               <span className="text-xs text-gray-400">{notice.assignedAgent.area}</span>
                               <div className="flex gap-1">
                                 {notice.status === 'issued' && (
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={() => updateNoticeStatus(notice.id, 'delivered')}
                                     className="text-xs h-6"
                                   >
                                     Mark Delivered
                                   </Button>
                                 )}
                                 {notice.status === 'delivered' && (
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={() => updateNoticeStatus(notice.id, 'completed')}
                                     className="text-xs h-6"
                                   >
                                     Mark Completed
                                   </Button>
                                 )}
                               </div>
                             </div>
                           ) : (
                             <Select
                               value={selectedAgent}
                               onValueChange={(value) => {
                                 setSelectedAgent(value);
                                 assignFieldAgent(notice.id, value);
                               }}
                               disabled={isAssigningAgent}
                             >
                               <SelectTrigger className="w-32">
                                 <SelectValue placeholder="Assign" />
                               </SelectTrigger>
                               <SelectContent>
                                 {fieldAgents.map(agent => (
                                   <SelectItem key={agent.id} value={agent.id}>
                                     {agent.name}
                                   </SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                           )}
                         </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadNotice(notice)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => printNotice(notice)}
                            >
                              <Printer className="h-3 w-3" />
                            </Button>
                            {!notice.assignedAgent && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => previewNotice(notice.landownerId)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No issued notices found</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Generate and issue notices to see them here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {errors.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notice Preview</DialogTitle>
            <DialogDescription>
              Preview of the generated notice
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {previewContent.replace(/\[OWNER_NAME\]/g, (match) => {
                  const owners = csvData.find(r => r.id === selectedRecords[0])?.[fieldMappings.find(m => m.templateVariable === 'OWNER_NAME')?.csvField || 'खातेदाराचे नांव'] || '';
                  return owners.split('/').map(o => o.trim()).join('\n');
                })}
              </pre>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => {
                const blob = new Blob([previewContent], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'notice-preview.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}>
                <Download className="h-4 w-4 mr-2" />
                Download Preview
              </Button>
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Field Agent Dialog */}
      <Dialog open={showAddAgentDialog} onOpenChange={setShowAddAgentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Field Agent</DialogTitle>
            <DialogDescription>
              Add a new field agent for notice delivery and follow-up
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Agent Name</Label>
              <Input
                placeholder="Enter agent name"
                value={newAgentData.name}
                onChange={(e) => setNewAgentData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                placeholder="Enter phone number"
                value={newAgentData.phone}
                onChange={(e) => setNewAgentData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Area</Label>
              <Input
                placeholder="Enter assigned area"
                value={newAgentData.area}
                onChange={(e) => setNewAgentData(prev => ({ ...prev, area: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (newAgentData.name && newAgentData.phone && newAgentData.area) {
                    addFieldAgent(newAgentData);
                    setNewAgentData({ name: '', phone: '', area: '' });
                    setShowAddAgentDialog(false);
                  } else {
                    toast.error('Please fill all fields');
                  }
                }}
                className="flex-1"
              >
                Add Agent
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setNewAgentData({ name: '', phone: '', area: '' });
                  setShowAddAgentDialog(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedNoticeGenerator; 