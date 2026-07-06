"use client";

import { useState } from "react";
import type { Alert } from "@/types";
import Header from "@/components/Header";
import { useDistrict } from "@/context/DistrictContext";
import { getSeverityColor } from "@/data/mockData";
import { dhicApi } from "@/lib/api";
import {
  Bell,
  AlertTriangle,
  Shield,
  Pill,
  Bed,
  Users,
  Server,
  MessageSquare,
  Activity,
  Clock,
  CheckCircle,
  Eye,
  Filter,
} from "lucide-react";

const categoryIcons = {
  "Medicine Stock-Out Risk": Pill,
  "Bed Capacity Risk": Bed,
  "Staff Shortage": Users,
  "Infrastructure Failure": Server,
  "Resource Transfer Required": Activity,
  "Rising Citizen Complaints": MessageSquare,
  "Unusual Resource Consumption": Shield,
};

const categoryFilters = [
  "All",
  "Medicine Stock-Out Risk",
  "Bed Capacity Risk",
  "Staff Shortage",
  "Infrastructure Failure",
  "Resource Transfer Required",
  "Rising Citizen Complaints",
  "Unusual Resource Consumption",
];

export default function AIAlertCentre() {
  const { alerts, acknowledgeAlert } = useDistrict();
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const filtered = alerts.filter((a) => {
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    if (categoryFilter !== "All" && a.category !== categoryFilter) return false;
    return true;
  });

  const counts = {
    critical: alerts.filter((a) => a.severity === "critical").length,
    high: alerts.filter((a) => a.severity === "high").length,
    medium: alerts.filter((a) => a.severity === "medium").length,
    low: alerts.filter((a) => a.severity === "low").length,
  };

  const handleDismiss = async (alertId: string) => {
    await acknowledgeAlert(alertId);
  };

  return (
    <>
      <Header
        title="AI Alert Centre"
        subtitle="Centralized repository for all AI-generated alerts across the district"
      />
      <div className="page">
        {/* Severity Quick Filters */}
        <div className="summary-cards" style={{ marginBottom: 20 }}>
          {[
            { label: "Critical", count: counts.critical, color: "#ef4444", bg: "rgba(239,68,68,0.1)", key: "critical" },
            { label: "High", count: counts.high, color: "#f97316", bg: "rgba(249,115,22,0.1)", key: "high" },
            { label: "Medium", count: counts.medium, color: "#eab308", bg: "rgba(234,179,8,0.1)", key: "medium" },
            { label: "Low", count: counts.low, color: "#22c55e", bg: "rgba(34,197,94,0.1)", key: "low" },
          ].map((s) => (
            <div
              key={s.key}
              className="summary-card"
              style={{ cursor: "pointer", borderColor: severityFilter === s.key ? s.color : undefined }}
              onClick={() => setSeverityFilter(severityFilter === s.key ? "all" : s.key)}
            >
              <div className="summary-card__icon" style={{ background: s.bg, color: s.color }}>
                <AlertTriangle size={20} />
              </div>
              <div className="summary-card__value">{s.count}</div>
              <div className="summary-card__label">{s.label} Severity</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 20, minHeight: "calc(100vh - 300px)" }}>
          {/* Alert List */}
          <div style={{ flex: 1 }}>
            {/* Category Filter Chips */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {categoryFilters.map((cat) => (
                <button
                  key={cat}
                  className={`btn btn--sm ${categoryFilter === cat ? "btn--primary" : "btn--outline"}`}
                  onClick={() => setCategoryFilter(cat)}
                  style={{ fontSize: 11.5 }}
                >
                  {cat === "All" ? <><Filter size={12} /> All</> : cat}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map((alert) => {
                const Icon = categoryIcons[alert.category as keyof typeof categoryIcons] || Bell;
                return (
                  <div
                    key={alert.id}
                    className={`recommendation recommendation--${alert.severity === "critical" ? "critical" : alert.severity === "high" ? "high" : "medium"}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="recommendation__header">
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: `${getSeverityColor(alert.severity)}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon size={18} style={{ color: getSeverityColor(alert.severity) }} />
                        </div>
                        <div>
                          <div className="recommendation__title" style={{ fontSize: 13 }}>{alert.category}</div>
                          <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 1 }}>
                            {alert.hospital} • {alert.generatedAt}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="badge badge--active" style={{ fontSize: 10 }}>{alert.severity.toUpperCase()}</span>
                        <span className="recommendation__confidence">{Math.round((alert.confidence ?? 0) * 100)}%</span>
                      </div>
                    </div>
                    <div className="recommendation__body" style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span className="recommendation__field-label">Recommended Action:</span>
                        <span className="recommendation__field">{alert.action}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span className="recommendation__field-label">Evidence:</span>
                        <span className="recommendation__field">{alert.evidence}</span>
                      </div>
                    </div>
                    <div className="recommendation__actions">
                      <button className="btn btn--sm btn--primary" onClick={(e) => { e.stopPropagation(); acknowledgeAlert(alert.id); }}>Act Now</button>
                      <button className="btn btn--sm btn--outline" onClick={(e) => e.stopPropagation()}><Eye size={12} /> Details</button>
                      <button className="btn btn--sm btn--ghost" onClick={(e) => { e.stopPropagation(); handleDismiss(alert.id); }}>Dismiss</button>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="empty-state">
                  <Bell size={48} className="empty-state__icon" />
                  <div className="empty-state__title">No alerts match your filters</div>
                  <div className="empty-state__desc">Try adjusting the severity or category filters</div>
                </div>
              )}
            </div>
          </div>

          {/* Summary Panel */}
          <div style={{ width: 280, display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <div className="card__header">
                <span className="card__title">Alert Summary</span>
              </div>
              <div className="card__body">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>Total Active</span>
                    <span style={{ fontWeight: 700 }}>{alerts.filter(a => a.status === "active").length}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>Acknowledged</span>
                    <span style={{ fontWeight: 700 }}>{alerts.filter(a => a.status === "acknowledged").length}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>Resolved</span>
                    <span style={{ fontWeight: 700, color: "#22c55e" }}>{alerts.filter(a => a.status === "resolved").length}</span>
                  </div>
                  <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: 12, marginTop: 4 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Avg. Confidence Score</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#3b82f6" }}>
                      {Math.round(alerts.reduce((a, b) => a + b.confidence, 0) / alerts.length * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__header">
                <span className="card__title">Why This Portal Matters</span>
              </div>
              <div className="card__body">
                <div style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.6 }}>
                  Every prediction generated by the AI Engine appears here, allowing district authorities to respond before operational issues escalate into healthcare emergencies.
                </div>
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  {["Real-time monitoring", "Explainable AI", "Actionable recommendations", "Full audit trail"].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500 }}>
                      <CheckCircle size={13} style={{ color: "#22c55e" }} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
