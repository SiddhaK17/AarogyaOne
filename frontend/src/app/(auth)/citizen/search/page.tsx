"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, Building2, MapPin, Phone, Clock, 
  Activity, Star, Compass, HeartPulse, X, ShieldCheck
} from "lucide-react";
import { getHospitals, Hospital } from "../mockDb";

export default function HospitalSearchPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchName, setSearchName] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterTaluka, setFilterTaluka] = useState("");
  const [filterPinCode, setFilterPinCode] = useState("");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  useEffect(() => {
    setHospitals(getHospitals());
  }, []);

  const districts = Array.from(new Set(hospitals.map(h => h.district)));
  const talukas = Array.from(new Set(hospitals.filter(h => !filterDistrict || h.district === filterDistrict).map(h => h.taluka)));

  const filteredHospitals = hospitals.filter(h => {
    const matchesName = h.name.toLowerCase().includes(searchName.toLowerCase());
    const matchesDistrict = !filterDistrict || h.district === filterDistrict;
    const matchesTaluka = !filterTaluka || h.taluka === filterTaluka;
    const matchesPin = !filterPinCode || h.pinCode.includes(filterPinCode);
    return matchesName && matchesDistrict && matchesTaluka && matchesPin;
  });

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 bg-emerald-50 border-emerald-100";
    if (score >= 60) return "text-amber-500 bg-amber-50 border-amber-100";
    return "text-rose-500 bg-rose-50 border-rose-100";
  };

  const getStatusBadge = (color: Hospital["statusColor"]) => {
    switch (color) {
      case "Healthy":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Warning":
        return "bg-amber-50 text-amber-700 border-amber-100 animate-pulse";
      case "High Risk":
        return "bg-orange-50 text-orange-700 border-orange-100";
      case "Critical":
        return "bg-rose-50 text-rose-700 border-rose-100 ring-2 ring-rose-500/10";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* 1. FILTER CONTROLS HEADER */}
      <section className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-black text-slate-900 tracking-tight text-base">Facility Search Registry</h3>
        <p className="text-xs text-slate-500 font-semibold leading-normal">
          Filter and discover local government hospitals, primary clinics, and community health centers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Name search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by facility name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            />
          </div>

          {/* District select */}
          <select
            value={filterDistrict}
            onChange={(e) => {
              setFilterDistrict(e.target.value);
              setFilterTaluka(""); // reset taluka
            }}
            className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer"
          >
            <option value="">-- All Districts --</option>
            {districts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Taluka select */}
          <select
            value={filterTaluka}
            onChange={(e) => setFilterTaluka(e.target.value)}
            disabled={!filterDistrict}
            className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            <option value="">-- All Talukas --</option>
            {talukas.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* PIN code input */}
          <input
            type="text"
            placeholder="Filter by PIN Code..."
            value={filterPinCode}
            onChange={(e) => setFilterPinCode(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          />
        </div>
      </section>

      {/* 2. SEARCH RESULTS GRID */}
      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Showing {filteredHospitals.length} government health facilities</span>
        </div>

        {filteredHospitals.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
            <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-base text-slate-700">No health facilities found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your spelling or selecting a different district/taluka filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredHospitals.map((hosp) => (
              <div 
                key={hosp.id} 
                className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between gap-6 group"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <span className="text-[9px] font-black text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {hosp.type}
                      </span>
                      <h4 className="font-extrabold text-base text-slate-900 mt-1.5 leading-snug group-hover:text-teal-600 transition-colors">
                        {hosp.name}
                      </h4>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${getStatusBadge(hosp.statusColor)}`}>
                      {hosp.statusColor}
                    </span>
                  </div>

                  <div className="space-y-2 mt-4 text-xs font-medium text-slate-500">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{hosp.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{hosp.contactNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>Average Waiting Time: <strong className="text-slate-700">{hosp.averageWaitingTime}</strong></span>
                    </div>
                  </div>

                  {/* Bed Capacity Progress bar */}
                  <div className="mt-5 space-y-2 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-600">Bed Availability</span>
                      <span className="text-slate-900">{hosp.availableBeds} / {hosp.totalBeds} available</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          hosp.availableBeds / hosp.totalBeds < 0.1 
                            ? "bg-rose-500" 
                            : hosp.availableBeds / hosp.totalBeds < 0.25 
                            ? "bg-amber-500" 
                            : "bg-teal-500"
                        }`}
                        style={{ width: `${(hosp.availableBeds / hosp.totalBeds) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                      <span>Doctor Staffing: {hosp.doctorAttendance}</span>
                      {hosp.icuCapacity > 0 && (
                        <span className="text-teal-600">ICU: {hosp.availableIcuBeds} / {hosp.icuCapacity} Free</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold">AI Health Score</span>
                    <span className={`text-xs font-black px-2 py-0.5 rounded border tabular-nums ${getHealthScoreColor(hosp.aiHealthScore)}`}>
                      {hosp.aiHealthScore}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setSelectedHospital(hosp)}
                    className="px-4 py-2 bg-slate-900 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    View Services & Departments
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. DETAIL POPUP DIALOG MODAL */}
      {selectedHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedHospital(null)}></div>
          
          <div className="bg-white border border-slate-200 rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-6 max-h-[90vh]">
            <button
              onClick={() => setSelectedHospital(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[9px] font-black text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider w-max block">
                {selectedHospital.type} Profile
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 pr-10">{selectedHospital.name}</h3>
              <p className="text-xs text-slate-500 font-bold flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> PIN: {selectedHospital.pinCode} | Taluka: {selectedHospital.taluka} | District: {selectedHospital.district}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 overflow-y-auto pr-1">
              
              {/* Left Details column */}
              <div className="space-y-4">
                <div className="space-y-1.5 text-xs text-slate-600 font-semibold">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Facility Address</p>
                  <p className="leading-relaxed text-slate-800">{selectedHospital.address}</p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 font-semibold">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contact Number</p>
                  <p className="text-slate-800 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-slate-400" /> {selectedHospital.contactNumber}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Operational Health Score</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-slate-900 tabular-nums">{selectedHospital.aiHealthScore} / 100</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedHospital.aiHealthScore >= 80 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {selectedHospital.aiHealthScore >= 80 ? "Operational Health: Excellent" : "Operational Health: Under Review"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                    The health score is dynamically calculated by AI based on medicine availability, bed occupancy, doctor attendance, and citizen feedback.
                  </p>
                </div>
              </div>

              {/* Right Services / Departments column */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Departments</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedHospital.departments.map((dept, i) => (
                      <span key={i} className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/50 flex items-center gap-1">
                        <HeartPulse className="h-3 w-3 text-teal-600 shrink-0" /> {dept}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Special Emergency Services</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedHospital.emergencyServices.map((service, i) => (
                      <span key={i} className="text-xs font-bold bg-teal-50 text-teal-700 px-2.5 py-1 rounded-lg border border-teal-100 flex items-center gap-1">
                        <Compass className="h-3 w-3 text-teal-600 shrink-0" /> {service}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedHospital(null)}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Close Profile
              </button>
              <a
                href={`/citizen/report?hospitalId=${selectedHospital.id}`}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-rose-500/10 transition-colors flex items-center gap-1"
              >
                Report Facility Grievance
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
