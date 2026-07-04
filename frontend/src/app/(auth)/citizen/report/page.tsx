"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, AlertTriangle, ClipboardCheck, Sparkles, CheckCircle,
  ArrowLeft, MapPin, Mic, Camera, ChevronDown, Phone, X, Loader2
} from "lucide-react";
import {
  PALGHAR_HOSPITALS,
  PALGHAR_TALUKAS,
  getHospitalsByTaluka,
  type PalgharHospital,
} from "@/data/palgharHospitals";
import { useAppData, type ComplaintCategory, type IssueSeverity } from "@/context/AppDataContext";

const CATEGORIES: ComplaintCategory[] = [
  "Medicine Not Available",
  "Doctor Unavailable",
  "Long Waiting Time",
  "Equipment Not Working",
  "Cleanliness Issues",
  "Staff Behaviour",
  "Infrastructure Damage",
  "Emergency Services",
  "Other",
];

function classifyComplaint(text: string, category: string) {
  const t = (text + " " + category).toLowerCase();
  let severity: IssueSeverity = "Medium";
  let department = "District Health Office";
  let aiCategory = category || "General Grievance";
  let confidence = 85 + Math.floor(Math.random() * 12);

  if (t.includes("medicine") || t.includes("drug") || t.includes("tablet") || t.includes("ors") || t.includes("stockout")) {
    severity = "Critical"; department = "District Medical Store"; aiCategory = "Medicine Stockout";
  } else if (t.includes("icu") || t.includes("oxygen") || t.includes("ventilator") || t.includes("emergency") || t.includes("dying") || t.includes("accident")) {
    severity = "Critical"; department = "Emergency Logistics"; aiCategory = "Emergency Services";
  } else if (t.includes("doctor") || t.includes("absent") || t.includes("unavailable") || t.includes("nurse")) {
    severity = "High"; department = "Medical Superintendent Office"; aiCategory = "Staff Unavailability";
  } else if (t.includes("equipment") || t.includes("machine") || t.includes("xray") || t.includes("x-ray") || t.includes("mri")) {
    severity = "High"; department = "Biomedical Engineering Team"; aiCategory = "Equipment Failure";
  } else if (t.includes("leak") || t.includes("water") || t.includes("broken") || t.includes("damage") || t.includes("infrastructure")) {
    severity = "High"; department = "Public Works Department (PWD)"; aiCategory = "Infrastructure Damage";
  } else if (t.includes("clean") || t.includes("garbage") || t.includes("dirt") || t.includes("toilet") || t.includes("smell")) {
    severity = "Low"; department = "Hospital Sanitation Committee"; aiCategory = "Cleanliness Issue";
  } else if (t.includes("wait") || t.includes("queue") || t.includes("long")) {
    severity = "Medium"; department = "Hospital Administration"; aiCategory = "Long Waiting Time";
  }

  const priority = severity === "Critical" ? "Immediate Attention" : severity === "High" ? "High Priority" : "Routine";
  return { severity, department, aiCategory, confidence, priority: priority as "Immediate Attention" | "High Priority" | "Routine" };
}

export default function ReportIssuePage() {
  const router = useRouter();
  const { addComplaint } = useAppData();

  // ── Step state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — Location
  const [selectedTaluka, setSelectedTaluka] = useState("");
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);

  // Step 2 — Complaint details
  const [category, setCategory] = useState<ComplaintCategory>("Other");
  const [description, setDescription] = useState("");
  const [dateOfVisit, setDateOfVisit] = useState(new Date().toISOString().split("T")[0]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reporterName, setReporterName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [voiceSimulating, setVoiceSimulating] = useState(false);

  // Step 3 — Submitted
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hospitalsInTaluka = useMemo(() => getHospitalsByTaluka(selectedTaluka), [selectedTaluka]);
  const selectedHospital: PalgharHospital | undefined = useMemo(
    () => PALGHAR_HOSPITALS.find((h) => h.id === selectedHospitalId),
    [selectedHospitalId]
  );

  const aiResult = useMemo(() => {
    if (!description && !category) return null;
    return classifyComplaint(description, category);
  }, [description, category]);

  // Voice simulation
  const simulateVoice = () => {
    setVoiceSimulating(true);
    setTimeout(() => {
      const samples = [
        "PHC mein doctor kal se aa hi nahi rahe. Mera baccha beemar hai aur koi dekhne wala nahi hai.",
        "Medicines counter par kuch bhi nahi hai. Paracetamol bhi khatam ho gaya 3 din se.",
        "OPD mein 3 ghante se wait kar raha hoon. Koi system nahi hai — pahle aao pahle pao nahi chal raha.",
        "X-ray machine kharab hai 1 week se. Private hospital bhej rahe hain.",
      ];
      const sample = samples[Math.floor(Math.random() * samples.length)];
      setDescription((prev) => (prev ? prev + " " + sample : sample));
      setVoiceSimulating(false);
    }, 2000);
  };

  const handleSubmit = async () => {
    if (!selectedHospital || !description) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    const ai = classifyComplaint(description, category);
    const result = addComplaint({
      hospital_id: selectedHospital.id,
      hospital_name: selectedHospital.name,
      hospital_short_name: selectedHospital.short_name,
      taluka: selectedHospital.taluka,
      district: "Palghar",
      hospital_address: selectedHospital.address,
      hospital_phone: selectedHospital.phone,
      category,
      description,
      severity: ai.severity,
      priority: ai.priority,
      date_of_visit: dateOfVisit,
      is_anonymous: isAnonymous,
      reporter_name: isAnonymous ? undefined : reporterName,
      contact_info: isAnonymous ? undefined : contactInfo,
      status: "Submitted",
      ai_classification: ai.aiCategory,
      ai_confidence: ai.confidence,
      assigned_department: ai.department,
    });

    setSubmittedId(result.id);
    setIsSubmitting(false);
    setStep(3);
  };

  // ── Step 3 — Success ────────────────────────────────────────────────────
  if (step === 3 && submittedId) {
    const ai = classifyComplaint(description, category);
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-16">
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mx-auto">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Complaint Registered!</h2>
          <p className="text-slate-600 text-sm">Your complaint has been submitted and auto-classified by our AI system.</p>
          <div className="bg-white rounded-2xl p-5 text-left space-y-3 border border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Complaint ID</span>
              <span className="font-black text-slate-900 font-mono">{submittedId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hospital</span>
              <span className="text-sm font-bold text-slate-800">{selectedHospital?.short_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Classification</span>
              <span className="text-sm font-bold text-blue-700">{ai.aiCategory}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Severity</span>
              <span className={`text-xs font-black px-3 py-1 rounded-full ${
                ai.severity === "Critical" ? "bg-red-100 text-red-700" :
                ai.severity === "High" ? "bg-orange-100 text-orange-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>{ai.severity}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Routed To</span>
              <span className="text-xs font-bold text-slate-700">{ai.department}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push("/citizen")} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
            View My Complaints
          </button>
          <button onClick={() => { setStep(1); setSelectedTaluka(""); setSelectedHospitalId(null); setDescription(""); setCategory("Other"); setSubmittedId(null); }}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors">
            File Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => step > 1 ? setStep((step - 1) as 1 | 2 | 3) : router.push("/citizen")}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Report Healthcare Issue</h1>
          <p className="text-sm text-slate-500">Palghar District · Government Health Facility</p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {[1, 2].map((s) => (
          <React.Fragment key={s}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-black transition-all ${
              step >= s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
            }`}>{s}</div>
            {s < 2 && <div className={`flex-1 h-0.5 rounded-full transition-all ${step > s ? "bg-slate-900" : "bg-slate-200"}`} />}
          </React.Fragment>
        ))}
        <span className="text-xs font-bold text-slate-500 ml-2">
          {step === 1 ? "Select Hospital" : "Complaint Details"}
        </span>
      </div>

      {/* ── STEP 1: Hospital selection ─────────────────────────────────── */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm">
          <h2 className="font-black text-slate-900">Which hospital did you visit?</h2>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">District</label>
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-900">Palghar District, Maharashtra</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Select Taluka</label>
            <div className="relative">
              <select value={selectedTaluka} onChange={(e) => { setSelectedTaluka(e.target.value); setSelectedHospitalId(null); }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900">
                <option value="">— Select Taluka —</option>
                {PALGHAR_TALUKAS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {selectedTaluka && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Select Hospital ({hospitalsInTaluka.length} facilities)
              </label>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {hospitalsInTaluka.map((h) => (
                  <button key={h.id} type="button"
                    onClick={() => setSelectedHospitalId(h.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                      selectedHospitalId === h.id
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-100 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">{h.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{h.facility_type} · {h.taluka}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{h.address.split(",").slice(-2).join(",").trim()}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {h.services_24x7 && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">24×7</span>}
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{h.total_beds} beds</span>
                      </div>
                    </div>
                    {selectedHospitalId === h.id && (
                      <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-600">
                        <Phone className="h-3 w-3" /> {h.phone}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            disabled={!selectedHospitalId}
            onClick={() => setStep(2)}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {selectedHospital ? `Continue — ${selectedHospital.short_name} →` : "Select a Hospital to Continue"}
          </button>
        </div>
      )}

      {/* ── STEP 2: Complaint details ───────────────────────────────────── */}
      {step === 2 && selectedHospital && (
        <div className="space-y-4">
          {/* Hospital context banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-black text-slate-900">{selectedHospital.name}</p>
              <p className="text-xs text-slate-500">{selectedHospital.taluka} · Palghar District · {selectedHospital.registration_no}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Issue Category *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat} type="button" onClick={() => setCategory(cat)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all border-2 ${
                      category === cat ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description *</label>
                <button type="button" onClick={simulateVoice} disabled={voiceSimulating}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    voiceSimulating ? "bg-red-100 text-red-600 animate-pulse" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}>
                  {voiceSimulating ? <><Loader2 className="h-3 w-3 animate-spin" /> Recording…</> : <><Mic className="h-3 w-3" /> Voice Input</>}
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe the issue clearly. You can also use the voice input button above to record your complaint in Hindi or English..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none placeholder:text-slate-400"
              />
            </div>

            {/* AI Analysis live panel */}
            {aiResult && description.length > 15 && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">AI Analysis — Live</span>
                  <span className="ml-auto text-xs font-bold text-indigo-500">{aiResult.confidence}% confidence</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><p className="text-slate-500 font-medium">Classification</p><p className="font-black text-slate-900">{aiResult.aiCategory}</p></div>
                  <div><p className="text-slate-500 font-medium">Severity</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full font-black text-[11px] ${
                      aiResult.severity === "Critical" ? "bg-red-100 text-red-700" :
                      aiResult.severity === "High" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"
                    }`}>{aiResult.severity}</span>
                  </div>
                  <div><p className="text-slate-500 font-medium">Routed To</p><p className="font-bold text-slate-800">{aiResult.department}</p></div>
                  <div><p className="text-slate-500 font-medium">Priority</p><p className="font-bold text-slate-800">{aiResult.priority}</p></div>
                </div>
              </div>
            )}

            {/* Date of visit */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Date of Visit</label>
              <input type="date" value={dateOfVisit} max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDateOfVisit(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold" />
            </div>

            {/* Anonymous toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <p className="text-sm font-bold text-slate-900">Submit Anonymously</p>
                <p className="text-xs text-slate-500">Your name won't be shared with the hospital</p>
              </div>
              <button type="button" onClick={() => setIsAnonymous(!isAnonymous)}
                className={`relative w-11 h-6 rounded-full transition-colors ${isAnonymous ? "bg-slate-900" : "bg-slate-300"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAnonymous ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {!isAnonymous && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Your Name</label>
                  <input type="text" value={reporterName} onChange={(e) => setReporterName(e.target.value)} placeholder="Full name"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Mobile Number</label>
                  <input type="tel" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} placeholder="10-digit mobile"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
              </div>
            )}

            <button onClick={handleSubmit} disabled={!description || isSubmitting}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit Complaint →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
