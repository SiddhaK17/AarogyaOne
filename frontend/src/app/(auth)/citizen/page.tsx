"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, Search, Map, ClipboardList, 
  BrainCircuit, PhoneCall, AlertTriangle, CheckCircle, 
  Clock, ArrowRight, ShieldAlert, Sparkles, Activity
} from "lucide-react";
import { getComplaints, Complaint } from "./mockDb";

export default function CitizenDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    resolved: 0,
  });

  useEffect(() => {
    const list = getComplaints();
    setComplaints(list);
    
    const active = list.filter(c => c.status !== "Resolved" && c.status !== "Closed").length;
    const resolved = list.filter(c => c.status === "Resolved" || c.status === "Closed").length;
    
    setStats({
      total: list.length,
      active,
      resolved
    });
  }, []);

  const getStatusStyle = (status: Complaint["status"]) => {
    switch (status) {
      case "Received":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "Under AI Analysis":
        return "bg-purple-50 text-purple-700 border-purple-100 animate-pulse";
      case "Assigned to Department":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Investigation in Progress":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Closed":
        return "bg-slate-200 text-slate-600 border-slate-300";
      default:
        return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. HERO GREETING BANNER */}
      <section className="relative bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-[2rem] p-6 sm:p-8 lg:p-10 text-white shadow-xl overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent -z-10"></div>
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Welcome Citizen
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Empowering Public Healthcare through Transparency
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Report operational issues in government clinics, track grievance status in real time, and locate critical nearby resources using our AI-assisted command network.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0">
            <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-2xl text-center min-w-[90px] sm:min-w-[110px] backdrop-blur-sm">
              <Clock className="h-5 w-5 text-amber-400 mx-auto mb-2" />
              <div className="text-xl sm:text-2xl font-black text-white tabular-nums">{stats.active}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Active</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-2xl text-center min-w-[90px] sm:min-w-[110px] backdrop-blur-sm">
              <CheckCircle className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
              <div className="text-xl sm:text-2xl font-black text-white tabular-nums">{stats.resolved}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Resolved</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-2xl text-center min-w-[90px] sm:min-w-[110px] backdrop-blur-sm">
              <Activity className="h-5 w-5 text-teal-400 mx-auto mb-2" />
              <div className="text-xl sm:text-2xl font-black text-white tabular-nums">78%</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. QUICK ACTIONS (Grid of 4 Bento Cards) */}
      <section className="space-y-4">
        <h3 className="text-lg font-black text-slate-900 tracking-tight">Portal Quick Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <Link href="/citizen/report" className="bg-white hover:border-teal-500 hover:shadow-lg transition-all duration-300 p-6 rounded-[1.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between h-48 group">
            <div className="bg-teal-50 w-12 h-12 rounded-xl flex items-center justify-center text-teal-600 group-hover:scale-105 transition-transform duration-300">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-base mb-1.5">File a Grievance</h4>
              <p className="text-xs text-slate-500 leading-normal">
                Report medicine stock-outs, staff absences, or infrastructure issues directly to authorities.
              </p>
            </div>
          </Link>

          <Link href="/citizen/search" className="bg-white hover:border-blue-500 hover:shadow-lg transition-all duration-300 p-6 rounded-[1.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between h-48 group">
            <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform duration-300">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-base mb-1.5">Hospital Search</h4>
              <p className="text-xs text-slate-500 leading-normal">
                Search government hospitals by district, pin code, or services to verify address and public details.
              </p>
            </div>
          </Link>

          <Link href="/citizen/nearby" className="bg-white hover:border-indigo-500 hover:shadow-lg transition-all duration-300 p-6 rounded-[1.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between h-48 group">
            <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform duration-300">
              <Map className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-base mb-1.5">Nearby Healthcare</h4>
              <p className="text-xs text-slate-500 leading-normal">
                Simulate your location to discover nearest government health centres on an interactive map.
              </p>
            </div>
          </Link>

          <Link href="/citizen/assistant" className="bg-white hover:border-purple-500 hover:shadow-lg transition-all duration-300 p-6 rounded-[1.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between h-48 group">
            <div className="bg-purple-50 w-12 h-12 rounded-xl flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform duration-300">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-base mb-1.5">AI Assistant</h4>
              <p className="text-xs text-slate-500 leading-normal">
                Ask our smart health bot questions about filing complaints, tracking issues, or emergency details.
              </p>
            </div>
          </Link>

        </div>
      </section>

      {/* 3. RECENT COMPLAINTS AND HELPLINES PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* RECENT COMPLAINTS (Left/Center 2 cols) */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Your Submitted Grievances</h3>
            <Link href="/citizen/track" className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
              Track Complaint ID <ArrowRight className="h-4.5 w-4.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {complaints.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-500 shadow-sm">
                <ShieldAlert className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-sm text-slate-700">No active grievances registered</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  If you face problems during a hospital visit, you can file a complaint. Click 'File a Grievance' above to begin.
                </p>
              </div>
            ) : (
              complaints.slice(0, 3).map((comp) => (
                <div key={comp.id} className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between gap-4">
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-slate-900 tabular-nums">{comp.id}</span>
                        <span className="text-[10px] text-slate-400 font-bold">•</span>
                        <span className="text-xs font-bold text-slate-500">{comp.category}</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-800 leading-snug">{comp.hospitalName}</h4>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${getStatusStyle(comp.status)}`}>
                      {comp.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-normal line-clamp-2">
                    {comp.description}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] font-bold text-slate-400">
                    <span>Filed: {new Date(comp.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    <Link href={`/citizen/track?id=${comp.id}`} className="text-teal-600 hover:text-teal-700 flex items-center gap-0.5">
                      View details & history <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                </div>
              ))
            )}
          </div>
        </section>

        {/* GOVERNMENT HELPLINES & NOTICES (Right 1 col) */}
        <section className="space-y-6">
          
          <div className="bg-white border border-slate-200/80 rounded-[1.5rem] p-6 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 tracking-tight text-base">National Helpline Desk</h3>
            <p className="text-xs text-slate-500 leading-normal">
              For immediate medical emergencies or telephone consultations, call public help numbers:
            </p>
            <div className="space-y-3">
              <a href="tel:108" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-100 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <div className="bg-rose-50 text-rose-600 p-2 rounded-lg group-hover:scale-105 transition-transform"><PhoneCall className="h-4 w-4" /></div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800">108 Emergency</h5>
                    <p className="text-[9px] text-slate-400 font-bold">Ambulance & Trauma Services</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300" />
              </a>

              <a href="tel:104" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-100 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <div className="bg-teal-50 text-teal-600 p-2 rounded-lg group-hover:scale-105 transition-transform"><PhoneCall className="h-4 w-4" /></div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800">104 Health Helpline</h5>
                    <p className="text-[9px] text-slate-400 font-bold">Public Health Consultation</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300" />
              </a>

              <a href="tel:1800112545" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-100 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-lg group-hover:scale-105 transition-transform"><PhoneCall className="h-4 w-4" /></div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800">1800-112-545</h5>
                    <p className="text-[9px] text-slate-400 font-bold">Ministry of Health Toll Free</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300" />
              </a>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-[1.5rem] p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-500/10 to-transparent"></div>
            <h4 className="font-extrabold text-sm mb-2 flex items-center gap-1.5 text-teal-400">
              <Sparkles className="h-4 w-4 text-teal-400" /> AI Insights Impact
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              Every complaint submitted helps the system recalculate the hospital's **AI Health Score**. If score falls below critical thresholds, the Command Centre receives automated alerts and recommends immediate resource redistribution (such as dispatching doctors or stocking paracetamol).
            </p>
          </div>

        </section>

      </div>

    </div>
  );
}
