"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useDistrict } from "@/context/DistrictContext";
import { getSeverityColor } from "@/data/mockData";
import {
  Server,
  AlertTriangle,
  Droplets,
  Zap,
  Thermometer,
  Wifi,
  Shield,
  Clock,
  CheckCircle,
  Wrench,
  Filter,
} from "lucide-react";

const typeIcons = {
  "Water Supply": Droplets,
  "HVAC System": Thermometer,
  Electrical: Zap,
  "Medical Equipment": Server,
  Network: Wifi,
  Plumbing: Droplets,
  Elevator: Wrench,
  "Fire Safety": Shield,
};

const statusFilters = ["All", "Open", "In Progress", "Resolved"];

export default function InfrastructureMonitoring() {
  const { infrastructureIssues } = useDistrict();
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = infrastructureIssues.filter((issue) => {
    if (statusFilter === "All") return true;
    return issue.status === statusFilter.toLowerCase().replace(" ", "-");
  });

  const counts = {
    open: infrastructureIssues.filter((i) => i.status === "open").length,
    "in-progress": infrastructureIssues.filter((i) => i.status === "in-progress").length,
    critical: infrastructureIssues.filter((i) => i.severity === "critical").length,
  };

  return (
    <>
      <Header
        title="Infrastructure Monitoring"
        subtitle="Track and manage infrastructure issues across all district facilities"
      />
      <div className="page">
        {/* Stats Row */}
        <div className="summary-cards" style={{ marginBottom: 24 }}>
          <div className="summary-card">
            <div className="summary-card__icon" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
              <AlertTriangle size={20} />
            </div>
            <div className="summary-card__value">{counts.open}</div>
            <div className="summary-card__label">Open Issues</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__icon" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
              <Wrench size={20} />
            </div>
            <div className="summary-card__value">{counts["in-progress"]}</div>
            <div className="summary-card__label">In Progress</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__icon" style={{ background: "rgba(249,115,22,0.1)", color: "#f97316" }}>
              <Server size={20} />
            </div>
            <div className="summary-card__value">{counts.critical}</div>
            <div className="summary-card__label">Critical Issues</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__icon" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
              <CheckCircle size={20} />
            </div>
            <div className="summary-card__value">{infrastructureIssues.length}</div>
            <div className="summary-card__label">Total Tracked</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div style={{ display: "flex", gap: 8 }}>
            {statusFilters.map((f) => (
              <button
                key={f}
                className={`btn btn--sm ${statusFilter === f ? "btn--primary" : "btn--outline"}`}
                onClick={() => setStatusFilter(f)}
              >
                {f === "All" && <Filter size={12} />}
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Issues Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
          {filtered.map((issue) => {
            const TypeIcon = typeIcons[issue.type as keyof typeof typeIcons] || Server;
            return (
              <div
                key={issue.id}
                className="card"
                style={{ borderLeft: `4px solid ${getSeverityColor(issue.severity)}` }}
              >
                <div className="card__body">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 8,
                      background: `${getSeverityColor(issue.severity)}15`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <TypeIcon size={20} style={{ color: getSeverityColor(issue.severity) }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{issue.type}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{issue.hospital}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span className="badge badge--active" style={{
                        background: `${getSeverityColor(issue.severity)}15`,
                        color: getSeverityColor(issue.severity),
                      }}>
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className={`badge badge--${issue.status === "open" ? "critical" : "approved"}`}>
                        {issue.status === "in-progress" ? "In Progress" : issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.6, marginBottom: 14 }}>
                    {issue.description}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-light)", paddingTop: 12 }}>
                    <div style={{ display: "flex", gap: 16, fontSize: 11.5, color: "#94a3b8" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={12} /> Reported: {issue.reportedAt}
                      </span>
                      <span>Est. resolution: {issue.estimatedResolution}</span>
                    </div>
                    {issue.status === "open" && (
                      <button className="btn btn--sm btn--primary">
                        <Wrench size={12} /> Dispatch
                      </button>
                    )}
                    {issue.status === "in-progress" && (
                      <button className="btn btn--sm btn--success">
                        <CheckCircle size={12} /> Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state" style={{ padding: 64 }}>
            <CheckCircle size={48} className="empty-state__icon" style={{ color: "#22c55e" }} />
            <div className="empty-state__title">No issues found</div>
            <div className="empty-state__desc">All infrastructure is operating normally for the selected filter</div>
          </div>
        )}
      </div>
    </>
  );
}
