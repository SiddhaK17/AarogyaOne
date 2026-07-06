'use client';

import React, { useEffect, useState } from 'react';
import { useHospitalSession } from '@/context/HospitalSessionContext';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  Pill, BedDouble, Users, Ambulance, Stethoscope,
  Syringe, TrendingUp, TrendingDown, AlertTriangle, ArrowRight,
  Activity, BrainCircuit, Clock, CheckCircle2, Package,
  Wind, Droplets, ShieldCheck, ArrowLeftRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { hospitalApi, subscribeToNotifications, subscribeToInventoryChanges, subscribeToBedChanges } from '@/lib/api';

/* ─── Component ─── */
export default function HospitalDashboard() {
  const { session } = useHospitalSession();
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [weeklyOPD, setWeeklyOPD] = useState<any[]>([]);
  const [resourceStatus, setResourceStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashRes, statsRes, invRes] = await Promise.all([
          hospitalApi.getDashboard().catch(() => null),
          hospitalApi.getStatistics(7).catch(() => []),
          hospitalApi.getInventory().catch(() => [])
        ]);

        if (dashRes) setDashboardData(dashRes);
        
        if (statsRes && Array.isArray(statsRes)) {
          const formatted = statsRes.map((s: any) => ({
            day: new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' }),
            opd: s.opd_count,
            ipd: s.ipd_count
          })).reverse(); // chronological
          setWeeklyOPD(formatted.length ? formatted : []);
        }

        if (invRes && Array.isArray(invRes)) {
          // Map inventory to resource status bars
          const mapped = invRes.slice(0, 6).map((item: any) => {
            const pct = item.max_capacity > 0 ? Math.round((item.current_quantity / item.max_capacity) * 100) : 0;
            let status = 'healthy';
            if (item.current_quantity === 0) status = 'critical';
            else if (item.current_quantity <= item.min_threshold) status = 'warning';
            
            let icon = Package;
            if (item.category.includes('Medicine')) icon = Pill;
            else if (item.category.includes('Oxygen')) icon = Wind;
            else if (item.category.includes('Blood')) icon = Droplets;
            else if (item.category.includes('PPE')) icon = ShieldCheck;
            else if (item.category.includes('Vaccine')) icon = Syringe;

            return { name: item.item_name, status, percent: pct, icon };
          });
          setResourceStatus(mapped);
        }

      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    let unsubNotifications: (() => void) | undefined;
    let unsubInventory = subscribeToInventoryChanges(() => loadData());
    let unsubBeds = subscribeToBedChanges(() => loadData());

    if (session && session.hospital_id) {
      unsubNotifications = subscribeToNotifications('hospital', String(session.hospital_id), () => loadData());
    }

    return () => {
      unsubInventory();
      unsubBeds();
      if (unsubNotifications) unsubNotifications();
    };
  }, [session]);

  if (loading) {
    return <div className="flex h-[400px] items-center justify-center text-slate-500 font-bold">Loading dashboard...</div>;
  }

  if (!dashboardData) {
    return <div className="flex h-[400px] items-center justify-center text-rose-500 font-bold">Failed to load dashboard. Ensure you are logged in.</div>;
  }

  const { hospital, inventory_summary, bed_summary, staff_summary, recent_notifications } = dashboardData;

  const summaryCards = [
    { label: 'Total Medicines Tracked', value: inventory_summary?.total_items || 0, icon: Pill, change: '0', trend: 'up', color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Beds Available', value: `${bed_summary?.available || 0} / ${bed_summary?.total_capacity || 0}`, icon: BedDouble, change: '0', trend: 'up', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Low Stock Alerts', value: inventory_summary?.low_stock_count || 0, icon: AlertTriangle, change: '0', trend: 'down', color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Staff Present', value: staff_summary?.present || 0, icon: Users, change: '0', trend: 'up', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const forecasts = recent_notifications?.filter((n: any) => n.category === 'forecast') || [];
  const recommendations = recent_notifications?.filter((n: any) => n.category === 'recommendation') || [];
  const recentActivity = recent_notifications?.slice(0, 5) || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Hospital <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-blue">Dashboard</span>
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          {hospital ? (
            <>{hospital.name} · <span className="font-bold text-slate-700">{hospital.taluka} Taluka</span> · District: {hospital.district} · Last synced: just now</>
          ) : (
            'Loading hospital data…'
          )}
        </p>
      </div>

      {/* ─── Summary Cards Grid ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} padding="md" hover>
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl ${card.bg} flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
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
            <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/10 via-transparent to-brand-blue/10" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[10px] font-bold mb-4">
                <BrainCircuit className="h-3 w-3" />
                AI HEALTH SCORE
              </div>
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="52" fill="none" stroke="url(#scoreGradient)"
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${((hospital?.health_score || 0) / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06B6D4" />
                      <stop offset="100%" stopColor="#1E3ABA" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-900">{hospital?.health_score || 0}</span>
                  <span className="text-[10px] font-bold text-slate-500">/100</span>
                </div>
              </div>
              <Badge variant={hospital?.health_score < 50 ? "critical" : hospital?.health_score < 75 ? "warning" : "healthy"} dot>
                {hospital?.health_score < 50 ? "Critical" : hospital?.health_score < 75 ? "Needs Attention" : "Healthy"}
              </Badge>
            </div>
          </Card>
        </div>

        {/* Resource Status */}
        <div className="lg:col-span-5">
          <Card padding="md" className="h-full">
            <CardHeader title="Resource Status" subtitle="Real-time availability overview" />
            <div className="space-y-3.5">
              {resourceStatus.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No inventory tracked yet.</p>
              ) : resourceStatus.map((item) => {
                const Icon = item.icon;
                const barColor = item.status === 'healthy' ? 'bg-emerald-500' : item.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500';
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                         <span className="text-xs font-semibold text-slate-700 truncate">{item.name}</span>
                         <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-slate-900">{item.percent}%</span>
                           <Badge variant={item.status as 'healthy'|'warning'|'critical'} dot>
                             {item.status === 'healthy' ? 'OK' : item.status === 'warning' ? 'Low' : 'Critical'}
                           </Badge>
                         </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${barColor} transition-all duration-500`} style={{ width: `${item.percent}%` }} />
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
            <CardHeader title="AI Forecasts" subtitle="Predictions from LightGBM engine" action={<Badge variant="info" dot>Live</Badge>} />
            <div className="space-y-3">
              {forecasts.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No critical forecasts at this time.</p>
              ) : forecasts.map((f: any, i: number) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border text-xs font-medium leading-relaxed ${
                    f.priority === 'Critical' ? 'bg-rose-50/50 border-rose-200/60 text-rose-700' :
                    f.priority === 'High' ? 'bg-amber-50/50 border-amber-200/60 text-amber-700' :
                    'bg-blue-50/50 border-blue-200/60 text-blue-700'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    {f.body}
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
              {weeklyOPD.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyOPD}>
                    <defs>
                      <linearGradient id="opdGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ipdGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E3ABA" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#1E3ABA" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                      itemStyle={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}
                      labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    />
                    <Area type="monotone" dataKey="opd" stroke="#06B6D4" strokeWidth={2.5} fill="url(#opdGrad)" name="OPD" />
                    <Area type="monotone" dataKey="ipd" stroke="#1E3ABA" strokeWidth={2.5} fill="url(#ipdGrad)" name="IPD" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-500 italic">No statistical data recorded yet.</div>
              )}
            </div>
          </Card>
        </div>

        {/* AI Recommendations */}
        <div className="lg:col-span-5">
          <Card padding="md" className="h-full">
            <CardHeader
              title="AI Recommendations" subtitle="Proactive actions suggested by the engine"
              action={<span className="p-1.5 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600"><BrainCircuit className="h-4 w-4 text-white" /></span>}
            />
            <div className="space-y-3">
              {recommendations.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No recommendations at this time.</p>
              ) : recommendations.map((rec: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all group cursor-pointer">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">{rec.body}</p>
                    <Badge variant={rec.priority === 'Critical' ? 'critical' : rec.priority === 'High' ? 'warning' : 'info'} size="sm" dot>
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
          {recentActivity.length === 0 ? (
            <p className="py-4 text-xs text-slate-500 italic">No recent activity.</p>
          ) : recentActivity.map((item: any, i: number) => {
            return (
              <div key={i} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700 font-bold">{item.title}</p>
                  <p className="text-xs text-slate-500 font-medium">{item.body}</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 flex-shrink-0">
                  {new Date(item.created_at).toLocaleTimeString()}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
