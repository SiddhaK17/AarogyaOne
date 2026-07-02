'use client';

import React, { useState } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  AlertTriangle,
  Camera,
  Mic,
  BrainCircuit,
  Wrench,
  Zap,
  Droplets,
  Wifi,
  Plus,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

/* ─── Mock Data ─── */
const issueStats = [
  { label: 'Open Issues', value: 8, color: 'text-rose-600', bg: 'bg-rose-50' },
  { label: 'In Progress', value: 3, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Resolved (Today)', value: 2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Avg Resolution', value: '4.2 hrs', color: 'text-blue-600', bg: 'bg-blue-50' },
];

const issues = [
  {
    id: 'ISS-001',
    title: 'X-Ray Machine Malfunction',
    description: 'X-Ray machine in Radiology Department producing blurred images. Emergency patients being redirected.',
    type: 'Equipment Failure',
    department: 'Radiology',
    priority: 'Critical',
    status: 'Open',
    reporter: 'Dr. Priya Sharma',
    timestamp: '2 hours ago',
    aiCategory: 'Biomedical Engineering',
    aiSeverity: 'Critical',
    aiUrgency: 'Immediate',
  },
  {
    id: 'ISS-002',
    title: 'Oxygen Pipeline Leak – Ward B',
    description: 'Detected a slow leak in the central oxygen pipeline supplying Ward B. Current supply is maintained via portable cylinders.',
    type: 'Infrastructure',
    department: 'General Ward',
    priority: 'Critical',
    status: 'In Progress',
    reporter: 'Nurse Anita Desai',
    timestamp: '5 hours ago',
    aiCategory: 'Medical Gas Systems',
    aiSeverity: 'High',
    aiUrgency: 'Within 4 Hours',
  },
  {
    id: 'ISS-003',
    title: 'Generator Not Starting',
    description: 'Backup diesel generator failed to start during morning power outage. Electrician has been notified.',
    type: 'Electrical',
    department: 'Facilities',
    priority: 'High',
    status: 'Open',
    reporter: 'Suresh Gade',
    timestamp: '1 day ago',
    aiCategory: 'Electrical / PWD',
    aiSeverity: 'High',
    aiUrgency: 'Within 24 Hours',
  },
  {
    id: 'ISS-004',
    title: 'Water Leakage in ICU Ceiling',
    description: 'Persistent water dripping from ceiling tile above ICU bed #8. May pose infection control risk.',
    type: 'Plumbing',
    department: 'ICU',
    priority: 'High',
    status: 'In Progress',
    reporter: 'Dr. Arjun Mehta',
    timestamp: '1 day ago',
    aiCategory: 'PWD / Civil',
    aiSeverity: 'Medium',
    aiUrgency: 'Within 24 Hours',
  },
  {
    id: 'ISS-005',
    title: 'Wi-Fi Down in OPD Area',
    description: 'Internet connectivity lost in the outpatient department. Digital records are inaccessible.',
    type: 'IT Infrastructure',
    department: 'OPD',
    priority: 'Medium',
    status: 'Open',
    reporter: 'Ravi Kumar',
    timestamp: '3 hours ago',
    aiCategory: 'IT Department',
    aiSeverity: 'Medium',
    aiUrgency: 'Within 8 Hours',
  },
  {
    id: 'ISS-006',
    title: 'Broken window – Pediatric Ward',
    description: 'Window glass cracked in pediatric ward room 3. Safety hazard for children.',
    type: 'Civil',
    department: 'Pediatrics',
    priority: 'Medium',
    status: 'Resolved',
    reporter: 'Nurse Meena',
    timestamp: '2 days ago',
    aiCategory: 'PWD / Civil',
    aiSeverity: 'Low',
    aiUrgency: 'Scheduled',
  },
];

const typeIcons: Record<string, React.ReactNode> = {
  'Equipment Failure': <Wrench className="h-4 w-4" />,
  'Infrastructure': <AlertTriangle className="h-4 w-4" />,
  'Electrical': <Zap className="h-4 w-4" />,
  'Plumbing': <Droplets className="h-4 w-4" />,
  'IT Infrastructure': <Wifi className="h-4 w-4" />,
  'Civil': <Wrench className="h-4 w-4" />,
};

const statusIcons: Record<string, React.ReactNode> = {
  'Open': <XCircle className="h-3.5 w-3.5 text-rose-500" />,
  'In Progress': <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin" />,
  'Resolved': <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
};

export default function InfrastructurePage() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = issues.filter((issue) => {
    if (activeFilter === 'All') return true;
    return issue.status === activeFilter;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Infrastructure & Issues</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Report and track operational issues with AI-powered classification</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm"><Camera className="h-4 w-4" /> Photo Report</Button>
          <Button variant="outline" size="sm"><Mic className="h-4 w-4" /> Voice Report</Button>
          <Button variant="primary" size="sm"><Plus className="h-4 w-4" /> New Issue</Button>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {issueStats.map((stat) => (
          <Card key={stat.label} padding="md" className="text-center">
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* ─── Filters ─── */}
      <div className="flex items-center gap-2">
        {['All', 'Open', 'In Progress', 'Resolved'].map((f) => (
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

      {/* ─── Issue Cards ─── */}
      <div className="space-y-4">
        {filtered.map((issue) => (
          <Card key={issue.id} padding="md" hover className="cursor-pointer">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Main Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-slate-100">
                    {typeIcons[issue.type]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {issue.title}
                      <Badge variant={issue.priority === 'Critical' ? 'critical' : issue.priority === 'High' ? 'warning' : 'info'} dot size="sm">
                        {issue.priority}
                      </Badge>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {issue.id} · {issue.department} · {issue.type}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mb-3">{issue.description}</p>
                <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">{statusIcons[issue.status]} {issue.status}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {issue.timestamp}</span>
                  <span>Reported by: {issue.reporter}</span>
                </div>
              </div>

              {/* AI Classification Panel */}
              <div className="lg:w-[260px] flex-shrink-0 bg-slate-50/70 rounded-xl border border-slate-100 p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <BrainCircuit className="h-3.5 w-3.5 text-teal-600" />
                  <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">AI Classification</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">Category</span>
                    <span className="font-bold text-slate-800">{issue.aiCategory}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">Severity</span>
                    <Badge variant={issue.aiSeverity === 'Critical' ? 'critical' : issue.aiSeverity === 'High' ? 'warning' : issue.aiSeverity === 'Medium' ? 'info' : 'neutral'} size="sm">{issue.aiSeverity}</Badge>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">Urgency</span>
                    <span className="font-bold text-slate-800">{issue.aiUrgency}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/50">
                    <p className="text-[9px] text-slate-400 italic">Auto-routed to Government Authority Portal</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
