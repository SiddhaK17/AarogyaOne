'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  Paperclip,
  Check,
  Activity,
  User,
  Shield,
  Play,
  Volume2,
  Upload,
} from 'lucide-react';
import { useAppData, type ComplaintStatus, type InfrastructureIssue } from '@/context/AppDataContext';

export default function GovernmentTasks() {
  const { complaints, infraIssues, updateComplaintStatus, updateIssueStatus } = useAppData();
  const [selectedDept, setSelectedDept] = useState('pwd');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeTask, setActiveTask] = useState<any | null>(null);
  
  // Form States for updating task
  const [newStatus, setNewStatus] = useState('');
  const [progressNote, setProgressNote] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofAttached, setProofAttached] = useState(false);

  // Department mapping helper
  const getTaskDeptCode = (deptName?: string): string => {
    if (!deptName) return 'other';
    const dn = deptName.toLowerCase();
    if (dn.includes('public works') || dn.includes('pwd') || dn.includes('civil')) return 'pwd';
    if (dn.includes('biomedical') || dn.includes('equipment')) return 'biomedical';
    if (dn.includes('medical store') || dn.includes('stockout') || dn.includes('medicine')) return 'medical_store';
    if (dn.includes('electricity') || dn.includes('msedcl')) return 'electricity';
    if (dn.includes('water') || dn.includes('sanitation')) return 'water';
    return 'other';
  };

  // Convert complaints + issues into unified task models
  const tasks = useMemo(() => {
    const unified: any[] = [];

    // Add citizen complaints
    complaints.forEach((c) => {
      // Map statuses
      let displayStatus = 'Open';
      if (c.status === 'In Progress') displayStatus = 'Work in Progress';
      else if (c.status === 'Resolved' || c.status === 'Closed') displayStatus = 'Completed';
      else if (c.status === 'Assigned to Department') displayStatus = 'Accepted';

      unified.push({
        id: c.id,
        isComplaint: true,
        department: getTaskDeptCode(c.assigned_department || c.category),
        hospital: c.hospital_name,
        issue: c.category,
        description: c.description,
        priority: c.severity === 'Critical' ? 'Critical' : c.severity === 'High' ? 'High' : 'Medium',
        severity: `Level ${c.severity === 'Critical' ? '5 (Fatal)' : c.severity === 'High' ? '3 (High)' : '2 (Moderate)'}`,
        assignedDate: new Date(c.created_at).toLocaleDateString('en-IN'),
        dueDate: new Date(new Date(c.created_at).getTime() + 86400000 * 3).toLocaleDateString('en-IN'),
        status: displayStatus,
        affectedServices: c.category,
        aiClassification: {
          severity: c.severity,
          priority: c.severity === 'Critical' ? 'Critical' : 'High',
          suggestedDept: c.assigned_department || 'General Administration',
          explanation: `Auto-analyzed with ${c.confidence ?? 89}% AI confidence rating.`,
        },
        voiceNote: null,
        evidencePhoto: c.photo_url || null,
        history: c.timeline.map((t) => ({
          time: t.time,
          user: t.actor,
          note: t.note,
        })),
      });
    });

    // Add hospital infrastructure issues
    infraIssues.forEach((i) => {
      let displayStatus = 'Open';
      if (i.status === 'In Progress') displayStatus = 'Work in Progress';
      else if (i.status === 'Resolved') displayStatus = 'Completed';

      unified.push({
        id: i.id,
        isComplaint: false,
        department: getTaskDeptCode(i.department || i.type),
        hospital: i.hospital_name,
        issue: i.title,
        description: i.description,
        priority: i.priority,
        severity: `Level ${i.priority === 'Critical' ? '4 (Severe)' : '2 (Moderate)'}`,
        assignedDate: new Date(i.created_at).toLocaleDateString('en-IN'),
        dueDate: new Date(new Date(i.created_at).getTime() + 86400000 * 2).toLocaleDateString('en-IN'),
        status: displayStatus,
        affectedServices: i.type,
        aiClassification: {
          severity: i.ai_severity || i.priority,
          priority: i.priority,
          suggestedDept: i.ai_category || i.department,
          explanation: `Reported directly by ${i.reporter} from hospital portal.`,
        },
        voiceNote: null,
        evidencePhoto: null,
        history: [
          { time: new Date(i.created_at).toLocaleString('en-IN'), user: i.reporter, note: 'Issue reported from Hospital Portal' },
        ],
      });
    });

    return unified;
  }, [complaints, infraIssues]);

  // Sync selected task updates when state changes
  const updateTaskStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;

    // Transition back to source models
    const isComp = activeTask.isComplaint;
    if (isComp) {
      // Map displayStatus back to ComplaintStatus
      let targetStatus: ComplaintStatus = 'Submitted';
      if (newStatus === 'Work in Progress') targetStatus = 'In Progress';
      else if (newStatus === 'Completed') targetStatus = 'Resolved';
      else if (newStatus === 'Accepted') targetStatus = 'Assigned to Department';
      else if (newStatus === 'Open') targetStatus = 'Submitted';

      updateComplaintStatus(
        activeTask.id,
        targetStatus,
        'Government Authority Office',
        progressNote || `Status updated to ${newStatus}`
      );
    } else {
      // Map to InfrastructureIssue status
      let targetStatus: 'Open' | 'In Progress' | 'Resolved' = 'Open';
      if (newStatus === 'Work in Progress') targetStatus = 'In Progress';
      else if (newStatus === 'Completed') targetStatus = 'Resolved';

      updateIssueStatus(activeTask.id, targetStatus);
    }

    setProgressNote('');
    alert(`Task ${activeTask.id} status successfully transitioned to: ${newStatus}`);
    setActiveTask(null);
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesDept = t.department === selectedDept;
      const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
      const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
      const matchesSearch = searchQuery === '' || 
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.issue.toLowerCase().includes(searchQuery.toLowerCase());
        
      return matchesDept && matchesPriority && matchesStatus && matchesSearch;
    });
  }, [tasks, selectedDept, filterPriority, filterStatus, searchQuery]);

  // Pre-fill form when task details modal opens
  useEffect(() => {
    if (activeTask) {
      setNewStatus(activeTask.status);
      setProofAttached(false);
    }
  }, [activeTask]);

  // Handle mock file upload
  const handleProofUpload = () => {
    setIsUploadingProof(true);
    setTimeout(() => {
      setIsUploadingProof(false);
      setProofAttached(true);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assigned Service Orders</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Review, accept, and submit progress details for assigned hospital complaints.</p>
        </div>

        {/* Department Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <span className="text-xs font-black text-slate-500 px-2 uppercase">Filter Dept:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-white border-slate-200 text-slate-900 rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm focus:outline-none"
          >
            <option value="pwd">PWD (Public Works)</option>
            <option value="biomedical">Biomedical Engineering</option>
            <option value="medical_store">District Medical Store</option>
            <option value="electricity">Electricity Board</option>
            <option value="water">Water Supply Dept</option>
          </select>
        </div>
      </div>

      {/* Filters Card */}
      <Card padding="sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Search bar */}
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, hospital, issue name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Priority:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none w-full"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none w-full"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Accepted">Accepted</option>
              <option value="Work in Progress">Work in Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Hospital</th>
                <th className="px-6 py-4">Issue Summary</th>
                <th className="px-6 py-4">AI Priority</th>
                <th className="px-6 py-4">Assigned</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{task.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-950">{task.hospital}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{task.affectedServices}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate font-medium text-slate-700">{task.issue}</td>
                    <td className="px-6 py-4">
                      <Badge variant={task.priority === 'Critical' ? 'critical' : task.priority === 'High' ? 'high-risk' : 'warning'} dot>
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{task.assignedDate}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        task.status === 'Open' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : task.status === 'Work in Progress'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : task.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {task.status === 'Completed' && <Check className="h-3.5 w-3.5" />}
                        {task.status === 'Work in Progress' && <Clock className="h-3.5 w-3.5" />}
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTask(task)}
                        className="font-bold flex items-center gap-1 mx-auto hover:bg-slate-100 transition-all"
                      >
                        Inspect <ChevronRight className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-slate-400 font-bold">
                    No active service orders found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── Task Details Slide-over / Modal Panel ─── */}
      {activeTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-end transition-all">
          <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-350 overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-brand-navy to-slate-900 text-white">
              <div>
                <span className="text-xs font-bold text-brand-cyan tracking-wider uppercase">{activeTask.id} Details</span>
                <h3 className="text-xl font-black">{activeTask.hospital}</h3>
              </div>
              <button
                onClick={() => setActiveTask(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all font-bold text-sm"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Summary Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant={activeTask.priority === 'Critical' ? 'critical' : 'warning'} dot>
                  Priority: {activeTask.priority}
                </Badge>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  Impact: {activeTask.severity}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  Due: {activeTask.dueDate}
                </span>
              </div>

              {/* Core Description */}
              <div className="space-y-2">
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Issue Description</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {activeTask.description}
                </p>
              </div>

              {/* Evidence Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Photo Evidence */}
                <div>
                  <h5 className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Paperclip className="h-3 w-3" /> Photo Evidence
                  </h5>
                  <div className="relative h-[160px] w-full rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 group">
                    <img 
                      src={activeTask.evidencePhoto} 
                      alt="Evidence" 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>

                {/* Voice Note */}
                <div className="flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Volume2 className="h-3 w-3" /> Reported Voice Assistance Note
                    </h5>
                    {activeTask.voiceNote ? (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-brand-cyan/10 text-brand-cyan rounded-xl">
                            <Play className="h-4 w-4 fill-current" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{activeTask.voiceNote}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">Duration: 0:24s</p>
                          </div>
                        </div>
                        <Badge variant="healthy">Verified</Badge>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 italic">No voice attachment available</p>
                    )}
                  </div>

                  <div className="bg-[#FFFDF5] border border-amber-100 p-4 rounded-2xl text-[11px] font-bold text-amber-800 flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <span>Always inspect sites carefully to verify scope of electrical/structural repairs.</span>
                  </div>
                </div>
              </div>

              {/* AI Recommendations Panel */}
              <div className="bg-[#FAF5FF] border border-[#E8D5FF] rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-purple-100 rounded-lg text-purple-700">
                    <Activity className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-extrabold text-purple-950 uppercase tracking-wider">AarogyaPulse AI Dispatch Recommendation</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-purple-900/80">
                  <div>
                    <span className="text-[10px] text-purple-500 block">Classified Priority</span>
                    <span className="text-sm font-black text-purple-950">{activeTask.aiClassification.priority}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-500 block">Assigned Queue</span>
                    <span className="text-sm font-black text-purple-950">{activeTask.aiClassification.suggestedDept}</span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-purple-800 leading-relaxed pt-2 border-t border-purple-200/50">
                  {activeTask.aiClassification.explanation}
                </p>
              </div>

              {/* Status Update Form */}
              <form onSubmit={updateTaskStatus} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-1">
                  <Clock className="h-4 w-4 text-brand-blue" /> Transition Task Status
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">New Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none w-full shadow-sm"
                    >
                      <option value="Open">Open (Pending Review)</option>
                      <option value="Accepted">Accepted (Awaiting inspection)</option>
                      <option value="Inspection Scheduled">Inspection Scheduled</option>
                      <option value="Work in Progress">Work in Progress</option>
                      <option value="Waiting for Parts">Waiting for Parts</option>
                      <option value="Awaiting Verification">Awaiting Verification</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  {/* Completion proof upload */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Completion Photo Proof</label>
                    <button
                      type="button"
                      disabled={newStatus !== 'Completed'}
                      onClick={handleProofUpload}
                      className={`flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-bold rounded-xl border border-dashed transition-all ${
                        newStatus !== 'Completed'
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : proofAttached
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : isUploadingProof
                          ? 'bg-slate-100 text-slate-600 border-slate-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {proofAttached ? (
                        <>
                          <Check className="h-4 w-4" /> Proof Photo Attached.jpg
                        </>
                      ) : isUploadingProof ? (
                        'Uploading proof...'
                      ) : (
                        <>
                          <Upload className="h-4 w-4" /> Upload Completion Evidence
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Progress Notes / Logs</label>
                  <textarea
                    rows={2}
                    placeholder="Describe inspection results or repair milestones..."
                    value={progressNote}
                    onChange={(e) => setProgressNote(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 font-medium focus:outline-none shadow-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTask(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={newStatus === 'Completed' && !proofAttached}
                  >
                    Submit Transition
                  </Button>
                </div>
              </form>

              {/* Historical Updates Log */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wide">Historical Updates Log</h4>
                <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                  {activeTask.history.map((log: any, index: number) => (
                    <div key={index} className="flex gap-4 items-start relative pl-1 text-xs">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0 relative z-10">
                        {log.user.includes('AI') ? (
                          <Activity className="h-3 w-3 text-purple-600" />
                        ) : (
                          <User className="h-3 w-3 text-slate-600" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{log.user}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{log.time}</span>
                        </div>
                        <p className="text-slate-500 font-semibold">{log.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
