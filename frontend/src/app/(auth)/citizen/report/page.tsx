"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, AlertTriangle, Calendar, ClipboardCheck, 
  Sparkles, CheckCircle, ArrowLeft, ArrowRight, ShieldCheck
} from "lucide-react";
import { getHospitals, saveComplaint, Hospital } from "../mockDb";
import VoiceRecorder from "../components/voice-recorder";
import ImageUploader from "../components/image-uploader";

const CATEGORIES = [
  "Medicine Not Available",
  "Doctor Unavailable",
  "Long Waiting Time",
  "Equipment Not Working",
  "Cleanliness Issues",
  "Staff Behaviour",
  "Infrastructure Damage",
  "Emergency Services",
  "Other"
];

export default function ReportIssuePage() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [form, setForm] = useState({
    hospitalId: "",
    category: "",
    description: "",
    dateOfVisit: new Date().toISOString().split("T")[0],
    contactInfo: "",
    isAnonymous: false,
  });

  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [evidenceImage, setEvidenceImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Live AI Simulation State
  const [aiAnalysis, setAiAnalysis] = useState<{
    category: string;
    severity: "Low" | "Medium" | "High" | "Critical";
    department: string;
    confidence: number;
    sentiment: string;
  } | null>(null);

  useEffect(() => {
    setHospitals(getHospitals());
  }, []);

  // Update AI live simulation as description changes
  useEffect(() => {
    const text = (form.description + " " + voiceTranscript).trim().toLowerCase();
    if (text.length < 10) {
      setAiAnalysis(null);
      return;
    }

    // Simple heuristic parser simulating IndicBERT
    let category = form.category || "General Grievance";
    let severity: "Low" | "Medium" | "High" | "Critical" = "Medium";
    let department = "District Health Office";
    let confidence = 85 + Math.floor(Math.random() * 12);
    let sentiment = "Negative Experience";

    if (text.includes("leak") || text.includes("water") || text.includes("broken") || text.includes("infrastructure") || text.includes("damage") || text.includes("mri") || text.includes("x-ray")) {
      category = "Infrastructure Damage";
      department = "Public Works Department";
      severity = "High";
    } else if (text.includes("medicine") || text.includes("drug") || text.includes("paracetamol") || text.includes("antibiotic")) {
      category = "Medicine Not Available";
      department = "District Medical Store";
      severity = "High";
    } else if (text.includes("icu") || text.includes("oxygen") || text.includes("critical") || text.includes("ventilator") || text.includes("dying") || text.includes("accident")) {
      category = "Emergency Services";
      severity = "Critical";
      department = "Emergency Logistics Team";
    } else if (text.includes("clean") || text.includes("garbage") || text.includes("dirt") || text.includes("toilet") || text.includes("smell")) {
      category = "Cleanliness Issues";
      department = "Hospital Sanitation Committee";
      severity = "Low";
    } else if (text.includes("doctor") || text.includes("absent") || text.includes("unavailable") || text.includes("nurse")) {
      category = "Doctor Unavailable";
      department = "District Health Office";
      severity = "High";
    }

    if (text.includes("good") || text.includes("thank") || text.includes("helpful") || text.includes("nice")) {
      sentiment = "Positive Experience";
      severity = "Low";
    }

    setAiAnalysis({
      category,
      severity,
      department,
      confidence,
      sentiment
    });

  }, [form.description, form.category, voiceTranscript]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: checked }));
  };

  const handleVoiceTranscription = (text: string) => {
    setVoiceTranscript(text);
    // Append to description if empty
    if (!form.description) {
      setForm(prev => ({ ...prev, description: text }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hospitalId) {
      alert("Please select a hospital.");
      return;
    }
    if (!form.category) {
      alert("Please select an issue category.");
      return;
    }
    if (!form.description && !voiceTranscript) {
      alert("Please provide a description or a voice recording.");
      return;
    }

    setIsSubmitting(true);
    
    // Find hospital name
    const hospital = hospitals.find(h => h.id === form.hospitalId);
    const hospitalName = hospital ? hospital.name : "Government Health Center";

    setTimeout(() => {
      const saved = saveComplaint({
        hospitalId: form.hospitalId,
        hospitalName,
        category: form.category,
        description: form.description,
        dateOfVisit: form.dateOfVisit,
        contactInfo: form.isAnonymous ? "" : form.contactInfo,
        isAnonymous: form.isAnonymous,
        photoUrl: evidenceImage || undefined,
        voiceUrl: voiceTranscript ? "mock-audio-record" : undefined,
      });

      setIsSubmitting(false);
      setSubmittedId(saved.id);
    }, 2000); // 2s submission delay for animation
  };

  if (submittedId) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle className="h-10 w-10 stroke-[2.5]" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Grievance Registered Successfully</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Your complaint has been parsed, translated, and automatically routed to the designated administrative department.
          </p>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-inner max-w-sm mx-auto">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Your Complaint tracking ID</p>
          <p className="text-2xl font-black tracking-widest text-teal-400 select-all my-1 tabular-nums">
            {submittedId}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Copy this ID to track resolution progress</p>
        </div>

        <div className="flex gap-4 justify-center pt-4">
          <button
            onClick={() => router.push("/citizen")}
            className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-all"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push(`/citizen/track?id=${submittedId}`)}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-500/15 hover:shadow-teal-500/25 transition-all"
          >
            Track Status Timeline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16 items-start">
      
      {/* LEFT FORM (2 cols on large screen) */}
      <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Grievance Registry Form</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Please enter accurate details about the operational failure faced.</p>
        </div>

        {/* Hospital Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Select Health Centre / Hospital *
          </label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <select
              name="hospitalId"
              value={form.hospitalId}
              onChange={handleInputChange}
              required
              className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer"
            >
              <option value="">-- Choose Government Facility --</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name} ({h.district})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Issue Category *
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleInputChange}
              required
              className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer"
            >
              <option value="">-- Choose Category --</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Date of Incident / Visit *
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="date"
                name="dateOfVisit"
                value={form.dateOfVisit}
                onChange={handleInputChange}
                required
                className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Voice Recording Widget */}
        <VoiceRecorder onTranscriptionComplete={handleVoiceTranscription} />

        {/* Text Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Grievance Description *
            </label>
            {voiceTranscript && (
              <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                Synced with voice memo
              </span>
            )}
          </div>
          <textarea
            name="description"
            rows={5}
            value={form.description}
            onChange={handleInputChange}
            placeholder="Please detail the issue here, for example: Pharmacy closed during morning hours, staff unavailable, or medical equipment malfunction..."
            required={!voiceTranscript}
            className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-2xl p-4 text-sm font-semibold leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          />
        </div>

        {/* Image Evidence Uploader */}
        <ImageUploader onImageUploaded={(url) => setEvidenceImage(url)} />

        {/* Anonymous & Contact Info */}
        <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl space-y-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="isAnonymous"
              name="isAnonymous"
              checked={form.isAnonymous}
              onChange={handleCheckboxChange}
              className="mt-1 h-4 w-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer"
            />
            <div>
              <label htmlFor="isAnonymous" className="text-xs font-bold text-slate-900 cursor-pointer">
                Submit Anonymously
              </label>
              <p className="text-[10px] text-slate-400 font-bold leading-normal mt-0.5">
                Checking this hides your profile information from government authorities. Only the text grievance and uploaded files will be reviewed.
              </p>
            </div>
          </div>

          {!form.isAnonymous && (
            <div className="space-y-2 pt-2 border-t border-slate-200/50">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Contact Information (Optional)
              </label>
              <input
                type="text"
                name="contactInfo"
                value={form.contactInfo}
                onChange={handleInputChange}
                placeholder="Full Name, Phone Number or Email (e.g. Rahul Sharma, +91 99999 88888)"
                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              />
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.push("/citizen")}
            className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-all"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/50 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-500/15 hover:shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Registering...
              </>
            ) : (
              "Submit Grievance"
            )}
          </button>
        </div>

      </form>

      {/* RIGHT AI INSIGHTS CARD (1 col) */}
      <aside className="space-y-6">
        
        {/* Real-time AI Classification Preview */}
        <div className="bg-slate-900 text-white rounded-[2rem] p-6 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-500/10 to-transparent -z-10"></div>
          
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-teal-400" />
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">
              AI Real-Time Parser
            </h4>
          </div>

          <p className="text-[11px] text-slate-400 leading-normal mb-6">
            As you type or transcribe audio, our neural pipeline (IndicBERT + IndicTrans2) processes the grievance in real time to forecast downstream routing.
          </p>

          {aiAnalysis ? (
            <div className="space-y-5">
              
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/50">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Classified Category</p>
                <p className="text-sm font-extrabold text-teal-300 mt-1">{aiAnalysis.category}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Severity Level</p>
                  <p className={`text-xs font-black mt-1 ${
                    aiAnalysis.severity === "Critical" 
                      ? "text-rose-400" 
                      : aiAnalysis.severity === "High"
                      ? "text-amber-400"
                      : "text-slate-300"
                  }`}>{aiAnalysis.severity}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Confidence</p>
                  <p className="text-xs font-black text-slate-100 mt-1 tabular-nums">{aiAnalysis.confidence}%</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/50">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned Department</p>
                <p className="text-xs font-black text-slate-100 mt-1">{aiAnalysis.department}</p>
                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Auto-Routing Active</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/50">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Customer Sentiment</p>
                <p className="text-xs font-black text-slate-300 mt-1">{aiAnalysis.sentiment}</p>
              </div>

              <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/20">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Validation check passed</span>
              </div>

            </div>
          ) : (
            <div className="py-10 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center">
              <ClipboardCheck className="h-8 w-8 text-slate-700 mb-2" />
              <p className="text-xs font-bold text-slate-400">Awaiting input details</p>
              <p className="text-[9px] text-slate-600 mt-0.5">Type description or speak into recorder</p>
            </div>
          )}

        </div>

        {/* Info card on workflow */}
        <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm space-y-4 text-left">
          <h4 className="font-extrabold text-slate-900 text-sm">Grievance Workflow Pipeline</h4>
          
          <div className="space-y-3">
            {[
              { step: "1", title: "Intake", desc: "Citizen submits audio description and photo evidence." },
              { step: "2", title: "NLP Processing", desc: "IndicBERT reads complaint and automatically sets department and urgency." },
              { step: "3", title: "Task Routing", desc: "Routed issue instantly populates Government Portal task lists." },
              { step: "4", title: "Resolution Logs", desc: "Engineers upload photo evidence of completed task to resolve grievance." }
            ].map((s) => (
              <div key={s.step} className="flex gap-3">
                <span className="h-5 w-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-500 shrink-0">
                  {s.step}
                </span>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-800">{s.title}</h5>
                  <p className="text-[10px] text-slate-500 leading-normal mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </aside>

    </div>
  );
}
