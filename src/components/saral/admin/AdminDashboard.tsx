import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  FileText, 
  Activity, 
  TrendingUp, 
  Settings,
  Upload,
  Eye,
  UserPlus,
  Download,
  Shield,
  Building2,
  MapPin,
  Hash,
  Workflow,
  Database
} from 'lucide-react';
import emblemOfIndia from '../../../assets/images/emblem-of-india.png';
import UserManagement from './UserManagement';
import NoticeHeaderManagement from './NoticeHeaderManagement';
import NoticeTemplateCreator from './NoticeTemplateCreator';
import SystemSettings from './SystemSettings';
// Import new enhanced components
import BlockchainDashboard from './BlockchainDashboard';
import CompleteWorkflowManager from './CompleteWorkflowManager';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { getProjectStats } = useSaral();
  const [activeTab, setActiveTab] = useState('overview');
  
  const stats = getProjectStats();

  const translations = {
    marathi: {
      welcome: 'स्वागत',
      dashboard: 'प्रशासकीय डॅशबोर्ड',
      overview: 'सारांश',
      userManagement: 'वापरकर्ता व्यवस्थापन',
      noticeHeaders: 'नोटीस हेडर',
      systemSettings: 'सिस्टम सेटिंग्स',
      blockchainDashboard: 'ब्लॉकचेन डॅशबोर्ड',
      workflowManager: 'वर्कफ्लो मॅनेजर',
      totalProjects: 'एकूण प्रकल्प',
      activeProjects: 'सक्रिय प्रकल्प',
      totalUsers: 'एकूण वापरकर्ते',
      systemHealth: 'सिस्टम आरोग्य',
      recentActivity: 'अलीकडील क्रियाकलाप',
      quickActions: 'जलद कृती',
      addUser: 'वापरकर्ता जोडा',
      uploadHeader: 'हेडर अपलोड करा',
      viewReports: 'अहवाल पाहा',
      systemConfig: 'सिस्टम कॉन्फिगरेशन'
    },
    english: {
      welcome: 'Welcome',
      dashboard: 'Administrator Dashboard',
      overview: 'Overview',
      userManagement: 'User Management',
      noticeHeaders: 'Notice Headers',
      systemSettings: 'System Settings',
      blockchainDashboard: 'Blockchain Dashboard',
      workflowManager: 'Workflow Manager',
      totalProjects: 'Total Projects',
      activeProjects: 'Active Projects',
      totalUsers: 'Total Users',
      systemHealth: 'System Health',
      recentActivity: 'Recent Activity',
      quickActions: 'Quick Actions',
      addUser: 'Add User',
      uploadHeader: 'Upload Header',
      viewReports: 'View Reports',
      systemConfig: 'System Configuration'
    },
    hindi: {
      welcome: 'स्वागत',
      dashboard: 'प्रशासनिक डैशबोर्ड',
      overview: 'सारांश',
      userManagement: 'उपयोगकर्ता प्रबंधन',
      noticeHeaders: 'नोटिस हेडर',
      systemSettings: 'सिस्टम सेटिंग्स',
      blockchainDashboard: 'ब्लॉकचेन डैशबोर्ड',
      workflowManager: 'वर्कफ्लो मैनेजर',
      totalProjects: 'कुल परियोजनाएं',
      activeProjects: 'सक्रिय परियोजनाएं',
      totalUsers: 'कुल उपयोगकर्ता',
      systemHealth: 'सिस्टम स्वास्थ्य',
      recentActivity: 'हाल की गतिविधि',
      quickActions: 'त्वरित कार्य',
      addUser: 'उपयोगकर्ता जोड़ें',
      uploadHeader: 'हेडर अपलोड करें',
      viewReports: 'रिपोर्ट देखें',
      systemConfig: 'सिस्टम कॉन्फ़िगरेशन'
    }
  };

  const t = translations[user?.language || 'marathi'];

  const recentActivities = [
    { action: 'New project created: महाराष्ट्र औद्योगिक विकास प्रकल्प', time: '2 hours ago', type: 'project' },
    { action: 'Notice header uploaded by Admin', time: '4 hours ago', type: 'notice' },
    { action: 'KYC approved for survey no. 40', time: '6 hours ago', type: 'kyc' },
    { action: 'Payment initiated for ₹80,21,026', time: '1 day ago', type: 'payment' },
    { action: 'New agent assigned to project', time: '2 days ago', type: 'user' }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'notice':
        return <FileText className="h-4 w-4 text-orange-600" />;
      case 'kyc':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'payment':
        return <TrendingUp className="h-4 w-4 text-purple-600" />;
      case 'user':
        return <Users className="h-4 w-4 text-indigo-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

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
            }}>Administrator</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800" style={{ 
              fontFamily: "'Noto Sans', 'Arial', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.2px'
            }}>{t.totalProjects}</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalProjects}</div>
            <p className="text-xs text-blue-600 mt-1">Active land acquisition projects</p>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-orange-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800" style={{ 
              fontFamily: "'Noto Sans', 'Arial', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.2px'
            }}>{t.activeProjects}</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.activeProjects}</div>
            <p className="text-xs text-orange-600 mt-1">Currently in progress</p>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-green-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800" style={{ 
              fontFamily: "'Noto Sans', 'Arial', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.2px'
            }}>{t.totalUsers}</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.totalUsers}</div>
            <p className="text-xs text-green-600 mt-1">Registered system users</p>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-purple-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800" style={{ 
              fontFamily: "'Noto Sans', 'Arial', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.2px'
            }}>{t.systemHealth}</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">98%</div>
            <p className="text-xs text-purple-600 mt-1">System performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-900" style={{ 
            fontFamily: "'Noto Sans', 'Arial', sans-serif",
            fontWeight: 600,
            letterSpacing: '0.2px'
          }}>System Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-blue-50">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>
                {t.overview}
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>
                {t.userManagement}
              </TabsTrigger>
              <TabsTrigger value="notices" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>
                {t.noticeHeaders}
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>
                {t.systemSettings}
              </TabsTrigger>
              <TabsTrigger value="blockchain" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>
                <Hash className="h-4 w-4 mr-1" />
                {t.blockchainDashboard}
              </TabsTrigger>
              <TabsTrigger value="workflow" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.2px'
              }}>
                <Workflow className="h-4 w-4 mr-1" />
                {t.workflowManager}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-900 flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>{t.recentActivity}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50/50 rounded-lg">
                          {getActivityIcon(activity.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900">{activity.action}</p>
                            <p className="text-xs text-blue-600">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-orange-900 flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>{t.quickActions}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t.addUser}
                      </Button>
                      <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                        <Upload className="h-4 w-4 mr-2" />
                        {t.uploadHeader}
                      </Button>
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                        <Eye className="h-4 w-4 mr-2" />
                        {t.viewReports}
                      </Button>
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        <Settings className="h-4 w-4 mr-2" />
                        {t.systemConfig}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <UserManagement />
            </TabsContent>

            <TabsContent value="notices" className="mt-6">
              <NoticeHeaderManagement />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <SystemSettings />
            </TabsContent>
            <TabsContent value="blockchain" className="mt-6">
              <BlockchainDashboard />
            </TabsContent>
            <TabsContent value="workflow" className="mt-6">
              <CompleteWorkflowManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;