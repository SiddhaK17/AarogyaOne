"use client";

import React, { useState, useEffect } from "react";
import { 
  MapPin, Compass, Navigation, Phone, Activity, 
  Sparkles, CheckCircle2, ChevronRight, HelpCircle, Building2
} from "lucide-react";
import { citizenApi } from "@/lib/api";

interface NearbyHospital {
  id: number;
  name: string;
  facility_type: string;
  district: string;
  taluka: string;
  address: string;
  phone: string;
  distance_km: number;
  directions?: string[];
  statusColor?: string;
  available_beds?: number;
  total_beds?: number;
  latitude?: number;
  longitude?: number;
}

export default function NearbyHealthcarePage() {
  const [radius, setRadius] = useState("10"); // km
  const [nearbyList, setNearbyList] = useState<NearbyHospital[]>([]);
  const [selectedHosp, setSelectedHosp] = useState<NearbyHospital | null>(null);
  const [loading, setLoading] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);

  const searchNearby = async () => {
    setLoading(true);
    setGpsActive(true);

    try {
      // Hardcoded center of Palghar District for demonstration
      const centerLat = 19.696;
      const centerLng = 72.769;

      const data = await citizenApi.findNearby(centerLat, centerLng, parseFloat(radius)) as any[];
      
      const mapped: NearbyHospital[] = data.map(h => ({
        id: h.id,
        name: h.name,
        facility_type: h.facility_type,
        district: h.district,
        taluka: h.taluka,
        address: h.address,
        phone: h.phone || "+91 9999999999",
        distance_km: h.distance_km,
        directions: ["Head towards " + h.taluka, "Follow signs for " + h.name, "Arrive at destination"]
      }));

      mapped.sort((a, b) => a.distance_km - b.distance_km);
      setNearbyList(mapped);
      
      if (mapped.length > 0) {
        setSelectedHosp(mapped[0]);
      } else {
        setSelectedHosp(null);
      }
    } catch (err) {
      console.error("Failed to fetch nearby hospitals", err);
      setNearbyList([]);
      setSelectedHosp(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchNearby();
  }, [radius]);

  const getStatusColorClass = (color?: string) => {
    switch (color) {
      case "Healthy":
        return "bg-emerald-500 border-emerald-600";
      case "Warning":
        return "bg-amber-500 border-amber-600";
      case "High Risk":
        return "bg-orange-500 border-orange-600";
      case "Critical":
        return "bg-rose-500 border-rose-600";
      default:
        return "bg-slate-400 border-slate-500";
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* RADIUS FILTERS BAR */}
      <section className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-slate-900 tracking-tight text-base">Nearby Healthcare Centres</h3>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Use GPS simulation to locate facilities within a specified radius.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Search Radius:</label>
          <select
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className="bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="5">5 Kilometers</option>
            <option value="10">10 Kilometers</option>
            <option value="15">15 Kilometers</option>
            <option value="25">25 Kilometers</option>
          </select>
          
          <button
            onClick={searchNearby}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-teal-500/10 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Compass className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh GPS
          </button>
        </div>
      </section>

      {/* SPLIT SCREEN MAP LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch min-h-[550px]">
        
        {/* LEFT PANEL: HOSPITAL LISTING (2/5 size) */}
        <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-1">
          
          {loading ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 shadow-sm flex-1 flex flex-col justify-center items-center">
              <div className="h-8 w-8 rounded-full border-4 border-teal-500 border-t-transparent animate-spin mb-3"></div>
              <p className="text-xs font-bold text-slate-700">Triangulating Geolocation...</p>
              <p className="text-[10px] text-slate-400 mt-1">Retrieving lat/long from mock telecom cell towers</p>
            </div>
          ) : nearbyList.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 shadow-sm flex-1 flex flex-col justify-center items-center">
              <HelpCircle className="h-10 w-10 text-slate-300 mb-3" />
              <p className="font-bold text-sm text-slate-700">No clinics in this radius</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                No registered public hospitals found within {radius} km. Try increasing the search radius option.
              </p>
            </div>
          ) : (
            nearbyList.map((hosp) => {
              const isActive = selectedHosp?.id === hosp.id;
              return (
                <div
                  key={hosp.id}
                  onClick={() => setSelectedHosp(hosp)}
                  className={`bg-white border rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all text-left flex flex-col gap-3 relative ${
                    isActive 
                      ? "border-teal-500 ring-2 ring-teal-500/10 shadow-sm" 
                      : "border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{hosp.facility_type}</span>
                        <span className="text-[9px] text-slate-300">•</span>
                        <p className="font-bold text-slate-800 text-sm mt-1">{hosp.distance_km.toFixed(1)} km away</p>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 mt-1">
                        {hosp.name}
                      </h4>
                    </div>
                    <span className={`w-3 h-3 rounded-full border shrink-0 ${getStatusColorClass(hosp.statusColor)}`}></span>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-500 space-y-1">
                    <p className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {hosp.phone}</p>
                    <p className="flex items-center gap-1">
                      <Activity className="h-3.5 w-3.5" /> 
                      <span>Beds Free: <strong className="text-slate-700">{hosp.available_beds} / {hosp.total_beds}</strong></span>
                    </p>
                  </div>

                  {isActive && (
                    <div className="border-t border-slate-100 pt-3 mt-1 space-y-2 animate-in slide-in-from-top-1 duration-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Directions Map Route</p>
                      <ol className="space-y-1.5 pl-4 list-decimal text-[10px] text-slate-600 font-semibold leading-relaxed">
                        {hosp.directions?.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                      
                      <div className="flex justify-end gap-2 pt-2">
                        <a 
                          href={`/citizen/report?hospitalId=${hosp.id}`}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 text-[10px] font-bold rounded-lg transition-colors"
                        >
                          Report Issue
                        </a>
                        <button
                          onClick={() => alert(`Simulating navigation call to external map services for GPS location ${hosp.latitude}, ${hosp.longitude}`)}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Navigation className="h-3 w-3" /> Navigation GPS
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT PANEL: INTERACTIVE SVG MAP VIEW (3/5 size) */}
        <div className="lg:col-span-3 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between relative p-6 text-white min-h-[500px]">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial-gradient from-teal-500/10 to-transparent pointer-events-none -z-10"></div>
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 z-10">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-teal-400" />
              <div>
                <h4 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider">Geographic Map Canvas</h4>
                <p className="text-xs text-slate-500 font-semibold">Geospatial Mapping Engine (Leaflet Overlay)</p>
              </div>
            </div>
            {gpsActive && (
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> GPS Linked
              </span>
            )}
          </div>

          {/* SVG map draw */}
          <div className="flex-1 flex items-center justify-center relative py-6 my-4 select-none">
            {/* SVG drawing content */}
            <svg className="w-full h-full max-h-[350px] min-h-[300px]" viewBox="0 0 600 500">
              <g transform="translate(300, 250)">
                <circle r="60" className="fill-none stroke-blue-500/10 stroke-2 animate-ping" style={{ animationDuration: "3s" }} />
                <circle r="8" className="fill-blue-500/20" />
                <circle r="4" className="fill-blue-500" />
              </g>

              {gpsActive && nearbyList.map((hosp) => {
                const isSelected = selectedHosp?.id === hosp.id;
                let nodeColor = "#10B981";
                if (hosp.statusColor === "Warning") nodeColor = "#F59E0B";
                if (hosp.statusColor === "High Risk") nodeColor = "#F97316";
                if (hosp.statusColor === "Critical") nodeColor = "#EF4444";

                return (
                  <g 
                    key={`node-${hosp.id}`} 
                    transform={`translate(${300 + ((hosp.longitude ?? 72.769) - 72.769) * 2000}, ${250 + (19.696 - (hosp.latitude ?? 19.696)) * 2000})`}
                    className="cursor-pointer"
                    onClick={() => setSelectedHosp(hosp)}
                  >
                    {isSelected && <circle r="18" className="fill-none stroke-teal-400 stroke-2 animate-pulse" />}
                    <circle r="12" className="fill-slate-900 stroke-slate-700 stroke-2" />
                    <circle r="8" fill={nodeColor} />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Dynamic details card footer inside map */}
          {selectedHosp ? (
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 z-10">
              <div className="space-y-1 text-left">
                <span className="text-[9px] font-black text-teal-400 uppercase tracking-wider">Currently Inspected Clinic</span>
                <h5 className="font-extrabold text-sm text-slate-100">{selectedHosp.name}</h5>
                <p className="font-semibold text-slate-400 text-[10px]">{selectedHosp.address}</p>
                <p className="text-[10px] text-slate-400 font-semibold">Bed Stock: {selectedHosp.available_beds} Free</p>
              </div>
              <a
                href={`/citizen/report?hospitalId=${selectedHosp.id}`}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-900 font-bold text-xs rounded-xl shadow-md transition-colors text-center shrink-0 flex items-center gap-1 justify-center"
              >
                File Grievance <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <div className="bg-slate-800/40 p-4 rounded-2xl text-center text-slate-400 text-xs font-bold border border-slate-800">
              Select a clinic marker on the map canvas to view routing details
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
