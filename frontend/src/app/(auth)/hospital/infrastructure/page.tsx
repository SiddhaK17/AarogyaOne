'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useHospitalSession } from '@/context/HospitalSessionContext';
import { hospitalApi } from '@/lib/api';
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
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Upload,
  CheckCheck,
} from 'lucide-react';

/* ─── Types ─── */
interface Issue {
  id: string;
  title: string;
  description: string;
  type: string;
  department: string;
  priority: string;
  status: string;
  reporter: string;
  created_at: string;
  ai_category: string;
  ai_severity: string;
  ai_assigned_department: string;
}

/* ─── Seeded Mock Data (matches database seed) ─── */
const initialIssues: Issue[] = [
  {
    id: 'ISS-001',
    title: 'X-Ray Machine Malfunction',
    description: 'X-Ray machine in Radiology Department producing blurred images. Emergency patients being redirected.',
    type: 'Equipment Failure',
    department: 'Radiology',
    priority: 'Critical',
    status: 'Open',
    reporter: 'Dr. Priya Sharma',
    created_at: '2 hours ago',
    ai_category: 'Biomedical Engineering',
    ai_severity: 'Critical',
    ai_assigned_department: 'Biomedical',
  },
  {
    id: 'ISS-002',
    title: 'Oxygen Pipeline Leak – Ward B',
    description: 'Detected a slow leak in the central oxygen pipeline supplying Ward B.',
    type: 'Infrastructure',
    department: 'General Ward',
    priority: 'Critical',
    status: 'In Progress',
    reporter: 'Nurse Anita Desai',
    created_at: '5 hours ago',
    ai_category: 'Medical Gas Systems',
    ai_severity: 'High',
    ai_assigned_department: 'Facilities',
  },
  {
    id: 'ISS-003',
    title: 'Generator Not Starting',
    description: 'Backup diesel generator failed to start during morning power outage.',
    type: 'Electrical',
    department: 'Facilities',
    priority: 'High',
    status: 'Open',
    reporter: 'Suresh Gade',
    created_at: '1 day ago',
    ai_category: 'Electrical / PWD',
    ai_severity: 'High',
    ai_assigned_department: 'Facilities',
  },
  {
    id: 'ISS-004',
    title: 'Water Leakage in ICU Ceiling',
    description: 'Persistent water dripping from ceiling tile above ICU bed #8.',
    type: 'Plumbing',
    department: 'ICU',
    priority: 'High',
    status: 'In Progress',
    reporter: 'Dr. Arjun Mehta',
    created_at: '1 day ago',
    ai_category: 'PWD / Civil',
    ai_severity: 'Medium',
    ai_assigned_department: 'Facilities',
  },
  {
    id: 'ISS-005',
    title: 'Wi-Fi Down in OPD Area',
    description: 'Internet connectivity lost in the outpatient department.',
    type: 'IT Infrastructure',
    department: 'OPD',
    priority: 'Medium',
    status: 'Open',
    reporter: 'Ravi Kumar',
    created_at: '3 hours ago',
    ai_category: 'IT Department',
    ai_severity: 'Medium',
    ai_assigned_department: 'IT / Admin',
  },
];

const issueTypeOptions = [
  'Equipment Failure',
  'Infrastructure',
  'Electrical',
  'Plumbing',
  'IT Infrastructure',
  'Civil',
  'Other',
];

const departmentOptions = [
  'Radiology',
  'ICU',
  'OPD',
  'Emergency',
  'General Ward',
  'Facilities',
  'IT / Admin',
];

const priorityOptions = ['Critical', 'High', 'Medium', 'Low'] as const;

const typeIcons: Record<string, React.ReactNode> = {
  'Equipment Failure': <Wrench className="h-4 w-4" />,
  'Infrastructure': <AlertTriangle className="h-4 w-4" />,
  'Electrical': <Zap className="h-4 w-4" />,
  'Plumbing': <Droplets className="h-4 w-4" />,
  'IT Infrastructure': <Wifi className="h-4 w-4" />,
  'Civil': <Wrench className="h-4 w-4" />,
  'Other': <AlertTriangle className="h-4 w-4" />,
};

const statusIcons: Record<string, React.ReactNode> = {
  'Open': <XCircle className="h-3.5 w-3.5 text-rose-500" />,
  'In Progress': <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin" />,
  'Resolved': <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
};

function getAIClassification(type: string, priority: string) {
  const categoryMap: Record<string, string> = {
    'Equipment Failure': 'Biomedical Engineering',
    'Infrastructure': 'PWD / Civil',
    'Electrical': 'Electrical / PWD',
    'Plumbing': 'PWD / Civil',
    'IT Infrastructure': 'IT Department',
    'Civil': 'PWD / Civil',
    'Other': 'District Admin',
  };
  const urgencyMap: Record<string, string> = {
    'Critical': 'Immediate',
    'High': 'Within 24 Hours',
    'Medium': 'Within 72 Hours',
    'Low': 'Scheduled',
  };
  return {
    ai_category: categoryMap[type] ?? 'District Admin',
    ai_severity: priority,
    ai_assigned_department: categoryMap[type] ?? 'District Admin',
  };
}
/* ─── New Issue Modal ─── */
function NewIssueModal({
  mode,
  onClose,
  onSubmit,
}: {
  mode: 'form' | 'photo' | 'voice';
  onClose: () => void;
  onSubmit: (issue: any) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Equipment Failure');
  const [department, setDepartment] = useState('OPD');
  const [priority, setPriority] = useState('High');
  const [reporter, setReporter] = useState('Dr. Arjun Mehta');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [photoSelected, setPhotoSelected] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        issue_type: type,
        department,
        priority,
        reporter_name: reporter,
      });
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (e) {
      console.error(e);
      alert('Failed to submit issue');
      setSubmitting(false);
    }
  };

  const handleVoiceToggle = () => {
    setIsRecording((prev) => !prev);
    if (!isRecording) {
      // Simulate voice-to-text after 2 seconds
      setTimeout(() => {
        setTitle('Generator failure in Block C');
        setDescription('The diesel generator in Block C has stopped working. Power backup is unavailable in the surgical ward.');
        setType('Electrical');
        setDepartment('Facilities');
        setPriority('Critical');
        setIsRecording(false);
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-4 animate-bounce-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCheck className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Issue Reported!</h3>
          <p className="text-sm text-slate-500 text-center">AI has classified and routed this issue to the Government Authority portal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-50">
              {mode === 'photo' ? <Camera className="h-5 w-5 text-rose-600" /> : mode === 'voice' ? <Mic className="h-5 w-5 text-rose-600" /> : <Plus className="h-5 w-5 text-rose-600" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Report Issue</h2>
              <p className="text-xs text-slate-500 font-medium">AI will auto-classify and route to the correct department</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Voice mode */}
          {mode === 'voice' && (
            <div
              onClick={handleVoiceToggle}
              className={`flex items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                isRecording ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <Mic className={`h-6 w-6 ${isRecording ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
              <p className="text-sm font-bold text-slate-600">
                {isRecording ? 'Recording... Speak your issue in Hindi or English' : 'Click to start voice recording'}
              </p>
            </div>
          )}

          {/* Photo mode */}
          {mode === 'photo' && !photoSelected && (
            <label className="flex items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-300 bg-slate-50 cursor-pointer transition-all">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={() => {
                  setPhotoSelected(true);
                  setTitle('Equipment Issue (Photo Report)');
                  setDescription('Photo evidence uploaded. AI will classify this issue based on visual content.');
                }}
              />
              <Upload className="h-6 w-6 text-slate-400" />
              <p className="text-sm font-bold text-slate-600">Click to upload a photo of the issue</p>
            </label>
          )}
          {mode === 'photo' && photoSelected && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <Camera className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-bold text-blue-700">Photo uploaded. AI analysis complete. Fields pre-filled below.</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Issue Title *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. X-Ray Machine not working"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Description *</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the issue in detail..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Type & Department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Issue Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              >
                {issueTypeOptions.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              >
                {departmentOptions.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Priority & Reporter */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              >
                {priorityOptions.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Reported By</label>
              <input
                value={reporter}
                onChange={(e) => setReporter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* AI Preview */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-1.5 mb-2">
              <BrainCircuit className="h-3.5 w-3.5 text-teal-600" />
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">AI Pre-Classification</span>
            </div>
            <div className="flex gap-4 text-[11px]">
              <span><span className="text-slate-400">Routes to:</span> <span className="font-bold text-slate-800">{getAIClassification(type, priority).ai_assigned_department}</span></span>
              <span><span className="text-slate-400">Severity:</span> <span className="font-bold text-slate-800">{getAIClassification(type, priority).ai_severity}</span></span>
            </div>
          </div>

          {/* Actions */}
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
              className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-teal-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : 'Submit & Route Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function InfrastructurePage() {
  const { session } = useHospitalSession();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [modalMode, setModalMode] = useState<'form' | 'photo' | 'voice' | null>(null);

  useEffect(() => {
    async function loadIssues() {
      try {
        const data = await hospitalApi.getIssues();
        setIssues(data as any[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadIssues();
  }, []);

  const issueStats = [
    { label: 'Open Issues', value: issues.filter(i => i.status === 'Open').length, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'In Progress', value: issues.filter(i => i.status === 'In Progress').length, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Resolved (Today)', value: issues.filter(i => i.status === 'Resolved').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avg Resolution', value: '4.2 hrs', color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  const filtered = issues.filter((issue) => {
    if (activeFilter === 'All') return true;
    return issue.status === activeFilter;
  });

  const handleNewIssue = async (partial: Partial<Issue>) => {
    if (!session) return;
    try {
      await hospitalApi.reportIssue(partial);
      const data = await hospitalApi.getIssues();
      setIssues(data as any[]);
    } catch (e) {
      console.error(e);
      throw e; // propagate to modal
    }
  };

  return (
    <div className="space-y-8">
      {/* Modal */}
      {modalMode && (
        <NewIssueModal
          mode={modalMode}
          onClose={() => setModalMode(null)}
          onSubmit={async (issue) => {
            handleNewIssue(issue);
            setModalMode(null);
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Infrastructure & Issues</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Report and track operational issues with AI-powered classification</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setModalMode('photo')}>
            <Camera className="h-4 w-4" /> Photo Report
          </Button>
          <Button variant="outline" size="sm" onClick={() => setModalMode('voice')}>
            <Mic className="h-4 w-4" /> Voice Report
          </Button>
          <Button variant="primary" size="sm" onClick={() => setModalMode('form')}>
            <Plus className="h-4 w-4" /> New Issue
          </Button>
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
        {filtered.length === 0 && (
          <Card padding="md" className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
            <p className="font-bold text-slate-700">No issues in this category</p>
            <p className="text-sm text-slate-400 mt-1">All clear! Click "+ New Issue" to report one.</p>
          </Card>
        )}
        {filtered.map((issue) => (
          <Card key={issue.id} padding="md" hover className="cursor-pointer">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Main Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-slate-100">
                    {typeIcons[issue.type] ?? <AlertTriangle className="h-4 w-4" />}
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
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(issue.created_at).toLocaleDateString('en-IN')}</span>
                  <span>Reported by: {issue.reporter_name}</span>
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
                    <span className="font-bold text-slate-800">{issue.ai_category}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">Severity</span>
                    <Badge variant={issue.ai_severity === 'Critical' ? 'critical' : issue.ai_severity === 'High' ? 'warning' : 'info'} size="sm">{issue.ai_severity}</Badge>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">Urgency</span>
                    <span className="font-bold text-slate-800">{issue.ai_assigned_department ?? 'Evaluating'}</span>
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
