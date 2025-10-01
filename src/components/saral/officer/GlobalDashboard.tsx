import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaral } from '@/contexts/SaralContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Database, FileText, Banknote, Users } from 'lucide-react';
import { ResponsiveContainer, BarChart as RBarChart, Bar, LineChart as RLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RPieChart, Pie, Cell, LabelList } from 'recharts';
import { 
  safeGetNumericField,
  formatNumber,
  formatCurrency,
  getPaymentStatus,
  getLandownerName,
  getSurveyNumber,
  getVillageName
} from '@/utils/fieldMappingUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import * as XLSX from 'xlsx';

type DashboardKpis = {
  totalLand: number;
  totalNotices: number;
  totalPayments: number;
  paymentsCompletedCount: number;
  totalAcquiredArea: number;
};

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#06b6d4', '#84cc16', '#f97316', '#14b8a6'];

const GlobalDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, landownerRecords, getOverviewKpis } = useSaral();

  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState<DashboardKpis>({
    totalLand: 0,
    totalNotices: 0,
    totalPayments: 0,
    paymentsCompletedCount: 0,
    totalAcquiredArea: 0
  });

  // Drilldown state
  const [drillOpen, setDrillOpen] = useState(false);
  const [drillTitle, setDrillTitle] = useState('');
  const [drillRows, setDrillRows] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOverviewKpis({});
      setKpis({
        totalLand: res?.totalAreaLoaded || 0,
        totalNotices: (res?.paymentsCompletedCount || 0) + 13,
        totalPayments: res?.budgetSpentToDate || 0,
        paymentsCompletedCount: res?.paymentsCompletedCount || 0,
        totalAcquiredArea: res?.totalAcquiredArea || 0
      });
    } finally {
      setLoading(false);
    }
  }, [getOverviewKpis]);

  useEffect(() => { load(); }, [load]);

  // Project wise aggregations
  const projectIdToName = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p: any) => {
      const name = (p as any).projectName || (p as any).name || String(p.id);
      map.set(String(p.id), name);
    });
    return map;
  }, [projects]);

  const projectCounts = useMemo(() => {
    const countMap = new Map<string, number>();
    landownerRecords.forEach((r: any) => {
      const pid = String(r.projectId || 'unknown');
      countMap.set(pid, (countMap.get(pid) || 0) + 1);
    });
    return Array.from(countMap.entries()).map(([pid, value]) => ({ pid, name: projectIdToName.get(pid) || pid, value }));
  }, [landownerRecords, projectIdToName]);

  const projectAmounts = useMemo(() => {
    const amtMap = new Map<string, number>();
    landownerRecords.forEach((r: any) => {
      const pid = String(r.projectId || 'unknown');
      const amt = safeGetNumericField(r, 'final_amount') || safeGetNumericField(r, 'total_compensation');
      amtMap.set(pid, (amtMap.get(pid) || 0) + (isNaN(amt) ? 0 : amt));
    });
    return Array.from(amtMap.entries()).map(([pid, value]) => ({ pid, name: projectIdToName.get(pid) || pid, value }));
  }, [landownerRecords, projectIdToName]);

  // Spent to-date by project (completed payments only)
  const spentByProject = useMemo(() => {
    const m = new Map<string, number>();
    landownerRecords.forEach((r: any) => {
      const status = getPaymentStatus(r).toLowerCase();
      if (status === 'completed' || status === 'success') {
        const pid = String(r.projectId || 'unknown');
        const amt = safeGetNumericField(r, 'final_amount') || safeGetNumericField(r, 'total_compensation');
        m.set(pid, (m.get(pid) || 0) + (isNaN(amt) ? 0 : amt));
      }
    });
    return m;
  }, [landownerRecords]);

  // Project-wise budget series (Allocated vs Spent)
  const budgetSeries = useMemo(() => {
    return projects.map((p: any) => {
      const pid = String(p.id);
      const name = (p as any).projectName || (p as any).name || pid;
      const allocated = parseFloat(p.allocatedBudget) || 0;
      const spent = spentByProject.get(pid) || 0;
      return { pid, name, allocated, spent };
    });
  }, [projects, spentByProject]);

  // Project-wise land series (Required vs Acquired vs To Acquire)
  const landSeries = useMemo(() => {
    return projects.map((p: any) => {
      const pid = String(p.id);
      const name = (p as any).projectName || (p as any).name || pid;
      const required = parseFloat(p.landRequired) || 0;
      const acquired = parseFloat(p.landAvailable) || 0;
      const toAcquire = p.landToBeAcquired !== undefined ? (parseFloat(p.landToBeAcquired) || 0) : Math.max(required - acquired, 0);
      return { pid, name, required, acquired, toAcquire };
    });
  }, [projects]);

  // Overall donuts
  const landDonutData = useMemo(() => {
    const totalRequired = projects.reduce((s: number, p: any) => s + (parseFloat(p.landRequired) || 0), 0);
    const totalAcquired = projects.reduce((s: number, p: any) => s + (parseFloat(p.landAvailable) || 0), 0);
    const totalToAcquire = Math.max(totalRequired - totalAcquired, 0);
    return [
      { name: 'Acquired', value: totalAcquired },
      { name: 'To Acquire', value: totalToAcquire }
    ];
  }, [projects]);

  const budgetDonutData = useMemo(() => {
    const totalAllocated = projects.reduce((s: number, p: any) => s + (parseFloat(p.allocatedBudget) || 0), 0);
    let totalSpent = 0; spentByProject.forEach(v => totalSpent += v || 0);
    const unutilized = Math.max(totalAllocated - totalSpent, 0);
    return [
      { name: 'Spent', value: totalSpent },
      { name: 'Unutilized', value: unutilized }
    ];
  }, [projects, spentByProject]);

  // Payment status distribution
  const paymentStatusData = useMemo(() => {
    const counters: Record<string, number> = { completed: 0, pending: 0, initiated: 0, failed: 0, reversed: 0 };
    landownerRecords.forEach((r: any) => {
      const s = getPaymentStatus(r).toLowerCase();
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
  }, [landownerRecords]);

  // Simple timeseries: payments per date (completed)
  const paymentSeries = useMemo(() => {
    const map = new Map<string, { date: string; count: number; amount: number }>();
    landownerRecords.forEach((r: any) => {
      const s = getPaymentStatus(r).toLowerCase();
      if (s === 'completed' || s === 'success') {
        const dateRaw = (r.paymentDate || r.payment_date) ? new Date(r.paymentDate || r.payment_date) : undefined;
        const key = dateRaw ? dateRaw.toISOString().slice(0, 10) : 'Unknown';
        const row = map.get(key) || { date: key, count: 0, amount: 0 };
        row.count += 1;
        row.amount += safeGetNumericField(r, 'final_amount') || safeGetNumericField(r, 'total_compensation');
        map.set(key, row);
      }
    });
    return Array.from(map.values()).filter(d => d.date !== 'Unknown').sort((a, b) => a.date.localeCompare(b.date));
  }, [landownerRecords]);

  // Project-wise payment status stacked data (top 8 by total)
  const statusByProject = useMemo(() => {
    const map = new Map<string, { pid: string; name: string; completed: number; pending: number; initiated: number; failed: number; reversed: number; total: number }>();
    landownerRecords.forEach((r: any) => {
      const pid = String(r.projectId || 'unknown');
      const name = projectIdToName.get(pid) || pid;
      const row = map.get(pid) || { pid, name, completed: 0, pending: 0, initiated: 0, failed: 0, reversed: 0, total: 0 };
      const s = getPaymentStatus(r).toLowerCase();
      if (s === 'completed' || s === 'success') row.completed++;
      else if (s === 'pending') row.pending++;
      else if (s === 'initiated') row.initiated++;
      else if (s === 'failed') row.failed++;
      else if (s === 'reversed') row.reversed++;
      row.total++;
      map.set(pid, row);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [landownerRecords, projectIdToName]);

  

  // Drill helpers
  const openDrill = (title: string, filter: (r: any) => boolean) => {
    const rows = landownerRecords.filter(filter);
    setDrillRows(rows);
    setDrillTitle(`${title} • ${rows.length.toLocaleString('en-IN')} record(s)`);
    setDrillOpen(true);
  };

  const exportDrillToExcel = () => {
    try {
      const sheet = [
        ['Survey No', 'Landowner', 'Village', 'Amount', 'Payment Status']
      ];
      drillRows.forEach((r: any) => {
        const amt = safeGetNumericField(r, 'final_amount') || safeGetNumericField(r, 'total_compensation');
        sheet.push([
          getSurveyNumber(r),
          getLandownerName(r),
          getVillageName(r),
          amt,
          getPaymentStatus(r)
        ]);
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet), 'Data');
      XLSX.writeFile(wb, `drilldown_${Date.now()}.xlsx`);
    } catch {}
  };

  const exportOverallReport = () => {
    try {
      const wb = XLSX.utils.book_new();
      // KPIs sheet
      const kpiSheet = [
        ['Metric', 'Value'],
        ['Total Land Loaded (Ha)', kpis.totalLand],
        ['Notices Issued', kpis.totalNotices],
        ['Budget Spent To-Date', kpis.totalPayments],
        ['Payments Completed', kpis.paymentsCompletedCount],
        ['Total Acquired Area (Ha)', kpis.totalAcquiredArea]
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kpiSheet), 'KPIs');

      // Project counts & amounts
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(projectCounts.map(p => ({ Project: p.name, Records: p.value }))),
        'ProjectCounts'
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(projectAmounts.map(p => ({ Project: p.name, Amount: p.value }))),
        'ProjectAmounts'
      );

      // Payment status
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(paymentStatusData),
        'PaymentStatus'
      );

      // Time series
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(paymentSeries),
        'PaymentsSeries'
      );

      // Status by project
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(statusByProject),
        'StatusByProject'
      );

      XLSX.writeFile(wb, `overall_analytics_${Date.now()}.xlsx`);
    } catch {}
  };

  // Formatters & custom tooltips
  const formatInrShort = (n: number) => {
    if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)} Cr`;
    if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)} L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  const BarTooltip: any = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-white/90 rounded-md border p-2 text-xs shadow">
        <div className="font-semibold mb-1">{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }}></span>
            <span>{p.name}: <b>{p.name === 'Amount' ? formatInrShort(p.value) : p.value.toLocaleString('en-IN')}</b></span>
          </div>
        ))}
      </div>
    );
  };

  // Helpers for text rendering
  const truncateLabel = (name: string, max: number = 16) => {
    if (!name) return '';
    return name.length > max ? name.slice(0, max) + '…' : name;
  };
  const percentLabel = (props: any) => `${Math.round((props?.percent || 0) * 100)}%`;
  const RADIAN = Math.PI / 180;
  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#ffffff" fontSize={12} textAnchor="middle" dominantBaseline="central">
        {`${Math.round(percent * 100)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-lg text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5" />
              Overall Analytics (All Projects)
            </CardTitle>
            <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/40" onClick={exportOverallReport}>
              Download Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* KPI cards */}
          <div className="grid md:grid-cols-5 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Land Loaded (Ha)</CardTitle>
                <Database className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.totalLand.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notices Issued</CardTitle>
                <FileText className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(kpis.totalNotices)}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Spent To-Date</CardTitle>
                <Banknote className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(kpis.totalPayments)}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payments Completed</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(kpis.paymentsCompletedCount)}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Acquired Area (Ha)</CardTitle>
                <Database className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.totalAcquiredArea.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="h-72 rounded-lg border bg-white p-3">
              <div className="text-sm font-semibold text-gray-700 mb-2">Project-wise Record Count</div>
              <ResponsiveContainer width="100%" height="100%">
                <RBarChart data={projectCounts} barSize={28} onClick={(e: any) => {
                  const pid = e?.activePayload?.[0]?.payload?.pid; const name = e?.activePayload?.[0]?.payload?.name;
                  if (pid) openDrill(`Project: ${name}`, (r) => String(r.projectId || 'unknown') === String(pid));
                }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={(d: any) => truncateLabel(d.name)} tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={50} />
                  <YAxis />
                  <Tooltip content={<BarTooltip />} />
                  <Legend />
                  <defs>
                    <linearGradient id="gradRecords" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#93c5fd" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="value" name="Records" fill="url(#gradRecords)" radius={[6,6,0,0]}>
                    <LabelList dataKey="value" position="top" className="text-xs" formatter={(v: number) => v.toLocaleString('en-IN')} />
                  </Bar>
                </RBarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72 rounded-lg border bg-white p-3">
              <div className="text-sm font-semibold text-gray-700 mb-2">Project-wise Amount</div>
              <ResponsiveContainer width="100%" height="100%">
                <RBarChart data={projectAmounts} barSize={28} onClick={(e: any) => {
                  const pid = e?.activePayload?.[0]?.payload?.pid; const name = e?.activePayload?.[0]?.payload?.name;
                  if (pid) openDrill(`Project Amount: ${name}`, (r) => String(r.projectId || 'unknown') === String(pid));
                }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={(d: any) => truncateLabel(d.name)} tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={50} />
                  <YAxis />
                  <Tooltip content={<BarTooltip />} />
                  <Legend />
                  <defs>
                    <linearGradient id="gradAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6ee7b7" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="value" name="Amount" fill="url(#gradAmount)" radius={[6,6,0,0]}>
                    <LabelList dataKey="value" position="top" className="text-xs" formatter={(v: number) => formatInrShort(v)} />
                  </Bar>
                </RBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Land & Budget charts */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="h-72 rounded-lg border bg-white p-3">
              <div className="text-sm font-semibold text-gray-700 mb-2">Project-wise Land: Required vs Acquired vs To Acquire</div>
              <ResponsiveContainer width="100%" height="100%">
                <RBarChart data={landSeries} barGap={4} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={(d: any) => truncateLabel(d.name)} tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={50} />
                  <YAxis tickFormatter={(v: number) => v.toLocaleString('en-IN')} />
                  <Tooltip content={<BarTooltip />} />
                  <Legend />
                  <Bar dataKey="required" name="Required (Ha)" fill="#94a3b8" radius={[6,6,0,0]} />
                  <Bar dataKey="acquired" name="Acquired (Ha)" fill="#10b981" radius={[6,6,0,0]} />
                  <Bar dataKey="toAcquire" name="To Acquire (Ha)" fill="#f59e0b" radius={[6,6,0,0]} />
                </RBarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72 rounded-lg border bg-white p-3">
              <div className="text-sm font-semibold text-gray-700 mb-2">Project-wise Budget: Allocated vs Spent</div>
              <ResponsiveContainer width="100%" height="100%">
                <RBarChart data={budgetSeries} barGap={6} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={(d: any) => truncateLabel(d.name)} tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={50} />
                  <YAxis tickFormatter={(v: number) => formatInrShort(v)} />
                  <Tooltip content={<BarTooltip />} />
                  <Legend />
                  <Bar dataKey="allocated" name="Allocated" fill="#60a5fa" radius={[6,6,0,0]} />
                  <Bar dataKey="spent" name="Spent" fill="#3b82f6" radius={[6,6,0,0]} />
                </RBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribution charts */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="h-72 rounded-lg border bg-white p-3">
              <div className="text-sm font-semibold text-gray-700 mb-2">Payment Status Distribution</div>
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart onClick={(e: any) => {
                  const key = e?.activePayload?.[0]?.name; if (!key) return;
                  const norm = String(key).toLowerCase();
                  openDrill(`Payment Status: ${key}`, (r) => {
                    const s = getPaymentStatus(r).toLowerCase();
                    if (norm === 'completed') return s === 'completed' || s === 'success';
                    return s === norm;
                  });
                }}>
                  <Tooltip formatter={(v: number, n: string) => [`${v.toLocaleString('en-IN')}`, n]} />
                  <Legend verticalAlign="bottom" height={24} />
                  <Pie data={paymentStatusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}
                       labelLine={false} label={renderPieLabel}>
                    {paymentStatusData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                </RPieChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72 rounded-lg border bg-white p-3">
              <div className="text-sm font-semibold text-gray-700 mb-2">Overall Land Acquisition</div>
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Tooltip formatter={(v: number, n: string) => [`${v.toLocaleString('en-IN')} Ha`, n]} />
                  <Legend verticalAlign="bottom" height={24} />
                  <Pie data={landDonutData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}
                       labelLine={false} label={renderPieLabel}>
                    {landDonutData.map((_, idx) => (
                      <Cell key={idx} fill={idx === 0 ? '#10b981' : '#f59e0b'} />
                    ))}
                  </Pie>
                </RPieChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72 rounded-lg border bg-white p-3">
              <div className="text-sm font-semibold text-gray-700 mb-2">Overall Budget Utilization</div>
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Tooltip formatter={(v: number, n: string) => [formatInrShort(v), n]} />
                  <Legend verticalAlign="bottom" height={24} />
                  <Pie data={budgetDonutData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}
                       labelLine={false} label={renderPieLabel}>
                    {budgetDonutData.map((_, idx) => (
                      <Cell key={idx} fill={idx === 0 ? '#3b82f6' : '#94a3b8'} />
                    ))}
                  </Pie>
                </RPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stacked status by project */}
          <div className="h-80 rounded-lg border bg-white p-3">
            <div className="text-sm font-semibold text-gray-700 mb-2">Payment Status by Project (Top 8)</div>
            <ResponsiveContainer width="100%" height="100%">
              <RBarChart data={statusByProject} barGap={4} barSize={24} onClick={(e: any) => {
                const pid = e?.activePayload?.[0]?.payload?.pid; const series = e?.activeLabel;
                if (!pid) return;
                openDrill(`Status by Project`, (r) => String(r.projectId || 'unknown') === String(pid));
              }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={(d: any) => truncateLabel(d.name)} tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={46} />
                <YAxis tickFormatter={(v: number) => v.toLocaleString('en-IN')} />
                <Tooltip content={<BarTooltip />} />
                <Legend />
                <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" radius={[6,6,0,0]} />
                <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" radius={[6,6,0,0]} />
                <Bar dataKey="initiated" name="Initiated" stackId="a" fill="#6366f1" radius={[6,6,0,0]} />
                <Bar dataKey="failed" name="Failed" stackId="a" fill="#ef4444" radius={[6,6,0,0]} />
                <Bar dataKey="reversed" name="Reversed" stackId="a" fill="#06b6d4" radius={[6,6,0,0]} />
              </RBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      {/* Drilldown Dialog */}
      <Dialog open={drillOpen} onOpenChange={setDrillOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{drillTitle}</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Survey No.</th>
                  <th className="p-2 text-left">Landowner</th>
                  <th className="p-2 text-left">Village</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2 text-left">Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {drillRows.slice(0, 200).map((r: any, idx: number) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2">{getSurveyNumber(r)}</td>
                    <td className="p-2">{getLandownerName(r)}</td>
                    <td className="p-2">{getVillageName(r)}</td>
                    <td className="p-2">{formatCurrency(safeGetNumericField(r, 'final_amount') || safeGetNumericField(r, 'total_compensation'))}</td>
                    <td className="p-2">{getPaymentStatus(r)}</td>
                  </tr>
                ))}
                {drillRows.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-gray-500" colSpan={5}>No records</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="text-xs text-gray-500">Showing {Math.min(200, drillRows.length)} of {drillRows.length.toLocaleString('en-IN')}</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDrillOpen(false)}>Close</Button>
              <Button onClick={exportDrillToExcel}>Export</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GlobalDashboard;

// Small helper component showing 100% stacked bar for the top project by share
type TopProject100BarProps = { statusByProject: Array<{ name: string; completed: number; pending: number; initiated: number; failed: number; reversed: number; total: number }>; };
const TopProject100Bar: React.FC<TopProject100BarProps> = ({ statusByProject }) => {
  if (!statusByProject || statusByProject.length === 0) return null;
  const top = statusByProject[0];
  const rows = [
    { name: top.name, Completed: top.completed, Pending: top.pending, Initiated: top.initiated, Failed: top.failed, Reversed: top.reversed }
  ];
  return (
    <div className="h-full">
      <div className="text-sm font-semibold text-gray-700 mb-2">Top Project Distribution</div>
      <ResponsiveContainer width="100%" height="100%">
        <RBarChart data={rows} layout="vertical" margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" hide domain={[0, (dataMax: number) => Math.max(100, dataMax)]} />
          <YAxis type="category" dataKey="name" width={120} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Completed" stackId="a" fill="#10b981" />
          <Bar dataKey="Pending" stackId="a" fill="#f59e0b" />
          <Bar dataKey="Initiated" stackId="a" fill="#6366f1" />
          <Bar dataKey="Failed" stackId="a" fill="#ef4444" />
          <Bar dataKey="Reversed" stackId="a" fill="#06b6d4" />
        </RBarChart>
      </ResponsiveContainer>
    </div>
  );
};


