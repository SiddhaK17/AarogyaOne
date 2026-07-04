"use client";

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Truck,
  AlertTriangle,
  Wrench,
  MessageSquare,
  Siren,
  CheckCircle,
  Clock,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Building2,
  HeartPulse,
  BedDouble,
  Ambulance,
  Stethoscope,
  Syringe,
  Activity,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";
import Header from "@/components/Header";
import { useDistrict } from "@/context/DistrictContext";

const eventIconMap = {
  transfer: { icon: Truck, className: "transfer" },
  alert: { icon: AlertTriangle, className: "alert" },
  infrastructure: { icon: Wrench, className: "infrastructure" },
  complaint: { icon: MessageSquare, className: "complaint" },
  emergency: { icon: Siren, className: "emergency" },
  completed: { icon: CheckCircle, className: "completed" },
};

const summaryIcons = [
  { key: "totalHospitalsConnected", label: "Hospitals Connected", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", Icon: Building2 },
  { key: "activePHCs", label: "Active PHCs", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", Icon: HeartPulse },
  { key: "activeCHCs", label: "Active CHCs", color: "#14b8a6", bg: "rgba(20,184,166,0.1)", Icon: Stethoscope },
  { key: "totalAvailableBeds", label: "Available Beds", color: "#22c55e", bg: "rgba(34,197,94,0.1)", Icon: BedDouble },
  { key: "icuBedsAvailable", label: "ICU Beds Available", color: "#f97316", bg: "rgba(249,115,22,0.1)", Icon: Syringe },
  { key: "doctorsOnDuty", label: "Doctors On Duty", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", Icon: Stethoscope },
  { key: "activeAmbulances", label: "Active Ambulances", color: "#14b8a6", bg: "rgba(20,184,166,0.1)", Icon: Ambulance },
  { key: "pendingCriticalIssues", label: "Critical Issues", color: "#ef4444", bg: "rgba(239,68,68,0.1)", Icon: Activity },
];

export default function Dashboard() {
  const {
    districtSummary,
    districtHealthScore,
    riskDistribution,
    operationalEvents,
    aiRecommendations,
  } = useDistrict();

  const scoreData = [
    { name: "Health Score", value: districtHealthScore.overall, fill: "#3b82f6" },
  ];

  const pieData = riskDistribution.map((r) => ({
    name: r.level,
    value: r.count,
    color: r.color,
  }));

  return (
    <>
      <Header title="District Dashboard" subtitle="Real-time overview of Palghar District healthcare operations" />
      <div className="page">
        {/* Summary Cards */}
        <div className="summary-cards">
          {summaryIcons.map(({ key, label, color, bg, Icon }) => (
            <div className="summary-card" key={key}>
              <div className="summary-card__icon" style={{ background: bg, color }}>
                <Icon size={20} />
              </div>
              <div className="summary-card__value">{districtSummary[key].toLocaleString()}</div>
              <div className="summary-card__label">{label}</div>
              {key === "pendingCriticalIssues" && (
                <div className="summary-card__trend summary-card__trend--down">
                  <TrendingUp size={11} /> +2 today
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Score + Risk + Recommendations */}
        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* Health Score + Risk */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card">
              <div className="card__header">
                <span className="card__title">District Health Score</span>
                <span className={`summary-card__trend summary-card__trend--${districtHealthScore.trend === "up" ? "up" : districtHealthScore.trend === "down" ? "down" : "stable"}`}>
                  {districtHealthScore.trend === "up" ? <TrendingUp size={11} /> : districtHealthScore.trend === "down" ? <TrendingDown size={11} /> : <Minus size={11} />}
                  {districtHealthScore.previousScore} → {districtHealthScore.overall}
                </span>
              </div>
              <div className="card__body" style={{ display: "flex", alignItems: "center", gap: 32 }}>
                <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="72%" outerRadius="100%" data={scoreData} startAngle={90} endAngle={-270}>
                      <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "#f1f5f9" }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: "#3b82f6" }}>{districtHealthScore.overall}</span>
                    <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>/ 100</span>
                  </div>
                </div>
                <div className="score-breakdown" style={{ flex: 1 }}>
                  {(Object.entries(districtHealthScore.breakdown) as [string, number][]).map(([key, val]) => (
                    <div className="score-breakdown__item" key={key}>
                      <span className="score-breakdown__label">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                      <div className="score-breakdown__bar">
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-bar__fill" style={{ width: `${val}%`, background: val >= 70 ? "#22c55e" : val >= 50 ? "#eab308" : "#ef4444" }} />
                        </div>
                        <span className="score-breakdown__bar-value">{val}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Risk Distribution */}
            <div className="card">
              <div className="card__header">
                <span className="card__title">Hospital Risk Distribution</span>
              </div>
              <div className="card__body" style={{ display: "flex", gap: 24, alignItems: "center" }}>
                <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="risk-widget" style={{ flex: 1 }}>
                  {riskDistribution.map((r) => (
                    <div className="risk-widget__item" key={r.level} style={{ background: `${r.color}08` }}>
                      <div className="risk-widget__left">
                        <span className="risk-widget__dot" style={{ background: r.color }} />
                        <span className="risk-widget__label">{r.level}</span>
                      </div>
                      <span className="risk-widget__count">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendations + Events */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card">
              <div className="card__header">
                <span className="card__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkles size={16} style={{ color: "#8b5cf6" }} /> AI Recommendations
                </span>
                <span className="badge badge--active">{aiRecommendations.filter((r) => r.status === "pending").length} pending</span>
              </div>
              <div className="card__body card__body--flush" style={{ maxHeight: 400, overflowY: "auto" }}>
                {aiRecommendations.slice(0, 4).map((rec) => (
                  <div key={rec.id} className={`recommendation recommendation--${rec.priority}`} style={{ margin: 0, borderLeft: "none", borderTop: "1px solid var(--border-light)", borderRadius: 0 }}>
                    <div className="recommendation__header">
                      <span className="recommendation__title">{rec.title}</span>
                      <span className="recommendation__confidence">{Math.round(rec.confidence * 100)}%</span>
                    </div>
                    <div className="recommendation__body">
                      <span className="recommendation__field">{rec.reasoning.slice(0, 120)}…</span>
                    </div>
                    <div className="recommendation__actions">
                      <button className="btn btn--sm btn--success"><ThumbsUp size={12} /> Approve</button>
                      <button className="btn btn--sm btn--outline"><ThumbsDown size={12} /> Defer</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Events */}
            <div className="card">
              <div className="card__header">
                <span className="card__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Clock size={16} style={{ color: "#64748b" }} /> Today's Operational Events
                </span>
              </div>
              <div className="card__body card__body--flush" style={{ maxHeight: 300, overflowY: "auto" }}>
                <div className="timeline">
                  {operationalEvents.map((evt) => {
                    const { icon: Icon, className } = eventIconMap[evt.type as keyof typeof eventIconMap] || eventIconMap.alert;
                    return (
                      <div className="timeline__item" key={evt.id}>
                        <div className={`timeline__icon timeline__icon--${className}`}>
                          <Icon size={16} />
                        </div>
                        <div className="timeline__content">
                          <div className="timeline__title">{evt.title}</div>
                          <div className="timeline__detail">{evt.detail}</div>
                        </div>
                        <span className="timeline__time">{evt.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
