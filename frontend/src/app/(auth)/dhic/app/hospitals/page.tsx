"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header";
import { useDistrict } from "@/context/DistrictContext";
import {
  getStatusColor,
  getStatusLabel,
} from "@/data/mockData";
import {
  Search,
  Bed,
  Stethoscope,
  Pill,
  Heart,
  AlertTriangle,
  Activity,
  TrendingDown,
  Clock,
  ArrowUpDown,
  ChevronRight,
} from "lucide-react";

const scoreDimensions = [
  { key: "operationalEfficiency", label: "Operational Efficiency" },
  { key: "medicineAvailability", label: "Medicine Availability" },
  { key: "infrastructureReliability", label: "Infrastructure Reliability" },
  { key: "citizenSatisfaction", label: "Citizen Satisfaction" },
  { key: "attendanceConsistency", label: "Attendance Consistency" },
  { key: "emergencyReadiness", label: "Emergency Readiness" },
];

// Deterministic pseudo-random based on hospital ID string
function seededOffset(str: string, idx: number) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i) + idx) | 0;
  }
  return Math.abs(hash) % 10;
}

import type { Hospital, ScoreDimensions } from "@/types";

function generateScores(hospital: Hospital): ScoreDimensions {
  const base = hospital.aiHealthScore;
  const id = hospital.id;
  return {
    operationalEfficiency: Math.min(100, base + seededOffset(id, 1) - 3),
    medicineAvailability: hospital.medicineStock,
    infrastructureReliability: Math.min(100, Math.max(20, base - 5 + seededOffset(id, 2))),
    citizenSatisfaction: Math.round(hospital.citizenSatisfaction * 20),
    attendanceConsistency: Math.round((hospital.doctors.onDuty / hospital.doctors.total) * 100),
    emergencyReadiness: Math.min(100, Math.max(15, base + seededOffset(id, 3) - 3)),
  };
}

export default function HospitalIntelligence() {
  const { hospitals, alerts } = useDistrict();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Hospital | null>(null);
  const [sortBy, setSortBy] = useState<string>("score");

  const generateDynamicInsights = (h: Hospital) => {
    const insights = [];
    if (h.aiHealthScore < 50) insights.push({ type: "declining", text: `AI Health Score is critically low (${h.aiHealthScore})` });
    if (h.medicineStock < 50) insights.push({ type: "shortage", text: `Medicine stock is low (${h.medicineStock}%)` });
    if (h.activeIssues > 10) insights.push({ type: "complaint", text: `${h.activeIssues} active issues reported` });
    
    // Check global alerts for this hospital
    const hospitalAlerts = alerts.filter(a => a.hospital === h.name);
    hospitalAlerts.slice(0, 2).forEach(a => {
      insights.push({ type: a.severity === 'Critical' ? "declining" : "complaint", text: a.category });
    });

    if (insights.length === 0) {
      insights.push({ type: "stable", text: "No significant AI-detected concerns for this facility" });
    }
    return insights;
  };

  const filtered = hospitals
    .filter(
      (h) =>
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.type.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "score") return a.aiHealthScore - b.aiHealthScore;
      if (sortBy === "beds") return a.beds.available - b.beds.available;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const selectedScores = useMemo(() => selected ? generateScores(selected) : null, [selected]);

  return (
    <>
      <Header
        title="Hospital Intelligence"
        subtitle="Supervisory view of all registered hospitals in the district"
      />
      <div className="page">
        <div style={{ display: "flex", gap: 20, minHeight: "calc(100vh - 140px)" }}>
          {/* Hospital List */}
          <div style={{ width: selected ? 380 : "100%", transition: "width 0.3s" }}>
            <div className="filter-bar">
              <div className="filter-bar__search-wrapper">
                <Search size={16} className="filter-bar__search-icon" />
                <input
                  className="filter-bar__search"
                  placeholder="Search hospitals by name or type..."
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                />
              </div>
              <button
                className="btn btn--outline btn--sm"
                onClick={() => setSortBy(sortBy === "score" ? "beds" : sortBy === "beds" ? "name" : "score")}
              >
                <ArrowUpDown size={14} />
                {sortBy === "score" ? "AI Score" : sortBy === "beds" ? "Bed Avail." : "Name"}
              </button>
            </div>

            <div className="card">
              <div className="card__body card__body--flush">
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Hospital</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>AI Score</th>
                        <th>Beds</th>
                        <th>Doctors</th>
                        <th>Issues</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((h) => (
                        <tr
                          key={h.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => setSelected(h)}
                        >
                          <td style={{ fontWeight: 600, color: "#0f172a" }}>{h.name}</td>
                          <td>{h.type}</td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: `${getStatusColor(h.status)}15`,
                                color: getStatusColor(h.status),
                              }}
                            >
                              {getStatusLabel(h.status)}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: h.aiHealthScore >= 70 ? "#22c55e" : h.aiHealthScore >= 50 ? "#eab308" : "#ef4444" }}>
                              {h.aiHealthScore}
                            </span>
                          </td>
                          <td>{h.beds.available}/{h.beds.total}</td>
                          <td>{h.doctors.onDuty}/{h.doctors.total}</td>
                          <td>
                            {h.activeIssues > 0 && (
                              <span className="badge badge--high">{h.activeIssues}</span>
                            )}
                            {h.activeIssues === 0 && <span style={{ color: "#22c55e" }}>0</span>}
                          </td>
                          <td><ChevronRight size={14} style={{ color: "#94a3b8" }} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          {selected && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
              <div className="card">
                <div className="card__header">
                  <div>
                    <span className="card__title">{selected.name}</span>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{selected.type} — {selected.id}</div>
                  </div>
                  <button className="btn btn--sm btn--ghost" onClick={() => setSelected(null)}>Close</button>
                </div>
                <div className="card__body">
                  {/* Quick Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
                    <MiniStat icon={<Bed size={16} />} label="Available Beds" value={`${selected.beds.available}`} color="#3b82f6" />
                    <MiniStat icon={<Bed size={16} />} label="ICU Available" value={`${selected.beds.icu.available}`} color="#8b5cf6" />
                    <MiniStat icon={<Stethoscope size={16} />} label="Doctors" value={`${selected.doctors.onDuty}/${selected.doctors.total}`} color="#14b8a6" />
                    <MiniStat icon={<Pill size={16} />} label="Medicine Stock" value={`${selected.medicineStock}%`} color={selected.medicineStock >= 70 ? "#22c55e" : selected.medicineStock >= 40 ? "#eab308" : "#ef4444"} />
                  </div>

                  {/* Performance Scorecard */}
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#0f172a" }}>Performance Scorecard</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                    {scoreDimensions.map(({ key, label }) => {
                      const val = selectedScores ? selectedScores[key as keyof ScoreDimensions] : 0;
                      return (
                        <div key={key}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: val >= 70 ? "#22c55e" : val >= 50 ? "#eab308" : "#ef4444" }}>{val}</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-bar__fill" style={{ width: `${val}%`, background: val >= 70 ? "#22c55e" : val >= 50 ? "#eab308" : "#ef4444" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* AI Insights */}
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#0f172a" }}>AI Insights</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {generateDynamicInsights(selected).map((insight, i) => (
                      <div key={i} style={{
                        display: "flex", gap: 10, padding: "10px 14px", borderRadius: 8,
                        background: insight.type === "declining" || insight.type === "shortage" ? "#fef2f2" : insight.type === "attendance" ? "#fff7ed" : "#f0fdf4",
                        fontSize: 12.5, color: "#475569", lineHeight: 1.5,
                      }}>
                        {insight.type === "declining" ? <TrendingDown size={15} style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }} /> :
                         insight.type === "shortage" ? <Pill size={15} style={{ color: "#f97316", flexShrink: 0, marginTop: 2 }} /> :
                         insight.type === "attendance" ? <Clock size={15} style={{ color: "#eab308", flexShrink: 0, marginTop: 2 }} /> :
                         insight.type === "complaint" ? <AlertTriangle size={15} style={{ color: "#8b5cf6", flexShrink: 0, marginTop: 2 }} /> :
                         insight.type === "consumption" ? <Activity size={15} style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }} /> :
                         <Heart size={15} style={{ color: "#22c55e", flexShrink: 0, marginTop: 2 }} />}
                        <span>{insight.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface MiniStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

function MiniStat({ icon, label, value, color }: MiniStatProps) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-primary)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{value}</div>
    </div>
  );
}
