import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FolderPlus, 
  Upload, 
  MapPin, 
  IndianRupee, 
  CheckCircle, 
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
  Workflow
} from 'lucide-react';
import emblemOfIndia from '../../../assets/images/emblem-of-india.png';
import ProjectManagement from './ProjectManagement';
import VillageWiseReports from './VillageWiseReports';
import KYCAssignmentManager from './KYCAssignmentManager';
import PaymentInitiation from './PaymentInitiation';
import NoticeGenerator from './NoticeGenerator';
import SimpleAgentAssignment from './SimpleAgentAssignment';
// Import new enhanced components
import EnhancedJMRManager from './EnhancedJMRManager';
import EnhancedAwardManager from './EnhancedAwardManager';
import LandRecordsManager from './LandRecordsManager';
import EnhancedPaymentManager from './EnhancedPaymentManager';
import EnhancedDashboard from './EnhancedDashboard';
import DocumentUploadPortal from './DocumentUploadPortal';

const OfficerDashboard = () => {
  const { user } = useAuth();
  const { getProjectStats, projects, landownerRecords } = useSaral();
  const [activeTab, setActiveTab] = useState('overview');
  
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
      landRecordsManagement: 'भूमी रेकॉर्ड व्यवस्थापन',
      jmr: 'JMR',
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
      dashboard: 'Land Officer Dashboard',
      overview: 'Overview',
      projects: 'Project Management',
      notices: 'Notice Generator',
      villages: 'Village Reports',
      kycApproval: 'KYC Approval',
      payments: 'Payment Initiation',
      enhancedPayment: 'Enhanced Payment',
      documentUpload: 'Document Upload',
      landRecordsManagement: 'Land Records Management',
      jmr: 'JMR',
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
      dashboard: 'भूमि अधिकारी डैशबोर्ड',
      overview: 'सारांश',
      projects: 'परियोजना प्रबंधन',
      notices: 'नोटिस जनरेटर',
      villages: 'गांव रिपोर्ट',
      kycApproval: 'KYC अनुमोदन',
      payments: 'भुगतान शुरुआत',
      enhancedPayment: 'एन्हान्स्ड Payment',
      documentUpload: 'Document Upload',
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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ 
              fontFamily: "'Noto Sans', 'Arial', sans-serif",
              fontWeight: 700,
              letterSpacing: '0.5px',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>{t.welcome}, {user?.name}!</h1>
            <p className="text-blue-100 mt-1" style={{ 
              fontFamily: "'Noto Sans', 'Arial', sans-serif",
              fontWeight: 500,
              letterSpacing: '0.2px'
            }}>{t.dashboard}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium" style={{ 
              fontFamily: "'Noto Sans', 'Arial', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.2px'
            }}>Land Officer</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/80 backdrop-blur-md border-blue-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">{t.totalProjects}</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalProjects}</div>
            <p className="text-xs text-blue-600 mt-1">Land acquisition projects</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border-orange-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">{t.totalCompensation}</CardTitle>
            <IndianRupee className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{formatCurrency(stats.totalCompensation)}</div>
            <p className="text-xs text-orange-600 mt-1">Total compensation amount</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border-green-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">{t.pendingKYC}</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.pendingKYC}</div>
            <p className="text-xs text-green-600 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border-purple-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">{t.pendingPayments}</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{stats.pendingPayments}</div>
            <p className="text-xs text-purple-600 mt-1">Payment processing</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card className="bg-white/80 backdrop-blur-md border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-900">Land Acquisition Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex w-full bg-blue-50 overflow-x-auto">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>
                {t.projects}
              </TabsTrigger>
              <TabsTrigger value="landRecords" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>
                <FileText className="h-4 w-4 mr-1" />
                {t.landRecordsManagement}
              </TabsTrigger>
              <TabsTrigger value="jmr" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>
                <Database className="h-4 w-4 mr-1" />
                {t.jmr}
              </TabsTrigger>
              <TabsTrigger value="award" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>
                <Award className="h-4 w-4 mr-1" />
                {t.award}
              </TabsTrigger>
              <TabsTrigger value="notices" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>
                {t.notices}
              </TabsTrigger>
              <TabsTrigger value="villages" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>
                {t.villages}
              </TabsTrigger>
              <TabsTrigger value="kyc" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>
                {t.kycApproval}
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>
                {t.payments}
              </TabsTrigger>
              <TabsTrigger value="enhancedPayment" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>
                <Banknote className="h-4 w-4 mr-1" />
                {t.enhancedPayment}
              </TabsTrigger>
              <TabsTrigger value="documentUpload" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>
                <Workflow className="h-4 w-4 mr-1" />
                {t.documentUpload}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <EnhancedDashboard />
            </TabsContent>

            <TabsContent value="projects" className="mt-6">
              <ProjectManagement />
            </TabsContent>

            <TabsContent value="landRecords" className="mt-6">
              <LandRecordsManager />
            </TabsContent>

            <TabsContent value="jmr" className="mt-6">
              <EnhancedJMRManager />
            </TabsContent>

            <TabsContent value="award" className="mt-6">
              <EnhancedAwardManager />
            </TabsContent>

            <TabsContent value="notices" className="mt-6">
              <NoticeGenerator />
            </TabsContent>

            <TabsContent value="villages" className="mt-6">
              <VillageWiseReports />
            </TabsContent>

            <TabsContent value="kyc" className="mt-6">
              <KYCAssignmentManager />
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <PaymentInitiation />
            </TabsContent>
            <TabsContent value="enhancedPayment" className="mt-6">
              <EnhancedPaymentManager />
            </TabsContent>
            <TabsContent value="documentUpload" className="mt-6">
              <DocumentUploadPortal />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfficerDashboard;