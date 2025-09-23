import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Give a small delay to allow auth context to initialize
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-lg p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-blue-800" style={{ 
            fontFamily: "'Noto Sans', 'Arial', sans-serif",
            fontWeight: 600,
            letterSpacing: '0.2px'
          }}>Loading...</h2>
          <p className="text-blue-600 mt-2" style={{ 
            fontFamily: "'Noto Sans', 'Arial', sans-serif",
            fontWeight: 500,
            letterSpacing: '0.1px'
          }}>Please wait while we verify your authentication</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/saral/login" replace />;
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-lg p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-red-800 mb-4">Access Denied</h2>
          <p className="text-red-600">
            User role '{user.role}' is not authorized to access this route. Required roles: {allowedRoles.join(', ')}
          </p>
          <button 
            onClick={() => window.history.back()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
