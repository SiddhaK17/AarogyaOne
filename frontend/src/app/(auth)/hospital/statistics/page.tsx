'use client';

import React from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  Users,
  Activity,
  TrendingUp,
  Ambulance,
  Clock,
  BrainCircuit,
  AlertTriangle,
  ArrowRight,
  Plus,
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
} from 'recharts';

/* ─── Mock Data ─── */
const todayStats = [
  { label: "Today's OPD", value: 412, icon: Users, change: '+38 vs yesterday', color: 'text-teal-600', bg: 'bg-teal-50' },
  { label: "Today's IPD", value: 67, icon: Activity, change: '+4 admissions', color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Emergency', value: 12, icon: Ambulance, change: '+2 critical', color: 'text-rose-600', bg: 'bg-rose-50' },
  { label: 'Discharges', value: 23, icon: TrendingUp, change: '—', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Referrals', value: 5, icon: ArrowRight, change: '2 to District Hospital', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Avg Wait Time', value: '28 min', icon: Clock, change: '-5 min from last week', color: 'text-amber-600', bg: 'bg-amber-50' },
];

const weeklyTrend = [
  { day: 'Mon', opd: 380, ipd: 52, emergency: 8 },
  { day: 'Tue', opd: 420, ipd: 65, emergency: 11 },
  { day: 'Wed', opd: 395, ipd: 58, emergency: 7 },
  { day: 'Thu', opd: 450, ipd: 71, emergency: 14 },
  { day: 'Fri', opd: 412, ipd: 67, emergency: 12 },
  { day: 'Sat', opd: 310, ipd: 45, emergency: 6 },
  { day: 'Sun', opd: 280, ipd: 38, emergency: 9 },
];

const departmentDistribution = [
  { dept: 'General', patients: 145 },
  { dept: 'Pediatrics', patients: 68 },
  { dept: 'Orthopedics', patients: 42 },
  { dept: 'Gynecology', patients: 55 },
  { dept: 'ENT', patients: 38 },
  { dept: 'Ophthalmology', patients: 32 },
  { dept: 'Dermatology', patients: 28 },
];

const peakHours = [
  { hour: '8AM', count: 22 },
  { hour: '9AM', count: 48 },
  { hour: '10AM', count: 72 },
  { hour: '11AM', count: 85 },
  { hour: '12PM', count: 65 },
  { hour: '1PM', count: 35 },
  { hour: '2PM', count: 55 },
  { hour: '3PM', count: 62 },
  { hour: '4PM', count: 48 },
  { hour: '5PM', count: 30 },
];

const aiPrediction = {
  avgOPD: 410,
  predictedTomorrow: 565,
  increase: '38%',
  recommendation: 'Increase outpatient staff by 3 doctors to handle predicted surge.',
};

export default function StatisticsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Patient Statistics</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Aggregate operational statistics for AI forecasting</p>
        </div>
        <Button variant="primary" size="sm"><Plus className="h-4 w-4" /> Log Today&apos;s Data</Button>
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {todayStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} padding="md" hover>
              <div className={`p-2 rounded-xl ${stat.bg} w-fit mb-3`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{stat.label}</p>
              <p className="text-[9px] text-slate-400 font-medium mt-1">{stat.change}</p>
            </Card>
          );
        })}
      </div>

      {/* ─── Row: Weekly Trend + AI Prediction ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card padding="md">
            <CardHeader title="Weekly Patient Trend" subtitle="OPD, IPD, and Emergency admissions" />
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrend}>
                  <defs>
                    <linearGradient id="statsOpdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }} itemStyle={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }} labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700 }} />
                  <Area type="monotone" dataKey="opd" stroke="#06B6D4" strokeWidth={2.5} fill="url(#statsOpdGrad)" name="OPD" />
                  <Area type="monotone" dataKey="ipd" stroke="#1E3ABA" strokeWidth={2} fill="transparent" name="IPD" />
                  <Area type="monotone" dataKey="emergency" stroke="#ef4444" strokeWidth={2} fill="transparent" name="Emergency" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* AI Prediction */}
        <div className="lg:col-span-4">
          <Card padding="lg" className="h-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 via-transparent to-blue-50/30" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600"><BrainCircuit className="h-4 w-4 text-white" /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Footfall Prediction</h3>
                  <p className="text-[10px] text-slate-500 font-medium">LightGBM Forecast</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/80 rounded-xl p-4 border border-slate-100 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Avg Daily</p>
                  <p className="text-2xl font-black text-slate-900">{aiPrediction.avgOPD}</p>
                </div>
                <div className="bg-white/80 rounded-xl p-4 border border-amber-100 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Tomorrow</p>
                  <p className="text-2xl font-black text-amber-600">{aiPrediction.predictedTomorrow}</p>
                </div>
              </div>
              <Badge variant="warning" dot size="md">+{aiPrediction.increase} Expected Increase</Badge>
              <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 mt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 font-medium">{aiPrediction.recommendation}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ─── Row: Department Distribution + Peak Hours ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md">
          <CardHeader title="Department Distribution" subtitle="Patient visits by department today" />
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="dept" type="category" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', padding: '10px 14px' }} itemStyle={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }} />
                <Bar dataKey="patients" fill="#1E3ABA" radius={[0, 6, 6, 0]} name="Patients" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="md">
          <CardHeader title="Peak Hours" subtitle="OPD patient count by hour today" />
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', padding: '10px 14px' }} itemStyle={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }} />
                <Bar dataKey="count" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Patients" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
