"use client";

import React, { useState, useMemo } from "react";
import {
  Search, Building2, MapPin, Phone, Clock, Activity,
  Star, HeartPulse, X, ChevronDown, Beaker, Ambulance, Bed
} from "lucide-react";
import {
  PALGHAR_HOSPITALS,
  PALGHAR_TALUKAS,
  getHospitalsByTaluka,
  type PalgharHospital,
  PALGHAR_DISTRICT_INFO,
} from "@/data/palgharHospitals";

function getHealthScore(h: PalgharHospital): number {
  let score = 60;
  if (h.facility_type === "District General Hospital") score = 78;
  else if (h.facility_type === "Sub-District Hospital") score = 72;
  else if (h.facility_type === "Rural Hospital") score = 64;
  else score = 50 + (h.has_laboratory ? 5 : 0) + (h.has_ambulance ? 5 : 0);
  return Math.min(100, score);
}

function getScoreColor(score: number) {
  if (score >= 70) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 55) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-rose-600 bg-rose-50 border-rose-200";
}

function getTypeColor(type: string) {
  if (type.includes("District General")) return "bg-blue-100 text-blue-700";
  if (type.includes("Sub-District")) return "bg-indigo-100 text-indigo-700";
  if (type.includes("Rural")) return "bg-teal-100 text-teal-700";
  return "bg-slate-100 text-slate-600";
}

export default function HospitalSearchPage() {
  const [searchName, setSearchName] = useState("");
  const [filterTaluka, setFilterTaluka] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filter24x7, setFilter24x7] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<PalgharHospital | null>(null);

  const facilityTypes = Array.from(new Set(PALGHAR_HOSPITALS.map((h) => h.facility_type)));

  const filtered = useMemo(() => {
    return PALGHAR_HOSPITALS.filter((h) => {
      const matchName = h.name.toLowerCase().includes(searchName.toLowerCase()) ||
        h.short_name.toLowerCase().includes(searchName.toLowerCase());
      const matchTaluka = !filterTaluka || h.taluka === filterTaluka;
      const matchType = !filterType || h.facility_type === filterType;
      const match24x7 = !filter24x7 || h.services_24x7;
      return matchName && matchTaluka && matchType && match24x7;
    });
  }, [searchName, filterTaluka, filterType, filter24x7]);

  return (
    <div className="space-y-6 pb-16">

      {/* District banner */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold mb-3">
              <MapPin className="h-3 w-3 text-teal-400" /> Palghar District — Maharashtra
            </div>
            <h1 className="text-2xl font-black mb-1">Government Health Facilities</h1>
            <p className="text-slate-400 text-sm">Find hospitals, PHCs and rural health centres across all 8 talukas of Palghar district</p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Facilities", value: PALGHAR_DISTRICT_INFO.totalHospitals },
              { label: "Talukas", value: PALGHAR_DISTRICT_INFO.talukas },
              { label: "Total Beds", value: PALGHAR_DISTRICT_INFO.totalBeds },
              { label: "24×7", value: PALGHAR_DISTRICT_INFO.hospitals24x7 },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-2xl p-3 text-center min-w-[70px]">
                <div className="text-xl font-black">{s.value}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Search by hospital name (e.g. PHC Agashi, Rural Hospital Dahanu)…"
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400 font-medium"
          />
          {searchName && (
            <button onClick={() => setSearchName("")} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <select value={filterTaluka} onChange={(e) => setFilterTaluka(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900">
              <option value="">All Talukas</option>
              {PALGHAR_TALUKAS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900">
              <option value="">All Types</option>
              {facilityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          <button onClick={() => setFilter24x7(!filter24x7)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
              filter24x7 ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
            }`}>
            {filter24x7 ? "✓ " : ""}24×7 Emergency Only
          </button>
        </div>

        <p className="text-xs text-slate-400 font-medium">
          Showing {filtered.length} of {PALGHAR_HOSPITALS.length} facilities
        </p>
      </div>

      {/* Hospital list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((h) => {
          const score = getHealthScore(h);
          return (
            <button key={h.id} onClick={() => setSelectedHospital(h)}
              className="text-left bg-white border border-slate-200 hover:border-slate-400 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getTypeColor(h.facility_type)}`}>
                    {h.facility_type}
                  </span>
                  <h3 className="font-black text-slate-900 mt-2 text-sm group-hover:text-blue-700 transition-colors">{h.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <MapPin className="h-3 w-3" /> {h.taluka} Taluka
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-black shrink-0 ${getScoreColor(score)}`}>
                  <Activity className="h-3 w-3" /> {score}
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-3 line-clamp-1">{h.address}</p>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">
                  <Bed className="h-3 w-3" /> {h.total_beds} Beds
                </span>
                {h.icu_capacity > 0 && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                    <HeartPulse className="h-3 w-3" /> {h.icu_capacity} ICU
                  </span>
                )}
                {h.has_laboratory && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                    <Beaker className="h-3 w-3" /> Lab
                  </span>
                )}
                {h.has_ambulance && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                    <Ambulance className="h-3 w-3" /> Ambulance
                  </span>
                )}
                {h.services_24x7 && (
                  <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">24×7</span>
                )}
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-slate-400">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="font-bold">No hospitals found matching your filters</p>
          </div>
        )}
      </div>

      {/* Hospital detail modal */}
      {selectedHospital && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedHospital(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getTypeColor(selectedHospital.facility_type)}`}>
                  {selectedHospital.facility_type}
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-2">{selectedHospital.name}</h2>
                <p className="text-sm text-slate-500">{selectedHospital.registration_no}</p>
              </div>
              <button onClick={() => setSelectedHospital(null)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <p className="text-slate-700 font-medium">{selectedHospital.address}</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Phone className="h-4 w-4 text-slate-400" />
                <p className="font-bold text-slate-900">{selectedHospital.phone}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 font-medium">Total Beds</p>
                  <p className="font-black text-slate-900 text-lg">{selectedHospital.total_beds}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 font-medium">ICU Capacity</p>
                  <p className="font-black text-slate-900 text-lg">{selectedHospital.icu_capacity || "—"}</p>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 font-medium mb-2">Departments</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedHospital.departments.map((d) => (
                    <span key={d} className="text-[11px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">{d}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <a href={`tel:${selectedHospital.phone.replace(/[^0-9]/g, '')}`}
                className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm text-center">
                📞 Call Now
              </a>
              <button onClick={() => setSelectedHospital(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
