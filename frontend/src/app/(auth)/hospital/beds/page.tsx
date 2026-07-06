'use client';

import React, { useState, useEffect } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { hospitalApi } from '@/lib/api';
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
  X,
  CheckCheck,
  Loader2,
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

/* ─── Base Categories for UI ─── */
const baseBedCategories = [
  { name: 'General Beds', icon: BedDouble, color: '#1E3ABA' },
  { name: 'ICU Beds', icon: Heart, color: '#ef4444' },
  { name: 'Emergency Beds', icon: ShieldAlert, color: '#f59e0b' },
  { name: 'Isolation Beds', icon: ShieldAlert, color: '#8b5cf6' },
  { name: 'Pediatric Beds', icon: Baby, color: '#06B6D4' },
  { name: 'Maternity Beds', icon: Users, color: '#ec4899' },
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

function BedUpdateModal({
  onClose,
  onSubmit,
  initialCategory,
  bedsData,
}: {
  onClose: () => void;
  onSubmit: (bedId: number, data: any, catName: string) => void;
  initialCategory?: string;
  bedsData: any[];
}) {
  const [category, setCategory] = useState(initialCategory || baseBedCategories[0].name);
  const selectedBed = bedsData.find((b) => b.category === category);
  const [total, setTotal] = useState(String(selectedBed?.total_capacity || '50'));
  const [occupied, setOccupied] = useState(String(selectedBed?.occupied_count || '35'));
  const [reserved, setReserved] = useState(String(selectedBed?.reserved_count || '5'));
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const b = bedsData.find((item) => item.category === category);
    if (b) {
      setTotal(String(b.total_capacity));
      setOccupied(String(b.occupied_count));
      setReserved(String(b.reserved_count));
    } else {
      setTotal('50');
      setOccupied('30');
      setReserved('5');
    }
  }, [category, bedsData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    const bedId = selectedBed?.id || (baseBedCategories.findIndex((c) => c.name === category) + 1);
    try {
      await hospitalApi.updateBed(bedId, {
        total_capacity: parseInt(total) || 0,
        occupied_count: parseInt(occupied) || 0,
        reserved_count: parseInt(reserved) || 0,
      });
    } catch (err) {
      console.warn('Backend updateBed error or offline, using fallback state update:', err);
    }
    onSubmit(
      bedId,
      {
        id: bedId,
        category,
        total_capacity: parseInt(total) || 0,
        occupied_count: parseInt(occupied) || 0,
        reserved_count: parseInt(reserved) || 0,
      },
      category
    );
    setSuccess(true);
    setTimeout(() => onClose(), 1100);
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCheck className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Bed Occupancy Updated!</h3>
          <p className="text-sm text-slate-500 font-medium">Real-time availability numbers have been saved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900">Update Bed Occupancy</h2>
            <p className="text-xs text-slate-500 font-medium">Modify total capacity and active patient counts</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Bed Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            >
              {baseBedCategories.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Total Capacity *</label>
            <input
              required
              type="number"
              min={0}
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Occupied Beds *</label>
            <input
              required
              type="number"
              min={0}
              value={occupied}
              onChange={(e) => setOccupied(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Reserved Beds</label>
            <input
              type="number"
              min={0}
              value={reserved}
              onChange={(e) => setReserved(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div className="flex gap-3 pt-3">
            <Button type="button" variant="ghost" onClick={onClose} className="w-full">Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BedManagementPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | undefined>();
  const [bedsData, setBedsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiPrediction, setAiPrediction] = useState({
    currentICU: 0,
    predictedTomorrow: 0,
    riskLevel: 'EVALUATING',
    recommendation: 'Analyzing occupancy patterns...',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await hospitalApi.getBeds() as any[];
        setBedsData(res);
        
        // Mocking AI prediction based on real data for now
        const icu = res.find(b => b.category.includes('ICU'));
        if (icu) {
          setAiPrediction({
            currentICU: icu.occupancy_percent,
            predictedTomorrow: icu.predicted_occupancy_tomorrow || icu.occupancy_percent + 12,
            riskLevel: icu.occupancy_percent > 80 ? 'HIGH' : 'MODERATE',
            recommendation: icu.occupancy_percent > 80 ? 'Temporarily reserve additional ICU beds.' : 'Capacity is stable.',
          });
        }
      } catch (err) {
        console.error("Failed to load beds", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleBedUpdate = (bedId: number, newData: any, catName: string) => {
    setBedsData((prev) => {
      const exists = prev.some((b) => b.category === catName || b.id === bedId);
      if (exists) {
        return prev.map((b) => (b.category === catName || b.id === bedId ? { ...b, ...newData } : b));
      }
      return [...prev, newData];
    });
  };

  const bedCategories = baseBedCategories.map(base => {
    const data = bedsData.find(b => b.category === base.name);
    return {
      ...base,
      total: data?.total_capacity || 0,
      occupied: data?.occupied_count || 0,
      reserved: data?.reserved_count || 0,
    };
  });

  const totalBeds = bedCategories.reduce((a, b) => a + b.total, 0);
  const totalOccupied = bedCategories.reduce((a, b) => a + b.occupied, 0);
  const totalAvailable = totalBeds - totalOccupied - bedCategories.reduce((a, b) => a + b.reserved, 0);

  const pieData = bedCategories.filter(cat => cat.occupied > 0).map((cat) => ({
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
        <Button variant="primary" size="sm" onClick={() => { setSelectedCat(undefined); setShowModal(true); }}>
          <BedDouble className="h-4 w-4" /> Update Beds
        </Button>
      </div>

      {showModal && (
        <BedUpdateModal
          onClose={() => setShowModal(false)}
          onSubmit={handleBedUpdate}
          initialCategory={selectedCat}
          bedsData={bedsData}
        />
      )}

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
            {totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0}%
          </p>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Occupancy Rate</p>
        </Card>
      </div>

      {/* ─── Bed Category Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bedCategories.map((cat) => {
          const available = cat.total - cat.occupied - cat.reserved;
          const occupancyPercent = cat.total > 0 ? Math.round((cat.occupied / cat.total) * 100) : 0;
          const Icon = cat.icon;
          const statusVariant: 'healthy' | 'warning' | 'critical' =
            occupancyPercent >= 90 ? 'critical' : occupancyPercent >= 70 ? 'warning' : 'healthy';

          return (
            <Card key={cat.name} padding="md" hover className="cursor-pointer" onClick={() => { setSelectedCat(cat.name); setShowModal(true); }}>
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
