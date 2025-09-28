import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { SaralProvider } from "@/contexts/SaralContext";
import LoginPage from "@/pages/saral/LoginPage";
import DashboardPage from "@/pages/saral/DashboardPage";
import FieldOfficerPage from "@/pages/saral/FieldOfficerPage";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

// Component to redirect to HTML login page
const HtmlLoginRedirect = () => {
  useEffect(() => {
    window.location.href = '/login.html';
  }, []);
  return null;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SaralProvider>
          <BrowserRouter>
            <TooltipProvider>
              <Routes>
                <Route path="/" element={<Navigate to="/saral/login" replace />} />
                <Route path="/saral/login" element={<HtmlLoginRedirect />} />
                <Route path="/saral/dashboard" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/field-officer" element={
                  <ProtectedRoute allowedRoles={['field_officer', 'officer', 'admin']}>
                    <FieldOfficerPage />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/saral/login" replace />} />
              </Routes>
              <Toaster />
            </TooltipProvider>
          </BrowserRouter>
        </SaralProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;