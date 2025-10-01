import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FolderPlus, 
  Upload, 
  MapPin, 
  IndianRupee, 
  CheckCircle, 
  CheckCircle2,
  Clock,
  FileText,
  Users,
  Eye,
  Download,
  Shield,
  Building2,
  Landmark,
  Database,
  Award,
  Banknote,
  Hash,
  Workflow,
  Plus,
  Search,
  BarChart3
} from 'lucide-react';
import emblemOfIndia from '../../../assets/images/emblem-of-india.png';
import GovernmentLayout from '@/components/layout/GovernmentLayout';
import ProjectManagement from './ProjectManagement';
import VillageWiseReports from './VillageWiseReports';
import KYCAssignmentManager from './KYCAssignmentManager';
import PaymentInitiation from './PaymentInitiation';
import NoticeGenerator from './NoticeGenerator';
import SimpleFieldOfficerAssignment from './SimpleFieldOfficerAssignment';
// Import new enhanced components
import EnhancedAwardManager from './EnhancedAwardManager';
import LandRecordsManager from './LandRecordsManager';
import EnhancedPaymentManager from './EnhancedPaymentManager';
import EnhancedDashboard from './EnhancedDashboard';
import GlobalDashboard from './GlobalDashboard';
import DocumentUploadPortal from './DocumentUploadPortal';
import PaymentSlipGenerator from './PaymentSlipGenerator';
import BlockchainDashboard from './BlockchainDashboard';
import JMRManager from './JMRManager';

const OfficerDashboard = () => {
  const { user } = useAuth();
  const { getProjectStats, projects, landownerRecords } = useSaral();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const stats = getProjectStats();

  const translations = {
    marathi: {
      welcome: 'स्वागत',
      dashboard: 'भूमि अधिकारी डॅशबोर्ड',
      overview: 'सारांश',
      projects: 'प्रकल्प व्यवस्थापन',
      notices: 'नोटीस जनरेटर',
      villages: 'गावनिहाय अहवाल',
      kycApproval: 'KYC मंजुरी',
      payments: 'पेमेंट इनिशिएशन',
      enhancedPayment: 'एन्हान्स्ड Payment',
      documentUpload: 'Document Upload',
      paymentSlips: 'पेमेंट स्लिप्स',
      landRecordsManagement: 'भूमी रेकॉर्ड व्यवस्थापन',
      award: 'Award',
      totalProjects: 'एकूण प्रकल्प',
      activeProjects: 'सक्रिय प्रकल्प',
      totalCompensation: 'एकूण मोबदला',
      pendingKYC: 'प्रलंबित KYC',
      completedKYC: 'पूर्ण झालेले KYC',
      pendingPayments: 'प्रलंबित पेमेंट',
      recentProjects: 'अलीकडील प्रकल्प',
      quickActions: 'जलद कृती',
      createProject: 'नवीन प्रकल्प',
      uploadCSV: 'CSV अपलोड',
      viewVillages: 'गावे पाहा',
      approveKYC: 'KYC मंजूर करा',
      hectares: 'हेक्टर',
      status: 'स्थिती',
      pending: 'प्रलंबित',
      approved: 'मंजूर',
      rejected: 'नाकारले'
    },
    english: {
      welcome: 'Welcome',
      dashboard: 'Land Acquisition Officer Dashboard / भूसंपादन अधिकारी डैशबोर्ड',
      overview: 'Overview',
      projects: 'Project Management',
      notices: 'Notice Generator',
      villages: 'Village Reports',
      kycApproval: 'KYC Approval',
      payments: 'Payment Initiation',
      enhancedPayment: 'Enhanced Payment',
      documentUpload: 'Document Upload',
      paymentSlips: 'Payment Slips',
      landRecordsManagement: 'Land Records Management',
      award: 'Award',
      totalProjects: 'Total Projects',
      activeProjects: 'Active Projects',
      totalCompensation: 'Total Compensation',
      pendingKYC: 'Pending KYC',
      completedKYC: 'Completed KYC',
      pendingPayments: 'Pending Payments',
      recentProjects: 'Recent Projects',
      quickActions: 'Quick Actions',
      createProject: 'Create Project',
      uploadCSV: 'Upload CSV',
      viewVillages: 'View Villages',
      approveKYC: 'Approve KYC',
      hectares: 'Hectares',
      status: 'Status',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected'
    },
    hindi: {
      welcome: 'स्वागत',
      dashboard: 'भूसंपादन अधिकारी डैशबोर्ड',
      overview: 'सारांश',
      projects: 'परियोजना प्रबंधन',
      notices: 'नोटिस जनरेटर',
      villages: 'गांव रिपोर्ट',
      kycApproval: 'KYC अनुमोदन',
      payments: 'भुगतान शुरुआत',
      enhancedPayment: 'एन्हान्स्ड Payment',
      documentUpload: 'Document Upload',
      paymentSlips: 'पेमेंट स्लिप्स',
      landRecordsManagement: 'भूमि रिकॉर्ड प्रबंधन',
      jmr: 'JMR',
      award: 'Award',
      totalProjects: 'कुल परियोजनाएं',
      activeProjects: 'सक्रिय परियोजनाएं',
      totalCompensation: 'कुल मुआवजा',
      pendingKYC: 'लंबित KYC',
      completedKYC: 'पूर्ण KYC',
      pendingPayments: 'लंबित भुगतान',
      recentProjects: 'हाल की परियोजनाएं',
      quickActions: 'त्वरित कार्य',
      createProject: 'नई परियोजना',
      uploadCSV: 'CSV अपलोड',
      viewVillages: 'गांव देखें',
      approveKYC: 'KYC अनुमोदित करें',
      hectares: 'हेक्टेयर',
      status: 'स्थिति',
      pending: 'लंबित',
      approved: 'अनुमोदित',
      rejected: 'अस्वीकृत'
    }
  };

  const t = translations[user?.language || 'marathi'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: any) => {
    // Handle both string and object status
    if (typeof status === 'string') {
      switch (status.toLowerCase()) {
        case 'pending':
          return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{t.pending}</Badge>;
        case 'approved':
          return <Badge variant="secondary" className="bg-green-100 text-green-800">{t.approved}</Badge>;
        case 'rejected':
          return <Badge variant="secondary" className="bg-red-100 text-red-800">{t.rejected}</Badge>;
        default:
          return <Badge variant="secondary" className="bg-gray-100 text-gray-800">{status}</Badge>;
      }
    }
    
    // Handle object status (project status object)
    if (typeof status === 'object' && status !== null) {
      const statusValues = Object.values(status);
      const hasApproved = statusValues.includes('approved');
      const hasRejected = statusValues.includes('rejected');
      const hasPending = statusValues.includes('pending');
      
      if (hasRejected) {
        return <Badge variant="secondary" className="bg-red-100 text-red-800">{t.rejected}</Badge>;
      } else if (hasApproved && !hasPending) {
        return <Badge variant="secondary" className="bg-green-100 text-green-800">{t.approved}</Badge>;
      } else {
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{t.pending}</Badge>;
      }
    }
    
    // Fallback
    return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Unknown</Badge>;
  };

  const recentProjects = projects.slice(0, 5);

  return (
    <GovernmentLayout>
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-6 space-y-6">
        {/* Dashboard Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 700,
                letterSpacing: '0.5px',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}>Dashboard</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 600,
                letterSpacing: '0.2px'
              }}>Land Acquisition Officer / भूसंपादन अधिकारी</span>
            </div>
          </div>
        </div>

      {/* Removed top-level stats cards. Summary now lives inside the Overview tab. */}

      {/* Main Content Tabs */}
      <Card className="bg-white/80 backdrop-blur-md border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-900">Land Acquisition Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                         <TabsList className="flex w-full bg-blue-50 overflow-x-auto">
               <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                 fontFamily: "'Noto Sans', 'Arial', sans-serif",
                 fontWeight: 500,
                 letterSpacing: '0.2px'
               }}>
                 <BarChart3 className="h-4 w-4 mr-1" />
                Dashboard
               </TabsTrigger>
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>
                <FileText className="h-4 w-4 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>
                <Building2 className="h-4 w-4 mr-1" />
                Project Management
              </TabsTrigger>
               <TabsTrigger value="jmr" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                 fontFamily: "'Noto Sans', 'Arial', sans-serif",
                 fontWeight: 500,
                 letterSpacing: '0.2px'
               }}>
                 <FileText className="h-4 w-4 mr-1" />
                 JMR Management
               </TabsTrigger>
               <TabsTrigger value="landRecords" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                 fontFamily: "'Noto Sans', 'Arial', sans-serif",
                 fontWeight: 500,
                 letterSpacing: '0.2px'
               }}>
                 <FileText className="h-4 w-4 mr-1" />
                 Land Records Management
               </TabsTrigger>
               {/* <TabsTrigger value="awardDeclaration" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                 fontFamily: "'Noto Sans', 'Arial', sans-serif",
                 fontWeight: 500,
                 letterSpacing: '0.2px'
               }}>
                 <Award className="h-4 w-4 mr-1" />
                 Award Declaration
               </TabsTrigger> */}
               {/* <TabsTrigger value="award" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                 fontFamily: "'Noto Sans', 'Arial', sans-serif",
                 fontWeight: 500,
                 letterSpacing: '0.2px'
               }}>
                 <Award className="h-4 w-4 mr-1" />
                 Award
               </TabsTrigger> */}
               <TabsTrigger value="notices" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                 fontFamily: "'Noto Sans', 'Arial', sans-serif",
                 fontWeight: 500,
                 letterSpacing: '0.2px'
               }}>
                 <FileText className="h-4 w-4 mr-1" />
                 Notice Generator
               </TabsTrigger>
               <TabsTrigger value="paymentSlips" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                 fontFamily: "'Noto Sans', 'Arial', sans-serif",
                 fontWeight: 500,
                 letterSpacing: '0.2px'
               }}>
                 <FileText className="h-4 w-4 mr-1" />
                 Payment Slips
               </TabsTrigger>
                               <TabsTrigger value="blockchain" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                  fontFamily: "'Noto Sans', 'Arial', sans-serif",
                  fontWeight: 500,
                  letterSpacing: '0.2px'
                }}>
                  <Hash className="h-4 w-4 mr-1" />
                  Blockchain
                </TabsTrigger>
             </TabsList>
            
                        <TabsContent value="dashboard" className="space-y-6 mt-6">
              <GlobalDashboard />
            </TabsContent>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <EnhancedDashboard />
            </TabsContent>

            <TabsContent value="projects" className="mt-6">
              <ProjectManagement />
            </TabsContent>

             <TabsContent value="landRecords" className="mt-6">
               <LandRecordsManager />
             </TabsContent>

             {/* <TabsContent value="awardDeclaration" className="mt-6">
               <EnhancedAwardManager />
             </TabsContent> */}

             <TabsContent value="jmr" className="mt-6">
               <JMRManager />
             </TabsContent>

             {/* <TabsContent value="award" className="mt-6">
               <EnhancedAwardManager />
             </TabsContent> */}

             <TabsContent value="notices" className="mt-6">
               <NoticeGenerator />
             </TabsContent>

             <TabsContent value="paymentSlips" className="mt-6">
               <PaymentSlipGenerator />
             </TabsContent>
                         <TabsContent value="blockchain" className="mt-6">
               <BlockchainDashboard />
             </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </GovernmentLayout>
  );
};

export default OfficerDashboard;