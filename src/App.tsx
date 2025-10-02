import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { SaralProvider } from "@/contexts/SaralContext";
import DashboardPage from "@/pages/saral/DashboardPage";
import Dashboard2Page from "@/pages/saral/Dashboard2Page";
import FieldOfficerPage from "@/pages/saral/FieldOfficerPage";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import HtmlLoginPage from "@/pages/saral/HtmlLoginPage";
import OfficerDashboard from "@/components/saral/officer/OfficerDashboard";

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

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SaralProvider>
          <BrowserRouter>
            <TooltipProvider>
              <Routes>
                <Route path="/" element={<Navigate to="/saral/login" replace />} />
                <Route path="/saral/login" element={<HtmlLoginPage />} />
                <Route path="/saral/dashboard" element={
                  <ProtectedRoute allowedRoles={['officer', 'admin']}>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/saral/dashboard2" element={
                  <ProtectedRoute allowedRoles={['officer', 'admin']}>
                    <Dashboard2Page />
                  </ProtectedRoute>
                } />
                <Route path="/field-officer" element={
                  <ProtectedRoute allowedRoles={['field_officer', 'officer', 'admin']}>
                    <FieldOfficerPage />
                  </ProtectedRoute>
                } />
                <Route path="/officer-dashboard" element={
                  <ProtectedRoute allowedRoles={['officer', 'admin']}>
                    <OfficerDashboard />
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