"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useDistrict } from "@/context/DistrictContext";
import {
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
  MapPin,
  ArrowRight,
  ThumbsUp,
  XCircle,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const tabs = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
];

const urgencyColors = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

export default function ResourceManagement() {
  const { transferRequests, addNotification } = useDistrict();
  const [activeTab, setActiveTab] = useState("pending");
  const [transfers, setTransfers] = useState(transferRequests);

  const filtered = transfers.filter((t) => {
    if (activeTab === "all") return true;
    return t.status === activeTab;
  });

  const inventoryData = [
    { name: "Oxygen", stock: 82, color: "#3b82f6" },
    { name: "Insulin", stock: 45, color: "#ef4444" },
    { name: "Paracetamol", stock: 78, color: "#22c55e" },
    { name: "Ventilators", stock: 32, color: "#f97316" },
    { name: "PPE Kits", stock: 90, color: "#22c55e" },
    { name: "Blood Units", stock: 58, color: "#eab308" },
    { name: "Antibiotics", stock: 71, color: "#3b82f6" },
  ];

  const handleApprove = (id: string) => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "approved" } : t))
    );
    addNotification(`Transfer ${id} approved`);
  };

  const handleReject = (id: string) => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "rejected" } : t))
    );
    addNotification(`Transfer ${id} rejected`);
  };

  const stats = {
    pending: transfers.filter((t) => t.status === "pending").length,
    approved: transfers.filter((t) => t.status === "approved").length,
    completed: transfers.filter((t) => t.status === "completed").length,
  };

  return (
    <>
      <Header
        title="Resource Management"
        subtitle="Centralized resource transfer coordination across the district"
      />
      <div className="page">
        {/* Stats Row */}
        <div className="summary-cards" style={{ marginBottom: 24 }}>
          <div className="summary-card">
            <div className="summary-card__icon" style={{ background: "rgba(234,179,8,0.1)", color: "#eab308" }}>
              <Clock size={20} />
            </div>
            <div className="summary-card__value">{stats.pending}</div>
            <div className="summary-card__label">Pending Transfers</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__icon" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
              <Truck size={20} />
            </div>
            <div className="summary-card__value">{stats.approved}</div>
            <div className="summary-card__label">Approved / In Transit</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__icon" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
              <CheckCircle size={20} />
            </div>
            <div className="summary-card__value">{stats.completed}</div>
            <div className="summary-card__label">Completed Today</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__icon" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
              <AlertTriangle size={20} />
            </div>
            <div className="summary-card__value">
              {transfers.filter((t) => t.urgency === "critical").length}
            </div>
            <div className="summary-card__label">Critical Requests</div>
          </div>
        </div>

        <div className="grid-2-1">
          {/* Transfer Table */}
          <div className="card">
            <div className="card__header" style={{ borderBottom: "none", paddingBottom: 0 }}>
              <span className="card__title">Transfer Requests</span>
            </div>
            <div className="tabs" style={{ padding: "0 20px" }}>
              {tabs.map((t) => (
                <button
                  key={t.key}
                  className={`tab ${activeTab === t.key ? "tab--active" : ""}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="card__body card__body--flush">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>From → To</th>
                      <th>Urgency</th>
                      <th>ETA</th>
                      <th>AI Conf.</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 600, color: "#0f172a" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Package size={14} style={{ color: "#3b82f6" }} />
                            {t.item}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700 }}>{t.quantity}</td>
                        <td>
                          <div style={{ fontSize: 12 }}>
                            <span>{t.from}</span>
                            <ArrowRight size={11} style={{ margin: "0 4px", color: "#94a3b8" }} />
                            <span style={{ fontWeight: 600 }}>{t.to}</span>
                          </div>
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: `${urgencyColors[t.urgency as keyof typeof urgencyColors]}15`,
                              color: urgencyColors[t.urgency as keyof typeof urgencyColors],
                            }}
                          >
                            {t.urgency.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: 12 }}>{t.estimatedTime}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: t.aiConfidence >= 0.9 ? "#22c55e" : t.aiConfidence >= 0.8 ? "#eab308" : "#f97316" }}>
                            {Math.round(t.aiConfidence * 100)}%
                          </span>
                        </td>
                        <td>
                          {t.status === "pending" && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button className="btn btn--sm btn--success" onClick={() => handleApprove(t.id)}>
                                <ThumbsUp size={12} /> Approve
                              </button>
                              <button className="btn btn--sm btn--outline" onClick={() => handleReject(t.id)}>
                                <XCircle size={12} />
                              </button>
                            </div>
                          )}
                          {t.status === "approved" && (
                            <span className="badge badge--approved">Approved</span>
                          )}
                          {t.status === "completed" && (
                            <span className="badge badge--completed">Done</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Inventory Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <div className="card__header">
                <span className="card__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <BarChart3 size={15} style={{ color: "#3b82f6" }} /> District Inventory
                </span>
              </div>
              <div className="card__body">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={inventoryData} layout="vertical" margin={{ left: 0 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="stock" radius={[0, 4, 4, 0]} barSize={18}>
                      {inventoryData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Resource Optimization Info */}
            <div className="card">
              <div className="card__header">
                <span className="card__title">AI Optimization Factors</span>
              </div>
              <div className="card__body">
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5, color: "#475569" }}>
                  {[
                    { label: "Distance", desc: "Physical proximity of source to destination", icon: <MapPin size={14} /> },
                    { label: "Travel Time", desc: "Estimated transit time including traffic", icon: <Clock size={14} /> },
                    { label: "Current Stock", desc: "Source hospital remaining inventory level", icon: <Package size={14} /> },
                    { label: "Predicted Demand", desc: "AI-forecasted consumption for next 72 hours", icon: <BarChart3 size={14} /> },
                    { label: "Urgency", desc: "Clinical urgency classification of need", icon: <AlertTriangle size={14} /> },
                    { label: "Existing Commitments", desc: "Prior approved transfers from same source", icon: <RefreshCw size={14} /> },
                  ].map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ color: "#3b82f6", marginTop: 1 }}>{f.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{f.label}</div>
                        <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{f.desc}</div>
                      </div>
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
