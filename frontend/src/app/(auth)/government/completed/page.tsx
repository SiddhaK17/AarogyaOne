'use client';

import React, { useState } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  CheckCircle2,
  Calendar,
  User,
  Shield,
  FileText,
  ChevronRight,
  Search,
  Building,
  Image,
} from 'lucide-react';

/* ─── Mock Completed Tasks Database ─── */
const MOCK_COMPLETED_TASKS = [
  {
    id: 'TSK-192',
    hospital: 'PHC Kothrud',
    issue: 'Low-pressure water feed to dental clinic',
    department: 'PWD (Public Works)',
    completionDate: '2026-06-28',
    officer: 'Rajesh Kumar',
    resolution: 'Replaced malfunctioning booster pump pressure valve, flushed pipelines, and restored target water pressure of 3.2 bar to all chairs.',
    photoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600',
    verification: 'Verified',
    hospitalConfirmation: 'Confirmed by Dr. Arjun Mehta',
    auditNotes: 'Onsite inspection completed by District Operations Lead. Standard checklist verified, water pressure pressure-tested successfully.'
  },
  {
    id: 'TSK-189',
    hospital: 'PHC Hadapsar',
    issue: 'Emergency backup generator battery failure',
    department: 'Electricity Board',
    completionDate: '2026-06-25',
    officer: 'Vikas Patil',
    resolution: 'Battery banks replaced completely with heavy-duty maintenance-free backups. Simulated grid failure test performed successfully.',
    photoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600',
    verification: 'Verified',
    hospitalConfirmation: 'Confirmed by Dr. Satish Joshi',
    auditNotes: 'Telemetry checks confirm generator starts automatically within 6 seconds of grid drop.'
  },
  {
    id: 'TSK-195',
    hospital: 'District Hospital Pune',
    issue: 'ICU Monitor #2 display panel flickering',
    department: 'Biomedical Engineering',
    completionDate: '2026-06-29',
    officer: 'Anil Deshmukh',
    resolution: 'Disassembled monitor, replaced failing LCD inverter board and main power cable, re-calibrated color brightness.',
    photoUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600',
    verification: 'Awaiting Audit',
    hospitalConfirmation: 'Awaiting Confirmation',
    auditNotes: 'Task marked complete by engineer. Needs local superintendent confirmation and district audit validation.'
  },
  {
    id: 'TSK-174',
    hospital: 'CHC Warje',
    issue: 'Defective autoclave sterilizer gaskets',
    department: 'Biomedical Engineering',
    completionDate: '2026-06-20',
    officer: 'Anil Deshmukh',
    resolution: 'Installed new silicone high-temperature vacuum gaskets, pressure checked up to 134°C sterilization cycle.',
    photoUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600',
    verification: 'Verified',
    hospitalConfirmation: 'Confirmed by Admin Suresh Patil',
    auditNotes: 'Autoclave performance log verified for 10 cycles without pressure drops.'
  }
];

export default function CompletedTasks() {
  const [completedList] = useState(MOCK_COMPLETED_TASKS);
  const [selectedAuditTask, setSelectedAuditTask] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');

  // Filters
  const filteredCompleted = completedList.filter(t => {
    const matchesDept = selectedDeptFilter === 'All' || t.department.includes(selectedDeptFilter);
    const matchesSearch = searchQuery === '' || 
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.officer.toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Completed Work & Auditing Log</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Archived records of completed service orders with image proofs and verification details for audit trails.</p>
      </div>

      {/* Filter Card */}
      <Card padding="sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, hospital, repair description, or officer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Dept:</span>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none w-full"
            >
              <option value="All">All Departments</option>
              <option value="PWD">PWD (Public Works)</option>
              <option value="Biomedical">Biomedical Engineering</option>
              <option value="Electricity">Electricity Board</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table grid */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Hospital</th>
                <th className="px-6 py-4">Resolved Issue</th>
                <th className="px-6 py-4">Completed Date</th>
                <th className="px-6 py-4">Responsible Officer</th>
                <th className="px-6 py-4">Audit Status</th>
                <th className="px-6 py-4 text-center">Audit Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompleted.length > 0 ? (
                filteredCompleted.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{task.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-950">{task.hospital}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{task.department}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 max-w-xs truncate">{task.issue}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {task.completionDate}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4 text-slate-400" />
                        {task.officer}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={task.verification === 'Verified' ? 'healthy' : 'warning'} dot>
                        {task.verification}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAuditTask(task)}
                        className="font-bold flex items-center gap-1 mx-auto hover:bg-slate-100 transition-all"
                      >
                        Inspect Proof <ChevronRight className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-slate-400 font-bold">
                    No completed audit records match the query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── Audit Modal ─── */}
      {selectedAuditTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-brand-navy to-slate-900 text-white">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand-cyan" />
                <div>
                  <h3 className="text-lg font-black">{selectedAuditTask.id} Resolution Audit</h3>
                  <p className="text-[10px] text-slate-300 font-bold uppercase">{selectedAuditTask.hospital}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAuditTask(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all font-bold text-sm"
              >
                ✕ Close
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Core Information */}
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Original Issue</span>
                <p className="text-sm font-extrabold text-slate-900">{selectedAuditTask.issue}</p>
              </div>

              {/* Resolution Description */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resolution Summary</span>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  {selectedAuditTask.resolution}
                </p>
              </div>

              {/* Photo Evidence */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Image className="h-3.5 w-3.5" /> Attached Completion Photo Proof
                </span>
                <div className="relative h-[200px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
                  <img
                    src={selectedAuditTask.photoUrl}
                    alt="Resolution proof"
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>

              {/* Audit Status */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs font-bold">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Audit Verification</span>
                  <Badge variant={selectedAuditTask.verification === 'Verified' ? 'healthy' : 'warning'} dot>
                    {selectedAuditTask.verification}
                  </Badge>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Hospital Acknowledgment</span>
                  <span className={`inline-flex items-center gap-1 font-bold ${
                    selectedAuditTask.hospitalConfirmation.includes('Pending') ? 'text-amber-600' : 'text-slate-800'
                  }`}>
                    {selectedAuditTask.hospitalConfirmation}
                  </span>
                </div>
              </div>

              {/* Auditor notes */}
              <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-2xl flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Audit Trails / Telemetry Logs</span>
                  <p className="text-xs text-blue-900 font-semibold leading-relaxed">
                    {selectedAuditTask.auditNotes}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedAuditTask(null)}
              >
                Close Audit Profile
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
