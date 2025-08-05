import { LandownerRecord } from '@/contexts/SaralContext';

export const demoLandownerRecords: LandownerRecord[] = [
  {
    id: '1',
    projectId: 'project-1',
    खातेदाराचे_नांव: 'कमळी कमळाकर मंडळ',
    सर्वे_नं: '40',
    क्षेत्र: '0.1850',
    संपादित_क्षेत्र: '0.0504',
    दर: '53100000',
    संरचना_झाडे_विहिरी_रक्कम: '0',
    एकूण_मोबदला: '4010513',
    सोलेशियम_100: '4010513',
    अंतिम_रक्कम: '8021026',
    village: 'उंबरपाडा नंदाडे',
    taluka: 'पालघर',
    district: 'पालघर',
    noticeGenerated: true,
    noticeNumber: 'NOTICE-2024-001',
    noticeDate: new Date('2024-01-15'),
    kycStatus: 'pending',
    paymentStatus: 'pending',
    assignedAgent: 'agent1@example.com',
    documentsUploaded: false,
    paymentInitiated: false
  },
  {
    id: '2',
    projectId: 'project-1',
    खातेदाराचे_नांव: 'राम शामराव पाटील',
    सर्वे_नं: '41',
    क्षेत्र: '0.2000',
    संपादित_क्षेत्र: '0.0600',
    दर: '53100000',
    संरचना_झाडे_विहिरी_रक्कम: '50000',
    एकूण_मोबदला: '4600000',
    सोलेशियम_100: '4600000',
    अंतिम_रक्कम: '9200000',
    village: 'उंबरपाडा नंदाडे',
    taluka: 'पालघर',
    district: 'पालघर',
    noticeGenerated: true,
    noticeNumber: 'NOTICE-2024-002',
    noticeDate: new Date('2024-01-16'),
    kycStatus: 'in_progress',
    paymentStatus: 'pending',
    assignedAgent: 'agent2@example.com',
    documentsUploaded: true,
    paymentInitiated: false
  },
  {
    id: '3',
    projectId: 'project-1',
    खातेदाराचे_नांव: 'सीता देवी शर्मा',
    सर्वे_नं: '42',
    क्षेत्र: '0.1500',
    संपादित_क्षेत्र: '0.0450',
    दर: '53100000',
    संरचना_झाडे_विहिरी_रक्कम: '25000',
    एकूण_मोबदला: '3450000',
    सोलेशियम_100: '3450000',
    अंतिम_रक्कम: '6900000',
    village: 'उंबरपाडा नंदाडे',
    taluka: 'पालघर',
    district: 'पालघर',
    noticeGenerated: false,
    kycStatus: 'pending',
    paymentStatus: 'pending',
    assignedAgent: 'agent1@example.com',
    documentsUploaded: false,
    paymentInitiated: false
  },
  {
    id: '4',
    projectId: 'project-1',
    खातेदाराचे_नांव: 'अमित कुमार सिंह',
    सर्वे_नं: '43',
    क्षेत्र: '0.1800',
    संपादित_क्षेत्र: '0.0540',
    दर: '53100000',
    संरचना_झाडे_विहिरी_रक्कम: '75000',
    एकूण_मोबदला: '4200000',
    सोलेशियम_100: '4200000',
    अंतिम_रक्कम: '8400000',
    village: 'उंबरपाडा नंदाडे',
    taluka: 'पालघर',
    district: 'पालघर',
    noticeGenerated: true,
    noticeNumber: 'NOTICE-2024-003',
    noticeDate: new Date('2024-01-17'),
    kycStatus: 'completed',
    paymentStatus: 'initiated',
    assignedAgent: 'agent2@example.com',
    documentsUploaded: true,
    paymentInitiated: true
  },
  {
    id: '5',
    projectId: 'project-1',
    खातेदाराचे_नांव: 'मीरा बाई पाटील',
    सर्वे_नं: '44',
    क्षेत्र: '0.2200',
    संपादित_क्षेत्र: '0.0660',
    दर: '53100000',
    संरचना_झाडे_विहिरी_रक्कम: '100000',
    एकूण_मोबदला: '5200000',
    सोलेशियम_100: '5200000',
    अंतिम_रक्कम: '10400000',
    village: 'उंबरपाडा नंदाडे',
    taluka: 'पालघर',
    district: 'पालघर',
    noticeGenerated: true,
    noticeNumber: 'NOTICE-2024-004',
    noticeDate: new Date('2024-01-18'),
    kycStatus: 'approved',
    paymentStatus: 'success',
    assignedAgent: 'agent1@example.com',
    documentsUploaded: true,
    paymentInitiated: true,
    transactionId: 'TXN-2024-001',
    utrNumber: 'UTR-2024-001',
    paymentDate: new Date('2024-01-20')
  }
];

export const demoProjects = [
  {
    id: 'project-1',
    projectName: 'Western Dedicated Freight Corridor Railway Flyover Project',
    pmisCode: 'PROJECT-2024-001',
    schemeName: 'Right to fair compensation for land acquired',
    landRequired: 2.5,
    landAvailable: 1.8,
    landToBeAcquired: 0.7,
    type: 'greenfield' as const,
    status: {
      stage3A: 'approved' as const,
      stage3D: 'approved' as const,
      corrigendum: 'pending' as const,
      award: 'approved' as const
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'admin@example.com'
  }
];

export const createDemoCSVContent = () => {
  return `खातेदाराचे_नांव,सर्वे_नं,क्षेत्र,संपादित_क्षेत्र,दर,संरचना_झाडे_विहिरी_रक्कम,एकूण_मोबदला,सोलेशियम_100,अंतिम_रक्कम,village,taluka,district
कमळी कमळाकर मंडळ,40,0.1850,0.0504,53100000,0,4010513,4010513,8021026,उंबरपाडा नंदाडे,पालघर,पालघर
राम शामराव पाटील,41,0.2000,0.0600,53100000,50000,4600000,4600000,9200000,उंबरपाडा नंदाडे,पालघर,पालघर
सीता देवी शर्मा,42,0.1500,0.0450,53100000,25000,3450000,3450000,6900000,उंबरपाडा नंदाडे,पालघर,पालघर
अमित कुमार सिंह,43,0.1800,0.0540,53100000,75000,4200000,4200000,8400000,उंबरपाडा नंदाडे,पालघर,पालघर
मीरा बाई पाटील,44,0.2200,0.0660,53100000,100000,5200000,5200000,10400000,उंबरपाडा नंदाडे,पालघर,पालघर`;
}; 