// Demo data for when database is not available
import bcrypt from 'bcryptjs';

// Generate demo user IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Demo users
export const demoUsers = [
  {
    _id: 'demo_admin_001',
    name: 'Admin User',
    email: 'admin@saral.gov.in',
    password: bcrypt.hashSync('admin', 12),
    role: 'admin',
    department: 'Administration',
    phone: '9876543210',
    language: 'marathi',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'demo_officer_001',
    name: 'Land Officer',
    email: 'officer@saral.gov.in',
    password: bcrypt.hashSync('officer', 12),
    role: 'officer',
    department: 'Land Acquisition',
    phone: '9876543211',
    language: 'marathi',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'demo_agent_rajesh',
    name: 'राजेश पाटील',
    email: 'rajesh.patil@saral.gov.in',
    password: bcrypt.hashSync('agent123', 12),
    role: 'agent',
    department: 'Field Operations',
    phone: '9876543210',
    language: 'marathi',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'demo_agent_sunil',
    name: 'सुनील कांबळे',
    email: 'sunil.kamble@saral.gov.in',
    password: bcrypt.hashSync('agent123', 12),
    role: 'agent',
    department: 'Field Operations',
    phone: '9876543211',
    language: 'marathi',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Demo projects
export const demoProjects = [
  {
    _id: 'demo_project_001',
    projectName: 'Railway Flyover Project - Nandgaon',
    pmisCode: 'MH-PAL-RF-001',
    type: 'infrastructure',
    description: 'Construction of railway flyover at Nandgaon junction',
    location: {
      district: 'Palghar',
      taluka: 'Nandgaon',
      villages: ['गाव1', 'गाव2', 'नांदे']
    },
    budget: {
      estimatedCost: 50000000,
      allocatedBudget: 55000000,
      currency: 'INR'
    },
    timeline: {
      startDate: new Date('2024-01-01'),
      expectedCompletion: new Date('2025-12-31')
    },
    status: {
      stage1: 'approved',
      stage2: 'approved', 
      stage3A: 'approved',
      stage3B: 'in_progress',
      stage4: 'pending'
    },
    assignedOfficers: ['demo_officer_001'],
    assignedAgents: ['demo_agent_rajesh', 'demo_agent_sunil'],
    isActive: true,
    createdBy: 'demo_admin_001',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Demo landowner records
export const demoLandownerRecords = [
  {
    _id: 'demo_landowner_001',
    projectId: 'demo_project_001',
    खातेदाराचे_नांव: 'रामचंद्र पाटील',
    'स.नं./हि.नं./ग.नं.': '30/1',
    गांव: 'गाव1',
    क्षेत्र: '0.1500',
    संपादित_क्षेत्र: '0.0200',
    दर: '53100000',
    संरचना_झाडे_विहिरी_रक्कम: '0',
    एकूण_मोबदला: '2500000',
    सोलेशियम_100: '625000',
    अंतिम_रक्कम: '3125000',
    village: 'गाव1',
    taluka: 'नांदे',
    district: 'पालघर',
    noticeGenerated: true,
    noticeNumber: 'NOTICE-1702834567890-001',
    noticeDate: new Date('2024-01-15'),
    noticeContent: 'Complete notice content would be here...',
    kycStatus: 'in_progress',
    assignedAgent: 'demo_agent_rajesh',
    assignedAt: new Date('2024-01-16'),
    paymentStatus: 'pending',
    isActive: true,
    createdBy: 'demo_officer_001',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'demo_landowner_002',
    projectId: 'demo_project_001',
    खातेदाराचे_नांव: 'सुनिता शर्मा',
    'स.नं./हि.नं./ग.नं.': '30/2',
    गांव: 'गाव2',
    क्षेत्र: '0.2000',
    संपादित_क्षेत्र: '0.0300',
    दर: '53100000',
    संरचना_झाडे_विहिरी_रक्कम: '50000',
    एकूण_मोबदला: '3200000',
    सोलेशियम_100: '800000',
    अंतिम_रक्कम: '4000000',
    village: 'गाव2',
    taluka: 'नांदे',
    district: 'पालघर',
    noticeGenerated: true,
    noticeNumber: 'NOTICE-1702834567891-002',
    noticeDate: new Date('2024-01-15'),
    noticeContent: 'Complete notice content would be here...',
    kycStatus: 'in_progress',
    assignedAgent: 'demo_agent_rajesh',
    assignedAt: new Date('2024-01-16'),
    paymentStatus: 'pending',
    isActive: true,
    createdBy: 'demo_officer_001',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'demo_landowner_003',
    projectId: 'demo_project_001',
    खातेदाराचे_नांव: 'अमित जाधव',
    'स.नं./हि.नं./ग.नं.': '30/3',
    गांव: 'नांदे',
    क्षेत्र: '0.1800',
    संपादित_क्षेत्र: '0.0250',
    दर: '53100000',
    संरचना_झाडे_विहिरी_रक्कम: '25000',
    एकूण_मोबदला: '2800000',
    सोलेशियम_100: '700000',
    अंतिम_रक्कम: '3500000',
    village: 'नांदे',
    taluka: 'नांदे',
    district: 'पालघर',
    noticeGenerated: false,
    kycStatus: 'pending',
    paymentStatus: 'pending',
    isActive: true,
    createdBy: 'demo_officer_001',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// In-memory storage for demo mode
let inMemoryUsers = [...demoUsers];
let inMemoryProjects = [...demoProjects];
let inMemoryLandownerRecords = [...demoLandownerRecords];

// Demo service functions
export const demoService = {
  // User operations
  findUser: (query) => {
    return inMemoryUsers.find(user => {
      if (query.email) return user.email === query.email;
      if (query._id) return user._id === query._id;
      if (query.role) return user.role === query.role;
      return false;
    });
  },

  findUsers: (query = {}) => {
    return inMemoryUsers.filter(user => {
      if (query.role && user.role !== query.role) return false;
      if (query.isActive !== undefined && user.isActive !== query.isActive) return false;
      return true;
    });
  },

  // Project operations
  findProjects: (query = {}) => {
    return inMemoryProjects.filter(project => {
      if (query.isActive !== undefined && project.isActive !== query.isActive) return false;
      return true;
    });
  },

  findProject: (id) => {
    return inMemoryProjects.find(p => p._id === id);
  },

  // Landowner record operations
  findLandownerRecords: (query = {}) => {
    return inMemoryLandownerRecords.filter(record => {
      if (query.projectId && record.projectId !== query.projectId) return false;
      if (query.assignedAgent && record.assignedAgent !== query.assignedAgent) return false;
      if (query.noticeGenerated !== undefined && record.noticeGenerated !== query.noticeGenerated) return false;
      if (query.kycStatus && record.kycStatus !== query.kycStatus) return false;
      if (query.isActive !== undefined && record.isActive !== query.isActive) return false;
      return true;
    });
  },

  findLandownerRecord: (id) => {
    return inMemoryLandownerRecords.find(r => r._id === id);
  },

  updateLandownerRecord: (id, updateData) => {
    const index = inMemoryLandownerRecords.findIndex(r => r._id === id);
    if (index !== -1) {
      inMemoryLandownerRecords[index] = {
        ...inMemoryLandownerRecords[index],
        ...updateData,
        updatedAt: new Date()
      };
      return inMemoryLandownerRecords[index];
    }
    return null;
  },

  createLandownerRecord: (data) => {
    const newRecord = {
      _id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryLandownerRecords.push(newRecord);
    return newRecord;
  },

  // Reset demo data
  resetDemoData: () => {
    inMemoryUsers = [...demoUsers];
    inMemoryProjects = [...demoProjects];
    inMemoryLandownerRecords = [...demoLandownerRecords];
    console.log('🔄 Demo data reset');
  }
};

export default demoService;