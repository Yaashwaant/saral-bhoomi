// Agent API utilities for better error handling and logging
import { config } from '../config';

const API_BASE_URL = config.API_BASE_URL;

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Enhanced API call with detailed logging
export const agentApiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`🔗 API Call: ${options.method || 'GET'} ${url}`);
  console.log('📤 Request options:', options);
  
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('📥 Response data:', data);
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ API Error for ${endpoint}:`, error);
    throw error;
  }
};

// Agent-specific API functions
export const agentApi = {
  // Get assigned records
  getAssignedRecords: async () => {
    return agentApiCall('/agents/assigned');
  },

  // Get assigned records with notices
  getAssignedRecordsWithNotices: async () => {
    return agentApiCall('/agents/assigned-with-notices');
  },

  // Assign agent to landowner
  assignAgent: async (landownerId: string, agentId: string, noticeData?: any) => {
    return agentApiCall('/agents/assign', {
      method: 'PUT',
      body: JSON.stringify({
        landownerId,
        agentId,
        noticeData
      })
    });
  },

  // Update KYC status
  updateKycStatus: async (recordId: string, kycStatus: string, notes?: string) => {
    return agentApiCall(`/agents/kyc-status/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify({
        kycStatus,
        notes
      })
    });
  },

  // Upload document
  uploadDocument: async (recordId: string, documentType: string, fileName: string, fileUrl: string) => {
    return agentApiCall(`/agents/upload-document/${recordId}`, {
      method: 'POST',
      body: JSON.stringify({
        documentType,
        fileName,
        fileUrl
      })
    });
  },

  // Get available agents
  getAvailableAgents: async () => {
    return agentApiCall('/agents/available');
  }
};