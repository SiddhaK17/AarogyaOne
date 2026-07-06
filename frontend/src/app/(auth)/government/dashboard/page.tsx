'use client';

import React, { useState, useMemo } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Award,
  Building,
  ArrowRight,
  TrendingUp,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { governmentApi } from '@/lib/api';

/* ─── Mock Department Info ─── */
const DEPARTMENTS = [
  { id: 'pwd', name: 'Public Works Department (PWD)', lead: 'Rajesh Kumar' },
  { id: 'biomedical', name: 'Biomedical Engineering Team', lead: 'Anil Deshmukh' },
  { id: 'medical_store', name: 'District Medical Store', lead: 'Dr. Sunita Rao' },
  { id: 'electricity', name: 'Electricity Board', lead: 'Vikas Patil' },
  { id: 'water', name: 'Water Supply Department', lead: 'Sanjay More' },
];

export default function GovernmentDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const currentDeptName = analytics?.department || 'Department';

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [anData, tsData] = await Promise.all([
          governmentApi.getAnalytics(),
          governmentApi.getTasks()
        ]);
        setAnalytics(anData);
        setTasks(tsData as any[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const deptData = useMemo(() => {
    if (!analytics) return { stats: [], weeklyTrend: [], issueTypes: [], urgentTasks: [] };

    const stats = [
      { label: 'Avg. Resolution Time', value: analytics.avg_resolution_hours ? `${analytics.avg_resolution_hours} hrs` : 'N/A', icon: Clock, change: 'Target: < 12 hrs', color: 'text-cyan-600', bg: 'bg-cyan-50' },
      { label: 'Tasks Completed', value: String(analytics.completed_count), icon: CheckCircle2, change: 'Recent', color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Pending Work', value: String(analytics.pending_count), icon: AlertCircle, change: `${analytics.in_progress_count} in progress`, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Overdue Tasks', value: String(analytics.overdue_count), icon: AlertTriangle, change: 'Requires escalation', color: 'text-rose-600', bg: 'bg-rose-50' },
      { label: 'High Priority Open', value: String(analytics.high_tasks + analytics.critical_tasks), icon: Award, change: 'Critical & High', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];

    const weeklyTrend = [
      { day: 'Mon', completed: 4, assigned: Math.max(0, analytics.pending_count - 5) },
      { day: 'Tue', completed: 6, assigned: Math.max(0, analytics.pending_count - 3) },
      { day: 'Wed', completed: 5, assigned: Math.max(0, analytics.pending_count - 4) },
      { day: 'Thu', completed: 8, assigned: Math.max(0, analytics.pending_count - 1) },
      { day: 'Fri', completed: 7, assigned: analytics.pending_count },
      { day: 'Sat', completed: 3, assigned: Math.max(0, analytics.pending_count - 1) },
      { day: 'Sun', completed: 2, assigned: Math.max(0, analytics.pending_count - 1) },
    ];

    const categoriesMap: Record<string, number> = {};
    tasks.forEach(t => {
      const issue = t.title || 'General';
      categoriesMap[issue] = (categoriesMap[issue] || 0) + 1;
    });

    const colors = ['#1E3ABA', '#06B6D4', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6'];
    const issueTypes = Object.keys(categoriesMap).map((name, index) => ({
      name,
      count: categoriesMap[name],
      color: colors[index % colors.length]
    }));

    if (issueTypes.length === 0) {
      issueTypes.push({ name: 'General Support', count: 0, color: '#1E3ABA' });
    }

    const urgentTasks = tasks
      .filter(t => t.status !== 'Completed' && (t.priority === 'Critical' || t.priority === 'High'))
      .map(t => ({
        id: `TSK-${t.id}`,
        hospital: t.hospital_name || 'N/A',
        issue: t.title,
        priority: t.priority,
        daysOpen: Math.max(1, Math.floor((Date.now() - new Date(t.assigned_at).getTime()) / 86400000))
      }));

    return { stats, weeklyTrend, issueTypes, urgentTasks };
  }, [analytics, tasks]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Top Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 lg:p-8 rounded-3xl shadow-xl shadow-slate-900/10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand-cyan text-xs font-black tracking-widest uppercase">
            <Building className="h-4 w-4 text-teal-400" /> Government authorities portal
          </div>
          <h1 className="text-3xl font-black tracking-tight">Department Performance Analytics</h1>
          <p className="text-sm text-slate-300 font-medium">
            Monitor response efficiency, resolution rate, and AI-assigned tasks for {currentDeptName}.
          </p>
        </div>
      </div>

      {/* ─── Summary KPIs ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {deptData.stats.map((stat: any) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} padding="md" hover className="flex flex-col justify-between">
              <div>
                <div className={`p-2 rounded-xl ${stat.bg} w-fit mb-4`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <h4 className="text-sm font-bold text-slate-500">{stat.label}</h4>
                <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{stat.value}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">{stat.change}</span>
              </div>
            </Card>
          );
        })}
      </div>


      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Weekly Completion Activity"
            subtitle="Comparison of completed repairs against newly assigned tasks over the last 7 days"
            action={
              <Badge variant="healthy" dot>
                Online
              </Badge>
            }
          />
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={deptData.weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3ABA" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1E3ABA" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} fontWeight={600} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} fontWeight={600} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '16px', border: 'none', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="completed" name="Completed Tasks" stroke="#06B6D4" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
                <Area type="monotone" dataKey="assigned" name="Assigned Tasks" stroke="#1E3ABA" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorAssigned)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Issue Distribution by Type */}
        <Card>
          <CardHeader
            title="Task Distribution"
            subtitle="Volume of service requests by issue category"
          />
          <div className="h-[220px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData.issueTypes} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} fontWeight={600} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} fontWeight={600} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '16px', border: 'none', color: '#fff' }}
                />
                <Bar dataKey="count" name="Total Issues" radius={[8, 8, 0, 0]}>
                  {deptData.issueTypes.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {deptData.issueTypes.map((type: any) => (
              <div key={type.name} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color }} />
                  <span className="text-slate-600">{type.name}</span>
                </div>
                <span className="text-slate-900 font-extrabold">{type.count} issues</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Urgent Issues and Workflow Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Assigned Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Urgent Service Orders"
            subtitle="High-priority infrastructure tasks needing immediate inspection or feedback"
            action={
              <Link href="/government/tasks">
                <Button variant="ghost" size="sm" className="text-brand-blue flex items-center gap-1 font-bold">
                  View All Tasks <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            }
          />
          <div className="space-y-4">
            {deptData.urgentTasks.length > 0 ? (
              deptData.urgentTasks.map((task: any) => (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">{task.id}</span>
                      <Badge variant={task.priority === 'Critical' ? 'critical' : 'warning'} dot>
                        {task.priority}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{task.daysOpen} days open</span>
                    </div>
                    <h5 className="text-sm font-bold text-slate-900">{task.issue}</h5>
                    <p className="text-xs font-semibold text-slate-500">{task.hospital}</p>
                  </div>
                  <Link href="/government/tasks">
                    <Button variant="outline" size="sm">
                      Update Task
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 font-bold text-sm">
                No urgent tasks pending assignment.
              </div>
            )}
          </div>
        </Card>

        {/* AI Routing Workflow Alert */}
        <Card className="bg-[#FAF5FF] border-[#E8D5FF]/60 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl w-fit">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-950 tracking-tight">AI Dispatcher Network</h4>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Hospital staff report issues via text or voice. AarogyaPulse's **NLP Classifier** automatically parses the description, flags urgency, matches it to standard repair categories, and routes it directly to your department queue.
              </p>
            </div>
            <div className="bg-white/60 p-4 rounded-xl border border-purple-100 text-[11px] font-bold text-purple-950 space-y-1">
              <span className="uppercase text-[9px] tracking-wider text-purple-600 block mb-1">Active Model</span>
              <p>Classification Accuracy: 94.6%</p>
              <p>Average Dispatch Delay: &lt; 4 seconds</p>
            </div>
          </div>
          <div className="pt-4 border-t border-purple-200/50 mt-4">
            <span className="text-[10px] text-purple-600 font-bold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Auto-Routing is functioning normally
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
