import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { BarChart3, Database, FileText, Banknote, Users } from 'lucide-react';
import { config } from '../../../config';

interface DashboardStats {
  totalLand: number;
  totalNotices: number;
  totalPayments: number;
  tribalCount: number;
  nonTribalCount: number;
  pendingPayments: number;
  successfulPayments: number;
  failedPayments: number;
}

const EnhancedDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useSaral();
  
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalLand: 0,
    totalNotices: 0,
    totalPayments: 0,
    tribalCount: 0,
    nonTribalCount: 0,
    pendingPayments: 0,
    successfulPayments: 0,
    failedPayments: 0
  });

  const API_BASE_URL = config.API_BASE_URL;

  const loadDashboardData = useCallback(async () => {
    if (!selectedProject) return;
    
    setLoading(true);
    try {
      // Placeholder for data loading
      setStats({
        totalLand: 100.5,
        totalNotices: 50000,
        totalPayments: 45000,
        tribalCount: 25,
        nonTribalCount: 75,
        pendingPayments: 5,
        successfulPayments: 20,
        failedPayments: 2
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject) {
      loadDashboardData();
    }
  }, [selectedProject, loadDashboardData]);

  const projectOptions = projects.map(p => ({ 
    id: p.id, 
    name: (p as any).projectName || (p as any).name || p.id 
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Enhanced Dashboard - Land Records & Payments Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="project">Select Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {projectOptions.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedProject && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="records">Records</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
              {/* Statistics Cards */}
                <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Land (Ha)</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalLand.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Measured area</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Notices</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{stats.totalNotices.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Notice amounts</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{stats.totalPayments.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Payment amounts</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tribal vs Non-Tribal</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.tribalCount}/{stats.nonTribalCount}</div>
                    <p className="text-xs text-muted-foreground">Tribal/Non-Tribal</p>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Status Breakdown */}
                <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Pending</span>
                        <Badge variant="outline">{stats.pendingPayments}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Successful</span>
                        <Badge variant="default">{stats.successfulPayments}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Failed</span>
                        <Badge variant="destructive">{stats.failedPayments}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </div>
              </TabsContent>

              {/* Records Tab */}
              <TabsContent value="records" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Land Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Database className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>Records view coming soon...</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Analytics Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>Advanced analytics coming soon...</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
          )}

          {!selectedProject && (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>Please select a project to view the dashboard.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedDashboard;
