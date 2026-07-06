import React from "react";
import { Sparkles, UserCheck, Activity, BrainCircuit, Mic, FileText, ServerCrash } from "lucide-react";

export default function AIIntelligenceReport({ complaint }: { complaint: any }) {
  const getPriorityStyle = (priority: string) => {
    if (priority === "Immediate Attention" || priority === "Critical" || priority === "High") return "text-rose-400";
    if (priority === "High Priority" || priority === "Medium") return "text-amber-400";
    return "text-slate-400";
  };

  return (
    <aside className="space-y-6">
      <div className="bg-slate-900 text-white rounded-[2rem] p-6 border border-slate-800 shadow-xl relative overflow-hidden" aria-label="AI Intelligence Report">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-500/10 to-transparent -z-10"></div>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-400" />
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">
              AI Intelligence Center
            </h4>
          </div>
          {complaint.ai_confidence && (
            <div className="bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-xs font-bold text-teal-400">{Math.round(complaint.ai_confidence * 100)}% Confidence</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Routing & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-xl">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned Dept</p>
              <p className="text-sm font-extrabold text-white mt-1">{complaint.ai_assigned_department || "Pending"}</p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-xl">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Urgency Priority</p>
              <p className={`text-xs font-black mt-1 ${getPriorityStyle(complaint.ai_severity)}`}>
                {complaint.ai_severity || "Evaluating"}
              </p>
            </div>
          </div>

          {/* Reasoning */}
          {complaint.ai_reasoning ? (
            <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-xl">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BrainCircuit className="h-3 w-3 text-emerald-400" /> AI Recommendation Reasoning
              </p>
              <p className="text-xs text-slate-300 font-medium leading-relaxed italic">
                "{complaint.ai_reasoning}"
              </p>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-rose-900/50 p-4 rounded-xl flex items-center gap-3">
              <ServerCrash className="h-5 w-5 text-rose-500 opacity-80" />
              <div>
                <p className="text-xs font-bold text-rose-400">NLP Engine Unavailable</p>
                <p className="text-[10px] text-slate-400">Reasoning generation bypassed</p>
              </div>
            </div>
          )}

          {/* Pipelines */}
          <div className="space-y-3">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-4">Pipeline Telemetry</p>
            
            {/* Audio Pipeline */}
            <div className="bg-slate-800/80 border border-slate-700/50 p-3 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Mic className="h-3.5 w-3.5 text-blue-400" /> Speech-to-Text
                </span>
                {complaint.ai_transcript ? (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase tracking-wider font-bold">Processed</span>
                ) : (
                  <span className="text-[9px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded uppercase tracking-wider font-bold">Not Invoked</span>
                )}
              </div>
              {complaint.ai_transcript && (
                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/30">
                  <p className="text-[10px] text-slate-400 italic line-clamp-3">"{complaint.ai_transcript}"</p>
                </div>
              )}
            </div>

            {/* Vision Pipeline */}
            <div className="bg-slate-800/80 border border-slate-700/50 p-3 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <FileText className="h-3.5 w-3.5 text-purple-400" /> Vision OCR
                </span>
                {complaint.ai_ocr_text ? (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase tracking-wider font-bold">Processed</span>
                ) : (
                  <span className="text-[9px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded uppercase tracking-wider font-bold">Not Invoked</span>
                )}
              </div>
              {complaint.ai_ocr_text && (
                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/30">
                  <p className="text-[10px] text-slate-400 italic line-clamp-3">"{complaint.ai_ocr_text}"</p>
                </div>
              )}
            </div>
            
          </div>

        </div>
      </div>
    </aside>
  );
}
