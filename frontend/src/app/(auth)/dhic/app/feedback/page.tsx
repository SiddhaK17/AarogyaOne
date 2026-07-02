"use client";

import Header from "@/components/Header";
import { useDistrict } from "@/context/DistrictContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

const starColors = ["#ef4444", "#f97316", "#eab308", "#3b82f6", "#22c55e"];
const pieColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

export default function CitizenFeedback() {
  const { citizenFeedback, hospitals } = useDistrict();

  const trendIcons = {
    increasing: { icon: TrendingUp, color: "#ef4444" },
    stable: { icon: Minus, color: "#eab308" },
    decreasing: { icon: TrendingDown, color: "#22c55e" },
  };

  return (
    <>
      <Header
        title="Citizen Feedback Intelligence"
        subtitle="Aggregated patient satisfaction data across the district"
      />
      <div className="page">
        {/* Top Stats */}
        <div className="summary-cards" style={{ marginBottom: 24 }}>
          <div className="summary-card">
            <div className="summary-card__icon" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
              <Star size={20} />
            </div>
            <div className="summary-card__value">{citizenFeedback.overallSatisfaction}</div>
            <div className="summary-card__label">Overall Satisfaction</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__icon" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
              <MessageSquare size={20} />
            </div>
            <div className="summary-card__value">{citizenFeedback.totalReviews.toLocaleString()}</div>
            <div className="summary-card__label">Total Reviews</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__icon" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
              <AlertTriangle size={20} />
            </div>
            <div className="summary-card__value">{citizenFeedback.topComplaints[0].count}</div>
            <div className="summary-card__label">#1 Complaint: Wait Times</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__icon" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
              <ThumbsUp size={20} />
            </div>
            <div className="summary-card__value">56%</div>
            <div className="summary-card__label">4–5 Star Reviews</div>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* Rating Distribution */}
          <div className="card">
            <div className="card__header">
              <span className="card__title">Rating Distribution</span>
            </div>
            <div className="card__body" style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={citizenFeedback.distribution.slice().reverse()}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      dataKey="count"
                      stroke="none"
                    >
                      {citizenFeedback.distribution.slice().reverse().map((_, i) => (
                        <Cell key={i} fill={pieColors[i]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {citizenFeedback.distribution.map((d, i) => (
                  <div key={d.stars} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", gap: 2, minWidth: 60 }}>
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star
                          key={si}
                          size={12}
                          fill={si < d.stars ? starColors[4] : "none"}
                          stroke={si < d.stars ? starColors[4] : "#d1d5db"}
                        />
                      ))}
                    </div>
                    <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                      <div className="progress-bar__fill" style={{ width: `${d.percentage}%`, background: starColors[4 - i] }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", minWidth: 32 }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Complaints */}
          <div className="card">
            <div className="card__header">
              <span className="card__title">Top Complaint Categories</span>
            </div>
            <div className="card__body">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={citizenFeedback.topComplaints} margin={{ bottom: 0 }}>
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32} fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Complaint Trend + Hospital Ratings */}
        <div className="grid-2">
          {/* Trend Indicators */}
          <div className="card">
            <div className="card__header">
              <span className="card__title">Complaint Trends</span>
            </div>
            <div className="card__body">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {citizenFeedback.topComplaints.map((c, i) => {
                  const trend = trendIcons[c.trend as keyof typeof trendIcons];
                  const TrendIcon = trend.icon;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, background: "#f8fafc" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{c.category}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{c.count}</span>
                        <TrendIcon size={14} style={{ color: trend.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Hospital Ratings */}
          <div className="card">
            <div className="card__header">
              <span className="card__title">Hospital Satisfaction Rankings</span>
            </div>
            <div className="card__body card__body--flush">
              <div className="table-wrap" style={{ maxHeight: 320, overflowY: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Hospital</th>
                      <th>Rating</th>
                      <th>Reviews</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citizenFeedback.hospitalRatings.map((h, i) => (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 700, color: i < 3 ? "#ef4444" : "#64748b" }}>{i + 1}</td>
                        <td style={{ fontWeight: 600, color: "#0f172a", fontSize: 12.5 }}>{h.name}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Star size={13} fill="#eab308" stroke="#eab308" />
                            <span style={{ fontWeight: 700, color: h.rating >= 4 ? "#22c55e" : h.rating >= 3 ? "#eab308" : "#ef4444" }}>{h.rating}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 12 }}>{h.reviews}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
