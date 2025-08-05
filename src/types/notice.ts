// Notice Generation System Types

export interface NoticeTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  projectId: string;
  language: 'marathi' | 'hindi' | 'english';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface GeneratedNotice {
  id: string;
  landownerId: string;
  projectId: string;
  templateId: string;
  noticeNumber: string;
  noticeDate: Date;
  content: string;
  status: 'draft' | 'generated' | 'assigned' | 'issued' | 'delivered' | 'completed';
  issuedBy: string;
  issuedAt?: Date;
  assignedAgent?: {
    id: string;
    name: string;
    phone: string;
    area: string;
    assignedAt: Date;
  };
  assignedAt?: Date;
  deliveryStatus: 'pending' | 'delivered' | 'failed';
  deliveryDate?: Date;
  deliveryNotes?: string;
}

export interface RequiredDocument {
  id: string;
  projectId: string;
  name: string;
  nameMarathi: string;
  nameHindi: string;
  nameEnglish: string;
  isRequired: boolean;
  order: number;
  description?: string;
  descriptionMarathi?: string;
  descriptionHindi?: string;
  descriptionEnglish?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadedDocument {
  id: string;
  landownerId: string;
  documentTypeId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: Date;
  uploadedBy: string;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  verificationNotes?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface AgentAssignment {
  id: string;
  landownerId: string;
  agentId: string;
  projectId: string;
  assignedAt: Date;
  assignedBy: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  completedAt?: Date;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  landownerId: string;
  projectId: string;
  amount: number;
  bankDetails: {
    beneficiaryName: string;
    beneficiaryAccount: string;
    beneficiaryIFSC: string;
    bankName: string;
    branchName: string;
  };
  status: 'pending' | 'initiated' | 'processing' | 'success' | 'failed';
  initiatedAt?: Date;
  processedAt?: Date;
  transactionId?: string;
  utrNumber?: string;
  failureReason?: string;
  initiatedBy: string;
}

export interface CSVFieldMapping {
  csvField: string;
  templateVariable: string;
  dataType: 'text' | 'number' | 'date' | 'currency';
  isRequired: boolean;
  defaultValue?: string;
}

export interface NoticeGenerationConfig {
  projectId: string;
  templateId: string;
  fieldMappings: CSVFieldMapping[];
  autoAssignAgent: boolean;
  defaultAgentId?: string;
  deliveryMethod: 'agent' | 'post' | 'email';
  language: 'marathi' | 'hindi' | 'english';
}

// Language mapping interface
export interface LanguageMapping {
  marathi: string;
  hindi: string;
  english: string;
}

// Notice content with language support
export interface NoticeContent {
  marathi: string;
  hindi: string;
  english: string;
}

// Enhanced LandownerRecord with notice and payment tracking
export interface EnhancedLandownerRecord {
  id: string;
  projectId: string;
  surveyNumber: string; // Primary key
  landownerName: string;
  area: number;
  acquiredArea: number;
  rate: number;
  compensationAmount: number;
  solatium: number;
  finalAmount: number;
  village: string;
  taluka: string;
  district: string;
  
  // Notice tracking
  noticeStatus: 'pending' | 'generated' | 'issued' | 'delivered';
  noticeNumber?: string;
  noticeDate?: Date;
  noticeGeneratedAt?: Date;
  noticeIssuedAt?: Date;
  noticeDeliveredAt?: Date;
  
  // Agent assignment
  assignedAgent?: string;
  assignedAt?: Date;
  agentNotes?: string;
  
  // Document tracking
  documentsRequired: number;
  documentsUploaded: number;
  documentsVerified: number;
  kycStatus: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  kycCompletedAt?: Date;
  kycApprovedAt?: Date;
  
  // Payment tracking
  paymentStatus: 'pending' | 'initiated' | 'processing' | 'success' | 'failed';
  paymentInitiatedAt?: Date;
  paymentProcessedAt?: Date;
  transactionId?: string;
  utrNumber?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// System configuration
export interface SystemConfig {
  defaultLanguage: 'marathi' | 'hindi' | 'english';
  supportedLanguages: ('marathi' | 'hindi' | 'english')[];
  noticeNumberPrefix: string;
  autoGenerateNoticeNumbers: boolean;
  requireAgentVerification: boolean;
  requireOfficerApproval: boolean;
  maxFileSize: number; // in bytes
  allowedFileTypes: string[];
  paymentRetryAttempts: number;
  noticeDeliveryTimeout: number; // in days
}

// Error types
export interface NoticeGenerationError {
  code: string;
  message: string;
  messageMarathi: string;
  messageHindi: string;
  messageEnglish: string;
  field?: string;
  recordId?: string;
}

// Success response
export interface NoticeGenerationResult {
  success: boolean;
  noticesGenerated: number;
  noticesFailed: number;
  errors: NoticeGenerationError[];
  generatedNotices: GeneratedNotice[];
} 