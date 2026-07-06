'use client';

import React, { useState, useMemo } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  FileBarChart,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Download,
  Filter,
  Search,
  Building2,
  ChevronRight,
  ShieldCheck,
  Award,
  FileText,
  Calendar,
  Users,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';

interface DeptAuditRecord {
  id: string;
  name: string;
  code: string;
  head: string;
  totalOrders: number;
  slaCompliant: number;
  overdueOrders: number;
  aiScore: number;
  satisfaction: number;
  status: 'Compliant' | 'Under Review' | 'Action Required';
  recentAuditDate: string;
  keyFinding: string;
}

export default function GovernmentReportsPage() {
  const { complaints, infraIssues } = useAppData();
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeAudit, setActiveAudit] = useState<DeptAuditRecord | null>(null);

  // Generate dynamic audit data based on system context + realistic baselines
  const auditRecords: DeptAuditRecord[] = useMemo(() => [
    {
      id: 'AUD-PWD-01',
      name: 'Public Works Department (PWD)',
      code: 'pwd',
      head: 'Er. Rajesh Kulkarni (Executive Engineer)',
      totalOrders: 42,
      slaCompliant: 38,
      overdueOrders: 4,
      aiScore: 92,
      satisfaction: 4.6,
      status: 'Compliant',
      recentAuditDate: '28 Jun 2026',
      keyFinding: 'Excellent structural maintenance across district hospitals; minor delays in ceiling leakage waterproofing.',
    },
    {
      id: 'AUD-BIO-02',
      name: 'Biomedical Engineering Division',
      code: 'biomedical',
      head: 'Dr. Neha Deshmukh (Chief Bio-Engineer)',
      totalOrders: 64,
      slaCompliant: 51,
      overdueOrders: 13,
      aiScore: 81,
      satisfaction: 4.1,
      status: 'Under Review',
      recentAuditDate: '01 Jul 2026',
      keyFinding: 'High demand for ventilator and dialysis machine recalibration; recommend adding 2 field technician teams.',
    },
    {
      id: 'AUD-MED-03',
      name: 'District Medical Store & Pharmacy',
      code: 'medical_store',
      head: 'Shri. Vikram Sethi (District Pharmacist)',
      totalOrders: 89,
      slaCompliant: 86,
      overdueOrders: 3,
      aiScore: 97,
      satisfaction: 4.8,
      status: 'Compliant',
      recentAuditDate: '02 Jul 2026',
      keyFinding: 'Outstanding inventory rotation; zero critical essential medicine stockouts reported across 14 CHCs.',
    },
    {
      id: 'AUD-ELE-04',
      name: 'Electricity Board (MSEDCL Liaison)',
      code: 'electricity',
      head: 'Er. Suresh Patil (Sub-Divisional Officer)',
      totalOrders: 28,
      slaCompliant: 27,
      overdueOrders: 1,
      aiScore: 95,
      satisfaction: 4.7,
      status: 'Compliant',
      recentAuditDate: '25 Jun 2026',
      keyFinding: '100% functional backup generator ATS switching verified at District General Hospital.',
    },
    {
      id: 'AUD-WAT-05',
      name: 'Water & Sanitation Authority',
      code: 'water',
      head: 'Smt. Anjali Shinde (Sanitation Inspector)',
      totalOrders: 35,
      slaCompliant: 26,
      overdueOrders: 9,
      aiScore: 74,
      satisfaction: 3.6,
      status: 'Action Required',
      recentAuditDate: '03 Jul 2026',
      keyFinding: 'Recurrent water turbidity reported in Ward 4; mandatory RO plant membrane replacement overdue by 12 days.',
    },
  ], []);

  const filteredRecords = useMemo(() => {
    return auditRecords.filter((rec) => {
      const matchesStatus = selectedStatus === 'All' || rec.status === selectedStatus;
      const matchesSearch =
        searchQuery === '' ||
        rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.head.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [auditRecords, selectedStatus, searchQuery]);

  const handleExportPDF = () => {
    alert('Generating official PDF Inter-Agency Audit Report signed by Government Authority...');
  };

  const handleExportCSV = () => {
    alert('Downloading raw CSV audit telemetry data...');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-brand-navy to-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30">
              <ShieldCheck className="h-3.5 w-3.5" /> OFFICIAL GOVT AUDIT
            </span>
            <span className="text-xs font-bold text-slate-400">Quarter: Q3 2026 (FY 26-27)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <FileBarChart className="h-7 w-7 text-brand-cyan" />
            Department Audit & Compliance
          </h1>
          <p className="text-sm text-slate-300 font-medium max-w-xl">
            Inter-agency performance evaluation, SLA adherence tracking, and automated AI efficiency scoring across assigned departments.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-brand-cyan" />
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportPDF}
            className="bg-brand-cyan hover:bg-brand-cyan/90 text-slate-950 font-black text-xs shadow-lg shadow-brand-cyan/20"
          >
            <FileText className="h-3.5 w-3.5 mr-1" />
            Generate PDF Executive Report
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="bg-gradient-to-br from-white to-slate-50 border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Overall SLA Compliance</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">91.8%</span>
            <span className="text-xs font-bold text-emerald-600">+2.4% vs last Q</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '91.8%' }} />
          </div>
        </Card>

        <Card padding="sm" className="bg-gradient-to-br from-white to-slate-50 border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Avg Resolution Time</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">38.4 Hrs</span>
            <span className="text-xs font-bold text-slate-500">Target: &lt;48 Hrs</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: '80%' }} />
          </div>
        </Card>

        <Card padding="sm" className="bg-gradient-to-br from-white to-slate-50 border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Active Escalations</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">14 Cases</span>
            <span className="text-xs font-bold text-amber-600">3 High Priority</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: '35%' }} />
          </div>
        </Card>

        <Card padding="sm" className="bg-gradient-to-br from-white to-slate-50 border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">AI Audit Rating</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">87.8 / 100</span>
            <span className="text-xs font-bold text-purple-600">Grade A-</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full" style={{ width: '87.8%' }} />
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search departments, division heads, or audit codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Audit Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none w-full"
            >
              <option value="All">All Audit Statuses</option>
              <option value="Compliant">Compliant (SLA &gt; 90%)</option>
              <option value="Under Review">Under Review (80-90%)</option>
              <option value="Action Required">Action Required (&lt; 80%)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Audit Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Department & Head</th>
                <th className="px-6 py-4">Total Orders</th>
                <th className="px-6 py-4">SLA Compliance</th>
                <th className="px-6 py-4">AI Efficiency</th>
                <th className="px-6 py-4">Citizen Rating</th>
                <th className="px-6 py-4">Audit Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-extrabold text-slate-900">{rec.name}</div>
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                      <Users className="h-3 w-3 text-slate-400" /> {rec.head}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {rec.totalOrders}{' '}
                    <span className="text-xs text-slate-400 font-normal">({rec.overdueOrders} overdue)</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            rec.slaCompliant / rec.totalOrders >= 0.9
                              ? 'bg-emerald-500'
                              : rec.slaCompliant / rec.totalOrders >= 0.8
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${(rec.slaCompliant / rec.totalOrders) * 100}%` }}
                        />
                      </div>
                      <span className="font-extrabold text-slate-900 text-xs">
                        {Math.round((rec.slaCompliant / rec.totalOrders) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-brand-blue">{rec.aiScore} / 100</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                      ★ {rec.satisfaction}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        rec.status === 'Compliant'
                          ? 'healthy'
                          : rec.status === 'Under Review'
                          ? 'warning'
                          : 'critical'
                      }
                      dot
                    >
                      {rec.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveAudit(rec)}
                      className="font-bold text-xs flex items-center gap-1 mx-auto hover:bg-slate-100 transition-all"
                    >
                      Audit Report <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── Audit Details Slide-over Modal ─── */}
      {activeAudit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-end transition-all">
          <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-350 overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-brand-navy to-slate-900 text-white">
              <div>
                <span className="text-xs font-bold text-brand-cyan tracking-wider uppercase">{activeAudit.id} Audit File</span>
                <h3 className="text-xl font-black">{activeAudit.name}</h3>
              </div>
              <button
                onClick={() => setActiveAudit(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all font-bold text-sm"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase">Division Head</span>
                  <span className="text-sm font-black text-slate-900">{activeAudit.head}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase">Last Audit Date</span>
                  <span className="text-sm font-extrabold text-slate-800">{activeAudit.recentAuditDate}</span>
                </div>
                <Badge
                  variant={
                    activeAudit.status === 'Compliant'
                      ? 'healthy'
                      : activeAudit.status === 'Under Review'
                      ? 'warning'
                      : 'critical'
                  }
                  dot
                >
                  {activeAudit.status}
                </Badge>
              </div>

              {/* Key Findings */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-purple-600" /> Executive Audit Finding & Recommendation
                </h4>
                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 text-sm font-medium text-purple-950 leading-relaxed">
                  {activeAudit.keyFinding}
                </div>
              </div>

              {/* Performance Breakdown Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wide">SLA & Telemetry Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 block">Orders Within SLA</span>
                    <span className="text-xl font-black text-emerald-600">
                      {activeAudit.slaCompliant} / {activeAudit.totalOrders}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 block mt-1">
                      {Math.round((activeAudit.slaCompliant / activeAudit.totalOrders) * 100)}% compliance efficiency
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 block">Overdue Escalations</span>
                    <span className={`text-xl font-black ${activeAudit.overdueOrders > 5 ? 'text-red-600' : 'text-slate-800'}`}>
                      {activeAudit.overdueOrders} Cases
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 block mt-1">
                      {activeAudit.overdueOrders > 0 ? 'Requires priority attention' : 'All queues cleared'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sign-off button */}
              <div className="pt-6 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert(`Printing Compliance Certificate for ${activeAudit.name}...`)}
                >
                  Print Certificate
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    alert(`Official sign-off recorded for ${activeAudit.id}. Notify department head via AarogyaPulse.`);
                    setActiveAudit(null);
                  }}
                >
                  Confirm Official Sign-off
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
