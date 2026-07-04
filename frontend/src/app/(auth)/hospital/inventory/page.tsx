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
  TrendingDown,
  X,
  Loader2,
  CheckCheck,
  Pencil,
  Trash2,
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

/* ─── Types ─── */
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current: number;
  min: number;
  max: number;
  expiry: string;
  supplier: string;
  status: 'critical' | 'warning' | 'healthy';
  depletionDays: number;
}

/* ─── Seeded Mock Data ─── */
const initialItems: InventoryItem[] = [
  { id: 'M001', name: 'Paracetamol 500mg', category: 'Medicines', current: 120, min: 200, max: 1000, expiry: '2027-03-15', supplier: 'Sun Pharma', status: 'critical', depletionDays: 3 },
  { id: 'M002', name: 'Amoxicillin 250mg', category: 'Medicines', current: 380, min: 150, max: 800, expiry: '2027-06-20', supplier: 'Cipla Ltd.', status: 'healthy', depletionDays: 12 },
  { id: 'M003', name: 'Insulin Glargine', category: 'Medicines', current: 45, min: 50, max: 200, expiry: '2026-12-01', supplier: 'Novo Nordisk', status: 'warning', depletionDays: 5 },
  { id: 'O001', name: 'Oxygen Cylinder (Type D)', category: 'Oxygen', current: 8, min: 15, max: 50, expiry: '—', supplier: 'Linde Gas', status: 'critical', depletionDays: 2 },
  { id: 'B001', name: 'Blood Unit A+', category: 'Blood Units', current: 3, min: 10, max: 30, expiry: '2026-08-10', supplier: 'District Blood Bank', status: 'critical', depletionDays: 1 },
  { id: 'P001', name: 'N95 Masks', category: 'PPE Kits', current: 420, min: 100, max: 500, expiry: '2028-01-01', supplier: 'Venus Safety', status: 'healthy', depletionDays: 45 },
  { id: 'V001', name: 'Covishield Dose', category: 'Vaccines', current: 180, min: 200, max: 1000, expiry: '2026-11-30', supplier: 'SII', status: 'warning', depletionDays: 7 },
  { id: 'E001', name: 'Defibrillator Pads', category: 'Emergency', current: 12, min: 5, max: 20, expiry: '2027-09-01', supplier: 'Philips Health', status: 'healthy', depletionDays: 90 },
];

const categoryIcons: Record<string, React.ElementType> = {
  'Medicines': Pill,
  'Oxygen': Wind,
  'Blood Units': Droplets,
  'PPE Kits': ShieldCheck,
  'Vaccines': Syringe,
  'Emergency': Package,
};

const categoryColors: Record<string, { text: string; bg: string }> = {
  'Medicines': { text: 'text-teal-600', bg: 'bg-teal-50' },
  'Oxygen': { text: 'text-blue-600', bg: 'bg-blue-50' },
  'Blood Units': { text: 'text-rose-600', bg: 'bg-rose-50' },
  'PPE Kits': { text: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Vaccines': { text: 'text-violet-600', bg: 'bg-violet-50' },
  'Emergency': { text: 'text-orange-600', bg: 'bg-orange-50' },
};

function computeStatus(current: number, min: number): 'critical' | 'warning' | 'healthy' {
  if (current < min) return 'critical';
  if (current < min * 1.5) return 'warning';
  return 'healthy';
}

/* ─── Add/Edit Modal ─── */
function InventoryModal({
  editItem,
  onClose,
  onSubmit,
}: {
  editItem: InventoryItem | null;
  onClose: () => void;
  onSubmit: (item: Partial<InventoryItem>, isEdit: boolean) => void;
}) {
  const [name, setName] = useState(editItem?.name ?? '');
  const [category, setCategory] = useState(editItem?.category ?? 'Medicines');
  const [current, setCurrent] = useState(String(editItem?.current ?? ''));
  const [min, setMin] = useState(String(editItem?.min ?? '50'));
  const [max, setMax] = useState(String(editItem?.max ?? '500'));
  const [expiry, setExpiry] = useState(editItem?.expiry && editItem.expiry !== '—' ? editItem.expiry : '');
  const [supplier, setSupplier] = useState(editItem?.supplier ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleVoiceUpdate = () => {
    setIsListening(true);
    // Simulate voice recognition
    setTimeout(() => {
      setCurrent('500');
      setIsListening(false);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !current) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    onSubmit({
      name,
      category,
      current: parseInt(current),
      min: parseInt(min),
      max: parseInt(max),
      expiry: expiry || '—',
      supplier,
      status: computeStatus(parseInt(current), parseInt(min)),
      depletionDays: Math.ceil(parseInt(current) / Math.max(1, Math.ceil(parseInt(current) / 30))),
    }, !!editItem);
    setSuccess(true);
    setTimeout(() => onClose(), 1200);
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCheck className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-black text-slate-900">{editItem ? 'Item Updated!' : 'Item Added!'}</h3>
          <p className="text-sm text-slate-500">Inventory database has been updated successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50">
              {editItem ? <Pencil className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">{editItem ? `Edit: ${editItem.name}` : 'Add Inventory Item'}</h2>
              <p className="text-xs text-slate-500 font-medium">Update stock levels and item details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Voice shortcut */}
          <button
            type="button"
            onClick={handleVoiceUpdate}
            className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed transition-all text-sm font-bold ${
              isListening ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-slate-200 hover:border-teal-300 text-slate-500 hover:text-teal-600'
            }`}
          >
            <Mic className={`h-4 w-4 ${isListening ? 'animate-pulse' : ''}`} />
            {isListening ? 'Listening… Say the new quantity' : 'Voice Update (say quantity)'}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Item Name *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Paracetamol 500mg"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              >
                {Object.keys(categoryIcons).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Current Quantity *</label>
              <input
                required
                type="number"
                min={0}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="e.g. 250"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Min Threshold</label>
              <input
                type="number"
                min={0}
                value={min}
                onChange={(e) => setMin(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Max Capacity</label>
              <input
                type="number"
                min={0}
                value={max}
                onChange={(e) => setMax(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Expiry Date</label>
              <input
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Supplier</label>
              <input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. Sun Pharma"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Stock preview */}
          {current && min && (
            <div className={`p-3 rounded-xl border text-sm font-bold flex items-center gap-2 ${
              computeStatus(parseInt(current), parseInt(min)) === 'critical'
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : computeStatus(parseInt(current), parseInt(min)) === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              Stock Status Preview: {computeStatus(parseInt(current), parseInt(min)).toUpperCase()}
              {computeStatus(parseInt(current), parseInt(min)) === 'critical' && ' ⚠️ Below minimum threshold!'}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : (editItem ? 'Update Item' : 'Add to Inventory')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function InventoryPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  const categories = Object.keys(categoryIcons).map((name) => {
    const catItems = items.filter((i) => i.category === name);
    return {
      name,
      total: catItems.reduce((a, b) => a + b.current, 0),
      low: catItems.filter((i) => i.status === 'warning').length,
      critical: catItems.filter((i) => i.status === 'critical').length,
      ...categoryColors[name],
    };
  });

  const filtered = items.filter((item) => {
    const matchesCategory = activeFilter === 'All' || item.category === activeFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const consumptionData = [
    { name: 'Paracetamol', used: 68 },
    { name: 'Amoxicillin', used: 32 },
    { name: 'Insulin', used: 9 },
    { name: 'Oxygen', used: 4 },
    { name: 'Blood A+', used: 3 },
    { name: 'N95 Masks', used: 15 },
  ];

  const handleSubmit = (partial: Partial<InventoryItem>, isEdit: boolean) => {
    if (isEdit && editItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editItem.id
            ? { ...i, ...partial }
            : i
        )
      );
    } else {
      const newId = `${(partial.category ?? 'X')[0]}${String(items.length + 1).padStart(3, '0')}`;
      setItems((prev) => [{ ...partial, id: newId } as InventoryItem, ...prev]);
    }
    setEditItem(null);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Remove this item from inventory?')) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      {/* Modals */}
      {(showModal || editItem) && (
        <InventoryModal
          editItem={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSubmit={handleSubmit}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Resource & Inventory</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage medicines, equipment, and consumables in real time</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => { setEditItem(null); setShowModal(true); }}>
            <Mic className="h-4 w-4" /> Voice Update
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setEditItem(null); setShowModal(true); }}>
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* ─── Category Overview ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((cat) => {
          const Icon = categoryIcons[cat.name];
          return (
            <Card key={cat.name} padding="sm" hover className="cursor-pointer" onClick={() => setActiveFilter(cat.name)}>
              <div className={`p-2 rounded-xl ${cat.bg} w-fit mb-3`}>
                <Icon className={`h-4 w-4 ${cat.text}`} />
              </div>
              <p className="text-lg font-black text-slate-900">{cat.total}</p>
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{cat.name}</p>
              {(cat.low > 0 || cat.critical > 0) && (
                <div className="flex gap-2 mt-2">
                  {cat.critical > 0 && <Badge variant="critical" size="sm" dot>{cat.critical} Critical</Badge>}
                  {cat.low > 0 && <Badge variant="warning" size="sm">{cat.low} Low</Badge>}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── Filters & Search ─── */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {['All', ...Object.keys(categoryIcons)].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === f ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
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
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
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
                    <Badge variant={item.status as 'healthy' | 'warning' | 'critical'} dot>
                      {item.status === 'healthy' ? 'Healthy' : item.status === 'warning' ? 'Low' : 'Critical'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold flex items-center gap-1 ${
                      item.depletionDays <= 3 ? 'text-rose-600' : item.depletionDays <= 7 ? 'text-amber-600' : 'text-slate-600'
                    }`}>
                      {item.depletionDays <= 7 && <TrendingDown className="h-3 w-3" />}
                      {item.depletionDays} days
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600 font-medium">{item.expiry}</td>
                  <td className="px-5 py-4 text-xs text-slate-600 font-medium">{item.supplier}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditItem(item)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Edit Item"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
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
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', padding: '10px 14px' }}
                itemStyle={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}
                labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700 }}
              />
              <Bar dataKey="used" fill="#06B6D4" radius={[0, 6, 6, 0]} name="Units Used" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
