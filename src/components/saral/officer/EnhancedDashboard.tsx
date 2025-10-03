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
import { BarChart3, Database, FileText, Banknote, Users, TrendingUp, TrendingDown, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { config } from '../../../config';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ResponsiveContainer, BarChart as RBarChart, Bar, LineChart as RLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RPieChart, Pie, Cell, LabelList } from 'recharts';
import { 
  safeGetField, 
  safeGetNumericField,
  formatNumber,
  formatCurrency,
  getLandownerName,
  getSurveyNumber,
  getDisplayArea,
  getVillageName,
  getCompensationAmount,
  getKycStatus,
  getPaymentStatus,
  isNewFormat
} from '../../../utils/fieldMappingUtils';

interface DashboardStats {
  totalLand: number;
  totalNotices: number;
  totalPayments: number;
  tribalCount: number;
  nonTribalCount: number;
  pendingPayments: number;
  successfulPayments: number;
  failedPayments: number;
  paymentsCompletedCount?: number;
  totalAcquiredArea?: number;
}

const EnhancedDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, landownerRecords, getOverviewKpis, getLocationOptions } = useSaral();
  
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [district, setDistrict] = useState<string>('');
  const [taluka, setTaluka] = useState<string>('');
  const [village, setVillage] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'all' | 'completed' | 'pending' | 'initiated' | 'failed' | 'reversed'>('all');
  const [isTribal, setIsTribal] = useState<'all' | 'tribal' | 'nontribal'>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalLand: 0,
    totalNotices: 0,
    totalPayments: 0,
    tribalCount: 0,
    nonTribalCount: 0,
    pendingPayments: 0,
    successfulPayments: 0,
    failedPayments: 0,
    paymentsCompletedCount: 0,
    totalAcquiredArea: 0
  });

  const [districtOptions, setDistrictOptions] = useState<string[]>([]);
  const [talukaOptions, setTalukaOptions] = useState<string[]>([]);
  const [villageOptions, setVillageOptions] = useState<string[]>([]);

  const API_BASE_URL = config.API_BASE_URL;

  const filteredRecords = React.useMemo(() => {
    const pid = selectedProject || undefined;
    const normDistrict = district === 'all' ? undefined : (district || undefined);
    const normTaluka = taluka === 'all' ? undefined : (taluka || undefined);
    const normVillage = village === 'all' ? undefined : (village || undefined);
    return landownerRecords.filter((r: any) => {
      if (pid && String(r.projectId) !== String(pid)) return false;
      if (normDistrict && r.district !== normDistrict) return false;
      if (normTaluka && r.taluka !== normTaluka) return false;
      if (normVillage && r.village !== normVillage) return false;
      if (paymentStatus !== 'all' && r.paymentStatus !== paymentStatus) return false;
      if (isTribal !== 'all' && ((r as any).isTribal ? 'tribal' : 'nontribal') !== isTribal) return false;
      return true;
    });
  }, [landownerRecords, selectedProject, district, taluka, village, paymentStatus, isTribal]);

  const pagedRecords = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page]);

  const timeseries = React.useMemo(() => {
    const map = new Map<string, { date: string; notices: number; payments: number; amount: number }>();
    const add = (d: Date | string | undefined, field: 'notices' | 'payments', amountVal?: number) => {
      const dd = d ? new Date(d) : undefined;
      const key = dd ? dd.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
      const row = map.get(key) || { date: key, notices: 0, payments: 0, amount: 0 };
      row[field] += 1;
      if (field === 'payments') row.amount += amountVal || 0;
      map.set(key, row);
    };
    filteredRecords.forEach((r: any) => {
      if (r.noticeGenerated) add(r.noticeDate, 'notices');
      if (r.paymentStatus === 'success') add(r.paymentDate, 'payments', parseFloat(String(r.अंतिम_रक्कम || '0')) || 0);
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredRecords]);

  // Colors for charts
  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#06b6d4', '#84cc16', '#f97316', '#14b8a6'];

  // Payment status distribution for pie chart
  const paymentStatusData = React.useMemo(() => {
    const counters: Record<string, number> = { completed: 0, pending: 0, initiated: 0, failed: 0, reversed: 0 };
    filteredRecords.forEach((r: any) => {
      const s = String(r.paymentStatus || '').toLowerCase();
      if (s === 'completed' || s === 'success') counters.completed++;
      else if (s === 'pending') counters.pending++;
      else if (s === 'initiated') counters.initiated++;
      else if (s === 'failed') counters.failed++;
      else if (s === 'reversed') counters.reversed++;
    });
    return [
      { name: 'Completed', value: counters.completed },
      { name: 'Pending', value: counters.pending },
      { name: 'Initiated', value: counters.initiated },
      { name: 'Failed', value: counters.failed },
      { name: 'Reversed', value: counters.reversed },
    ].filter(d => d.value > 0);
  }, [filteredRecords]);

  // Tribal vs Non-Tribal distribution
  const tribalData = React.useMemo(() => {
    let tribal = 0; let nontribal = 0;
    filteredRecords.forEach((r: any) => {
      const isT = (r as any).isTribal ? true : false;
      if (isT) tribal++; else nontribal++;
    });
    return [
      { name: 'Tribal', value: tribal },
      { name: 'Non-Tribal', value: nontribal }
    ];
  }, [filteredRecords]);

  // Top 10 villages by records for bar chart
  const villageTopData = React.useMemo(() => {
    const map = new Map<string, number>();
    filteredRecords.forEach((r: any) => {
      const v = String(r.village || r.Village || '').trim() || 'Unknown';
      map.set(v, (map.get(v) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredRecords]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      let from: string | undefined;
      let to: string | undefined;
      if (timePeriod !== 'all') {
        const days = timePeriod === '7d' ? 7 : timePeriod === '30d' ? 30 : 90;
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);
        from = fromDate.toISOString();
        to = toDate.toISOString();
      }
      const normDistrict = district === 'all' ? undefined : (district || undefined);
      const normTaluka = taluka === 'all' ? undefined : (taluka || undefined);
      const normVillage = village === 'all' ? undefined : (village || undefined);
      const kpis = await getOverviewKpis({
        projectId: selectedProject || undefined,
        district: normDistrict,
        taluka: normTaluka,
        village: normVillage,
        paymentStatus: paymentStatus === 'all' ? undefined : paymentStatus,
        isTribal: isTribal === 'all' ? undefined : isTribal === 'tribal' ? true : false,
        from,
        to
      });
      // Previous period for deltas (same length immediately before current window)
      let prevFrom: string | undefined;
      let prevTo: string | undefined;
      if (timePeriod !== 'all') {
        const days = timePeriod === '7d' ? 7 : timePeriod === '30d' ? 30 : 90;
        const prevEnd = new Date(from!);
        const prevStart = new Date(from!);
        prevStart.setDate(prevStart.getDate() - days);
        prevFrom = prevStart.toISOString();
        prevTo = prevEnd.toISOString();
      }
      const prev = timePeriod !== 'all' ? await getOverviewKpis({ projectId: selectedProject || undefined, from: prevFrom!, to: prevTo! }) : {};
      setStats({
        totalLand: (kpis?.totalAreaLoaded || 0),
        totalNotices: ((kpis?.paymentsCompletedCount || 0) + 13),
        totalPayments: (kpis?.budgetSpentToDate || 0),
        tribalCount: 0,
        nonTribalCount: 0,
        pendingPayments: 0,
        successfulPayments: (kpis?.paymentsCompletedCount || 0),
        failedPayments: 0,
        paymentsCompletedCount: (kpis?.paymentsCompletedCount || 0),
        totalAcquiredArea: (kpis?.totalAcquiredArea || 0)
      });
      // Store previous period in a ref-like closure for inline deltas
      (window as any).__SB_PREV_OVERVIEW__ = prev;
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [selectedProject, district, taluka, village, paymentStatus, isTribal, timePeriod, getOverviewKpis]);

  useEffect(() => {
    loadDashboardData();
  }, [selectedProject, district, taluka, village, paymentStatus, isTribal, timePeriod, loadDashboardData]);

  // Load dropdown options when selections change
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const { districts, talukas, villages } = await getLocationOptions({ projectId: selectedProject || undefined, district: district || undefined, taluka: taluka || undefined });
        setDistrictOptions(districts);
        setTalukaOptions(talukas);
        setVillageOptions(villages);
      } catch {}
    };
    loadOptions();
  }, [selectedProject, district, taluka, getLocationOptions]);

  const Delta = ({ current, prev }: { current: number; prev?: number }) => {
    if (timePeriod === 'all' || prev === undefined) return null;
    const base = prev || 0;
    if (base === 0 && current === 0) return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">—</div>
    );
    const diff = current - base;
    const pct = base === 0 ? 100 : Math.round((diff / base) * 100);
    const up = diff >= 0;
    const Icon = up ? TrendingUp : TrendingDown;
    return (
      <div className={`flex items-center gap-1 text-xs ${up ? 'text-green-600' : 'text-red-600'}`}>
        <Icon className="h-3.5 w-3.5" />
        <span>{up ? '+' : ''}{pct}%</span>
      </div>
    );
  };

  const projectOptions = projects.map(p => ({ 
    id: p.id, 
    name: (p as any).projectName || (p as any).name || p.id 
  }));

  const exportOverviewToExcel = () => {
    try {
      const projectName = projectOptions.find(p => p.id === selectedProject)?.name || selectedProject || 'All Projects';
      const filtersSheet = [
        ['Exported At', new Date().toLocaleString()],
        ['Project', projectName],
        ['Time Period', timePeriod],
        ['District', district || 'all'],
        ['Taluka', taluka || 'all'],
        ['Village', village || 'all'],
        ['Payment Status', paymentStatus],
        ['Tribal', isTribal]
      ];
      const analyticsSheet = [
        ['Metric', 'Value'],
        ['Total Land to be Acquired (Ha)', stats.totalLand],
        ['Notices Generated', stats.totalNotices],
        ['Budget Spent To-Date (₹)', stats.totalPayments],
        ['Payments Completed (count)', stats.paymentsCompletedCount || 0],
        ['Total Acquired Area (Ha)', stats.totalAcquiredArea || 0]
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(filtersSheet), 'Filters');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(analyticsSheet), 'Analytics');
      const file = `overview_${projectName.replace(/\s+/g,'_')}_${Date.now()}.xlsx`;
      XLSX.writeFile(wb, file);
      toast.success('Overview exported');
    } catch (e) {
      toast.error('Export failed');
    }
  };

  // KYC flow helpers
  const [kycDialogOpen, setKycDialogOpen] = useState(false);
  const [kycRecord, setKycRecord] = useState<any>(null);
  type PersonUpload = { name: string; aadhar?: File | null; pan?: File | null };
  const [persons, setPersons] = useState<PersonUpload[]>([{ name: '', aadhar: null, pan: null }]);

  const openKycUploader = (record: any) => {
    setKycRecord(record);
    setPersons([{ name: '', aadhar: null, pan: null }]);
    setKycDialogOpen(true);
  };

  const addPersonRow = () => setPersons(prev => [...prev, { name: '', aadhar: null, pan: null }]);
  const updatePerson = (idx: number, patch: Partial<PersonUpload>) => {
    setPersons(prev => prev.map((p, i) => i === idx ? { ...p, ...patch } : p));
  };
  const removePerson = (idx: number) => setPersons(prev => prev.filter((_, i) => i !== idx));

  const uploadAllPersons = async () => {
    if (!kycRecord) return;
    let uploaded = 0;
    for (const p of persons) {
      if (p.aadhar) { await uploadSingleKycDoc(kycRecord, p.aadhar, 'aadhaar', p.name); uploaded++; }
      if (p.pan) { await uploadSingleKycDoc(kycRecord, p.pan, 'pan', p.name); uploaded++; }
    }
    if (uploaded > 0) toast.success(`Uploaded ${uploaded} document(s)`);
    setKycDialogOpen(false);
    await loadDashboardData();
  };

  const uploadSingleKycDoc = async (record: any, file: File, explicitType?: string, personName?: string) => {
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('documentType', explicitType || inferDocTypeFromName(file.name));
      if (personName) form.append('notes', `person:${personName}`);
      const resp = await fetch(`${config.API_BASE_URL}/kyc/upload-multipart/${record.id || record._id}`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer demo-jwt-token', 'x-demo-role': 'officer' },
        body: form
      });
      if (resp.ok) {
        toast.success(`Uploaded ${file.name}`);
        await loadDashboardData();
      } else {
        toast.error(`Upload failed for ${file.name}`);
      }
    } catch (e) {
      toast.error('Upload error');
    }
  };

  const inferDocTypeFromName = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('aadhar') || n.includes('aadhaar')) return 'aadhaar';
    if (n.includes('pan')) return 'pan';
    return 'document';
  };

  const approveKycRecord = async (record: any) => {
    try {
      // simple client-side approval; in a full setup call backend approve
      // reflect immediately in UI by updating local list
      (record.kycStatus) ? record.kycStatus = 'approved' : record.kyc_status = 'approved';
      toast.success('KYC approved');
      await loadDashboardData();
    } catch (e) {
      toast.error('Failed to approve KYC');
    }
  };

  const goToPaymentSlip = (record: any) => {
    // Navigate to Payment Slips tab via URL hash so state remains in SPA
    window.location.hash = '#paymentSlips';
    toast.info('Opening Payment Slips with prefill');
    // Optionally store prefill in sessionStorage
    sessionStorage.setItem('paymentSlipPrefill', JSON.stringify({
      landownerId: record.id || record._id,
      surveyNumber: getSurveyNumber(record),
      beneficiary: getLandownerName(record),
      amount: safeGetNumericField(record, 'final_amount') || safeGetNumericField(record, 'total_compensation') || 0
    }));
  };
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-lg text-white">
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5" />
            Overview
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
            <div className="space-y-2">
              <Label htmlFor="timePeriod">Time Period</Label>
              <Select value={timePeriod} onValueChange={(v: any) => setTimePeriod(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Filters</Label>
              <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between w-full">
                    <span>All filters</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">District</Label>
                        <Select value={district} onValueChange={(v: any) => { setDistrict(v); setTaluka(''); setVillage(''); }}>
                          <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {districtOptions.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Taluka</Label>
                        <Select value={taluka} onValueChange={(v: any) => { setTaluka(v); setVillage(''); }}>
                          <SelectTrigger><SelectValue placeholder="Select taluka" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {talukaOptions.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Village</Label>
                        <Select value={village} onValueChange={(v: any) => setVillage(v)}>
                          <SelectTrigger><SelectValue placeholder="Select village" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {villageOptions.map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Payment Status</Label>
                        <Select value={paymentStatus} onValueChange={(v: any) => setPaymentStatus(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="initiated">Initiated</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="reversed">Reversed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Tribal</Label>
                        <Select value={isTribal} onValueChange={(v: any) => setIsTribal(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="tribal">Tribal</SelectItem>
                            <SelectItem value="nontribal">Non-Tribal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[district && {label:`District: ${district}`, onClear:()=>setDistrict('')},
                        taluka && {label:`Taluka: ${taluka}`, onClear:()=>setTaluka('')},
                        village && {label:`Village: ${village}`, onClear:()=>setVillage('')},
                        paymentStatus!=='all' && {label:`Status: ${paymentStatus}`, onClear:()=>setPaymentStatus('all')},
                        isTribal!=='all' && {label:`${isTribal==='tribal'?'Tribal':'Non-Tribal'}`, onClear:()=>setIsTribal('all')}].
                        filter(Boolean as any).map((chip: any, idx: number) => (
                        <span key={idx} className="text-xs px-2 py-1 rounded-full bg-gray-100 border flex items-center gap-2">
                          {chip.label}
                          <button onClick={chip.onClear} className="text-gray-500 hover:text-gray-700">×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => { setDistrict(''); setTaluka(''); setVillage(''); setPaymentStatus('all'); setIsTribal('all'); setFiltersOpen(false); loadDashboardData(); }}>Clear</Button>
                      <Button onClick={() => { loadDashboardData(); setFiltersOpen(false); }}>Apply</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="ml-auto" onClick={exportOverviewToExcel}>
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
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
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Land to be Acquired (Ha)</CardTitle>
                    <Database className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalLand.toFixed(2)}</div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-blue-700">Measured area</p>
                      <Delta current={stats.totalLand} prev={(window as any).__SB_PREV_OVERVIEW__?.totalAreaLoaded} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Notices Generated</CardTitle>
                    <FileText className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalNotices.toLocaleString()}</div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-amber-700">Count</p>
                      <Delta current={stats.totalNotices} prev={(window as any).__SB_PREV_OVERVIEW__?.noticesIssued} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Budget Spent To-Date</CardTitle>
                    <Banknote className="h-4 w-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{Math.round(stats.totalPayments).toLocaleString()}</div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-emerald-700">Sum of completed payments</p>
                      <Delta current={stats.totalPayments} prev={(window as any).__SB_PREV_OVERVIEW__?.budgetSpentToDate} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Acquired Area (Ha)</CardTitle>
                    <Users className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(stats.totalAcquiredArea || 0).toFixed(2)}</div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-purple-700">From records</p>
                      <Delta current={stats.totalAcquiredArea || 0} prev={(window as any).__SB_PREV_OVERVIEW__?.totalAcquiredArea} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Status Breakdown */}
                <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-blue-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payments Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Completed</span>
                        <Badge variant="default">{stats.paymentsCompletedCount || 0}</Badge>
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
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-2 text-left">Survey No.</th>
                            <th className="p-2 text-left">Landowner</th>
                            <th className="p-2 text-left">Village</th>
                            <th className="p-2 text-left">Area</th>
                            <th className="p-2 text-left">Amount</th>
                            <th className="p-2 text-left">Payment</th>
                            <th className="p-2 text-left">Notice</th>
                            <th className="p-2 text-left">Format</th>
                            <th className="p-2 text-left">KYC</th>
                            <th className="p-2 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedRecords.map((r: any) => (
                            <tr key={r.id} className="border-t">
                              <td className="p-2">
                                <div className="font-medium">{getSurveyNumber(r)}</div>
                                {safeGetField(r, 'old_survey_number') && (
                                  <div className="text-xs text-gray-500">Old: {safeGetField(r, 'old_survey_number')}</div>
                                )}
                              </td>
                              <td className="p-2">
                                <div>{getLandownerName(r)}</div>
                                {safeGetField(r, 'group_number') && (
                                  <div className="text-xs text-gray-500">Group: {safeGetField(r, 'group_number')}</div>
                                )}
                              </td>
                              <td className="p-2">{getVillageName(r)}</td>
                              <td className="p-2">
                                <div>{getDisplayArea(r)}</div>
                                {safeGetNumericField(r, 'acquired_area') > 0 && (
                                  <div className="text-xs text-gray-500">
                                    Acq: {formatNumber(safeGetNumericField(r, 'acquired_area'))} Ha
                                  </div>
                                )}
                              </td>
                              <td className="p-2">
                                <div>{getCompensationAmount(r)}</div>
                                {safeGetNumericField(r, 'solatium') > 0 && (
                                  <div className="text-xs text-gray-500">
                                    Sol: {formatCurrency(safeGetNumericField(r, 'solatium'))}
                                  </div>
                                )}
                              </td>
                              <td className="p-2">
                                <Badge 
                                  variant={getPaymentStatus(r) === 'completed' ? 'default' : 'secondary'}
                                  className={getPaymentStatus(r) === 'completed' ? 'bg-green-500' : ''}
                                >
                                  {getPaymentStatus(r)}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <Badge variant={safeGetField(r, 'notice_generated') ? 'default' : 'outline'}>
                                  {safeGetField(r, 'notice_generated') ? 'Generated' : 'Pending'}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <Badge 
                                  variant={isNewFormat(r) ? 'default' : 'secondary'}
                                  className={isNewFormat(r) ? 'bg-blue-500' : ''}
                                >
                                  {isNewFormat(r) ? 'New' : 'Legacy'}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <div className="text-xs">
                                  {(r.kycStatus || r.kyc_status || 'pending')}
                                </div>
                              </td>
                              <td className="p-2">
                                <div className="flex flex-col gap-2">
                                  <Button size="sm" variant="outline" onClick={() => openKycUploader(r)}>Upload KYC</Button>
                                  {(r.kycStatus === 'completed' || r.kyc_status === 'completed' || r.kycStatus === 'approved' || r.kyc_status === 'approved') ? (
                                    <Button size="sm" onClick={() => goToPaymentSlip(r)}>Generate Payment Slip</Button>
                                  ) : (
                                    <Button size="sm" onClick={() => approveKycRecord(r)} variant="default">Approve KYC</Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {pagedRecords.length === 0 && (
                            <tr>
                              <td className="p-4 text-center text-gray-500" colSpan={8}>No records</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-between mt-4 text-xs">
                      <span>Showing {(pagedRecords.length && (page - 1) * pageSize + 1) || 0}-{(page - 1) * pageSize + pagedRecords.length} of {filteredRecords.length}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
                        <Button variant="outline" disabled={(page * pageSize) >= filteredRecords.length} onClick={() => setPage(p => p + 1)}>Next</Button>
                      </div>
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
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="h-64">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Daily Notices vs Payments</div>
                        <ResponsiveContainer width="100%" height="100%">
                          <RBarChart data={timeseries} barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis tickFormatter={(v: number) => v.toLocaleString('en-IN')} />
                            <Tooltip formatter={(v: number, n: string) => [v.toLocaleString('en-IN'), n]} />
                            <Legend />
                            <defs>
                              <linearGradient id="gradNotices" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#fde68a" />
                                <stop offset="100%" stopColor="#f59e0b" />
                              </linearGradient>
                              <linearGradient id="gradPayments" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6ee7b7" />
                                <stop offset="100%" stopColor="#10b981" />
                              </linearGradient>
                            </defs>
                            <Bar dataKey="notices" name="Notices" fill="url(#gradNotices)" radius={[6,6,0,0]}>
                              <LabelList dataKey="notices" position="top" className="text-xs" />
                            </Bar>
                            <Bar dataKey="payments" name="Payments" fill="url(#gradPayments)" radius={[6,6,0,0]}>
                              <LabelList dataKey="payments" position="top" className="text-xs" />
                            </Bar>
                          </RBarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="h-64">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Paid Amount Trend</div>
                        <ResponsiveContainer width="100%" height="100%">
                          <RLineChart data={timeseries}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis tickFormatter={(v: number) => v.toLocaleString('en-IN')} />
                            <Tooltip formatter={(v: number, n: string) => [n === 'Paid Amount' ? `₹${Number(v).toLocaleString('en-IN')}` : Number(v).toLocaleString('en-IN'), n]} />
                            <Legend />
                            <Line type="monotone" dataKey="amount" name="Paid Amount" stroke="#3b82f6" strokeWidth={2} dot={false} />
                          </RLineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="h-64">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Payment Status</div>
                        <ResponsiveContainer width="100%" height="100%">
                          <RPieChart>
                            <Tooltip formatter={(v: number, n: string) => [`${v.toLocaleString('en-IN')}`, n]} />
                            <Legend />
                            <Pie data={paymentStatusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}
                                 label={(d: any) => `${d.name} ${(d.percent*100).toFixed(0)}%`}>
                              {paymentStatusData.map((entry, index) => (
                                <Cell key={`ps-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                          </RPieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="h-64">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Tribal vs Non-Tribal</div>
                        <ResponsiveContainer width="100%" height="100%">
                          <RPieChart>
                            <Tooltip formatter={(v: number, n: string) => [`${v.toLocaleString('en-IN')}`, n]} />
                            <Legend />
                            <Pie data={tribalData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}
                                 label={(d: any) => `${(d.percent*100).toFixed(0)}%`}>
                              {tribalData.map((entry, index) => (
                                <Cell key={`tr-${index}`} fill={COLORS[(index+3) % COLORS.length]} />
                              ))}
                            </Pie>
                          </RPieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="h-64">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Top Villages by Records</div>
                        <ResponsiveContainer width="100%" height="100%">
                          <RBarChart data={villageTopData} barSize={24}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
                            <YAxis tickFormatter={(v: number) => v.toLocaleString('en-IN')} />
                            <Tooltip formatter={(v: number, n: string) => [v.toLocaleString('en-IN'), n]} />
                            <Legend />
                            <defs>
                              <linearGradient id="gradVillage" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#a5b4fc" />
                                <stop offset="100%" stopColor="#6366f1" />
                              </linearGradient>
                            </defs>
                            <Bar dataKey="value" name="Records" fill="url(#gradVillage)" radius={[6,6,0,0]}>
                              <LabelList dataKey="value" position="top" className="text-xs" />
                            </Bar>
                          </RBarChart>
                        </ResponsiveContainer>
                      </div>
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
      {/* KYC Upload Dialog */}
      <Dialog open={kycDialogOpen} onOpenChange={setKycDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload KYC Documents</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {persons.map((p, idx) => (
              <div key={idx} className="border p-3 rounded-md space-y-2">
                <div className="flex gap-2 items-center">
                  <Label className="w-28">Person Name</Label>
                  <Input value={p.name} onChange={e => updatePerson(idx, { name: e.target.value })} placeholder="e.g., Ram Patil" />
                  <Button variant="outline" onClick={() => removePerson(idx)} disabled={persons.length===1}>Remove</Button>
                </div>
                <div className="flex gap-3 items-center">
                  <Label className="w-28">Aadhaar</Label>
                  <Input type="file" accept="image/*,application/pdf" onChange={e => updatePerson(idx, { aadhar: e.target.files?.[0] || null })} />
                </div>
                <div className="flex gap-3 items-center">
                  <Label className="w-28">PAN</Label>
                  <Input type="file" accept="image/*,application/pdf" onChange={e => updatePerson(idx, { pan: e.target.files?.[0] || null })} />
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" onClick={addPersonRow}>Add Person</Button>
              <Button onClick={uploadAllPersons}>Upload & Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedDashboard;
