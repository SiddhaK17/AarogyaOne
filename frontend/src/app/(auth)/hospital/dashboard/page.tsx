'use client';

import React from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  Pill,
  BedDouble,
  Users,
  Ambulance,
  Stethoscope,
  Syringe,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Activity,
  BrainCircuit,
  Clock,
  CheckCircle2,
  Package,
  Wind,
  Droplets,
  ShieldCheck,
  ArrowLeftRight,
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
const summaryCards = [
  { label: 'Total Medicines', value: '1,247', icon: Pill, change: '+12', trend: 'up', color: 'text-teal-600', bg: 'bg-teal-50' },
  { label: 'ICU Beds Available', value: '6 / 20', icon: BedDouble, change: '-2', trend: 'down', color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'General Beds', value: '42 / 80', icon: BedDouble, change: '+5', trend: 'up', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Doctors Present', value: '14', icon: Stethoscope, change: '+1', trend: 'up', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Nurses On Duty', value: '28', icon: Users, change: '0', trend: 'up', color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Ambulances', value: '3 / 4', icon: Ambulance, change: '0', trend: 'up', color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: "Today's OPD", value: '412', icon: TrendingUp, change: '+38', trend: 'up', color: 'text-sky-600', bg: 'bg-sky-50' },
  { label: "Today's IPD", value: '67', icon: Activity, change: '+4', trend: 'up', color: 'text-pink-600', bg: 'bg-pink-50' },
];

const resourceStatus = [
  { name: 'Medicines', status: 'healthy', percent: 78, icon: Pill },
  { name: 'Oxygen Cylinders', status: 'warning', percent: 35, icon: Wind },
  { name: 'Blood Units', status: 'critical', percent: 12, icon: Droplets },
  { name: 'PPE Kits', status: 'healthy', percent: 85, icon: ShieldCheck },
  { name: 'Vaccines', status: 'warning', percent: 40, icon: Syringe },
  { name: 'Emergency Equip.', status: 'healthy', percent: 92, icon: Package },
];

const weeklyOPD = [
  { day: 'Mon', opd: 380, ipd: 52 },
  { day: 'Tue', opd: 420, ipd: 65 },
  { day: 'Wed', opd: 395, ipd: 58 },
  { day: 'Thu', opd: 450, ipd: 71 },
  { day: 'Fri', opd: 412, ipd: 67 },
  { day: 'Sat', opd: 310, ipd: 45 },
  { day: 'Sun', opd: 280, ipd: 38 },
];

const forecasts = [
  { message: 'Paracetamol expected to run out in 3 days.', severity: 'critical' as const },
  { message: 'ICU occupancy expected to reach 92% tomorrow.', severity: 'warning' as const },
  { message: 'Oxygen demand likely to increase next week.', severity: 'warning' as const },
  { message: 'Doctor shortage expected during upcoming festival.', severity: 'info' as const },
];

const recommendations = [
  { action: 'Request additional insulin from District Medical Store.', priority: 'High' },
  { action: 'Transfer surplus oxygen cylinders to PHC Hadapsar (4.2 km).', priority: 'Critical' },
  { action: 'Increase doctor allocation for the weekend OPD surge.', priority: 'Medium' },
  { action: 'Investigate increasing citizen complaints about wait times.', priority: 'Low' },
];

const recentActivity = [
  { time: '2 min ago', text: 'Paracetamol inventory updated by Pharmacist Sanjay.', icon: Package },
  { time: '15 min ago', text: 'ICU Bed #12 status changed to Occupied.', icon: BedDouble },
  { time: '1 hr ago', text: 'Resource transfer approved by District HQ.', icon: ArrowLeftRight },
  { time: '2 hr ago', text: 'New citizen complaint received: Water supply issue.', icon: AlertTriangle },
  { time: '3 hr ago', text: 'Dr. Mehta checked in for Morning shift.', icon: CheckCircle2 },
];

/* ─── Component ─── */
export default function HospitalDashboard() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Hospital Dashboard
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          PHC Kothrud, Pune · District: Pune · Last synced: 2 minutes ago
        </p>
      </div>

      {/* ─── Summary Cards Grid ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} padding="md" hover>
              <div className="flex items-start justify-between">
                <div
                  className={`p-2.5 rounded-xl ${card.bg} flex-shrink-0`}
                >
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                {card.change !== '0' && (
                  <span
                    className={`text-[10px] font-bold flex items-center gap-0.5 ${
                      card.trend === 'up'
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {card.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {card.change}
                  </span>
                )}
              </div>
              <p className="text-2xl font-black text-slate-900 mt-3">
                {card.value}
              </p>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">
                {card.label}
              </p>
            </Card>
          );
        })}
      </div>

      {/* ─── Row: AI Health Score + Resource Status + Forecast ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* AI Health Score */}
        <div className="lg:col-span-3">
          <Card padding="lg" className="h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-transparent to-blue-50/50" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/50 text-teal-700 text-[10px] font-bold mb-4">
                <BrainCircuit className="h-3 w-3" />
                AI HEALTH SCORE
              </div>
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60" cy="60" r="52"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60" cy="60" r="52"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(74 / 100) * 2 * Math.PI * 52} ${
                      2 * Math.PI * 52
                    }`}
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-900">74</span>
                  <span className="text-[10px] font-bold text-slate-500">/100</span>
                </div>
              </div>
              <Badge variant="warning" dot>Needs Attention</Badge>
              <p className="text-[10px] text-slate-400 mt-3 font-medium leading-relaxed">
                Low oxygen stock and rising bed occupancy are pulling the score down.
              </p>
            </div>
          </Card>
        </div>

        {/* Resource Status */}
        <div className="lg:col-span-5">
          <Card padding="md" className="h-full">
            <CardHeader title="Resource Status" subtitle="Real-time availability overview" />
            <div className="space-y-3.5">
              {resourceStatus.map((item) => {
                const Icon = item.icon;
                const barColor =
                  item.status === 'healthy'
                    ? 'bg-emerald-500'
                    : item.status === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-rose-500';
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-700 truncate">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {item.percent}%
                          </span>
                          <Badge
                            variant={item.status as 'healthy' | 'warning' | 'critical'}
                            dot
                          >
                            {item.status === 'healthy'
                              ? 'OK'
                              : item.status === 'warning'
                              ? 'Low'
                              : 'Critical'}
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${barColor} transition-all duration-500`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* AI Forecast */}
        <div className="lg:col-span-4">
          <Card padding="md" className="h-full">
            <CardHeader
              title="AI Forecasts"
              subtitle="Predictions from LightGBM engine"
              action={
                <Badge variant="info" dot>
                  Live
                </Badge>
              }
            />
            <div className="space-y-3">
              {forecasts.map((f, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border text-xs font-medium leading-relaxed ${
                    f.severity === 'critical'
                      ? 'bg-rose-50/50 border-rose-200/60 text-rose-700'
                      : f.severity === 'warning'
                      ? 'bg-amber-50/50 border-amber-200/60 text-amber-700'
                      : 'bg-blue-50/50 border-blue-200/60 text-blue-700'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    {f.message}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ─── Row: Weekly OPD/IPD Chart + AI Recommendations ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Chart */}
        <div className="lg:col-span-7">
          <Card padding="md">
            <CardHeader title="Weekly Patient Footfall" subtitle="OPD vs IPD trends this week" />
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyOPD}>
                  <defs>
                    <linearGradient id="opdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ipdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    }}
                    itemStyle={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                  <Area type="monotone" dataKey="opd" stroke="#14b8a6" strokeWidth={2.5} fill="url(#opdGrad)" name="OPD" />
                  <Area type="monotone" dataKey="ipd" stroke="#6366f1" strokeWidth={2.5} fill="url(#ipdGrad)" name="IPD" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* AI Recommendations */}
        <div className="lg:col-span-5">
          <Card padding="md" className="h-full">
            <CardHeader
              title="AI Recommendations"
              subtitle="Proactive actions suggested by the engine"
              action={
                <span className="p-1.5 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600">
                  <BrainCircuit className="h-4 w-4 text-white" />
                </span>
              }
            />
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all group cursor-pointer"
                >
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                      {rec.action}
                    </p>
                    <Badge
                      variant={
                        rec.priority === 'Critical'
                          ? 'critical'
                          : rec.priority === 'High'
                          ? 'warning'
                          : rec.priority === 'Medium'
                          ? 'info'
                          : 'neutral'
                      }
                      size="sm"
                      dot
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ─── Row: Recent Activity ─── */}
      <Card padding="md">
        <CardHeader title="Recent Activity" subtitle="Latest operational events across the hospital" />
        <div className="space-y-0 divide-y divide-slate-100">
          {recentActivity.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-slate-500" />
                </div>
                <p className="text-sm text-slate-700 font-medium flex-1">
                  {item.text}
                </p>
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 flex-shrink-0">
                  <Clock className="h-3 w-3" />
                  {item.time}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
