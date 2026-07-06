"use client";

import React from "react";
import { Check, Clipboard, Search, AlertCircle, FileCheck, Circle } from "lucide-react";
export interface TimelineEvent {
  timestamp: string;
  status: string;
  description: string;
  updatedBy: string;
}
interface TimelineProps {
  currentStatus: string;
  events: TimelineEvent[];
}

const ALL_STATUSES = [
  { name: "Received", icon: Clipboard, label: "Grievance Lodged" },
  { name: "Under AI Analysis", icon: Search, label: "AI Classification" },
  { name: "Assigned to Department", icon: AlertCircle, label: "Department Routing" },
  { name: "Investigation in Progress", icon: Search, label: "Investigation" },
  { name: "Resolved", icon: FileCheck, label: "Resolved" },
  { name: "Closed", icon: Check, label: "Closed" }
];

export default function Timeline({ currentStatus, events }: TimelineProps) {
  // Determine the highest step index reached based on events
  const getStatusIndex = (statusName: string) => {
    return ALL_STATUSES.findIndex(s => s.name === statusName);
  };

  const currentIndex = getStatusIndex(currentStatus);

  return (
    <div className="py-6">
      <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        
        {ALL_STATUSES.map((status, index) => {
          const isCompleted = index < currentIndex || currentStatus === "Closed" || (currentStatus === "Resolved" && index <= 4);
          const isActive = index === currentIndex && currentStatus !== "Closed";
          const event = events.find(e => e.status === status.name);
          const Icon = status.icon;

          return (
            <div key={status.name} className="relative group">
              
              {/* Status Circle Dot Indicator */}
              <div className={`absolute -left-8 top-1.5 h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all ${
                isCompleted 
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                  : isActive
                  ? "bg-teal-50 border-teal-500 text-teal-600 ring-4 ring-teal-500/20 animate-pulse"
                  : "bg-white border-slate-300 text-slate-400"
              }`}>
                {isCompleted ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </div>

              {/* Event Content */}
              <div className="pl-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className={`text-sm font-extrabold ${
                    isCompleted ? "text-slate-800" : isActive ? "text-teal-700" : "text-slate-400"
                  }`}>
                    {status.label}
                  </h4>
                  {event?.timestamp && (
                    <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                      {new Date(event.timestamp).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                      })}
                    </span>
                  )}
                </div>
                
                {event ? (
                  <div className="mt-1.5 bg-slate-50 border border-slate-100 p-3 rounded-xl shadow-sm">
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[9px] font-bold text-slate-400">
                      <span>Log source:</span>
                      <span className="bg-slate-200/60 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {event.updatedBy}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-slate-400 mt-1 italic">
                    Awaiting preceding milestones...
                  </p>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
