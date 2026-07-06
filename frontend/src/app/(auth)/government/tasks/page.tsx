'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  Search, Filter, CheckCircle2, AlertTriangle, Clock,
  ExternalLink, ChevronRight, MessageSquare, Paperclip, Check,
  Activity, User, Shield, Play, Volume2, Upload,
} from 'lucide-react';
import { governmentApi, subscribeToTaskUpdates } from '@/lib/api';

export default function GovernmentTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeTask, setActiveTask] = useState<any | null>(null);
  
  // Form States for updating task
  const [newStatus, setNewStatus] = useState('');
  const [progressNote, setProgressNote] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofAttached, setProofAttached] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const loadTasks = async () => {
    setLoadingTasks(true);
    try {
      const data = await governmentApi.getTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadTasks();
    const unsub = subscribeToTaskUpdates(() => loadTasks());
    return () => {
      unsub();
    };
  }, []);

  const loadTaskDetail = async (id: number) => {
    try {
      const detail = (await governmentApi.getTaskDetail(id)) as any;
      setActiveTask(detail);
      setNewStatus(detail.status);
      setProofAttached(false);
      setProofFile(null);
    } catch (err) {
      console.error("Error loading detail:", err);
    }
  };

  const updateTaskStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;

    try {
      await governmentApi.updateTaskStatus(activeTask.id, {
        status: newStatus,
        note: progressNote
      });

      if (newStatus === 'Completed' && proofFile) {
        await governmentApi.uploadEvidence(activeTask.id, proofFile);
      }
      
      alert(`Task ${activeTask.id} status successfully transitioned to: ${newStatus}`);
      setActiveTask(null);
      setProgressNote('');
      loadTasks(); // refresh list
    } catch (err) {
      console.error(err);
      alert('Failed to update task.');
    }
  };

  // Handle mock file upload for UI
  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setIsUploadingProof(true);
    setTimeout(() => {
      setIsUploadingProof(false);
      setProofAttached(true);
    }, 1500);
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
      const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
      const matchesSearch = searchQuery === '' || 
        t.id.toString().includes(searchQuery) ||
        (t.hospital_name && t.hospital_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase());
        
      return matchesPriority && matchesStatus && matchesSearch;
    });
  }, [tasks, filterPriority, filterStatus, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assigned Service Orders</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Review, accept, and submit progress details for assigned hospital complaints.</p>
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
              <option value="Pending">Pending</option>
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
              {loadingTasks ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-slate-400 font-bold">Loading tasks...</td>
                </tr>
              ) : filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{task.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-950">{task.hospital_name || 'N/A'}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{task.source_type}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate font-medium text-slate-700">{task.title}</td>
                    <td className="px-6 py-4">
                      <Badge variant={task.priority === 'Critical' ? 'critical' : task.priority === 'High' ? 'warning' : 'info'} dot>
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                      {new Date(task.assigned_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        task.status === 'Pending' || task.status === 'Open'
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : task.status === 'Work in Progress' || task.status === 'Accepted'
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
                        onClick={() => loadTaskDetail(task.id)}
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
                <span className="text-xs font-bold text-brand-cyan tracking-wider uppercase">Task #{activeTask.id}</span>
                <h3 className="text-xl font-black">{activeTask.hospital_name || 'General Assignment'}</h3>
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
                  Due: {activeTask.due_date ? new Date(activeTask.due_date).toLocaleDateString() : 'N/A'}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  Dept: {activeTask.assigned_department}
                </span>
              </div>

              {/* Core Description */}
              <div className="space-y-2">
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">{activeTask.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {activeTask.description}
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
                      <option value="Pending">Pending (Open)</option>
                      <option value="Accepted">Accepted</option>
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
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={handleProofUpload}
                        disabled={newStatus !== 'Completed'}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div
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
                            <Check className="h-4 w-4" /> {proofFile?.name || 'Attached'}
                          </>
                        ) : isUploadingProof ? (
                          'Uploading proof...'
                        ) : (
                          <>
                            <Upload className="h-4 w-4" /> Upload Completion Evidence
                          </>
                        )}
                      </div>
                    </div>
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
                  {activeTask.progress_logs && activeTask.progress_logs.length > 0 ? activeTask.progress_logs.map((log: any, index: number) => (
                    <div key={index} className="flex gap-4 items-start relative pl-1 text-xs">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0 relative z-10">
                        {log.officer_name?.includes('AI') ? (
                          <Activity className="h-3 w-3 text-purple-600" />
                        ) : (
                          <User className="h-3 w-3 text-slate-600" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{log.officer_name || 'System'}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-500 font-semibold">{log.status}: {log.note || 'No additional note'}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-xs text-slate-500 italic pl-8">No progress logs recorded.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
