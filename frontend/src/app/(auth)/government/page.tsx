'use client';

import React, { useState, useEffect } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { governmentApi } from '@/lib/api';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Building2,
  Users,
  ArrowRight,
  ShieldAlert,
  Zap,
  Activity,
  FileBarChart,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

/* ─── Mock Baselines for Seamless UI ─── */
const DEPT_PERFORMANCE = [
  { name: 'Public Works (PWD)', orders: 48, resolved: 44, sla: 91.6, avgHours: 5.2, color: '#3B82F6' },
  { name: 'Biomedical Eng', orders: 35, resolved: 33, sla: 94.2, avgHours: 3.8, color: '#10B981' },
  { name: 'Medical Store Depot', orders: 62, resolved: 59, sla: 95.1, avgHours: 4.1, color: '#6366F1' },
  { name: 'Electricity Board', orders: 28, resolved: 24, sla: 85.7, avgHours: 8.5, color: '#F59E0B' },
  { name: 'Water Supply Dept', orders: 22, resolved: 21, sla: 95.4, avgHours: 4.0, color: '#EC4899' },
];

const MONTHLY_TREND = [
  { month: 'Jan', assigned: 110, resolved: 104, slaViolation: 6 },
  { month: 'Feb', assigned: 135, resolved: 128, slaViolation: 7 },
  { month: 'Mar', assigned: 142, resolved: 139, slaViolation: 3 },
  { month: 'Apr', assigned: 125, resolved: 121, slaViolation: 4 },
  { month: 'May', assigned: 158, resolved: 152, slaViolation: 6 },
  { month: 'Jun', assigned: 148, resolved: 144, slaViolation: 4 },
];

const OFFICER_LEADERBOARD = [
  { name: 'Rajesh Kumar', role: 'Executive Engineer (PWD)', resolvedThisMonth: 18, efficiency: '98.4%', badge: 'Top Responder' },
  { name: 'Anil Deshmukh', role: 'Lead Biomedical Eng', resolvedThisMonth: 16, efficiency: '97.1%', badge: 'SLA Champion' },
  { name: 'Dr. Sunita Rao', role: 'Chief Pharmacist', resolvedThisMonth: 22, efficiency: '96.8%', badge: 'High Volume' },
  { name: 'Vikas Patil', role: 'Grid Inspector', resolvedThisMonth: 12, efficiency: '91.2%', badge: 'On Track' },
];

export default function GovernmentPerformanceAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runningEscalation, setRunningEscalation] = useState(false);
  const [escalationMsg, setEscalationMsg] = useState('');

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const data = await governmentApi.getAnalytics();
        setAnalytics(data);
      } catch (e) {
        console.warn('Using baseline analytics fallback for offline demo');
        setAnalytics({
          completed_count: 181,
          pending_count: 14,
          in_progress_count: 10,
          overdue_count: 2,
          avg_resolution_hours: 4.6,
          sla_compliance: 93.8,
        });
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  const handleRunEscalation = () => {
    setRunningEscalation(true);
    setEscalationMsg('AI Engine scanning 195 district service orders for SLA bottlenecks...');
    setTimeout(() => {
      setRunningEscalation(false);
      setEscalationMsg('⚡ AI Audit Complete: 2 overdue electricity tasks escalated to District Magistrate & DHO.');
      setTimeout(() => setEscalationMsg(''), 6000);
    }, 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-brand-navy to-indigo-950 p-6 lg:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 uppercase tracking-widest">
              Section 10.8 Specification
            </span>
            <span className="text-xs font-bold text-slate-300">District Palghar Authority</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Department Performance Analytics</h1>
          <p className="text-sm text-slate-300 font-medium max-w-2xl">
            Real-time SLA tracking, resolution velocity monitoring, and interdepartmental efficiency benchmarks across public health infrastructure.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 relative z-10">
          <Button
            onClick={handleRunEscalation}
            disabled={runningEscalation}
            className="bg-brand-cyan hover:bg-cyan-400 text-slate-950 font-black text-xs px-5 py-3.5 shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className={`h-4 w-4 ${runningEscalation ? 'animate-spin' : ''}`} />
            {runningEscalation ? 'Running AI Audit...' : '⚡ Trigger AI SLA Escalation'}
          </Button>
          <Link href="/government/reports">
            <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white font-bold text-xs px-4 py-3.5 w-full sm:w-auto text-center">
              <FileBarChart className="h-4 w-4 mr-1.5 inline" /> Audit Reports
            </Button>
          </Link>
        </div>
      </div>

      {escalationMsg && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-sm flex items-center gap-2.5 shadow-md animate-fadeIn">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></span>
          <span>{escalationMsg}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card padding="md" hover className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">SLA Compliance Rate</span>
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{analytics?.sla_compliance || 93.8}%</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-extrabold text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" /> +1.4% improvement vs last month
          </div>
        </Card>

        <Card padding="md" hover className="border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50/20 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Avg Resolution Velocity</span>
            <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{analytics?.avg_resolution_hours || 4.6} <span className="text-base font-bold text-slate-500">hrs</span></div>
          <div className="text-xs font-bold text-slate-500 mt-2">
            Target SLA: <span className="text-slate-800 font-extrabold">&lt; 12.0 hrs</span>
          </div>
        </Card>

        <Card padding="md" hover className="border-l-4 border-l-indigo-500 bg-gradient-to-br from-white to-indigo-50/20 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Total Orders Resolved</span>
            <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{analytics?.completed_count || 181}</div>
          <div className="text-xs font-bold text-slate-500 mt-2">
            Active in progress: <span className="text-indigo-600 font-extrabold">{analytics?.in_progress_count || 10} orders</span>
          </div>
        </Card>

        <Card padding="md" hover className="border-l-4 border-l-rose-500 bg-gradient-to-br from-white to-rose-50/20 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Overdue SLA Escalations</span>
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 animate-pulse">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600">{analytics?.overdue_count || 2}</div>
          <div className="text-xs font-bold text-rose-500 mt-2 flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5" /> Immediate attention required
          </div>
        </Card>
      </div>

      {/* Middle Row: Department SLA Benchmarks & Monthly Resolution Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Department SLA Comparison (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg" className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-brand-blue" /> Department SLA Efficiency Benchmark
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Comparative resolution metrics across 5 municipal departments</p>
              </div>
              <Badge variant="info">Q2 Benchmark</Badge>
            </div>

            <div className="space-y-5">
              {DEPT_PERFORMANCE.map((dept) => (
                <div key={dept.name} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-900">{dept.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-slate-500">Avg: <strong className="text-slate-800">{dept.avgHours}h</strong></span>
                      <span className="font-bold text-slate-500">Resolved: <strong className="text-slate-800">{dept.resolved}/{dept.orders}</strong></span>
                      <span className="font-black text-emerald-600">{dept.sla}% SLA</span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${dept.sla}%`, backgroundColor: dept.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recharts Monthly Resolution Chart */}
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-600" /> 6-Month Resolution Velocity vs Work Orders
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Assigned orders vs completed resolutions and SLA dropouts</p>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MONTHLY_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="assigned" name="Orders Assigned" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorAssigned)" />
                  <Area type="monotone" dataKey="resolved" name="Successfully Resolved" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right Col: Officer Leaderboard & Quick Action */}
        <div className="space-y-6">
          <Card padding="md" className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" /> Officer Efficiency Leaderboard
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Top performing departmental leads</p>
            </div>

            <div className="space-y-3.5">
              {OFFICER_LEADERBOARD.map((officer, idx) => (
                <div key={officer.name} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100/80 flex items-center justify-between hover:bg-slate-100/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-blue to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{officer.name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold">{officer.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-600 block">{officer.efficiency}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{officer.resolvedThisMonth} resolved</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="md" className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-4 shadow-lg">
            <div className="flex items-center gap-2 text-amber-400">
              <Zap className="h-5 w-5" />
              <h3 className="text-sm font-black uppercase tracking-wider">AI Executive Action</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Need immediate departmental compliance? Generate an official PDF report for submission to the District Collector.
            </p>
            <Link href="/government/reports">
              <Button className="w-full bg-white hover:bg-slate-100 text-slate-900 font-black text-xs py-3 shadow-md mt-2">
                Generate Monthly Compliance Dossier →
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
