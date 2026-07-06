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
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  FileBarChart,
  Download,
  Calendar,
  TrendingUp,
  Clock,
  Activity,
  Users,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const COLORS = ["#3b82f6", "#22c55e", "#8b5cf6", "#f97316", "#14b8a6"];

export default function ExecutiveReports() {
  const { executiveReportData, districtSummary, districtHealthScore } = useDistrict();
  const { weeklyTrend, hospitalPerformance, resourceUtilization, monthlySummary } =
    executiveReportData;

  return (
    <>
      <Header
        title="Executive Reports"
        subtitle="District-level performance analytics and summary reports"
      />
      <div className="page">
        {/* Monthly Summary Cards */}
        <div className="summary-cards" style={{ marginBottom: 24 }}>
          <div className="summary-card">
            <div className="summary-card__icon" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
              <AlertTriangle size={20} />
            </div>
            <div className="summary-card__value">{monthlySummary.totalAlerts}</div>
            <div className="summary-card__label">Total Alerts (Month)</div>
            <div className="summary-card__trend summary-card__trend--up">
              <CheckCircle size={11} /> {monthlySummary.resolvedAlerts} resolved
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card__icon" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
              <TrendingUp size={20} />
            </div>
            <div className="summary-card__value">{monthlySummary.totalTransfers}</div>
            <div className="summary-card__label">Resource Transfers</div>
            <div className="summary-card__trend summary-card__trend--up">
              <CheckCircle size={11} /> {monthlySummary.completedTransfers} completed
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card__icon" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
              <Users size={20} />
            </div>
            <div className="summary-card__value">{monthlySummary.totalPatients.toLocaleString()}</div>
            <div className="summary-card__label">Patients Served</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__icon" style={{ background: "rgba(20,184,166,0.1)", color: "#14b8a6" }}>
              <Clock size={20} />
            </div>
            <div className="summary-card__value">{monthlySummary.avgResponseTime}</div>
            <div className="summary-card__label">Avg. Emergency Response</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* Weekly Trend */}
          <div className="card">
            <div className="card__header">
              <span className="card__title">Weekly Health Score Trend</span>
            </div>
            <div className="card__body">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis domain={[60, 85]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#3b82f6" }}
                    name="Health Score"
                  />
                  <Line
                    type="monotone"
                    dataKey="alerts"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#ef4444" }}
                    name="Alerts"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hospital Performance Comparison */}
          <div className="card">
            <div className="card__header">
              <span className="card__title">Hospital Performance Comparison</span>
            </div>
            <div className="card__body">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hospitalPerformance} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={70} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={18}>
                    {hospitalPerformance.map((entry, i) => (
                      <Cell key={i} fill={entry.score >= 70 ? "#22c55e" : entry.score >= 50 ? "#eab308" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Resource Utilization + Radar */}
        <div className="grid-2">
          <div className="card">
            <div className="card__header">
              <span className="card__title">District Resource Utilization</span>
            </div>
            <div className="card__body">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={resourceUtilization} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="resource" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="used" radius={[0, 4, 4, 0]} barSize={20} fill="#3b82f6" name="Used" />
                  <Bar dataKey="available" radius={[0, 4, 4, 0]} barSize={20} fill="#e2e8f0" name="Available" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Health Score Radar */}
          <div className="card">
            <div className="card__header">
              <span className="card__title">Health Score Radar</span>
            </div>
            <div className="card__body">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart
                  data={(Object.entries(districtHealthScore.breakdown) as [string, number][]).map(([key, val]) => ({
                    dimension: key.replace(/([A-Z])/g, " $1").trim(),
                    score: val,
                  }))}
                >
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} />
                  <Radar
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
