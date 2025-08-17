import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Removed demo-data dependency; use live API and safe fallbacks

// API Base URL
import { config } from '../config';
const API_BASE_URL = config.API_BASE_URL;

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
  description?: string;
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
  // Tribal flags
  isTribal?: boolean;
  tribalCertificateNo?: string;
  tribalLag?: string;
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
  }, extra?: { surveyNumber?: string; projectId?: string }) => Promise<boolean>;
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
  // Utilities
  reloadLandowners: () => Promise<void>;
  
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
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    try {
      const j = await response.json();
      msg = j.message || msg;
    } catch {}
    throw new Error(msg);
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
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.warn('Projects API failed; falling back to empty list');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLandownerRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCall('/landowners/list');
      const rows: any[] = Array.isArray(response.records) ? response.records : [];
      const parseIsTribal = (rec: any): boolean => {
        // Strictly use Marathi column when present
        const raw = rec?.['आदिवासी'] ?? rec?.isTribal ?? rec?.is_tribal;
        if (typeof raw === 'boolean') return raw;
        if (typeof raw === 'number') return raw === 1;
        if (typeof raw === 'string') {
          const v = raw.trim().toLowerCase();
          return ['होय','yes','true','1','y'].includes(v);
        }
        return false;
      };
      const pickCert = (rec: any): string => {
        const candidates = [
          rec?.tribalCertificateNo,
          rec?.tribal_certificate_no,
          rec?.['आदिवासी_प्रमाणपत्र_क्रमांक'],
          rec?.tribalCertNo,
          rec?.certificateNo,
          rec?.tribalLag,
          rec?.tribal_lag,
          rec?.['আदिवासी_लॅग'],
          rec?.['आदिवासी_लाग']
        ];
        const rawVal = candidates.find((c) => c !== undefined && c !== null && String(c).trim() !== '');
        const clean = String(rawVal ?? '').trim();
        const lower = clean.toLowerCase();
        if (!clean || lower === 'na' || lower === 'n/a' || clean === 'नाही' || clean === '-') return '';
        return clean;
      };
      const normalized = rows.map((r: any) => {
        const isTribal = parseIsTribal(r);
        const tribalCertificateNo = pickCert(r);
        const tribalLag = r?.tribalLag ?? r?.tribal_lag ?? r?.['आदिवासी_लाग'] ?? '';
        return {
          ...r,
          id: r.id,
          projectId: r.project_id ?? r.projectId,
          isTribal,
          tribalCertificateNo,
          tribalLag
        };
      });
      setLandownerRecords(normalized);
    } catch (err) {
      console.warn('Landowners API failed; falling back to empty list');
      setLandownerRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Public wrapper to reload landowner records on demand
  const reloadLandowners = async (): Promise<void> => {
    await loadLandownerRecords();
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
    return projects.find(p => String(p.id) === String(id));
  };

  const uploadCSV = async (projectId: string, file: File): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      // Read file text and send to ingest endpoint (no multipart upload)
      const csvText = await file.text();
      const res = await fetch(`${API_BASE_URL}/csv/ingest/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent: csvText,
          assignToAgent: false,
          generateNotice: true,
          overwrite: true
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'CSV ingest failed');
      await loadLandownerRecords();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ingest CSV');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getLandownersByProject = (projectId: string): LandownerRecord[] => {
    return landownerRecords.filter(r => String(r.projectId ?? (r as any).project_id) === String(projectId));
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

  const processRTGSPayment = async (landownerId: string, _bankDetails: any): Promise<any> => {
    // For now: accept any details and always succeed
    const transactionId = `TXN${Date.now()}`;
    const utrNumber = `UTR${Date.now()}`;

    setLandownerRecords(prev => prev.map(r => 
      String(r.id) === String(landownerId)
        ? { 
            ...r, 
            paymentStatus: 'success' as const,
            paymentProcessedAt: new Date() as any,
            transactionId: transactionId as any,
            utrNumber: utrNumber as any
          }
        : r
    ));

    return {
      success: true,
      transactionId,
      message: 'Payment processed successfully',
      timestamp: new Date(),
      status: 'success',
      utrNumber
    };
  };

  const getPaymentStatus = (landownerId: string): string => {
    const record = landownerRecords.find(r => String(r.id) === String(landownerId));
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
    },
    extra?: { surveyNumber?: string; projectId?: string }
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
          noticeData,
          surveyNumber: extra?.surveyNumber,
          projectId: extra?.projectId
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
    const activeProjects = projects.filter(p => (p as any)?.stage3A === 'approved' || (p as any)?.isActive).length;
    const completedKYC = landownerRecords.filter(r => r?.kycStatus === 'approved').length;
    const pendingPayments = landownerRecords.filter(r => r?.paymentStatus === 'pending').length;
    const totalCompensation = landownerRecords.reduce((sum, r) => sum + (parseFloat((r as any)?.अंतिम_रक्कम || '0') || 0), 0);
    return { totalProjects, activeProjects, completedKYC, pendingPayments, totalCompensation };
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
    reloadLandowners,
    loading,
    error
  };

  return (
    <SaralContext.Provider value={value}>
      {children}
    </SaralContext.Provider>
  );
};