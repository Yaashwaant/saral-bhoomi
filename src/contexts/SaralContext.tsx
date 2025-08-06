import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { demoLandownerRecords, demoProjects, createDemoCSVContent } from '@/utils/demo-data';

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Interfaces
export interface Project {
  id: string;
  projectName: string;
  pmisCode: string;
  schemeName: string;
  landRequired: number; // in hectares
  landAvailable: number;
  landToBeAcquired: number;
  type: 'greenfield' | 'brownfield';
  indexMap?: File;
  videoUrl?: string;
  status: {
    stage3A: 'pending' | 'approved' | 'rejected';
    stage3D: 'pending' | 'approved' | 'rejected';
    corrigendum: 'pending' | 'approved' | 'rejected';
    award: 'pending' | 'approved' | 'rejected';
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface LandownerRecord {
  id: string;
  _id?: string; // MongoDB ObjectId
  projectId: string;
  खातेदाराचे_नांव: string; // landowner_name
  सर्वे_नं: string; // survey_number
  क्षेत्र: string; // area (Ha.Ar)
  संपादित_क्षेत्र: string; // acquired_area (sq.m / Ha.Ar)
  दर: string; // rate (₹)
  संरचना_झाडे_विहिरी_रक्कम: string; // structures_amount
  एकूण_मोबदला: string; // compensation_amount
  सोलेशियम_100: string; // solatium
  अंतिम_रक्कम: string; // final_compensation
  village: string;
  taluka: string;
  district: string;
  noticeGenerated: boolean;
  noticeNumber?: string;
  noticeDate?: Date;
  noticeContent?: string;
  noticePdfUrl?: string;
  kycStatus: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  paymentStatus: 'pending' | 'initiated' | 'success' | 'failed';
  assignedAgent?: string;
  assignedAt?: Date;
  documentsUploaded: boolean;
  paymentInitiated?: boolean;
  transactionId?: string;
  utrNumber?: string;
  paymentDate?: Date;
}

export interface KYCDocument {
  id: string;
  landownerId: string;
  documentType: 'aadhaar' | 'pan' | 'voter_id' | '7_12_extract' | 'power_of_attorney' | 'bank_passbook' | 'photo';
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  uploadedBy: string;
  verified: boolean;
}

export interface NoticeHeader {
  id: string;
  fileName: string;
  fileUrl: string;
  version: number;
  isActive: boolean;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface VillageSummary {
  villageName: string;
  totalCompensation: number;
  totalSurveyNos: number;
  totalLandParties: number;
  totalArea: number;
  compensationPaid: number;
  paidSurveyNos: number;
  paidLandParties: number;
  paidArea: number;
  pendingCompensation: number;
  pendingSurveyNos: number;
  pendingLandParties: number;
  pendingArea: number;
}

interface SaralContextType {
  // Projects
  projects: Project[];
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateProject: (id: string, project: Partial<Project>) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  getProject: (id: string) => Project | undefined;
  
  // CSV & Landowner Records
  landownerRecords: LandownerRecord[];
  uploadCSV: (projectId: string, file: File) => Promise<boolean>;
  getLandownersByProject: (projectId: string) => LandownerRecord[];
  updateLandownerRecord: (id: string, updates: Partial<LandownerRecord>) => Promise<boolean>;
  
  // Notice Management
  noticeHeaders: NoticeHeader[];
  uploadNoticeHeader: (file: File) => Promise<boolean>;
  generateNotices: (projectId: string) => Promise<boolean>;
  
  // KYC Management
  kycDocuments: KYCDocument[];
  uploadKYCDocument: (landownerId: string, documentType: string, file: File) => Promise<boolean>;
  approveKYC: (landownerId: string) => Promise<boolean>;
  rejectKYC: (landownerId: string, reason: string) => Promise<boolean>;
  
  // Payment Management
  initiatePayment: (landownerId: string, bankDetails: {
    beneficiaryName: string;
    beneficiaryAccount: string;
    beneficiaryIFSC: string;
  }) => Promise<boolean>;
  getPaymentStatus: (landownerId: string) => string;
  processRTGSPayment: (landownerId: string, bankDetails: any) => Promise<any>;
  
  // Village Dashboard
  getVillageSummary: (projectId: string) => VillageSummary[];
  
  // Agent Assignment
  assignAgent: (landownerId: string, agentId: string) => Promise<boolean>;
  assignAgentWithNotice: (landownerId: string, agentId: string, noticeData: {
    noticeNumber: string;
    noticeDate: Date;
    noticeContent: string;
  }) => Promise<boolean>;
  getAssignedRecords: (agentId: string) => Promise<LandownerRecord[]>;
  getAssignedRecordsWithNotices: (agentId: string) => Promise<LandownerRecord[]>;
  
  // Statistics
  getProjectStats: () => {
    totalProjects: number;
    activeProjects: number;
    completedKYC: number;
    pendingPayments: number;
    totalCompensation: number;
  };
  
  // Loading states
  loading: boolean;
  error: string | null;
}

const SaralContext = createContext<SaralContextType | undefined>(undefined);

export const useSaral = () => {
  const context = useContext(SaralContext);
  if (context === undefined) {
    throw new Error('useSaral must be used within a SaralProvider');
  }
  return context;
};

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function for API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API call failed');
  }
  
  return response.json();
};

interface SaralProviderProps {
  children: ReactNode;
}

export const SaralProvider: React.FC<SaralProviderProps> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [landownerRecords, setLandownerRecords] = useState<LandownerRecord[]>([]);
  const [noticeHeaders, setNoticeHeaders] = useState<NoticeHeader[]>([]);
  const [kycDocuments, setKYCDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadProjects();
    loadLandownerRecords();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall('/projects');
      setProjects(response.data || []);
    } catch (err) {
      console.log('Using demo projects data');
      setProjects(demoProjects);
    } finally {
      setLoading(false);
    }
  };

  const loadLandownerRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the new landowners API endpoint
      const response = await apiCall('/landowners/list');
      console.log('Landowners API response:', response);
      
      if (response.success && response.records) {
        // Map MongoDB _id to frontend id for each record
        const mappedRecords = response.records.map((record: any) => ({
          ...record,
          id: record._id || record.id // Use MongoDB _id as the primary id
        }));
        
        setLandownerRecords(mappedRecords);
        console.log('Loaded landowner records:', mappedRecords);
      } else {
        console.log('No records from API, using demo data');
        setLandownerRecords(demoLandownerRecords);
      }
    } catch (err) {
      console.log('API failed, using demo landowner records data');
      setLandownerRecords(demoLandownerRecords);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall('/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
      });
      
      const newProject = response.data;
      setProjects(prev => [...prev, newProject]);
      return newProject.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (id: string, projectData: Partial<Project>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await apiCall(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(projectData),
      });
      
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...projectData } : p));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await apiCall(`/projects/${id}`, {
        method: 'DELETE',
      });
      
      setProjects(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getProject = (id: string): Project | undefined => {
    return projects.find(p => p.id === id);
  };

  const uploadCSV = async (projectId: string, file: File): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Parse CSV file content
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      const records: LandownerRecord[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',');
          const record: LandownerRecord = {
            id: Date.now().toString() + i,
            projectId,
            खातेदाराचे_नांव: values[0] || '',
            सर्वे_नं: values[1] || '',
            क्षेत्र: values[2] || '',
            संपादित_क्षेत्र: values[3] || '',
            दर: values[4] || '',
            संरचना_झाडे_विहिरी_रक्कम: values[5] || '',
            एकूण_मोबदला: values[6] || '',
            सोलेशियम_100: values[7] || '',
            अंतिम_रक्कम: values[8] || '',
            village: values[9] || '',
            taluka: values[10] || '',
            district: values[11] || '',
            noticeGenerated: false,
            kycStatus: 'pending',
            paymentStatus: 'pending',
            documentsUploaded: false,
            paymentInitiated: false
          };
          records.push(record);
        }
      }
      
      // Add new records to existing ones
      setLandownerRecords(prev => [...prev, ...records]);
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload CSV');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getLandownersByProject = (projectId: string): LandownerRecord[] => {
    return landownerRecords.filter(r => r.projectId === projectId);
  };

  const updateLandownerRecord = async (id: string, updates: Partial<LandownerRecord>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Update local state immediately for better UX
      setLandownerRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      
      // In a real implementation, you would call the API here
      // await apiCall(`/csv/record/${id}`, {
      //   method: 'PUT',
      //   body: JSON.stringify(updates),
      // });
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update record');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadNoticeHeader = async (file: File): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate file upload
      const newHeader: NoticeHeader = {
        id: Date.now().toString(),
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        version: 1,
        isActive: true,
        uploadedAt: new Date(),
        uploadedBy: 'current-user'
      };
      
      setNoticeHeaders(prev => [...prev, newHeader]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload notice header');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const generateNotices = async (projectId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Update records to mark notices as generated
      const projectRecords = landownerRecords.filter(r => r.projectId === projectId);
      const updatedRecords = projectRecords.map(r => ({
        ...r,
        noticeGenerated: true,
        noticeNumber: `NOTICE-${Date.now()}-${r.id}`,
        noticeDate: new Date()
      }));
      
      setLandownerRecords(prev => 
        prev.map(r => {
          const updated = updatedRecords.find(ur => ur.id === r.id);
          return updated || r;
        })
      );
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate notices');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadKYCDocument = async (landownerId: string, documentType: string, file: File): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const newDocument: KYCDocument = {
        id: Date.now().toString(),
        landownerId,
        documentType: documentType as any,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        uploadedAt: new Date(),
        uploadedBy: 'current-user',
        verified: false
      };
      
      setKYCDocuments(prev => [...prev, newDocument]);
      
      // Update landowner record KYC status
      setLandownerRecords(prev => prev.map(r => 
        r.id === landownerId 
          ? { ...r, kycStatus: 'completed' as const }
          : r
      ));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload KYC document');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const approveKYC = async (landownerId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      setLandownerRecords(prev => prev.map(r => 
        r.id === landownerId 
          ? { ...r, kycStatus: 'approved' as const }
          : r
      ));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve KYC');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const rejectKYC = async (landownerId: string, reason: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      setLandownerRecords(prev => prev.map(r => 
        r.id === landownerId 
          ? { ...r, kycStatus: 'rejected' as const }
          : r
      ));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject KYC');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async (landownerId: string, bankDetails: {
    beneficiaryName: string;
    beneficiaryAccount: string;
    beneficiaryIFSC: string;
  }): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate payment initiation
      setLandownerRecords(prev => prev.map(r => 
        r.id === landownerId 
          ? { 
              ...r, 
              paymentStatus: 'initiated' as const,
              paymentInitiated: true
            }
          : r
      ));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate payment');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const processRTGSPayment = async (landownerId: string, bankDetails: any): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      
      // Call bank server API instead of importing the module
      const response = await fetch('http://localhost:3001/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest)
      });
      
      const result = await response.json();
      
      const record = landownerRecords.find(r => r.id === landownerId);
      if (!record) {
        throw new Error('Landowner record not found');
      }

      const paymentRequest = {
        beneficiaryName: bankDetails.beneficiaryName,
        beneficiaryAccount: bankDetails.beneficiaryAccount,
        beneficiaryIFSC: bankDetails.beneficiaryIFSC,
        amount: parseFloat(record.अंतिम_रक्कम),
        purpose: 'Land Acquisition Compensation',
        referenceNumber: record.noticeNumber || `REF-${landownerId}`,
        landownerId
      };

      if (result.success) {
        setLandownerRecords(prev => prev.map(r => 
          r.id === landownerId 
            ? { 
                ...r, 
                paymentStatus: 'success' as const,
                transactionId: result.transactionId,
                utrNumber: result.utrNumber,
                paymentDate: new Date(),
                paymentInitiated: true
              }
            : r
        ));
      } else {
        setLandownerRecords(prev => prev.map(r => 
          r.id === landownerId 
            ? { ...r, paymentStatus: 'failed' as const }
            : r
        ));
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment');
      return {
        success: false,
        message: 'Payment processing failed',
        status: 'failed'
      };
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatus = (landownerId: string): string => {
    const record = landownerRecords.find(r => r.id === landownerId);
    return record?.paymentStatus || 'pending';
  };

  const getVillageSummary = (projectId: string): VillageSummary[] => {
    const projectRecords = landownerRecords.filter(r => r.projectId === projectId);
    const villageMap = new Map<string, VillageSummary>();
    
    projectRecords.forEach(record => {
      const village = record.village;
      if (!villageMap.has(village)) {
        villageMap.set(village, {
          villageName: village,
          totalCompensation: 0,
          totalSurveyNos: 0,
          totalLandParties: 0,
          totalArea: 0,
          compensationPaid: 0,
          paidSurveyNos: 0,
          paidLandParties: 0,
          paidArea: 0,
          pendingCompensation: 0,
          pendingSurveyNos: 0,
          pendingLandParties: 0,
          pendingArea: 0
        });
      }
      
      const summary = villageMap.get(village)!;
      const compensation = parseFloat(record.अंतिम_रक्कम) || 0;
      const area = parseFloat(record.क्षेत्र) || 0;
      
      summary.totalCompensation += compensation;
      summary.totalSurveyNos += 1;
      summary.totalLandParties += 1;
      summary.totalArea += area;
      
      if (record.paymentStatus === 'success') {
        summary.compensationPaid += compensation;
        summary.paidSurveyNos += 1;
        summary.paidLandParties += 1;
        summary.paidArea += area;
      } else {
        summary.pendingCompensation += compensation;
        summary.pendingSurveyNos += 1;
        summary.pendingLandParties += 1;
        summary.pendingArea += area;
      }
    });
    
    return Array.from(villageMap.values());
  };

  const assignAgent = async (landownerId: string, agentId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      setLandownerRecords(prev => prev.map(r => 
        r.id === landownerId 
          ? { 
              ...r, 
              assignedAgent: agentId,
              assignedAt: new Date(),
              kycStatus: 'in_progress' as const
            }
          : r
      ));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign agent');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Enhanced agent assignment with notice data
  const assignAgentWithNotice = async (
    landownerId: string, 
    agentId: string, 
    noticeData: {
      noticeNumber: string;
      noticeDate: Date;
      noticeContent: string;
    }
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Assigning agent with notice data:', { landownerId, agentId, noticeData });

      // Make API call to assign agent
      const response = await apiCall('/agents/assign', {
        method: 'PUT',
        body: JSON.stringify({
          landownerId: landownerId, // This should be the real database _id
          agentId: agentId,
          noticeData
        })
      });

      console.log('Agent assignment API response:', response);

      // Check if the API call was successful
      if (response.success && response.data) {
        // Update local state with the response data
        setLandownerRecords(prev => prev.map(r => 
          r.id === landownerId
            ? { 
                ...r, 
                assignedAgent: agentId,
                assignedAt: new Date(),
                kycStatus: 'in_progress' as const,
                noticeNumber: noticeData.noticeNumber,
                noticeDate: noticeData.noticeDate,
                noticeContent: noticeData.noticeContent,
                noticeGenerated: true
              }
            : r
        ));
        return true;
      } else {
        // API call failed
        console.error('API call failed:', response.message || 'Unknown error');
        setError(response.message || 'Failed to assign agent');
        return false;
      }
    } catch (err) {
      console.error('Failed to assign agent with notice data:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign agent with notice data');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getAssignedRecords = async (agentId: string): Promise<LandownerRecord[]> => {
    try {
      console.log('Fetching assigned records for agent:', agentId);
      
      const response = await apiCall('/agents/assigned');
      console.log('API response for assigned records:', response);
      
      if (response.success) {
        // Map the response data to include proper IDs
        const records = Array.isArray(response.data) ? response.data : [];
        return records.map((record: any) => ({
          ...record,
          id: record._id || record.id
        }));
      }
      
      return [];
    } catch (err) {
      console.error('Failed to fetch assigned records:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assigned records');
      return [];
    }
  };

  // Enhanced function to get assigned records with notice information from new collection
  const getAssignedRecordsWithNotices = async (agentId: string): Promise<LandownerRecord[]> => {
    try {
      console.log('Fetching assigned records with notices for agent:', agentId);
      
      const response = await apiCall(`/agents/assigned-with-notices?agentId=${agentId}`);
      console.log('API response for assigned records with notices:', response);
      
      if (response.success) {
        console.log('Notice assignments from new collection:', response.data);
        
        // Transform NoticeAssignment data to LandownerRecord format for compatibility
        const transformedRecords = (response.data || []).map((assignment: any) => ({
          id: assignment.landownerId, // Use frontend ID directly
          projectId: assignment.projectId,
          खातेदाराचे_नांव: assignment.landownerName,
          सर्वे_नं: assignment.surveyNumber,
          क्षेत्र: assignment.area,
          संपादित_क्षेत्र: assignment.area,
          दर: '0',
          संरचना_झाडे_विहिरी_रक्कम: '0',
          एकूण_मोबदला: assignment.compensationAmount,
          सोलेशियम_100: '0',
          अंतिम_रक्कम: assignment.compensationAmount,
          village: assignment.village,
          taluka: assignment.taluka,
          district: assignment.district,
          noticeGenerated: true,
          noticeNumber: assignment.noticeNumber,
          noticeDate: assignment.noticeDate,
          noticeContent: assignment.noticeContent,
          kycStatus: assignment.kycStatus,
          paymentStatus: 'pending',
          assignedAgent: assignment.assignedAgent,
          assignedAt: assignment.assignedAt,
          documentsUploaded: assignment.documentsUploaded,
          noticePdfUrl: assignment.noticePdfUrl
        }));
        
        return transformedRecords;
      }
      
      return [];
    } catch (err) {
      console.error('Failed to fetch assigned records with notices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assigned records with notices');
      return [];
    }
  };

  const getProjectStats = () => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status.stage3A === 'approved').length;
    const completedKYC = landownerRecords.filter(r => r.kycStatus === 'approved').length;
    const pendingPayments = landownerRecords.filter(r => r.paymentStatus === 'pending').length;
    const totalCompensation = landownerRecords.reduce((sum, r) => sum + (parseFloat(r.अंतिम_रक्कम) || 0), 0);
    
    return {
      totalProjects,
      activeProjects,
      completedKYC,
      pendingPayments,
      totalCompensation
    };
  };

  const value: SaralContextType = {
    projects,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    landownerRecords,
    uploadCSV,
    getLandownersByProject,
    updateLandownerRecord,
    noticeHeaders,
    uploadNoticeHeader,
    generateNotices,
    kycDocuments,
    uploadKYCDocument,
    approveKYC,
    rejectKYC,
    initiatePayment,
    getPaymentStatus,
    processRTGSPayment,
    getVillageSummary,
    assignAgent,
    assignAgentWithNotice,
    getAssignedRecords,
    getAssignedRecordsWithNotices,
    getProjectStats,
    loading,
    error
  };

  return (
    <SaralContext.Provider value={value}>
      {children}
    </SaralContext.Provider>
  );
};