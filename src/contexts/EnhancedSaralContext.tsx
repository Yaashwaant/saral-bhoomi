import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import {
  NoticeTemplate,
  GeneratedNotice,
  RequiredDocument,
  UploadedDocument,
  AgentAssignment,
  PaymentRecord,
  CSVFieldMapping,
  NoticeGenerationConfig,
  EnhancedLandownerRecord,
  SystemConfig,
  NoticeGenerationResult,
  NoticeGenerationError
} from '@/types/notice';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Default system configuration
const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  defaultLanguage: 'marathi',
  supportedLanguages: ['marathi', 'hindi', 'english'],
  noticeNumberPrefix: 'NOTICE',
  autoGenerateNoticeNumbers: true,
  requireAgentVerification: true,
  requireOfficerApproval: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
  paymentRetryAttempts: 3,
  noticeDeliveryTimeout: 7 // 7 days
};

// Default required documents for land acquisition
const DEFAULT_REQUIRED_DOCUMENTS: RequiredDocument[] = [
  {
    id: '1',
    projectId: '',
    name: '7/12 Extract',
    nameMarathi: '७/१२ उतारा',
    nameHindi: '७/१२ उतारा',
    nameEnglish: '7/12 Extract',
    isRequired: true,
    order: 1,
    description: 'Updated 7/12 extract of the concerned land',
    descriptionMarathi: 'संबंधित जमिनीचा अद्यायावत ७/१२ उतारा',
    descriptionHindi: 'संबंधित जमिनीचा अद्यायावत ७/१२ उतारा',
    descriptionEnglish: 'Updated 7/12 extract of the concerned land',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    projectId: '',
    name: 'Identity Proof',
    nameMarathi: 'ओळखपत्र',
    nameHindi: 'पहचान प्रमाण',
    nameEnglish: 'Identity Proof',
    isRequired: true,
    order: 2,
    description: 'Ration Card/Voter ID/Aadhaar Card, PAN Card, Driving License etc.',
    descriptionMarathi: 'रेशन कार्ड/निवडणूक ओळखपत्र/आधारकार्ड, पॅनकार्ड, ड्रायव्हींग लायसन्स इ.',
    descriptionHindi: 'राशन कार्ड/मतदान आईडी/आधार कार्ड, पैन कार्ड, ड्राइविंग लाइसेंस आदि',
    descriptionEnglish: 'Ration Card/Voter ID/Aadhaar Card, PAN Card, Driving License etc.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    projectId: '',
    name: 'No Objection Certificate',
    nameMarathi: 'नाहरकत दाखला',
    nameHindi: 'आपत्ति प्रमाणपत्र',
    nameEnglish: 'No Objection Certificate',
    isRequired: false,
    order: 3,
    description: 'If there is encumbrance on 7/12',
    descriptionMarathi: '७/१२ वर बोजा असल्यास बोजा कमी केल्याचा फेरफार',
    descriptionHindi: 'यदि ७/१२ पर कोई बोझ है',
    descriptionEnglish: 'If there is encumbrance on 7/12',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    projectId: '',
    name: 'Bank Passbook',
    nameMarathi: 'बँक पासबुक',
    nameHindi: 'बैंक पासबुक',
    nameEnglish: 'Bank Passbook',
    isRequired: true,
    order: 4,
    description: 'Original and photocopy of nationalized bank passbook',
    descriptionMarathi: 'राष्ट्रीयकृत बँक पासबुक मूळ प्रत व छायांकित प्रत',
    descriptionHindi: 'राष्ट्रीयकृत बैंक पासबुक की मूल प्रति और फोटोकॉपी',
    descriptionEnglish: 'Original and photocopy of nationalized bank passbook',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    projectId: '',
    name: 'Photographs',
    nameMarathi: 'फोटो',
    nameHindi: 'फोटो',
    nameEnglish: 'Photographs',
    isRequired: true,
    order: 5,
    description: 'Two photographs each',
    descriptionMarathi: 'प्रत्येकी दोन फोटो',
    descriptionHindi: 'प्रत्येक के दो फोटो',
    descriptionEnglish: 'Two photographs each',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '6',
    projectId: '',
    name: 'Power of Attorney',
    nameMarathi: 'कुळमुखत्यारपत्र',
    nameHindi: 'वकीलनामा',
    nameEnglish: 'Power of Attorney',
    isRequired: false,
    order: 6,
    description: 'If receiving consolidated compensation in sole name',
    descriptionMarathi: 'ज्या खातेदारांना नुकसान भरपाई ची एकत्रित रक्कम एकट्याचे नांवे घेण्याची आहे',
    descriptionHindi: 'यदि एकमात्र नाम में समेकित मुआवजा प्राप्त कर रहे हैं',
    descriptionEnglish: 'If receiving consolidated compensation in sole name',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '7',
    projectId: '',
    name: 'Consent Letter',
    nameMarathi: 'संमतीपत्र',
    nameHindi: 'सहमति पत्र',
    nameEnglish: 'Consent Letter',
    isRequired: false,
    order: 7,
    description: 'If receiving compensation on behalf of other account holders',
    descriptionMarathi: 'ज्या खातेदाराला इतर खातेदारांच्या वतीने नुकसान भरपाईची रक्कम स्विकारावयाची आहे',
    descriptionHindi: 'यदि अन्य खाताधारकों की ओर से मुआवजा प्राप्त कर रहे हैं',
    descriptionEnglish: 'If receiving compensation on behalf of other account holders',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '8',
    projectId: '',
    name: 'Heirship Proof',
    nameMarathi: 'वारस हक्काचा पुरावा',
    nameHindi: 'उत्तराधिकार प्रमाण',
    nameEnglish: 'Heirship Proof',
    isRequired: false,
    order: 8,
    description: 'If the account holder is deceased',
    descriptionMarathi: 'खातेदार मयत असल्याने वारस हक्काचा पुरावा',
    descriptionHindi: 'यदि खाताधारक मृत है',
    descriptionEnglish: 'If the account holder is deceased',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '9',
    projectId: '',
    name: 'Guardian Certificate',
    nameMarathi: 'पालन पोषण दाखला',
    nameHindi: 'अभिभावक प्रमाणपत्र',
    nameEnglish: 'Guardian Certificate',
    isRequired: false,
    order: 9,
    description: 'If the account holder is below 18 years',
    descriptionMarathi: 'सदर खातेदार १८ वर्षाआतील असल्यास, पालन पोषण करणा-याचे नाव',
    descriptionHindi: 'यदि खाताधारक १८ वर्ष से कमजोर है',
    descriptionEnglish: 'If the account holder is below 18 years',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '10',
    projectId: '',
    name: 'Non-Agricultural Order',
    nameMarathi: 'बिनशेती आदेश',
    nameHindi: 'गैर-कृषि आदेश',
    nameEnglish: 'Non-Agricultural Order',
    isRequired: false,
    order: 10,
    description: 'For non-agricultural plot holders',
    descriptionMarathi: 'बिनशेती प्लॉटधारकांनी बिनशेती आदेश व मंजुरी नकाशा',
    descriptionHindi: 'गैर-कृषि प्लॉट धारकों के लिए',
    descriptionEnglish: 'For non-agricultural plot holders',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '11',
    projectId: '',
    name: 'Approved Map',
    nameMarathi: 'मंजुरी नकाशा',
    nameHindi: 'अनुमोदित नक्शा',
    nameEnglish: 'Approved Map',
    isRequired: false,
    order: 11,
    description: 'For non-agricultural plot holders',
    descriptionMarathi: 'बिनशेती प्लॉटधारकांनी बिनशेती आदेश व मंजुरी नकाशा',
    descriptionHindi: 'गैर-कृषि प्लॉट धारकों के लिए',
    descriptionEnglish: 'For non-agricultural plot holders',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '12',
    projectId: '',
    name: 'Land Vesting Declaration',
    nameMarathi: 'जमिन संपादित घोषणा',
    nameHindi: 'भूमि अधिग्रहण घोषणा',
    nameEnglish: 'Land Vesting Declaration',
    isRequired: true,
    order: 12,
    description: 'Declaration that land will vest with acquiring body after compensation',
    descriptionMarathi: 'जमिन ३८ नुसार नुकसान भरपाई स्विकारल्यावर तात्काळ जमिन संपादित संस्थेच्या नियत होईल',
    descriptionHindi: 'मुआवजा के बाद भूमि अधिग्रहण संस्था के पास जाएगी',
    descriptionEnglish: 'Declaration that land will vest with acquiring body after compensation',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

interface EnhancedSaralContextType {
  // System Configuration
  systemConfig: SystemConfig;
  updateSystemConfig: (config: Partial<SystemConfig>) => void;
  
  // Notice Templates
  noticeTemplates: NoticeTemplate[];
  createNoticeTemplate: (template: Omit<NoticeTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateNoticeTemplate: (id: string, template: Partial<NoticeTemplate>) => Promise<boolean>;
  deleteNoticeTemplate: (id: string) => Promise<boolean>;
  getNoticeTemplate: (id: string) => NoticeTemplate | undefined;
  
  // Generated Notices
  generatedNotices: GeneratedNotice[];
  generateNotices: (config: NoticeGenerationConfig, recordIds: string[]) => Promise<NoticeGenerationResult>;
  issueNotices: (noticeIds: string[]) => Promise<boolean>;
  getNoticesByProject: (projectId: string) => GeneratedNotice[];
  
  // Required Documents
  requiredDocuments: RequiredDocument[];
  addRequiredDocument: (document: Omit<RequiredDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateRequiredDocument: (id: string, document: Partial<RequiredDocument>) => Promise<boolean>;
  removeRequiredDocument: (id: string) => Promise<boolean>;
  getRequiredDocumentsByProject: (projectId: string) => RequiredDocument[];
  
  // Uploaded Documents
  uploadedDocuments: UploadedDocument[];
  uploadDocument: (landownerId: string, documentTypeId: string, file: File) => Promise<boolean>;
  verifyDocument: (documentId: string, verified: boolean, notes?: string) => Promise<boolean>;
  getUploadedDocumentsByLandowner: (landownerId: string) => UploadedDocument[];
  
  // Agent Assignments
  agentAssignments: AgentAssignment[];
  assignAgent: (landownerId: string, agentId: string) => Promise<boolean>;
  updateAssignmentStatus: (assignmentId: string, status: AgentAssignment['status']) => Promise<boolean>;
  getAssignmentsByAgent: (agentId: string) => AgentAssignment[];
  
  // Payment Records
  paymentRecords: PaymentRecord[];
  initiatePayment: (landownerId: string, bankDetails: PaymentRecord['bankDetails']) => Promise<boolean>;
  getPaymentStatus: (landownerId: string) => PaymentRecord | undefined;
  retryPayment: (paymentId: string) => Promise<boolean>;
  
  // Enhanced Landowner Records
  enhancedLandownerRecords: EnhancedLandownerRecord[];
  uploadCSVWithMapping: (projectId: string, file: File, mappings: CSVFieldMapping[]) => Promise<boolean>;
  updateEnhancedLandownerRecord: (id: string, updates: Partial<EnhancedLandownerRecord>) => Promise<boolean>;
  getEnhancedLandownerRecordsByProject: (projectId: string) => EnhancedLandownerRecord[];
  
  // Language Support
  currentLanguage: 'marathi' | 'hindi' | 'english';
  setLanguage: (language: 'marathi' | 'hindi' | 'english') => void;
  getLocalizedText: (texts: { marathi: string; hindi: string; english: string }) => string;
  
  // Loading and Error States
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

const EnhancedSaralContext = createContext<EnhancedSaralContextType | undefined>(undefined);

export const useEnhancedSaral = () => {
  const context = useContext(EnhancedSaralContext);
  if (!context) {
    throw new Error('useEnhancedSaral must be used within an EnhancedSaralProvider');
  }
  return context;
};

interface EnhancedSaralProviderProps {
  children: ReactNode;
}

export const EnhancedSaralProvider: React.FC<EnhancedSaralProviderProps> = ({ children }) => {
  // State management
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [noticeTemplates, setNoticeTemplates] = useState<NoticeTemplate[]>([]);
  const [generatedNotices, setGeneratedNotices] = useState<GeneratedNotice[]>([]);
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>(DEFAULT_REQUIRED_DOCUMENTS);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [agentAssignments, setAgentAssignments] = useState<AgentAssignment[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [enhancedLandownerRecords, setEnhancedLandownerRecords] = useState<EnhancedLandownerRecord[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<'marathi' | 'hindi' | 'english'>('marathi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API call helper
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // System Configuration
  const updateSystemConfig = (config: Partial<SystemConfig>) => {
    setSystemConfig(prev => ({ ...prev, ...config }));
  };

  // Notice Templates
  const createNoticeTemplate = async (template: Omit<NoticeTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      
      const newTemplate: NoticeTemplate = {
        ...template,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setNoticeTemplates(prev => [...prev, newTemplate]);
      toast.success('Notice template created successfully');
      return newTemplate.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create notice template';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateNoticeTemplate = async (id: string, template: Partial<NoticeTemplate>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      setNoticeTemplates(prev => prev.map(t => 
        t.id === id 
          ? { ...t, ...template, updatedAt: new Date() }
          : t
      ));
      
      toast.success('Notice template updated successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update notice template';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteNoticeTemplate = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      setNoticeTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Notice template deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete notice template';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getNoticeTemplate = (id: string): NoticeTemplate | undefined => {
    return noticeTemplates.find(t => t.id === id);
  };

  // Notice Generation
  const generateNotices = async (config: NoticeGenerationConfig, recordIds: string[]): Promise<NoticeGenerationResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const template = getNoticeTemplate(config.templateId);
      if (!template) {
        throw new Error('Notice template not found');
      }
      
      const records = enhancedLandownerRecords.filter(r => recordIds.includes(r.id));
      const newNotices: GeneratedNotice[] = [];
      const errors: NoticeGenerationError[] = [];
      
      for (const record of records) {
        try {
          // Generate notice content by replacing variables
          let content = template.content;
          
          // Replace variables with record data
          config.fieldMappings.forEach(mapping => {
            const value = record[mapping.csvField as keyof EnhancedLandownerRecord];
            if (value !== undefined) {
              content = content.replace(new RegExp(`\\[${mapping.templateVariable}\\]`, 'g'), String(value));
            }
          });
          
          // Generate notice number
          const noticeNumber = `${systemConfig.noticeNumberPrefix}-${Date.now()}-${record.id}`;
          
          const notice: GeneratedNotice = {
            id: Date.now().toString() + record.id,
            landownerId: record.id,
            projectId: record.projectId,
            templateId: config.templateId,
            noticeNumber,
            noticeDate: new Date(),
            content,
            status: 'generated',
            issuedBy: 'current-user',
            deliveryStatus: 'pending'
          };
          
          newNotices.push(notice);
          
          // Update record status
          setEnhancedLandownerRecords(prev => prev.map(r => 
            r.id === record.id 
              ? { ...r, noticeStatus: 'generated', noticeNumber, noticeGeneratedAt: new Date() }
              : r
          ));
          
        } catch (error) {
          errors.push({
            code: 'NOTICE_GENERATION_FAILED',
            message: 'Failed to generate notice',
            messageMarathi: 'नोटीस तयार करण्यात अयशस्वी',
            messageHindi: 'नोटिस जनरेट करने में असफल',
            messageEnglish: 'Failed to generate notice',
            recordId: record.id
          });
        }
      }
      
      setGeneratedNotices(prev => [...prev, ...newNotices]);
      
      return {
        success: errors.length === 0,
        noticesGenerated: newNotices.length,
        noticesFailed: errors.length,
        errors,
        generatedNotices: newNotices
      };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate notices';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const issueNotices = async (noticeIds: string[]): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      setGeneratedNotices(prev => prev.map(notice => 
        noticeIds.includes(notice.id)
          ? { ...notice, status: 'issued', issuedAt: new Date() }
          : notice
      ));
      
      // Update landowner records
      setEnhancedLandownerRecords(prev => prev.map(record => {
        const notice = generatedNotices.find(n => n.landownerId === record.id && noticeIds.includes(n.id));
        return notice 
          ? { ...record, noticeStatus: 'issued', noticeIssuedAt: new Date() }
          : record;
      }));
      
      toast.success(`${noticeIds.length} notices issued successfully`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to issue notices';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getNoticesByProject = (projectId: string): GeneratedNotice[] => {
    return generatedNotices.filter(n => n.projectId === projectId);
  };

  // Required Documents
  const addRequiredDocument = async (document: Omit<RequiredDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      
      const newDocument: RequiredDocument = {
        ...document,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setRequiredDocuments(prev => [...prev, newDocument]);
      toast.success('Required document added successfully');
      return newDocument.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add required document';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRequiredDocument = async (id: string, document: Partial<RequiredDocument>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      setRequiredDocuments(prev => prev.map(d => 
        d.id === id 
          ? { ...d, ...document, updatedAt: new Date() }
          : d
      ));
      
      toast.success('Required document updated successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update required document';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeRequiredDocument = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      setRequiredDocuments(prev => prev.filter(d => d.id !== id));
      toast.success('Required document removed successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove required document';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getRequiredDocumentsByProject = (projectId: string): RequiredDocument[] => {
    return requiredDocuments.filter(d => d.projectId === projectId || d.projectId === '');
  };

  // Uploaded Documents
  const uploadDocument = async (landownerId: string, documentTypeId: string, file: File): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate file size
      if (file.size > systemConfig.maxFileSize) {
        throw new Error(`File size exceeds maximum limit of ${systemConfig.maxFileSize / (1024 * 1024)}MB`);
      }
      
      // Validate file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!systemConfig.allowedFileTypes.some(type => type.includes(fileExtension || ''))) {
        throw new Error('File type not allowed');
      }
      
      const newDocument: UploadedDocument = {
        id: Date.now().toString(),
        landownerId,
        documentTypeId,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size,
        uploadedAt: new Date(),
        uploadedBy: 'current-user',
        verified: false,
        status: 'pending'
      };
      
      setUploadedDocuments(prev => [...prev, newDocument]);
      
      // Update landowner record
      setEnhancedLandownerRecords(prev => prev.map(r => 
        r.id === landownerId 
          ? { ...r, documentsUploaded: r.documentsUploaded + 1 }
          : r
      ));
      
      toast.success('Document uploaded successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload document';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyDocument = async (documentId: string, verified: boolean, notes?: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      setUploadedDocuments(prev => prev.map(d => 
        d.id === documentId 
          ? { 
              ...d, 
              verified, 
              verifiedAt: new Date(), 
              verifiedBy: 'current-user',
              verificationNotes: notes,
              status: verified ? 'approved' : 'rejected'
            }
          : d
      ));
      
      toast.success(`Document ${verified ? 'approved' : 'rejected'} successfully`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify document';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getUploadedDocumentsByLandowner = (landownerId: string): UploadedDocument[] => {
    return uploadedDocuments.filter(d => d.landownerId === landownerId);
  };

  // Agent Assignments
  const assignAgent = async (landownerId: string, agentId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const assignment: AgentAssignment = {
        id: Date.now().toString(),
        landownerId,
        agentId,
        projectId: enhancedLandownerRecords.find(r => r.id === landownerId)?.projectId || '',
        assignedAt: new Date(),
        assignedBy: 'current-user',
        status: 'assigned'
      };
      
      setAgentAssignments(prev => [...prev, assignment]);
      
      // Update landowner record
      setEnhancedLandownerRecords(prev => prev.map(r => 
        r.id === landownerId 
          ? { ...r, assignedAgent: agentId, assignedAt: new Date() }
          : r
      ));
      
      toast.success('Agent assigned successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign agent';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateAssignmentStatus = async (assignmentId: string, status: AgentAssignment['status']): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      setAgentAssignments(prev => prev.map(a => 
        a.id === assignmentId 
          ? { ...a, status, completedAt: status === 'completed' ? new Date() : undefined }
          : a
      ));
      
      toast.success('Assignment status updated successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update assignment status';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentsByAgent = (agentId: string): AgentAssignment[] => {
    return agentAssignments.filter(a => a.agentId === agentId);
  };

  // Payment Records
  const initiatePayment = async (landownerId: string, bankDetails: PaymentRecord['bankDetails']): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const record = enhancedLandownerRecords.find(r => r.id === landownerId);
      if (!record) {
        throw new Error('Landowner record not found');
      }
      
      const payment: PaymentRecord = {
        id: Date.now().toString(),
        landownerId,
        projectId: record.projectId,
        amount: record.finalAmount,
        bankDetails,
        status: 'initiated',
        initiatedAt: new Date(),
        initiatedBy: 'current-user'
      };
      
      setPaymentRecords(prev => [...prev, payment]);
      
      // Update landowner record
      setEnhancedLandownerRecords(prev => prev.map(r => 
        r.id === landownerId 
          ? { ...r, paymentStatus: 'initiated', paymentInitiatedAt: new Date() }
          : r
      ));
      
      // Simulate payment processing
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate
        
        setPaymentRecords(prev => prev.map(p => 
          p.id === payment.id 
            ? { 
                ...p, 
                status: success ? 'success' : 'failed',
                processedAt: new Date(),
                transactionId: success ? `TXN${Date.now()}` : undefined,
                utrNumber: success ? `UTR${Date.now()}` : undefined,
                failureReason: success ? undefined : 'Bank server temporarily unavailable'
              }
            : p
        ));
        
        setEnhancedLandownerRecords(prev => prev.map(r => 
          r.id === landownerId 
            ? { 
                ...r, 
                paymentStatus: success ? 'success' : 'failed',
                paymentProcessedAt: new Date(),
                transactionId: success ? `TXN${Date.now()}` : undefined,
                utrNumber: success ? `UTR${Date.now()}` : undefined
              }
            : r
        ));
        
        toast.success(success ? 'Payment processed successfully' : 'Payment failed');
      }, 2000);
      
      toast.success('Payment initiated successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate payment';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatus = (landownerId: string): PaymentRecord | undefined => {
    return paymentRecords.find(p => p.landownerId === landownerId);
  };

  const retryPayment = async (paymentId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const payment = paymentRecords.find(p => p.id === paymentId);
      if (!payment) {
        throw new Error('Payment record not found');
      }
      
      // Reset payment status
      setPaymentRecords(prev => prev.map(p => 
        p.id === paymentId 
          ? { ...p, status: 'initiated', initiatedAt: new Date() }
          : p
      ));
      
      // Retry payment
      return await initiatePayment(payment.landownerId, payment.bankDetails);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry payment';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Enhanced Landowner Records
  const uploadCSVWithMapping = async (projectId: string, file: File, mappings: CSVFieldMapping[]): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Parse CSV file
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const records: EnhancedLandownerRecord[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        const record: any = {};
        
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        
        // Map CSV fields to record structure
        const mappedRecord: EnhancedLandownerRecord = {
          id: Date.now().toString() + i,
          projectId,
          surveyNumber: record[mappings.find(m => m.templateVariable === 'SURVEY_NUMBER')?.csvField || 'सर्वे_नं'] || '',
          landownerName: record[mappings.find(m => m.templateVariable === 'OWNER_NAME')?.csvField || 'खातेदाराचे_नांव'] || '',
          area: parseFloat(record[mappings.find(m => m.templateVariable === 'AREA')?.csvField || 'क्षेत्र']) || 0,
          acquiredArea: parseFloat(record[mappings.find(m => m.templateVariable === 'ACQUIRED_AREA')?.csvField || 'संपादित_क्षेत्र']) || 0,
          rate: parseFloat(record[mappings.find(m => m.templateVariable === 'RATE')?.csvField || 'दर']) || 0,
          compensationAmount: parseFloat(record[mappings.find(m => m.templateVariable === 'COMPENSATION_AMOUNT')?.csvField || 'एकूण_मोबदला']) || 0,
          solatium: parseFloat(record[mappings.find(m => m.templateVariable === 'SOLATIUM')?.csvField || 'सोलेशियम_100']) || 0,
          finalAmount: parseFloat(record[mappings.find(m => m.templateVariable === 'FINAL_AMOUNT')?.csvField || 'अंतिम_रक्कम']) || 0,
          village: record[mappings.find(m => m.templateVariable === 'VILLAGE')?.csvField || 'village'] || '',
          taluka: record[mappings.find(m => m.templateVariable === 'TALUKA')?.csvField || 'taluka'] || '',
          district: record[mappings.find(m => m.templateVariable === 'DISTRICT')?.csvField || 'district'] || '',
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
        
        records.push(mappedRecord);
      }
      
      setEnhancedLandownerRecords(prev => [...prev, ...records]);
      toast.success(`${records.length} records uploaded successfully`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload CSV';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateEnhancedLandownerRecord = async (id: string, updates: Partial<EnhancedLandownerRecord>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      setEnhancedLandownerRecords(prev => prev.map(r => 
        r.id === id 
          ? { ...r, ...updates, updatedAt: new Date() }
          : r
      ));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update record';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getEnhancedLandownerRecordsByProject = (projectId: string): EnhancedLandownerRecord[] => {
    return enhancedLandownerRecords.filter(r => r.projectId === projectId);
  };

  // Language Support
  const setLanguage = (language: 'marathi' | 'hindi' | 'english') => {
    setCurrentLanguage(language);
  };

  const getLocalizedText = (texts: { marathi: string; hindi: string; english: string }): string => {
    return texts[currentLanguage] || texts.english;
  };

  // Error handling
  const clearError = () => {
    setError(null);
  };

  const value: EnhancedSaralContextType = {
    systemConfig,
    updateSystemConfig,
    noticeTemplates,
    createNoticeTemplate,
    updateNoticeTemplate,
    deleteNoticeTemplate,
    getNoticeTemplate,
    generatedNotices,
    generateNotices,
    issueNotices,
    getNoticesByProject,
    requiredDocuments,
    addRequiredDocument,
    updateRequiredDocument,
    removeRequiredDocument,
    getRequiredDocumentsByProject,
    uploadedDocuments,
    uploadDocument,
    verifyDocument,
    getUploadedDocumentsByLandowner,
    agentAssignments,
    assignAgent,
    updateAssignmentStatus,
    getAssignmentsByAgent,
    paymentRecords,
    initiatePayment,
    getPaymentStatus,
    retryPayment,
    enhancedLandownerRecords,
    uploadCSVWithMapping,
    updateEnhancedLandownerRecord,
    getEnhancedLandownerRecordsByProject,
    currentLanguage,
    setLanguage,
    getLocalizedText,
    loading,
    error,
    clearError
  };

  return (
    <EnhancedSaralContext.Provider value={value}>
      {children}
    </EnhancedSaralContext.Provider>
  );
}; 