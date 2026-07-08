"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, CheckCircle,
  ArrowLeft, MapPin, Mic,  ChevronDown,
  Loader2,
  Camera,
  X,
  Phone
} from "lucide-react";
import { citizenApi } from "@/lib/api";
import VoiceRecorder from "../components/voice-recorder";
import ImageUploader from "../components/image-uploader";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

type ComplaintCategory = string;

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

// Replaced mock classifyComplaint with real backend AI pipeline processing.

export default function ReportIssuePage() {
  const router = useRouter();

  // ── Data state ─────────────────────────────────────────────────────────
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [talukas, setTalukas] = useState<string[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(true);

  // ── Step state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — Location
  const [selectedTaluka, setSelectedTaluka] = useState("");
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);

  // Step 2 — Complaint details
  const [categories, setCategories] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [dateOfVisit, setDateOfVisit] = useState(new Date().toISOString().split("T")[0]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reporterName, setReporterName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [voiceSimulating, setVoiceSimulating] = useState(false);

  // Step 3 — Submitted
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | Blob | null>(null);
  const [activeTab, setActiveTab] = useState<"text" | "voice" | "image">("text");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').substring(0, 10);
    let formatted = digits;
    if (digits.length > 5) {
      formatted = `${digits.substring(0, 5)} ${digits.substring(5)}`;
    }
    setContactInfo(`+91 ${formatted}`);
  };

  // Protect against unsaved changes
  const isDirty = step < 3 && (description.trim().length > 0 || mediaFile !== null);
  useUnsavedChanges(isDirty, "You have an incomplete grievance report. Are you sure you want to leave?");

  useEffect(() => {
    async function loadHospitals() {
      try {
        setIsLoadingHospitals(true);
        const data = await citizenApi.searchHospitals({});
        setHospitals(data);
        const uniqueTalukas = Array.from(new Set(data.map((h: any) => h.taluka))).filter(Boolean) as string[];
        setTalukas(uniqueTalukas.sort());
      } catch (err) {
        console.error("Failed to load hospitals", err);
      } finally {
        setIsLoadingHospitals(false);
      }
    }
    loadHospitals();
  }, []);

  const hospitalsInTaluka = useMemo(() => hospitals.filter((h) => h.taluka === selectedTaluka), [hospitals, selectedTaluka]);
  const selectedHospital = useMemo(
    () => hospitals.find((h) => h.id === selectedHospitalId),
    [hospitals, selectedHospitalId]
  );

  // Voice simulation is removed in favor of real recording
  const handleAudioReady = (blob: Blob | null) => {
    setMediaFile(blob);
  };

  const handleImageReady = (file: File | null) => {
    setMediaFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedHospital || !description) return;
    setIsSubmitting(true);
    
    try {
      const payload = {
        hospital_id: selectedHospitalId!,
        category: categories.length > 0 ? categories.join(", ") : "Other",
        description,
        is_anonymous: isAnonymous,
        date_of_visit: dateOfVisit,
        contact_info: isAnonymous ? undefined : contactInfo,
      };
      
      const result = await citizenApi.submitComplaint(payload) as any;

      if (mediaFile && result.id) {
        await citizenApi.uploadMedia(result.id, mediaFile);
      }
      
      if (typeof window !== 'undefined') {
        const history = JSON.parse(localStorage.getItem('my_grievances') || '[]');
        history.unshift(result.reference_number);
        localStorage.setItem('my_grievances', JSON.stringify(Array.from(new Set(history)).slice(0, 10)));
      }

      setSubmittedReference(result.reference_number);
      setStep(3);
    } catch (err) {
      console.error("Submission failed", err);
      alert("Failed to submit complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 3 — Success ────────────────────────────────────────────────────
  if (step === 3 && submittedReference) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-16">
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mx-auto">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Complaint Registered!</h2>
          <p className="text-slate-600 text-sm">Your complaint has been submitted and is currently being auto-classified by our AI system in the background.</p>
          <div className="bg-white rounded-2xl p-5 text-left space-y-3 border border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reference Number</span>
              <span className="font-black text-slate-900 font-mono">{submittedReference}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hospital</span>
              <span className="text-sm font-bold text-slate-800">{selectedHospital?.name}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push(`/citizen/track?ref=${submittedReference}`)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
            Track Progress
          </button>
          <button onClick={() => { setStep(1); setSelectedTaluka(""); setSelectedHospitalId(null); setDescription(""); setCategories([]); setSubmittedReference(null); setMediaFile(null); }}
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
                <option value="">{isLoadingHospitals ? "Loading..." : "— Select Taluka —"}</option>
                {talukas.map((t) => <option key={t} value={t}>{t}</option>)}
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
            {selectedHospital ? `Continue — ${selectedHospital.name} →` : "Select a Hospital to Continue"}
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
                {CATEGORIES.map((cat) => {
                  const isSelected = categories.includes(cat);
                  return (
                    <button key={cat} type="button" 
                      onClick={() => {
                        if (isSelected) setCategories(categories.filter(c => c !== cat));
                        else setCategories([...categories, cat]);
                      }}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all border-2 ${
                        isSelected ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                      }`}>
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Modality Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">How would you like to report?</label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button type="button" onClick={() => setActiveTab("text")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "text" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>Text</button>
                <button type="button" onClick={() => setActiveTab("voice")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "voice" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>Voice</button>
                <button type="button" onClick={() => setActiveTab("image")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "image" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>Photo / Video</button>
              </div>
            </div>

            {/* Description (Text Mode) */}
            {activeTab === "text" && (
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe the issue clearly..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none placeholder:text-slate-400"
                />
              </div>
            )}

            {/* Voice Mode */}
            {activeTab === "voice" && (
              <div>
                <VoiceRecorder onAudioReady={handleAudioReady} />
                {/* Fallback description input if they also want to type */}
                <div className="mt-4">
                   <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">Additional Comments (Optional)</label>
                   <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Any other details..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Image Mode */}
            {activeTab === "image" && (
              <div>
                <ImageUploader onImageReady={handleImageReady} />
                <div className="mt-4">
                   <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">Photo Description *</label>
                   <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Describe what is in the photo..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Information panel */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-sm text-slate-600">
              <p>By submitting this form, your complaint will be automatically routed to the correct department by our AI triage system.</p>
              <p>You will receive a tracking reference number to follow updates.</p>
            </div>

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
                  <div className="flex items-center w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-slate-900 transition-all">
                    <span className="pl-4 pr-2 py-3 text-sm font-bold text-slate-500 bg-slate-100 border-r border-slate-200">+91</span>
                    <input
                      type="tel"
                      placeholder="98765 43210"
                      value={contactInfo.replace(/^\+?91\s*/, '')}
                      onChange={handlePhoneChange}
                      maxLength={11}
                      className="w-full bg-transparent py-3 px-3 text-sm font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <button onClick={handleSubmit} disabled={!description && !mediaFile || isSubmitting}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit Complaint →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
