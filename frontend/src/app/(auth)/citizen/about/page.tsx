"use client";

import React from "react";
import { 
  Info, Cpu, Network, ShieldCheck, HeartPulse, 
  Settings, Users, Activity, CheckCircle
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="space-y-10 pb-16">
      
      {/* 1. HERO MISSION BANNER */}
      <section className="bg-gradient-to-br from-teal-800 to-blue-900 text-white rounded-[2rem] p-8 sm:p-10 shadow-xl overflow-hidden relative border border-teal-700/30">
        <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="space-y-4 max-w-3xl relative z-10 text-left">
          <h2 className="text-3xl font-black tracking-tight leading-tight">About AarogyaOne (ArogyaPulse)</h2>
          <p className="text-teal-100 text-sm sm:text-base leading-relaxed">
            AarogyaPulse is an AI-powered public healthcare intelligence and resource management platform. Unlike traditional administrative systems, AarogyaPulse focuses on operational intelligence to continuously monitor healthcare resources, predict shortages before they occur, and redistribute assets dynamically.
          </p>
        </div>
      </section>

      {/* 2. THE AI INTELLIGENCE STACK */}
      <section className="space-y-6">
        <div className="text-left space-y-1">
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="h-5 w-5 text-teal-600" /> Integrated AI Stack
          </h3>
          <p className="text-xs text-slate-500 font-semibold">Learn about the specialized machine learning models running in the background.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-3">
            <div className="bg-teal-50 text-teal-600 p-2 rounded-lg w-max"><Activity className="h-5 w-5" /></div>
            <h4 className="font-extrabold text-sm text-slate-900">1. Demand Forecasting (LightGBM)</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Predicts future inventory stock-outs and bed capacity spikes 3-5 days in advance using gradient-boosting trees, avoiding critical local shortages.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-3">
            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg w-max"><Cpu className="h-5 w-5" /></div>
            <h4 className="font-extrabold text-sm text-slate-900">2. Complaint Intelligence (IndicBERT)</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              A multilingual Transformer fine-tuned on Indic language complaints. Auto-classifies textual grievances and scores priority urgency.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-3">
            <div className="bg-purple-50 text-purple-600 p-2 rounded-lg w-max"><Cpu className="h-5 w-5" /></div>
            <h4 className="font-extrabold text-sm text-slate-900">3. Speech Recognition (IndicWhisper)</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Translates spoken citizen voice complaints directly into structured text, ensuring accessibility for users with limited digital literacy.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-3">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg w-max"><Cpu className="h-5 w-5" /></div>
            <h4 className="font-extrabold text-sm text-slate-900">4. Translation Engine (IndicTrans2)</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Converts Hindi and Marathi inputs into canonical English for downstream backend parsing while preserving the original transcript log.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-3">
            <div className="bg-amber-50 text-amber-600 p-2 rounded-lg w-max"><Network className="h-5 w-5" /></div>
            <h4 className="font-extrabold text-sm text-slate-900">5. Resource Optimization (OR-Tools)</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Runs logistics routing algorithms using Google OR-Tools to balance district supply chains and map optimal hospital transfers.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-3">
            <div className="bg-rose-50 text-rose-600 p-2 rounded-lg w-max"><Settings className="h-5 w-5" /></div>
            <h4 className="font-extrabold text-sm text-slate-900">6. Performance Scorecard (XGBoost)</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Aggregates operational indicators (doctor attendance, medicine quantity, and complaint count) to output dynamic health scores.
            </p>
          </div>

        </div>
      </section>

      {/* 3. CLOSED LOOP WORKFLOW CITIZEN CORNER */}
      <section className="bg-slate-50 border border-slate-200/80 rounded-[2rem] p-6 sm:p-8 space-y-6">
        <div className="text-left space-y-1">
          <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-teal-600" /> Citizens as an External Validation Layer
          </h3>
          <p className="text-xs text-slate-500 font-semibold">How citizen feedback contributes directly to district-wide intelligence.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-semibold text-slate-600 leading-relaxed">
          <div className="space-y-4">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-extrabold text-slate-900 text-sm">Validating Resource Reports</h5>
                <p className="text-xs text-slate-500 leading-normal mt-0.5">
                  If a hospital falsely reports full doctor attendance or full paracetamol stock, but multiple citizens submit complaints claiming otherwise, the AI engine flags this discrepancy instantly.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-extrabold text-slate-900 text-sm">Transparency Timeline</h5>
                <p className="text-xs text-slate-500 leading-normal mt-0.5">
                  Citizens receive a tracking reference number upon submission. Every step—from AI classification to government officer dispatch and resolution completion logs—is audit-verified.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-extrabold text-slate-900 text-sm">Indic Multilingual Accessibility</h5>
                <p className="text-xs text-slate-500 leading-normal mt-0.5">
                  Our voice-assisted intake system supports Marathi and Hindi. Voice data is transcrypted using IndicWhisper models running locally to ensure privacy.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-extrabold text-slate-900 text-sm">Vision-Based Intelligence</h5>
                <p className="text-xs text-slate-500 leading-normal mt-0.5">
                  Images uploaded as evidence are scanned by YOLOv11 and multimodal vision models to confirm the presence of structural damage, safety hazards, or dirty clinic corridors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
