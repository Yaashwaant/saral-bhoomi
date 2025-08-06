// Enhanced KYC Types for Notice Integration
export interface NoticeBasedKycRecord {
  // Notice Information
  id: string;
  noticeId: string;
  noticeNumber: string;
  noticeDate: Date;
  noticeContent: string;
  
  // Landowner Information from Notice
  landownerId: string;
  landownerName: string;
  surveyNumber: string;
  village: string;
  
  // Financial Information from Notice
  compensationAmount: number;
  solatiumAmount: number;
  finalAmount: number;
  
  // Agent Assignment
  assignedAgent?: {
    id: string;
    name: string;
    phone: string;
    area: string;
    assignedAt: Date;
  };
  
  // KYC Status
  kycStatus: 'pending' | 'assigned' | 'in_progress' | 'documents_collected' | 'verification_pending' | 'completed' | 'approved' | 'rejected';
  kycStartedAt?: Date;
  kycCompletedAt?: Date;
  kycApprovedAt?: Date;
  
  // Document Collection
  requiredDocuments: KycRequiredDocument[];
  uploadedDocuments: KycUploadedDocument[];
  documentCollectionStatus: 'pending' | 'in_progress' | 'completed';
  
  // Verification
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  
  // Payment Preparation
  bankDetailsCollected: boolean;
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName: string;
    accountHolderName: string;
  };
  
  // Workflow Status
  currentStep: 'notice_assignment' | 'document_collection' | 'verification' | 'bank_details' | 'ready_for_payment' | 'completed';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface KycRequiredDocument {
  id: string;
  name: string;
  nameMarathi: string;
  description: string;
  descriptionMarathi: string;
  isRequired: boolean;
  category: 'identity' | 'property' | 'financial' | 'legal' | 'other';
  acceptedFormats: string[];
  maxSize: number; // in MB
}

export interface KycUploadedDocument {
  id: string;
  documentTypeId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: string;
  
  // Verification Status
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'requires_reupload';
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  verificationNotes?: string;
}

export interface AgentKycDashboardData {
  assignedRecords: NoticeBasedKycRecord[];
  summary: {
    total: number;
    pending: number;
    inProgress: number;
    documentsCollected: number;
    verificationPending: number;
    completed: number;
  };
  recentActivity: KycActivity[];
}

export interface KycActivity {
  id: string;
  type: 'assignment' | 'document_upload' | 'verification' | 'status_change' | 'note_added';
  recordId: string;
  landownerName: string;
  description: string;
  timestamp: Date;
  performedBy: string;
}

// Default required documents as per notice requirements
export const DEFAULT_KYC_DOCUMENTS: KycRequiredDocument[] = [
  {
    id: 'satat_7_12',
    name: '7/12 Extract',
    nameMarathi: '७/१२ उतारा',
    description: 'Current 7/12 extract of the land',
    descriptionMarathi: 'संबंधित जमिनीचा अद्यावत ७/१२ उतारा',
    isRequired: true,
    category: 'property',
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 5
  },
  {
    id: 'identity_docs',
    name: 'Identity Documents',
    nameMarathi: 'ओळखपत्राच्या झेरॉक्स प्रती',
    description: 'Ration Card/Voter ID/Aadhaar Card, PAN Card, Driving License etc.',
    descriptionMarathi: 'रेशन कार्ड/निवडणूक ओळखपत्र/आधारकार्ड, पॅनकार्ड, ड्रायव्हींग लायसन्स इ.',
    isRequired: true,
    category: 'identity',
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 3
  },
  {
    id: 'encumbrance_clearance',
    name: 'Encumbrance Clearance',
    nameMarathi: 'बोजा कमी केल्याचा फेरफार',
    description: 'Encumbrance clearance if any burden exists on 7/12 or NOC from concerned institution/bank',
    descriptionMarathi: '७/१२ वर बोजा असल्यास बोजा कमी केल्याचा फेरफार अथवा ७/१२ इतर हक्कामधील बोजा असणाऱ्या संस्था/बँक यांचे रक्कम स्विकारण्याकरिता नाहरकत दाखला',
    isRequired: false,
    category: 'legal',
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 5
  },
  {
    id: 'other_rights_clearance',
    name: 'Other Rights Clearance',
    nameMarathi: '७/१२ चे सदरी इतर हक्कात शर्त नोंद',
    description: 'Related amendments or orders for condition relaxation for old/new conditions noted in other rights of 7/12',
    descriptionMarathi: '७/१२ चे सदरी इतर हक्कात जुनी शर्त अथवा नवीन शर्तीची नोंद असल्याने संबंधित फेरफार अथवा शर्तशिथिल केल्याचे आदेश',
    isRequired: false,
    category: 'legal',
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 5
  },
  {
    id: 'non_agricultural_approval',
    name: 'Non-Agricultural Approval',
    nameMarathi: 'बिनशेती आदेश व मंजुरी नकाशा',
    description: 'Non-agricultural orders and approved map for plot holders',
    descriptionMarathi: 'बिनशेती प्लॉटधारकांनी बिनशेती आदेश व मंजुरी नकाशा सादर करावेत',
    isRequired: false,
    category: 'property',
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 10
  },
  {
    id: 'bank_passbook',
    name: 'Bank Passbook',
    nameMarathi: 'राष्ट्रीयकृत बँक पासबुक',
    description: 'Nationalized bank passbook original and photocopy',
    descriptionMarathi: 'राष्ट्रीयकृत बँक पासबुक मूळ प्रत व छायांकित प्रत',
    isRequired: true,
    category: 'financial',
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 3
  },
  {
    id: 'photographs',
    name: 'Photographs',
    nameMarathi: 'फोटो',
    description: 'Two photographs each',
    descriptionMarathi: 'प्रत्येकी दोन फोटो',
    isRequired: true,
    category: 'identity',
    acceptedFormats: ['jpg', 'jpeg', 'png'],
    maxSize: 1
  },
  {
    id: 'power_of_attorney',
    name: 'Power of Attorney',
    nameMarathi: 'नोंदणीकृत कुळमुखत्यारपत्र',
    description: 'Registered family power of attorney for landowners who want to receive joint compensation in individual name',
    descriptionMarathi: 'ज्या खातेदारांना नुकसान भरपाई ची एकत्रित रक्कम एकट्याचे नांवे घेण्याची आहे त्यांनी दुय्यम निबंधक कडील नोंदणीकृत कुळमुखत्यारपत्र सादर करावे',
    isRequired: false,
    category: 'legal',
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 5
  },
  {
    id: 'consent_letter',
    name: 'Consent Letter',
    nameMarathi: 'नोंदणीकृत संमतीपत्र',
    description: 'Registered consent letter for landowner who will accept compensation on behalf of other landowners',
    descriptionMarathi: 'ज्या खातेदाराला इतर खातेदारांच्या वतीने नुकसान भरपाईची रक्कम स्विकारावयाची आहे, त्यांनी देखील नोंदणीकृत संमतीपत्र सादर करावे',
    isRequired: false,
    category: 'legal',
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 5
  },
  {
    id: 'succession_certificate',
    name: 'Succession Certificate',
    nameMarathi: 'वारस हक्काचा पुरावा व फेरफार',
    description: 'Succession proof and amendment if landowner is deceased',
    descriptionMarathi: 'खातेदार मयत असल्याने वारस हक्काचा पुरावा व फेरफार जोडावा',
    isRequired: false,
    category: 'legal',
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 5
  },
  {
    id: 'guardian_certificate',
    name: 'Guardian Certificate',
    nameMarathi: 'पालन पोषण करणाऱ्याचे दाखला',
    description: 'Certificate from concerned Talathi showing guardian name if landowner is under 18 years',
    descriptionMarathi: 'सदर खातेदार १८ वर्षाआतील असल्यास, पालन पोषण करणा-याचे नाव असलेले संबंधित तलाठीकडील दाखला',
    isRequired: false,
    category: 'legal',
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 3
  }
];