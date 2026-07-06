'use client';

import React, { useState, useEffect } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  BrainCircuit,
  Truck,
  MapPin,
  Pill,
  Wind,
} from 'lucide-react';
import { hospitalApi } from '@/lib/api';

/* ─── Base Transfer Stats ─── */
const baseTransferStats = [
  { label: 'Total Requests', value: 12, color: 'text-slate-900', bg: 'bg-slate-100' },
  { label: 'Incoming', value: 3, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Outgoing', value: 5, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Pending Approval', value: 2, color: 'text-amber-600', bg: 'bg-amber-50' },
];

const statusMap: Record<string, { icon: React.ReactNode; variant: 'healthy' | 'warning' | 'critical' | 'info' | 'neutral' }> = {
  'Approved': { icon: <CheckCircle2 className="h-3.5 w-3.5" />, variant: 'info' },
  'In Transit': { icon: <Truck className="h-3.5 w-3.5" />, variant: 'warning' },
  'Pending': { icon: <Clock className="h-3.5 w-3.5" />, variant: 'neutral' },
  'Completed': { icon: <CheckCircle2 className="h-3.5 w-3.5" />, variant: 'healthy' },
  'Declined': { icon: <XCircle className="h-3.5 w-3.5" />, variant: 'critical' },
};

export default function TransfersPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myHospitalId, setMyHospitalId] = useState<number | null>(null);
  
  // AI Reco could be fetched dynamically, using a placeholder based on data for now
  const [aiRec, setAiRec] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // We can get myHospitalId from the profile
        const profile = await hospitalApi.getProfile() as any;
        setMyHospitalId(profile.id);

        const data = await hospitalApi.getTransfers() as any[];
        
        const mapped = data.map(t => {
          const isIncoming = t.to_hospital_id === profile.id;
          return {
            id: `TRF-${String(t.id).padStart(3, '0')}`,
            dbId: t.id,
            direction: isIncoming ? 'incoming' : 'outgoing',
            item: t.item_name,
            quantity: t.quantity,
            unit: 'Units', // Fallback, would normally come from item
            from: t.from_hospital_name,
            to: t.to_hospital_name,
            distance: t.distance_km ? `${t.distance_km.toFixed(1)} km` : '—',
            eta: t.eta_minutes ? `${t.eta_minutes} min` : '—',
            status: t.status,
            aiRecommended: t.ai_recommended,
            aiReasoning: t.ai_reasoning,
            timestamp: new Date(t.created_at).toLocaleString('en-IN'),
          };
        });

        // Generate AI rec if any are recommended
        const rec = mapped.find(t => t.aiRecommended && t.status === 'Pending');
        if (rec) {
          setAiRec({
            item: rec.item,
            from: rec.from,
            quantity: `${rec.quantity} ${rec.unit}`,
            distance: rec.distance,
            estimatedDelivery: rec.eta,
            reason: rec.aiReasoning || `AI indicates ${rec.item} is critically low and should be transferred from ${rec.from}.`
          });
        }

        setTransfers(mapped);
      } catch (err) {
        console.error("Failed to load transfers", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = transfers.filter((t) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Incoming') return t.direction === 'incoming';
    if (activeFilter === 'Outgoing') return t.direction === 'outgoing';
    return t.status === activeFilter;
  });

  const transferStats = [
    { label: 'Total Requests', value: transfers.length, color: 'text-slate-900', bg: 'bg-slate-100' },
    { label: 'Incoming', value: transfers.filter(t => t.direction === 'incoming').length, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Outgoing', value: transfers.filter(t => t.direction === 'outgoing').length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Pending Approval', value: transfers.filter(t => t.status === 'Pending').length, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completed', value: transfers.filter(t => t.status === 'Completed').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Declined', value: transfers.filter(t => t.status === 'Declined').length, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Resource Transfer Centre</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">AI-optimized inter-hospital resource redistribution</p>
        </div>
        <Button variant="primary" size="sm"><ArrowLeftRight className="h-4 w-4" /> New Transfer Request</Button>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {transferStats.map((stat) => (
          <Card key={stat.label} padding="sm" className="text-center">
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* ─── AI Recommendation Banner ─── */}
      {aiRec ? (
        <Card padding="md" className="relative overflow-hidden border-teal-200/50 bg-gradient-to-r from-teal-50/50 via-white to-blue-50/50">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600">
                  <BrainCircuit className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Transfer Recommendation</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Powered by Google OR-Tools Optimization Engine</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">{aiRec.reason}</p>
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm">Accept & Request Transfer</Button>
                <Button variant="ghost" size="sm" onClick={() => setAiRec(null)}>Dismiss</Button>
              </div>
            </div>

          <div className="lg:w-[280px] flex-shrink-0 bg-white/80 rounded-xl border border-slate-100 p-4">
            <h4 className="text-[10px] font-bold text-teal-700 uppercase tracking-wider mb-3">Recommended Transfer</h4>
            <div className="space-y-2.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Item</span>
                <span className="font-bold text-slate-900">{aiRec.item}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Source</span>
                <span className="font-bold text-slate-900">{aiRec.from}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Quantity</span>
                <span className="font-bold text-slate-900">{aiRec.quantity}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Distance</span>
                <span className="font-bold text-slate-900 flex items-center gap-1"><MapPin className="h-3 w-3" />{aiRec.distance}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">ETA</span>
                <span className="font-bold text-emerald-600">{aiRec.estimatedDelivery}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
      ) : null}

      {/* ─── Filters ─── */}
      <div className="flex items-center gap-2 flex-wrap">
        {['All', 'Incoming', 'Outgoing', 'Pending', 'In Transit', 'Completed'].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ─── Transfer List ─── */}
      <div className="space-y-3">
        {filtered.map((t) => {
          const st = statusMap[t.status];
          return (
            <Card key={t.id} padding="md" hover className="cursor-pointer">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Direction icon */}
                <div className={`p-3 rounded-xl flex-shrink-0 ${t.direction === 'incoming' ? 'bg-blue-50' : 'bg-indigo-50'}`}>
                  {t.direction === 'incoming' ? (
                    <ArrowDownLeft className="h-5 w-5 text-blue-600" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5 text-indigo-600" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-900">{t.item}</h3>
                    <Badge variant="neutral" size="sm">{t.quantity} {t.unit}</Badge>
                    {t.aiRecommended && (
                      <Badge variant="info" size="sm"><BrainCircuit className="h-2.5 w-2.5" /> AI</Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {t.from} → {t.to} · {t.distance} · {t.id}
                  </p>
                </div>

                {/* Status + ETA */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {t.eta !== '—' && (
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                      <Truck className="h-3 w-3" /> ETA: {t.eta}
                    </span>
                  )}
                  <Badge variant={st.variant} dot size="md">{t.status}</Badge>
                </div>

                {/* Time */}
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 flex-shrink-0">
                  <Clock className="h-3 w-3" /> {t.timestamp}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
