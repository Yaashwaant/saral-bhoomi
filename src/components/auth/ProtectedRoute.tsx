import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
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

  return <>{children}</>;
};

export default ProtectedRoute;
