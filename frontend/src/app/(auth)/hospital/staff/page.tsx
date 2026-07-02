'use client';

import React, { useState } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  Users,
  Stethoscope,
  Syringe,
  FlaskConical,
  Truck,
  Wrench,
  UserCheck,
  UserX,
  Clock,
  CalendarOff,
  Search,
  Plus,
  BrainCircuit,
  AlertTriangle,
  TrendingUp,
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
const staffSummary = [
  { label: 'Doctors', present: 14, total: 18, icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Nurses', present: 28, total: 32, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Lab Technicians', present: 6, total: 8, icon: FlaskConical, color: 'text-teal-600', bg: 'bg-teal-50' },
  { label: 'Pharmacists', present: 3, total: 4, icon: Syringe, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Ambulance Drivers', present: 3, total: 4, icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Support Staff', present: 12, total: 15, icon: Wrench, color: 'text-slate-600', bg: 'bg-slate-100' },
];

const staffList = [
  { id: 'EMP001', name: 'Dr. Arjun Mehta', department: 'General Medicine', designation: 'Medical Superintendent', shift: 'Morning', status: 'Present', checkIn: '08:15 AM', checkOut: '—' },
  { id: 'EMP002', name: 'Dr. Priya Sharma', department: 'ICU', designation: 'Senior Doctor', shift: 'Morning', status: 'Present', checkIn: '08:00 AM', checkOut: '—' },
  { id: 'EMP003', name: 'Dr. Rajesh Kulkarni', department: 'Emergency', designation: 'Medical Officer', shift: 'Night', status: 'On Leave', checkIn: '—', checkOut: '—' },
  { id: 'EMP004', name: 'Nurse Anita Desai', department: 'General Ward', designation: 'Nurse Supervisor', shift: 'Morning', status: 'Present', checkIn: '07:45 AM', checkOut: '—' },
  { id: 'EMP005', name: 'Sanjay Patil', department: 'Pharmacy', designation: 'Chief Pharmacist', shift: 'Morning', status: 'Present', checkIn: '08:30 AM', checkOut: '—' },
  { id: 'EMP006', name: 'Dr. Neha Joshi', department: 'Pediatrics', designation: 'Junior Doctor', shift: 'Evening', status: 'Absent', checkIn: '—', checkOut: '—' },
  { id: 'EMP007', name: 'Ravi Kumar', department: 'Radiology', designation: 'Lab Technician', shift: 'Morning', status: 'Present', checkIn: '08:05 AM', checkOut: '—' },
  { id: 'EMP008', name: 'Suresh Gade', department: 'Transport', designation: 'Ambulance Driver', shift: 'Morning', status: 'Present', checkIn: '07:30 AM', checkOut: '—' },
];

const shiftDistribution = [
  { shift: 'Morning', doctors: 8, nurses: 14, others: 12 },
  { shift: 'Afternoon', doctors: 4, nurses: 8, others: 6 },
  { shift: 'Night', doctors: 2, nurses: 6, others: 4 },
];

const aiStaffPrediction = {
  currentDoctors: 14,
  tomorrowRequired: 18,
  prediction: 'Doctor shortage likely during weekend OPD surge.',
  recommendation: 'Request temporary deployment of 2 doctors from CHC Warje.',
};

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = staffList.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPresent = staffSummary.reduce((a, b) => a + b.present, 0);
  const totalStaff = staffSummary.reduce((a, b) => a + b.total, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff & Attendance</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Daily workforce availability and shift management</p>
        </div>
        <Button variant="primary" size="sm"><Plus className="h-4 w-4" /> Mark Attendance</Button>
      </div>

      {/* ─── Overall Stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="md" className="text-center">
          <div className="p-2.5 rounded-xl bg-emerald-50 w-fit mx-auto mb-2"><UserCheck className="h-5 w-5 text-emerald-600" /></div>
          <p className="text-3xl font-black text-slate-900">{totalPresent}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Present Today</p>
        </Card>
        <Card padding="md" className="text-center">
          <div className="p-2.5 rounded-xl bg-rose-50 w-fit mx-auto mb-2"><UserX className="h-5 w-5 text-rose-600" /></div>
          <p className="text-3xl font-black text-rose-600">{totalStaff - totalPresent}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Absent / Leave</p>
        </Card>
        <Card padding="md" className="text-center">
          <div className="p-2.5 rounded-xl bg-blue-50 w-fit mx-auto mb-2"><Clock className="h-5 w-5 text-blue-600" /></div>
          <p className="text-3xl font-black text-slate-900">3</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shifts Active</p>
        </Card>
        <Card padding="md" className="text-center">
          <div className="p-2.5 rounded-xl bg-amber-50 w-fit mx-auto mb-2"><CalendarOff className="h-5 w-5 text-amber-600" /></div>
          <p className="text-3xl font-black text-amber-600">2</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">On Leave</p>
        </Card>
      </div>

      {/* ─── Department Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {staffSummary.map((dept) => {
          const Icon = dept.icon;
          const percent = Math.round((dept.present / dept.total) * 100);
          return (
            <Card key={dept.label} padding="sm" hover>
              <div className={`p-2 rounded-xl ${dept.bg} w-fit mb-2`}>
                <Icon className={`h-4 w-4 ${dept.color}`} />
              </div>
              <p className="text-lg font-black text-slate-900">
                {dept.present}<span className="text-sm text-slate-400 font-semibold">/{dept.total}</span>
              </p>
              <p className="text-[10px] font-semibold text-slate-500">{dept.label}</p>
              <div className="mt-2 w-full bg-slate-100 rounded-full h-1">
                <div className="h-1 rounded-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* ─── Row: Staff Table + AI + Shift Chart ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Staff Table */}
        <div className="lg:col-span-8">
          <Card padding="none">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2">
                {['All', 'Present', 'Absent', 'On Leave'].map((f) => (
                  <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{f}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-slate-100/80 rounded-xl px-3 py-2 w-full sm:w-[220px] focus-within:ring-2 focus-within:ring-slate-900">
                <Search className="h-4 w-4 text-slate-400" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search staff..." className="bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none w-full font-medium" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Name</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Department</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Shift</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Check-in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900 text-xs">{s.name}</p>
                        <p className="text-[10px] text-slate-400">{s.designation}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">{s.department}</td>
                      <td className="px-5 py-3.5"><Badge variant="neutral">{s.shift}</Badge></td>
                      <td className="px-5 py-3.5">
                        <Badge variant={s.status === 'Present' ? 'healthy' : s.status === 'Absent' ? 'critical' : 'warning'} dot>{s.status}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">{s.checkIn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right column: AI + Chart */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Prediction */}
          <Card padding="md" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-violet-50/30" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600"><BrainCircuit className="h-3.5 w-3.5 text-white" /></div>
                <span className="text-xs font-bold text-slate-900">Workforce Prediction</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/80 rounded-xl p-3 border border-slate-100 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Now</p>
                  <p className="text-2xl font-black text-slate-900">{aiStaffPrediction.currentDoctors}</p>
                </div>
                <div className="bg-white/80 rounded-xl p-3 border border-amber-100 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Tomorrow</p>
                  <p className="text-2xl font-black text-amber-600">{aiStaffPrediction.tomorrowRequired}</p>
                </div>
              </div>
              <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-amber-800 mb-0.5">{aiStaffPrediction.prediction}</p>
                    <p className="text-[10px] text-amber-700 font-medium">{aiStaffPrediction.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Shift Distribution Chart */}
          <Card padding="md">
            <CardHeader title="Shift Distribution" />
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shiftDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="shift" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', padding: '8px 12px' }} itemStyle={{ color: '#e2e8f0', fontSize: '11px', fontWeight: 600 }} />
                  <Bar dataKey="doctors" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Doctors" />
                  <Bar dataKey="nurses" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Nurses" />
                  <Bar dataKey="others" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Others" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
