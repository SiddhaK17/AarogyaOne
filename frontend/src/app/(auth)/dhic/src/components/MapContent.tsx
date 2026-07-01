"use client";

import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons for bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

import { useDistrict } from "@/context/DistrictContext";
import { getStatusColor } from "@/data/mockData";
import {
  Bed,
  Stethoscope,
  Pill,
  Activity,
  AlertTriangle,
  Heart,
  X,
} from "lucide-react";

const statusLabels = {
  healthy: "🟢 Healthy",
  warning: "🟡 Warning",
  "high-risk": "🟠 High Risk",
  critical: "🔴 Critical",
};

export default function MapContent() {
  const { hospitals, selectedHospital, setSelectedHospital } = useDistrict();
  const [mapLayers, setMapLayers] = useState<Record<string, boolean>>({
    beds: false,
    medicine: false,
    oxygen: false,
    infrastructure: false,
    complaints: false,
  });

  const toggleLayer = (key: string) =>
    setMapLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  const layers = [
    { key: "beds", label: "Bed Occupancy", color: "#3b82f6" },
    { key: "medicine", label: "Medicine Shortages", color: "#8b5cf6" },
    { key: "oxygen", label: "Oxygen Availability", color: "#14b8a6" },
    { key: "infrastructure", label: "Infrastructure Issues", color: "#f97316" },
    { key: "complaints", label: "Citizen Complaints", color: "#ef4444" },
  ];

  return (
    <>
      {/* Map */}
      <div className="map-container" style={{ flex: 1, height: "100%" }}>
        <MapContainer
          center={[19.076, 72.8777]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hospitals.map((h) => (
            <CircleMarker
              key={h.id}
              center={[h.lat, h.lng]}
              radius={h.status === "critical" ? 12 : h.status === "high-risk" ? 10 : 8}
              pathOptions={{
                color: getStatusColor(h.status),
                fillColor: getStatusColor(h.status),
                fillOpacity: 0.7,
                weight: 2,
              }}
              eventHandlers={{
                click: () => setSelectedHospital(h),
              }}
            >
              <Popup>
                <strong>{h.name}</strong>
                <br />
                {statusLabels[h.status as keyof typeof statusLabels]}
                <br />
                Beds: {h.beds.available}/{h.beds.total}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Side Panel */}
      <div
        style={{
          width: 340,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Layer Controls */}
        <div className="card">
          <div className="card__header">
            <span className="card__title">Map Overlays</span>
          </div>
          <div className="card__body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {layers.map((l) => (
              <label
                key={l.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  padding: "6px 0",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <input
                  type="checkbox"
                  checked={mapLayers[l.key as keyof typeof mapLayers]}
                  onChange={() => toggleLayer(l.key)}
                  style={{ accentColor: l.color }}
                />
                <span style={{ color: l.color, width: 10, height: 10, borderRadius: "50%", background: l.color, display: "inline-block", opacity: mapLayers[l.key as keyof typeof mapLayers] ? 1 : 0.3 }} />
                {l.label}
              </label>
            ))}
          </div>
        </div>

        {/* Hospital Info Panel */}
        {selectedHospital && (
          <div className="card" style={{ flex: 1, overflowY: "auto" }}>
            <div className="card__header">
              <span className="card__title">{selectedHospital.name}</span>
              <button
                className="btn btn--sm btn--ghost"
                onClick={() => setSelectedHospital(null)}
              >
                <X size={14} />
              </button>
            </div>
            <div className="card__body">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <InfoRow
                  icon={<Activity size={15} />}
                  label="Status"
                  value={statusLabels[selectedHospital.status as keyof typeof statusLabels]}
                />
                <InfoRow
                  icon={<Bed size={15} />}
                  label="Available Beds"
                  value={`${selectedHospital.beds.available} / ${selectedHospital.beds.total}`}
                />
                <InfoRow
                  icon={<Bed size={15} />}
                  label="ICU Beds"
                  value={`${selectedHospital.beds.icu.available} / ${selectedHospital.beds.icu.total}`}
                />
                <InfoRow
                  icon={<Stethoscope size={15} />}
                  label="Doctors On Duty"
                  value={`${selectedHospital.doctors.onDuty} / ${selectedHospital.doctors.total}`}
                />
                <InfoRow
                  icon={<Pill size={15} />}
                  label="Medicine Stock"
                  value={`${selectedHospital.medicineStock}%`}
                  bar={selectedHospital.medicineStock}
                />
                <InfoRow
                  icon={<Heart size={15} />}
                  label="Citizen Satisfaction"
                  value={`${selectedHospital.citizenSatisfaction} / 5.0`}
                />
                <InfoRow
                  icon={<AlertTriangle size={15} />}
                  label="Active Issues"
                  value={selectedHospital.activeIssues}
                />
                <InfoRow
                  icon={<Activity size={15} />}
                  label="AI Health Score"
                  value={selectedHospital.aiHealthScore}
                  bar={selectedHospital.aiHealthScore}
                />
              </div>
            </div>
          </div>
        )}

        {!selectedHospital && (
          <div className="card" style={{ flex: 1 }}>
            <div className="empty-state" style={{ height: "100%" }}>
              <MapIcon />
              <div className="empty-state__title">Select a Hospital</div>
              <div className="empty-state__desc">
                Click any marker on the map to view hospital details
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  bar?: number;
}

function InfoRow({ icon, label, value, bar }: InfoRowProps) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ color: "#94a3b8" }}>{icon}</span>
        <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{label}</span>
        <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{value}</span>
      </div>
      {bar !== undefined && (
        <div className="progress-bar">
          <div
            className="progress-bar__fill"
            style={{
              width: `${bar}%`,
              background:
                bar >= 70 ? "#22c55e" : bar >= 40 ? "#eab308" : "#ef4444",
            }}
          />
        </div>
      )}
    </div>
  );
}

function MapIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
