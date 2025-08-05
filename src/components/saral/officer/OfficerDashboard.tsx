import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import SaralHeader from '@/components/saral/layout/SaralHeader';
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
  Download
} from 'lucide-react';
import ProjectManagement from './ProjectManagement';
import CSVUploadManager from './CSVUploadManager';
import VillageWiseReports from './VillageWiseReports';
import KYCApprovalQueue from './KYCApprovalQueue';
import PaymentInitiation from './PaymentInitiation';
import SurveyNumberManager from './SurveyNumberManager';
import NoticeGenerator from './NoticeGenerator';

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
      csvUpload: 'CSV अपलोड',
      surveys: 'सर्वे नंबर व्यवस्थापन',
      notices: 'नोटीस जनरेटर',
      villages: 'गावनिहाय अहवाल',
      kycApproval: 'KYC मंजुरी',
      payments: 'पेमेंट इनिशिएशन',
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
      csvUpload: 'CSV Upload',
      surveys: 'Survey Management',
      notices: 'Notice Generator',
      villages: 'Village Reports',
      kycApproval: 'KYC Approval',
      payments: 'Payment Initiation',
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
      csvUpload: 'CSV अपलोड',
      surveys: 'सर्वे प्रबंधन',
      notices: 'नोटिस जनरेटर',
      villages: 'गांव रिपोर्ट',
      kycApproval: 'KYC अनुमोदन',
      payments: 'भुगतान शुरुआत',
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
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700">{t.approved}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">{t.pending}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">{t.rejected}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SaralHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {t.welcome}, {user?.name}
          </h1>
          <p className="text-gray-600">{t.dashboard}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 bg-white border border-orange-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              {t.overview}
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              {t.projects}
            </TabsTrigger>
            <TabsTrigger value="csv" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              {t.csvUpload}
            </TabsTrigger>
            <TabsTrigger value="surveys" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              {t.surveys}
            </TabsTrigger>
            <TabsTrigger value="notices" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              {t.notices}
            </TabsTrigger>
            <TabsTrigger value="villages" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              {t.villages}
            </TabsTrigger>
            <TabsTrigger value="kyc" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              {t.kycApproval}
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              {t.payments}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{stats.totalProjects}</p>
                      <p className="text-sm text-gray-600">{t.totalProjects}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{stats.completedKYC}</p>
                      <p className="text-sm text-gray-600">{t.completedKYC}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <IndianRupee className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-lg font-bold text-gray-800">{formatCurrency(stats.totalCompensation)}</p>
                      <p className="text-sm text-gray-600">{t.totalCompensation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{stats.pendingPayments}</p>
                      <p className="text-sm text-gray-600">{t.pendingPayments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Projects and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Projects */}
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <span>{t.recentProjects}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projects.slice(0, 3).map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-800 truncate">
                            {project.projectName}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {project.landToBeAcquired} {t.hectares}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(project.status.stage3A)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FolderPlus className="h-5 w-5 text-orange-600" />
                    <span>{t.quickActions}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      className="flex items-center space-x-2 h-16 bg-blue-600 hover:bg-blue-700"
                      onClick={() => setActiveTab('projects')}
                    >
                      <FolderPlus className="h-5 w-5" />
                      <span className="text-sm">{t.createProject}</span>
                    </Button>
                    
                    <Button 
                      className="flex items-center space-x-2 h-16 bg-orange-600 hover:bg-orange-700"
                      onClick={() => setActiveTab('csv')}
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-sm">{t.uploadCSV}</span>
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="flex items-center space-x-2 h-16 border-green-200 text-green-700 hover:bg-green-50"
                      onClick={() => setActiveTab('villages')}
                    >
                      <MapPin className="h-5 w-5" />
                      <span className="text-sm">{t.viewVillages}</span>
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="flex items-center space-x-2 h-16 border-purple-200 text-purple-700 hover:bg-purple-50"
                      onClick={() => setActiveTab('kyc')}
                    >
                      <Users className="h-5 w-5" />
                      <span className="text-sm">{t.approveKYC}</span>
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="flex items-center space-x-2 h-16 border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => setActiveTab('notices')}
                    >
                      <FileText className="h-5 w-5" />
                      <span className="text-sm">Generate Notices</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <ProjectManagement />
          </TabsContent>

          <TabsContent value="csv">
            <CSVUploadManager />
          </TabsContent>

          <TabsContent value="surveys">
            <SurveyNumberManager />
          </TabsContent>

          <TabsContent value="notices">
            <NoticeGenerator />
          </TabsContent>

          <TabsContent value="villages">
            <VillageWiseReports />
          </TabsContent>

          <TabsContent value="kyc">
            <KYCApprovalQueue />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentInitiation />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OfficerDashboard;