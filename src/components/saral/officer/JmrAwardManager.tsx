import React, { useEffect, useMemo, useState } from 'react';
import { useSaral } from '@/contexts/SaralContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { config } from '../../../config';

const API_BASE_URL = config.API_BASE_URL;

const JmrAwardManager: React.FC = () => {
  const { projects, landownerRecords } = useSaral();

  const [selectedProject, setSelectedProject] = useState<string>('');
  const [jmrCount, setJmrCount] = useState<number>(0);
  const [awardCount, setAwardCount] = useState<number>(0);

  const [jmrForm, setJmrForm] = useState({
    surveyNumber: '',
    measuredArea: '',
    category: '',
    date: new Date().toISOString().slice(0, 10),
    landownerId: ''
  });

  const [awardForm, setAwardForm] = useState({
    landownerId: '',
    awardNumber: '',
    awardDate: new Date().toISOString().slice(0, 10),
    baseAmount: '',
    solatium: '',
    totalAmount: '',
    notes: ''
  });

  // Load counts whenever project changes
  useEffect(() => {
    const loadCounts = async () => {
      if (!selectedProject) { setJmrCount(0); setAwardCount(0); return; }
      try {
        const [jmrRes, awardRes] = await Promise.all([
          fetch(`${API_BASE_URL}/jmr/${selectedProject}`),
          fetch(`${API_BASE_URL}/awards/${selectedProject}`)
        ]);
        const j = await jmrRes.json().catch(() => ({ data: [] }));
        const a = await awardRes.json().catch(() => ({ data: [] }));
        setJmrCount(Array.isArray(j.data) ? j.data.length : 0);
        setAwardCount(Array.isArray(a.data) ? a.data.length : 0);
      } catch {
        setJmrCount(0); setAwardCount(0);
      }
    };
    loadCounts();
  }, [selectedProject]);

  const projectOptions = useMemo(() => projects.map(p => ({ id: p.id, name: (p as any).projectName || (p as any).name || p.id })), [projects]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>JMR / Award Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* JMR */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Joint Measurement (JMR)</span>
                    <Badge variant="outline">{jmrCount} records</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Survey Number</Label>
                      <Input value={jmrForm.surveyNumber} onChange={e => setJmrForm({ ...jmrForm, surveyNumber: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Measured Area (Ha)</Label>
                      <Input type="number" step="0.0001" value={jmrForm.measuredArea} onChange={e => setJmrForm({ ...jmrForm, measuredArea: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Category</Label>
                      <Input value={jmrForm.category} onChange={e => setJmrForm({ ...jmrForm, category: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Date</Label>
                      <Input type="date" value={jmrForm.date} onChange={e => setJmrForm({ ...jmrForm, date: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Landowner ID (optional)</Label>
                    <Input value={jmrForm.landownerId} onChange={e => setJmrForm({ ...jmrForm, landownerId: e.target.value })} placeholder="e.g. record id" />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={async () => {
                      try {
                        if (!jmrForm.surveyNumber || !jmrForm.measuredArea) { toast.error('Enter survey and measured area'); return; }
                        const resp = await fetch(`${API_BASE_URL}/jmr`, {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            project_id: selectedProject,
                            landowner_id: jmrForm.landownerId || 'unknown',
                            survey_number: jmrForm.surveyNumber,
                            measured_area: parseFloat(jmrForm.measuredArea || '0'),
                            category: jmrForm.category,
                            date_of_measurement: jmrForm.date
                          })
                        });
                        const data = await resp.json();
                        if (!resp.ok || !data.success) throw new Error(data.message || 'Failed');
                        toast.success('JMR saved');
                        setJmrCount(c => c + 1);
                      } catch (e: any) {
                        toast.error(e?.message || 'Failed to save JMR');
                      }
                    }}>Save JMR</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Award */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Award Declaration</span>
                    <Badge variant="outline">{awardCount} records</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Landowner ID</Label>
                      <Input value={awardForm.landownerId} onChange={e => setAwardForm({ ...awardForm, landownerId: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Award Number</Label>
                      <Input value={awardForm.awardNumber} onChange={e => setAwardForm({ ...awardForm, awardNumber: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="grid gap-2">
                      <Label>Award Date</Label>
                      <Input type="date" value={awardForm.awardDate} onChange={e => setAwardForm({ ...awardForm, awardDate: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Base Amount</Label>
                      <Input type="number" step="0.01" value={awardForm.baseAmount} onChange={e => setAwardForm({ ...awardForm, baseAmount: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Solatium</Label>
                      <Input type="number" step="0.01" value={awardForm.solatium} onChange={e => setAwardForm({ ...awardForm, solatium: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Total Amount</Label>
                      <Input type="number" step="0.01" value={awardForm.totalAmount} onChange={e => setAwardForm({ ...awardForm, totalAmount: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Notes</Label>
                      <Input value={awardForm.notes} onChange={e => setAwardForm({ ...awardForm, notes: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={async () => {
                      try {
                        if (!awardForm.landownerId || !awardForm.totalAmount) { toast.error('Enter landowner and total amount'); return; }
                        const resp = await fetch(`${API_BASE_URL}/awards`, {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            project_id: selectedProject,
                            landowner_id: awardForm.landownerId,
                            award_number: awardForm.awardNumber,
                            award_date: awardForm.awardDate,
                            base_amount: parseFloat(awardForm.baseAmount || '0'),
                            solatium: parseFloat(awardForm.solatium || '0'),
                            total_amount: parseFloat(awardForm.totalAmount || '0'),
                            notes: awardForm.notes
                          })
                        });
                        const data = await resp.json();
                        if (!resp.ok || !data.success) throw new Error(data.message || 'Failed');
                        toast.success('Award saved');
                        setAwardCount(c => c + 1);
                      } catch (e: any) {
                        toast.error(e?.message || 'Failed to save Award');
                      }
                    }}>Save Award</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JmrAwardManager;


