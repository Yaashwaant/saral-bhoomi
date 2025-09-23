import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import FieldOfficerDashboard from '@/components/saral/field-officer/FieldOfficerDashboard';
import SaralHeader from '@/components/saral/layout/SaralHeader';

const FieldOfficerPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['field_officer', 'officer', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        <SaralHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Field Officer Portal</h1>
            <p className="text-gray-600 mt-2">
              Welcome, {user?.name || 'Field Officer'}. Manage your KYC assignments and document uploads.
            </p>
          </div>
          <FieldOfficerDashboard />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default FieldOfficerPage;
