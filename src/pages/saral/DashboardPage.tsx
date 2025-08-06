import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from '@/components/saral/admin/AdminDashboard';
import OfficerDashboard from '@/components/saral/officer/OfficerDashboard';
import SimpleAgentDashboard from '@/components/saral/agent/SimpleAgentDashboard';

const DashboardPage = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
        </div>
      </div>
    );
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'officer':
      return <OfficerDashboard />;
    case 'agent':
      return <SimpleAgentDashboard />;
    default:
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600">Unauthorized Access</h2>
            <p className="text-gray-600">Your role is not recognized.</p>
          </div>
        </div>
      );
  }
};

export default DashboardPage;