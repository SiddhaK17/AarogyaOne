"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  ClipboardList, Search, Sparkles, ShieldAlert, 
  ArrowLeft, CheckCircle2, AlertCircle, Info, Clock, UserCheck
} from "lucide-react";
import Timeline from "../components/timeline";
import { citizenApi } from "@/lib/api";
import AIIntelligenceReport from "@/components/shared/AIIntelligenceReport";

function TrackComplaintContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialId = searchParams.get("id") || searchParams.get("ref") || "";

  const [searchId, setSearchId] = useState(initialId);
  const [complaint, setComplaint] = useState<any>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('my_grievances') || '[]');
      setHistory(stored);
    }
  }, []);

  useEffect(() => {
    if (initialId) {
      setSearchId(initialId);
      fetchComplaint(initialId);
    } else {
      setComplaint(null);
      setSearched(false);
    }
  }, [initialId]);

  const fetchComplaint = async (id: string) => {
    setLoading(true);
    try {
      const res = await citizenApi.trackComplaint(id);
      setComplaint(res);
      setSearched(true);
    } catch (err) {
      console.error(err);
      setComplaint(null);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    router.push(`/citizen/track?id=${searchId.trim()}`);
  };

  const getPriorityStyle = (priority: string) => {
    if (priority === "Immediate Attention" || priority === "Critical" || priority === "High") return "text-rose-400";
    if (priority === "High Priority" || priority === "Medium") return "text-amber-400";
    return "text-slate-400";
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* 1. SEARCH FORM BAR */}
      <section className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-black text-slate-900 tracking-tight text-base">Grievance Status Tracker</h3>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Enter your unique reference ID to query the status of resolution.</p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <div className="relative flex-1">
            <ClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Enter ID (e.g. ARP-A3F7B21C)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-slate-900 hover:bg-teal-600 text-white font-bold text-sm rounded-xl transition-colors shadow-md flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            {loading ? "Searching..." : "Query ID"}
          </button>
        </form>
      </section>

      {/* 1.5 RECENT HISTORY (only shown if not actively searching or right after viewing one) */}
      {!searched && history.length > 0 && (
        <section className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-teal-600" />
            <h3 className="font-black text-slate-900 tracking-tight text-base">Your Recent Grievances</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {history.map(refId => (
              <button
                key={refId}
                onClick={() => router.push(`/citizen/track?ref=${refId}`)}
                className="px-4 py-2 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-xl text-sm font-bold text-slate-700 hover:text-teal-700 transition-colors flex items-center gap-2"
              >
                <ClipboardList className="h-4 w-4" />
                {refId}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 2. MAIN LAYOUT GRID */}
      {searched && !loading ? (
        complaint ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* TIMELINE TRACKER VIEW */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Reference ID: {complaint.reference_number}</span>
                  <h4 className="font-extrabold text-lg text-slate-900 mt-1 leading-snug">{complaint.hospital_name}</h4>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Filed date: {new Date(complaint.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                
                <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 w-max shrink-0 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Status: {complaint.status}
                </span>
              </div>

              {/* Citizen description */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">User Grievance Category</p>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-semibold leading-relaxed text-slate-700 italic">
                  "{complaint.category}"
                </div>
              </div>

              {/* Vertical stepper Timeline */}
              <div className="space-y-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 pb-2">Administrative Status Timeline</p>
                <Timeline currentStatus={complaint.status} events={
                  complaint.tracking_history?.map((t: any) => ({
                    status: t.status,
                    timestamp: t.created_at,
                    description: t.note,
                    updatedBy: t.updated_by || "System",
                  })) || []
                } />
              </div>

            </div>

            <aside className="space-y-6">
              <AIIntelligenceReport complaint={complaint} />
              {/* Informational tip */}
              <div className="bg-white border border-slate-200/80 rounded-[1.5rem] p-6 shadow-sm text-xs font-medium text-slate-500 leading-relaxed space-y-3">
                <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm"><Info className="h-4.5 w-4.5 text-teal-600" /> Resolution Auditing</div>
                <p>
                  Once the department takes on-ground measures, they post completion evidence into the Command Centre.
                </p>
                <p>
                  The status is then marked as **Resolved**, and the hospital updates inventory levels.
                </p>
              </div>
            </aside>

          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
            <ShieldAlert className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-base text-slate-700">Tracking Reference ID not found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Please double check the ID format. A typical grievance tracking ID looks like: <strong>ARP-XXXXXX</strong>.
            </p>
          </div>
        )
      ) : null}

    </div>
  );
}

export default function TrackComplaintPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[300px] text-slate-500 font-bold text-sm">
        Loading Tracker Details...
      </div>
    }>
      <TrackComplaintContent />
    </Suspense>
  );
}
