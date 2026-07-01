'use client';

import React from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  BedDouble,
  AlertTriangle,
  TrendingUp,
  BrainCircuit,
  Baby,
  Heart,
  ShieldAlert,
  Users,
  ArrowRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

/* ─── Mock Data ─── */
const bedCategories = [
  { name: 'General Beds', total: 80, occupied: 38, reserved: 4, icon: BedDouble, color: '#1E3ABA' },
  { name: 'ICU Beds', total: 20, occupied: 14, reserved: 2, icon: Heart, color: '#ef4444' },
  { name: 'Emergency Beds', total: 12, occupied: 8, reserved: 1, icon: ShieldAlert, color: '#f59e0b' },
  { name: 'Isolation Beds', total: 10, occupied: 3, reserved: 0, icon: ShieldAlert, color: '#8b5cf6' },
  { name: 'Pediatric Beds', total: 15, occupied: 6, reserved: 1, icon: Baby, color: '#06B6D4' },
  { name: 'Maternity Beds', total: 10, occupied: 7, reserved: 1, icon: Users, color: '#ec4899' },
];

const occupancyTrend = [
  { hour: '6AM', general: 42, icu: 65, emergency: 50 },
  { hour: '8AM', general: 45, icu: 68, emergency: 55 },
  { hour: '10AM', general: 48, icu: 70, emergency: 62 },
  { hour: '12PM', general: 52, icu: 72, emergency: 67 },
  { hour: '2PM', general: 47, icu: 70, emergency: 58 },
  { hour: '4PM', general: 50, icu: 74, emergency: 65 },
  { hour: '6PM', general: 48, icu: 70, emergency: 60 },
];

const aiPrediction = {
  currentICU: 84,
  predictedTomorrow: 96,
  riskLevel: 'HIGH',
  recommendation: 'Temporarily reserve 6 additional ICU beds. Consider redirecting non-critical admissions to CHC Warje (3.1 km away).',
};

export default function BedManagementPage() {
  const totalBeds = bedCategories.reduce((a, b) => a + b.total, 0);
  const totalOccupied = bedCategories.reduce((a, b) => a + b.occupied, 0);
  const totalAvailable = totalBeds - totalOccupied - bedCategories.reduce((a, b) => a + b.reserved, 0);

  const pieData = bedCategories.map((cat) => ({
    name: cat.name,
    value: cat.occupied,
    color: cat.color,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Bed Management
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Real-time bed occupancy and capacity forecasting
          </p>
        </div>
        <Button variant="primary" size="sm">
          <BedDouble className="h-4 w-4" /> Update Beds
        </Button>
      </div>

      {/* ─── Overall Summary ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="md" className="text-center">
          <p className="text-4xl font-black text-slate-900">{totalBeds}</p>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Total Beds</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-4xl font-black text-emerald-600">{totalAvailable}</p>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Available</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-4xl font-black text-amber-600">
            {Math.round((totalOccupied / totalBeds) * 100)}%
          </p>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Occupancy Rate</p>
        </Card>
      </div>

      {/* ─── Bed Category Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bedCategories.map((cat) => {
          const available = cat.total - cat.occupied - cat.reserved;
          const occupancyPercent = Math.round((cat.occupied / cat.total) * 100);
          const Icon = cat.icon;
          const statusVariant: 'healthy' | 'warning' | 'critical' =
            occupancyPercent >= 90 ? 'critical' : occupancyPercent >= 70 ? 'warning' : 'healthy';

          return (
            <Card key={cat.name} padding="md" hover>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2.5 rounded-xl"
                    style={{ backgroundColor: `${cat.color}15` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: cat.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {cat.total} total capacity
                    </p>
                  </div>
                </div>
                <Badge variant={statusVariant} dot>
                  {occupancyPercent}%
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <p className="text-lg font-black text-slate-900">{cat.occupied}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Occupied</p>
                </div>
                <div className="bg-emerald-50/50 rounded-xl p-2.5">
                  <p className="text-lg font-black text-emerald-600">{available}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Available</p>
                </div>
                <div className="bg-amber-50/50 rounded-xl p-2.5">
                  <p className="text-lg font-black text-amber-600">{cat.reserved}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Reserved</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${occupancyPercent}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* ─── Row: Occupancy Trend + AI Prediction ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Occupancy Trend Chart */}
        <div className="lg:col-span-7">
          <Card padding="md">
            <CardHeader title="Occupancy Trends" subtitle="Hourly occupancy % by category today" />
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={occupancyTrend}>
                  <defs>
                    <linearGradient id="genGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E3ABA" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#1E3ABA" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="icuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                    itemStyle={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="general" stroke="#1E3ABA" strokeWidth={2} fill="url(#genGrad)" name="General" />
                  <Area type="monotone" dataKey="icu" stroke="#ef4444" strokeWidth={2} fill="url(#icuGrad)" name="ICU" />
                  <Area type="monotone" dataKey="emergency" stroke="#f59e0b" strokeWidth={2} fill="transparent" name="Emergency" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* AI Prediction Panel */}
        <div className="lg:col-span-5">
          <Card padding="lg" className="h-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50/30 via-transparent to-amber-50/30" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600">
                  <BrainCircuit className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Capacity Prediction</h3>
                  <p className="text-[10px] text-slate-500 font-medium">ICU Bed Forecast</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/80 rounded-xl p-4 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Current ICU</p>
                  <p className="text-3xl font-black text-slate-900">{aiPrediction.currentICU}%</p>
                </div>
                <div className="bg-white/80 rounded-xl p-4 border border-rose-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Predicted Tomorrow</p>
                  <p className="text-3xl font-black text-rose-600">{aiPrediction.predictedTomorrow}%</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Badge variant="critical" dot size="md">
                  Risk: {aiPrediction.riskLevel}
                </Badge>
                <span className="flex items-center gap-1 text-rose-600 text-xs font-bold">
                  <TrendingUp className="h-3 w-3" /> +12%
                </span>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-800 mb-1">Recommendation</p>
                    <p className="text-xs text-amber-700 font-medium leading-relaxed">
                      {aiPrediction.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ─── Distribution Pie */}
      <Card padding="md">
        <CardHeader title="Bed Occupancy Distribution" subtitle="Occupied beds across all categories" />
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', padding: '10px 14px' }}
                itemStyle={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {pieData.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              {d.name}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
