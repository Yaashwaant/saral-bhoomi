import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import SaralHeader from '@/components/saral/layout/SaralHeader';
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
  Download
} from 'lucide-react';
import UserManagement from './UserManagement';
import NoticeHeaderManagement from './NoticeHeaderManagement';
import NoticeTemplateCreator from './NoticeTemplateCreator';
import SystemSettings from './SystemSettings';

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
      case 'project': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'notice': return <Upload className="h-4 w-4 text-orange-600" />;
      case 'kyc': return <Users className="h-4 w-4 text-green-600" />;
      case 'payment': return <TrendingUp className="h-4 w-4 text-purple-600" />;
      case 'user': return <UserPlus className="h-4 w-4 text-indigo-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
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
          <TabsList className="grid w-full grid-cols-5 bg-white border border-orange-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              {t.overview}
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              {t.userManagement}
            </TabsTrigger>
            <TabsTrigger value="notices" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              {t.noticeHeaders}
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              Notice Templates
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              {t.systemSettings}
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
                    <Activity className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{stats.activeProjects}</p>
                      <p className="text-sm text-gray-600">{t.activeProjects}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-800">15</p>
                      <p className="text-sm text-gray-600">{t.totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-2xl font-bold text-gray-800">98%</p>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Online</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{t.systemHealth}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-orange-600" />
                    <span>{t.recentActivity}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">{activity.action}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
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
                    <Settings className="h-5 w-5 text-orange-600" />
                    <span>{t.quickActions}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      className="flex items-center space-x-2 h-16 bg-blue-600 hover:bg-blue-700"
                      onClick={() => setActiveTab('users')}
                    >
                      <UserPlus className="h-5 w-5" />
                      <span className="text-sm">{t.addUser}</span>
                    </Button>
                    
                    <Button 
                      className="flex items-center space-x-2 h-16 bg-orange-600 hover:bg-orange-700"
                      onClick={() => setActiveTab('notices')}
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-sm">{t.uploadHeader}</span>
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="flex items-center space-x-2 h-16 border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <Eye className="h-5 w-5" />
                      <span className="text-sm">{t.viewReports}</span>
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="flex items-center space-x-2 h-16 border-purple-200 text-purple-700 hover:bg-purple-50"
                      onClick={() => setActiveTab('settings')}
                    >
                      <Settings className="h-5 w-5" />
                      <span className="text-sm">{t.systemConfig}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="notices">
            <NoticeHeaderManagement />
          </TabsContent>

          <TabsContent value="templates">
            <NoticeTemplateCreator />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;