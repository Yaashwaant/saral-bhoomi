import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import GovernmentLayout from '@/components/layout/GovernmentLayout';
import AdminDashboard from '@/components/saral/admin/AdminDashboard';
import OfficerDashboard from '@/components/saral/officer/OfficerDashboard';
import SimpleAgentDashboard from '@/components/saral/agent/SimpleAgentDashboard';

const DashboardPage = () => {
  const { user } = useAuth();

  const getDashboardContent = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'officer':
        return <OfficerDashboard />;
      case 'agent':
        return <SimpleAgentDashboard />;
      default:
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-160px)]">
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-lg p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-red-600" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 600,
                letterSpacing: '0.2px'
              }}>Unauthorized Access</h2>
              <p className="text-blue-600 mt-2" style={{ 
                fontFamily: "'Noto Sans', 'Arial', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.1px'
              }}>Your role is not recognized.</p>
            </div>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (user.role) {
      case 'admin':
        return 'Admin Dashboard';
      case 'officer':
        return 'Officer Dashboard';
      case 'agent':
        return 'Agent Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const getSubtitle = () => {
    switch (user.role) {
      case 'admin':
        return 'System Administration & Management';
      case 'officer':
        return 'Land Acquisition Management';
      case 'agent':
        return 'Field Operations & Data Collection';
      default:
        return 'System Dashboard';
    }
  };

  return (
    <GovernmentLayout title={getTitle()} subtitle={getSubtitle()}>
      <div className="container mx-auto px-4 py-6">
        {getDashboardContent()}
      </div>
    </GovernmentLayout>
  );
};

export default DashboardPage;