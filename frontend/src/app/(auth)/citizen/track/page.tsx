"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  ClipboardList, Search, Sparkles, ShieldAlert, 
  ArrowLeft, CheckCircle2, AlertCircle, Info, Clock, UserCheck
} from "lucide-react";
import { getComplaints, Complaint } from "../mockDb";
import Timeline from "../components/timeline";

export default function TrackComplaintPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialId = searchParams.get("id") || "";

  const [searchId, setSearchId] = useState(initialId);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [recentList, setRecentList] = useState<Complaint[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const list = getComplaints();
    setRecentList(list);

    if (initialId) {
      const found = list.find(c => c.id.toLowerCase() === initialId.toLowerCase().trim());
      setComplaint(found || null);
      setSearched(true);
    } else {
      setComplaint(null);
      setSearched(false);
    }
  }, [initialId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    
    // Update URL query param to trigger page reload state
    router.push(`/citizen/track?id=${searchId.trim()}`);
  };

  const getPriorityStyle = (priority: Complaint["priority"]) => {
    switch (priority) {
      case "Immediate Attention":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "High Priority":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getSentimentStyle = (sentiment: Complaint["sentiment"]) => {
    switch (sentiment) {
      case "Positive Experience":
        return "text-emerald-600 bg-emerald-50";
      case "Neutral Feedback":
        return "text-slate-600 bg-slate-50";
      default:
        return "text-rose-600 bg-rose-50";
    }
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
              placeholder="Enter ID (e.g. GRI-883012)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all uppercase"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-slate-900 hover:bg-teal-600 text-white font-bold text-sm rounded-xl transition-colors shadow-md flex items-center justify-center gap-1.5 shrink-0"
          >
            <Search className="h-4 w-4" />
            Query ID
          </button>
        </form>
      </section>

      {/* 2. MAIN LAYOUT GRID */}
      {searched ? (
        complaint ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* TIMELINE TRACKER VIEW (Left/Center 2 cols) */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Reference ID: {complaint.id}</span>
                  <h4 className="font-extrabold text-lg text-slate-900 mt-1 leading-snug">{complaint.hospitalName}</h4>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Visit date: {complaint.dateOfVisit} | Filed date: {new Date(complaint.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                
                <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 w-max shrink-0 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Status: {complaint.status}
                </span>
              </div>

              {/* Citizen description */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">User Grievance Description</p>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-semibold leading-relaxed text-slate-700 italic">
                  "{complaint.description}"
                </div>
              </div>

              {/* Vertical stepper Timeline */}
              <div className="space-y-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 pb-2">Administrative Status Timeline</p>
                <Timeline currentStatus={complaint.status} events={complaint.updates} />
              </div>

            </div>

            {/* AI METADATA CARD (Right 1 col) */}
            <aside className="space-y-6">
              
              <div className="bg-slate-900 text-white rounded-[2rem] p-6 border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-500/10 to-transparent -z-10"></div>
                
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-teal-400" />
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">
                    AI Analysis Report
                  </h4>
                </div>

                <div className="space-y-4">
                  
                  <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned Department</p>
                    <p className="text-sm font-extrabold text-white mt-1">{complaint.department}</p>
                    <p className="text-[9px] text-slate-400 mt-1">Auto-routed via Workflow Intelligence</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Urgency Priority</p>
                      <p className={`text-xs font-black mt-1 ${
                        complaint.priority === "Immediate Attention" ? "text-rose-400" : "text-amber-400"
                      }`}>{complaint.priority}</p>
                    </div>

                    <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Parser Confidence</p>
                      <p className="text-xs font-black text-slate-100 mt-1">{complaint.confidence}%</p>
                    </div>
                  </div>

                  <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sentiment Score</p>
                    <p className="text-xs font-black text-slate-300 mt-1">{complaint.sentiment}</p>
                  </div>

                  <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Filing Type</p>
                    <p className="text-xs font-black text-slate-300 mt-1">
                      {complaint.isAnonymous ? "Anonymous Submission" : "Verified Identity"}
                    </p>
                  </div>

                </div>
              </div>

              {/* Informational tip */}
              <div className="bg-white border border-slate-200/80 rounded-[1.5rem] p-6 shadow-sm text-xs font-medium text-slate-500 leading-relaxed space-y-3">
                <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm"><Info className="h-4.5 w-4.5 text-teal-600" /> Resolution Auditing</div>
                <p>
                  Once the department takes on-ground measures (e.g. delivering paracetamol to the drug store or patching up leaks), they post completion evidence into the Command Centre.
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
              Please double check the ID format. A typical grievance tracking ID looks like: <strong>GRI-XXXXXX</strong>.
            </p>
          </div>
        )
      ) : null}

      {/* 3. RECENT COMPLAINTS QUICK LINK LIST */}
      <section className="space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Your Registry Complaints</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentList.map((comp) => (
            <button
              key={comp.id}
              onClick={() => {
                setSearchId(comp.id);
                router.push(`/citizen/track?id=${comp.id}`);
              }}
              className="bg-white border border-slate-200/80 hover:border-teal-500 rounded-2xl p-4 shadow-sm hover:shadow text-left flex flex-col justify-between gap-3 transition-all"
            >
              <div className="flex justify-between items-start gap-3 w-full">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{comp.id}</span>
                  <h4 className="font-extrabold text-xs text-slate-800 leading-snug line-clamp-1 mt-0.5">{comp.hospitalName}</h4>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                  comp.status === "Resolved" || comp.status === "Closed" 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}>
                  {comp.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal line-clamp-2 italic">
                "{comp.description}"
              </p>
              <span className="text-[9px] text-teal-600 font-bold mt-1.5 flex items-center gap-0.5">Click to check timeline →</span>
            </button>
          ))}
        </div>
      </section>

    </div>
  );
}
