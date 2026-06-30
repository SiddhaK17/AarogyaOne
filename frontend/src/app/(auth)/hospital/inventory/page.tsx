'use client';

import React, { useState } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  Pill,
  Wind,
  Droplets,
  ShieldCheck,
  Syringe,
  Package,
  Search,
  Plus,
  Mic,
  AlertTriangle,
  TrendingDown,
  Filter,
  Download,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* ─── Mock Data ─── */
const categories = [
  { name: 'Medicines', icon: Pill, total: 1247, low: 18, critical: 4, color: 'text-teal-600', bg: 'bg-teal-50' },
  { name: 'Oxygen', icon: Wind, total: 48, low: 2, critical: 1, color: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'Blood Units', icon: Droplets, total: 32, low: 5, critical: 3, color: 'text-rose-600', bg: 'bg-rose-50' },
  { name: 'PPE Kits', icon: ShieldCheck, total: 850, low: 0, critical: 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { name: 'Vaccines', icon: Syringe, total: 2100, low: 3, critical: 0, color: 'text-violet-600', bg: 'bg-violet-50' },
  { name: 'Emergency', icon: Package, total: 56, low: 1, critical: 0, color: 'text-orange-600', bg: 'bg-orange-50' },
];

const inventoryItems = [
  { id: 'M001', name: 'Paracetamol 500mg', category: 'Medicines', current: 120, min: 200, max: 1000, expiry: '2027-03-15', supplier: 'Sun Pharma', status: 'critical', depletionDays: 3 },
  { id: 'M002', name: 'Amoxicillin 250mg', category: 'Medicines', current: 380, min: 150, max: 800, expiry: '2027-06-20', supplier: 'Cipla Ltd.', status: 'healthy', depletionDays: 12 },
  { id: 'M003', name: 'Insulin Glargine', category: 'Medicines', current: 45, min: 50, max: 200, expiry: '2026-12-01', supplier: 'Novo Nordisk', status: 'warning', depletionDays: 5 },
  { id: 'O001', name: 'Oxygen Cylinder (Type D)', category: 'Oxygen', current: 8, min: 15, max: 50, expiry: '—', supplier: 'Linde Gas', status: 'critical', depletionDays: 2 },
  { id: 'B001', name: 'Blood Unit A+', category: 'Blood Units', current: 3, min: 10, max: 30, expiry: '2026-08-10', supplier: 'District Blood Bank', status: 'critical', depletionDays: 1 },
  { id: 'P001', name: 'N95 Masks', category: 'PPE Kits', current: 420, min: 100, max: 500, expiry: '2028-01-01', supplier: 'Venus Safety', status: 'healthy', depletionDays: 45 },
  { id: 'V001', name: 'Covishield Dose', category: 'Vaccines', current: 180, min: 200, max: 1000, expiry: '2026-11-30', supplier: 'SII', status: 'warning', depletionDays: 7 },
  { id: 'E001', name: 'Defibrillator Pads', category: 'Emergency', current: 12, min: 5, max: 20, expiry: '2027-09-01', supplier: 'Philips Health', status: 'healthy', depletionDays: 90 },
];

const consumptionData = [
  { name: 'Paracetamol', used: 68 },
  { name: 'Amoxicillin', used: 32 },
  { name: 'Insulin', used: 9 },
  { name: 'Oxygen', used: 4 },
  { name: 'Blood A+', used: 3 },
  { name: 'N95 Masks', used: 15 },
];

export default function InventoryPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = inventoryItems.filter((item) => {
    const matchesCategory = activeFilter === 'All' || item.category === activeFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Resource & Inventory
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage medicines, equipment, and consumables in real time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Mic className="h-4 w-4" /> Voice Update
          </Button>
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* ─── Category Overview ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card
              key={cat.name}
              padding="sm"
              hover
              className="cursor-pointer"
            >
              <div className={`p-2 rounded-xl ${cat.bg} w-fit mb-3`}>
                <Icon className={`h-4 w-4 ${cat.color}`} />
              </div>
              <p className="text-lg font-black text-slate-900">{cat.total}</p>
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                {cat.name}
              </p>
              {(cat.low > 0 || cat.critical > 0) && (
                <div className="flex gap-2 mt-2">
                  {cat.critical > 0 && (
                    <Badge variant="critical" size="sm" dot>
                      {cat.critical} Critical
                    </Badge>
                  )}
                  {cat.low > 0 && (
                    <Badge variant="warning" size="sm">
                      {cat.low} Low
                    </Badge>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── Filters & Search ─── */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {['All', 'Medicines', 'Oxygen', 'Blood Units', 'PPE Kits', 'Vaccines', 'Emergency'].map(
            (f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeFilter === f
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            )
          )}
        </div>
        <div className="flex items-center gap-2 bg-slate-100/80 rounded-xl px-4 py-2.5 w-full sm:w-[280px] focus-within:ring-2 focus-within:ring-slate-900 focus-within:bg-white transition-all">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items..."
            className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none w-full font-medium"
          />
        </div>
      </div>

      {/* ─── Inventory Table ─── */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Item</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Category</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Stock</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">AI Depletion</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Expiry</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Supplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{item.id}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="neutral">{item.category}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-bold text-slate-900">{item.current}</p>
                      <p className="text-[10px] text-slate-400">Min: {item.min} / Max: {item.max}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      variant={item.status as 'healthy' | 'warning' | 'critical'}
                      dot
                    >
                      {item.status === 'healthy' ? 'Healthy' : item.status === 'warning' ? 'Low' : 'Critical'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold flex items-center gap-1 ${
                      item.depletionDays <= 3
                        ? 'text-rose-600'
                        : item.depletionDays <= 7
                        ? 'text-amber-600'
                        : 'text-slate-600'
                    }`}>
                      {item.depletionDays <= 7 && <TrendingDown className="h-3 w-3" />}
                      {item.depletionDays} days
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600 font-medium">{item.expiry}</td>
                  <td className="px-5 py-4 text-xs text-slate-600 font-medium">{item.supplier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── Daily Consumption Chart ─── */}
      <Card padding="md">
        <CardHeader title="Today's Consumption" subtitle="Units consumed across top items today" />
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={consumptionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                }}
                itemStyle={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}
                labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700 }}
              />
              <Bar dataKey="used" fill="#14b8a6" radius={[0, 6, 6, 0]} name="Units Used" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
