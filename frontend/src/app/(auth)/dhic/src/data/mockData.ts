// ============================================================
// ArogyaOne – District Health Intelligence Centre Mock Data
// ============================================================

import type {
  DistrictInfo,
  DistrictSummary,
  DistrictHealthScore,
  RiskDistributionItem,
  Hospital,
  OperationalEvent,
  AIRecommendation,
  Alert,
  TransferRequest,
  CitizenFeedback,
  InfrastructureIssue,
  ExecutiveReportData,
  SettingsData,
  ChatMessage,
} from "@/types";

// ---- District Info ----
export const districtInfo: DistrictInfo = {
  name: "Palghar District",
  code: "MH-48",
  state: "Maharashtra",
  population: "3.0 Million",
  area: "4,696 km²",
  dho: "Dr. Rajesh Patil",
  cmo: "Dr. Priya Sharma",
  lastUpdated: new Date().toISOString(),
};

// ---- Summary Cards ----
export const districtSummary: DistrictSummary = {
  totalHospitalsConnected: 59,
  activePHCs: 28,
  activeCHCs: 12,
  totalAvailableBeds: 3842,
  icuBedsAvailable: 486,
  doctorsOnDuty: 312,
  activeAmbulances: 24,
  pendingCriticalIssues: 6,
};

// ---- District Health Score ----
export const districtHealthScore: DistrictHealthScore = {
  overall: 74,
  breakdown: {
    resourceAvailability: 78,
    bedCapacity: 72,
    staffAvailability: 68,
    citizenSatisfaction: 81,
    infrastructureHealth: 70,
    aiRiskPredictions: 76,
  },
  trend: "stable",
  previousScore: 73,
};

// ---- Risk Distribution ----
export const riskDistribution: RiskDistributionItem[] = [
  { level: "Low Risk", count: 42, color: "#22c55e", hospitals: [] },
  { level: "Medium Risk", count: 11, color: "#eab308", hospitals: [] },
  { level: "High Risk", count: 4, color: "#f97316", hospitals: [] },
  { level: "Critical", count: 2, color: "#ef4444", hospitals: [] },
];

// ---- Hospitals ----
export const hospitals: Hospital[] = [
  {
    id: "H001",
    name: "Mumbai Central General Hospital",
    type: "District Hospital",
    lat: 18.969,
    lng: 72.819,
    status: "healthy",
    beds: { total: 500, available: 182, icu: { total: 60, available: 18 } },
    doctors: { total: 85, onDuty: 62 },
    medicineStock: 92,
    citizenSatisfaction: 4.2,
    aiHealthScore: 82,
    activeIssues: 1,
    ambulances: 3,
    activeTransfers: 0,
    activeComplaints: 4,
  },
  {
    id: "H002",
    name: "BKC Superspeciality Hospital",
    type: "Sub-District Hospital",
    lat: 19.059,
    lng: 72.868,
    status: "warning",
    beds: { total: 300, available: 88, icu: { total: 40, available: 6 } },
    doctors: { total: 52, onDuty: 38 },
    medicineStock: 71,
    citizenSatisfaction: 3.8,
    aiHealthScore: 65,
    activeIssues: 4,
    ambulances: 2,
    activeTransfers: 1,
    activeComplaints: 12,
  },
  {
    id: "H003",
    name: "Andheri Community Health Centre",
    type: "CHC",
    lat: 19.119,
    lng: 72.847,
    status: "high-risk",
    beds: { total: 80, available: 12, icu: { total: 8, available: 0 } },
    doctors: { total: 14, onDuty: 8 },
    medicineStock: 45,
    citizenSatisfaction: 3.2,
    aiHealthScore: 42,
    activeIssues: 7,
    ambulances: 1,
    activeTransfers: 3,
    activeComplaints: 22,
  },
  {
    id: "H004",
    name: "Dadar PHC – Ward 1",
    type: "PHC",
    lat: 19.017,
    lng: 72.844,
    status: "critical",
    beds: { total: 20, available: 2, icu: { total: 0, available: 0 } },
    doctors: { total: 4, onDuty: 1 },
    medicineStock: 18,
    citizenSatisfaction: 2.5,
    aiHealthScore: 28,
    activeIssues: 9,
    ambulances: 0,
    activeTransfers: 2,
    activeComplaints: 31,
  },
  {
    id: "H005",
    name: "Sion Hospital",
    type: "District Hospital",
    lat: 19.043,
    lng: 72.867,
    status: "healthy",
    beds: { total: 420, available: 156, icu: { total: 50, available: 14 } },
    doctors: { total: 72, onDuty: 58 },
    medicineStock: 88,
    citizenSatisfaction: 4.0,
    aiHealthScore: 79,
    activeIssues: 2,
    ambulances: 3,
    activeTransfers: 0,
    activeComplaints: 6,
  },
  {
    id: "H006",
    name: "Kurla Sub-District Hospital",
    type: "Sub-District Hospital",
    lat: 19.072,
    lng: 72.879,
    status: "warning",
    beds: { total: 200, available: 44, icu: { total: 24, available: 3 } },
    doctors: { total: 36, onDuty: 28 },
    medicineStock: 62,
    citizenSatisfaction: 3.5,
    aiHealthScore: 58,
    activeIssues: 5,
    ambulances: 2,
    activeTransfers: 1,
    activeComplaints: 15,
  },
  {
    id: "H007",
    name: "Goregaon Health Centre",
    type: "CHC",
    lat: 19.167,
    lng: 72.852,
    status: "healthy",
    beds: { total: 100, available: 42, icu: { total: 10, available: 4 } },
    doctors: { total: 18, onDuty: 14 },
    medicineStock: 85,
    citizenSatisfaction: 4.1,
    aiHealthScore: 77,
    activeIssues: 1,
    ambulances: 1,
    activeTransfers: 0,
    activeComplaints: 3,
  },
  {
    id: "H008",
    name: "Bandra PHC – Ward 5",
    type: "PHC",
    lat: 19.054,
    lng: 72.837,
    status: "high-risk",
    beds: { total: 25, available: 3, icu: { total: 0, available: 0 } },
    doctors: { total: 5, onDuty: 2 },
    medicineStock: 35,
    citizenSatisfaction: 2.9,
    aiHealthScore: 38,
    activeIssues: 6,
    ambulances: 0,
    activeTransfers: 1,
    activeComplaints: 18,
  },
  {
    id: "H009",
    name: "Mulund General Hospital",
    type: "Sub-District Hospital",
    lat: 19.173,
    lng: 72.957,
    status: "healthy",
    beds: { total: 180, available: 78, icu: { total: 20, available: 8 } },
    doctors: { total: 30, onDuty: 24 },
    medicineStock: 90,
    citizenSatisfaction: 4.3,
    aiHealthScore: 84,
    activeIssues: 0,
    ambulances: 2,
    activeTransfers: 0,
    activeComplaints: 2,
  },
  {
    id: "H010",
    name: "Thane District Hospital",
    type: "District Hospital",
    lat: 19.197,
    lng: 72.956,
    status: "warning",
    beds: { total: 350, available: 98, icu: { total: 45, available: 7 } },
    doctors: { total: 60, onDuty: 45 },
    medicineStock: 68,
    citizenSatisfaction: 3.6,
    aiHealthScore: 60,
    activeIssues: 5,
    ambulances: 3,
    activeTransfers: 2,
    activeComplaints: 14,
  },
  {
    id: "H011",
    name: "Navi Mumbai PHC Complex",
    type: "PHC",
    lat: 19.033,
    lng: 73.031,
    status: "healthy",
    beds: { total: 30, available: 18, icu: { total: 0, available: 0 } },
    doctors: { total: 6, onDuty: 5 },
    medicineStock: 94,
    citizenSatisfaction: 4.5,
    aiHealthScore: 88,
    activeIssues: 0,
    ambulances: 1,
    activeTransfers: 0,
    activeComplaints: 1,
  },
  {
    id: "H012",
    name: "Worli Critical Care Centre",
    type: "Sub-District Hospital",
    lat: 19.011,
    lng: 72.815,
    status: "critical",
    beds: { total: 150, available: 8, icu: { total: 30, available: 1 } },
    doctors: { total: 28, onDuty: 22 },
    medicineStock: 30,
    citizenSatisfaction: 2.8,
    aiHealthScore: 32,
    activeIssues: 8,
    ambulances: 2,
    activeTransfers: 4,
    activeComplaints: 27,
  },
];

// ---- Today's Operational Events ----
export const operationalEvents: OperationalEvent[] = [
  { id: 1, type: "transfer", title: "O₂ cylinders transferred", detail: "50 units from Sion Hospital → BKC Superspeciality", time: "08:15 AM", icon: "truck" },
  { id: 2, type: "alert", title: "Critical: Insulin shortage", detail: "Dadar PHC – Ward 1 reports < 2-day stock", time: "08:42 AM", icon: "alert-triangle" },
  { id: 3, type: "infrastructure", title: "Water supply disruption", detail: "Andheri CHC – Ward 3 water tank failure reported", time: "09:10 AM", icon: "wrench" },
  { id: 4, type: "complaint", title: "3 new citizen complaints", detail: "Kurla Sub-District: Long wait times, pharmacy closed", time: "09:35 AM", icon: "message-square" },
  { id: 5, type: "emergency", title: "Emergency bed request", detail: "Bandra PHC requests 5 additional ICU beds", time: "10:02 AM", icon: "siren" },
  { id: 6, type: "completed", title: "Staffing issue resolved", detail: "Goregaon HC staffing increased to required levels", time: "10:20 AM", icon: "check-circle" },
  { id: 7, type: "alert", title: "Bed occupancy > 90%", detail: "Worli Critical Care Centre at 95% capacity", time: "10:45 AM", icon: "alert-triangle" },
  { id: 8, type: "transfer", title: "Medicine redistribution", detail: "Paracetamol stock moved: Mulund → Kurla", time: "11:00 AM", icon: "truck" },
];

// ---- AI Recommendations ----
export const aiRecommendations: AIRecommendation[] = [
  {
    id: "R001",
    title: "Transfer oxygen cylinders from Sion Hospital to BKC Superspeciality",
    confidence: 0.94,
    reasoning: "BKC Superspeciality oxygen utilisation rate has risen 28% in 48 hours. Sion Hospital maintains 40% surplus. Transfer of 50 units avoids projected stock-out within 6 hours.",
    supportingData: "BKC O₂ consumption: 180/day → 230/day. Sion surplus: 85 units.",
    expectedOutcome: "BKC stock restored to 5-day supply. No disruption to Sion operations.",
    priority: "high",
    status: "pending",
  },
  {
    id: "R002",
    title: "Increase staffing at Andheri Community Health Centre",
    confidence: 0.89,
    reasoning: "Doctor attendance dropped to 57% — the lowest in the district. Patient-to-doctor ratio has exceeded safe limits. Citizen complaints tripled in the past week.",
    supportingData: "Current ratio: 1:42 (safe: 1:30). Complaints: 6 → 22 in 7 days.",
    expectedOutcome: "Attendance restored to 85%+. Patient wait times reduced by ~40%.",
    priority: "high",
    status: "pending",
  },
  {
    id: "R003",
    title: "Inspect Dadar PHC – Ward 1 for systemic underperformance",
    confidence: 0.87,
    reasoning: "AI Health Score has declined for 3 consecutive weeks. Medicine stock at 18%. Only 1 of 4 doctors on duty. 9 active unresolved issues.",
    supportingData: "Score trend: 42 → 35 → 28. Issues unresolved avg: 6.2 days.",
    expectedOutcome: "Identify root causes, approve emergency procurement, assign additional staff.",
    priority: "critical",
    status: "pending",
  },
  {
    id: "R004",
    title: "Approve emergency insulin procurement for district-wide shortage",
    confidence: 0.92,
    reasoning: "3 hospitals forecast insulin stock-out within 5 days. Aggregated demand exceeds current district supply by 340 units.",
    supportingData: "Projected shortage: 340 units by Friday. Current stock: 520 units district-wide.",
    expectedOutcome: "Prevent insulin stock-out across 3 facilities. Maintain 7-day buffer stock.",
    priority: "critical",
    status: "pending",
  },
  {
    id: "R005",
    title: "Redirect non-critical patients from Worli to Mulund Hospital",
    confidence: 0.85,
    reasoning: "Worli Critical Care Centre at 95% bed occupancy. Mulund General Hospital has 78 beds available (43% capacity). Distance is 14 km with ~25 min travel time.",
    supportingData: "Worli occupancy: 95%. Mulund occupancy: 57%. Route: Eastern Express.",
    expectedOutcome: "Reduce Worli occupancy to ~80%. Improve patient outcomes at both facilities.",
    priority: "medium",
    status: "pending",
  },
  {
    id: "R006",
    title: "Schedule infrastructure audit at Kurla Sub-District Hospital",
    confidence: 0.78,
    reasoning: "Infrastructure reliability score dropped 15 points. Two equipment failures reported in the past week. Maintenance backlog increasing.",
    supportingData: "Infra score: 68 → 53. Pending maintenance: 12 items.",
    expectedOutcome: "Prevent equipment failures, improve infrastructure score by 10+ points.",
    priority: "medium",
    status: "pending",
  },
];

// ---- Alerts ----
export const alerts: Alert[] = [
  { id: "A001", category: "Medicine Stock-Out Risk", severity: "critical", confidence: 0.94, hospital: "Dadar PHC – Ward 1", generatedAt: "08:42 AM", action: "Emergency insulin procurement", evidence: "Stock < 2-day supply. 3 hospitals affected.", status: "active" },
  { id: "A002", category: "Bed Capacity Risk", severity: "critical", confidence: 0.91, hospital: "Worli Critical Care Centre", generatedAt: "10:45 AM", action: "Redirect non-critical patients", evidence: "95% occupancy. ICU at 97%.", status: "active" },
  { id: "A003", category: "Staff Shortage", severity: "high", confidence: 0.89, hospital: "Andheri CHC", generatedAt: "07:30 AM", action: "Deploy additional doctors", evidence: "57% attendance. 1:42 patient ratio.", status: "active" },
  { id: "A004", category: "Infrastructure Failure", severity: "high", confidence: 0.86, hospital: "Andheri CHC", generatedAt: "09:10 AM", action: "Emergency maintenance dispatch", evidence: "Water supply disrupted. Ward 3 affected.", status: "active" },
  { id: "A005", category: "Rising Citizen Complaints", severity: "medium", confidence: 0.82, hospital: "Kurla Sub-District Hospital", generatedAt: "09:35 AM", action: "Root cause analysis", evidence: "Complaints up 150% in 7 days. Top: wait times.", status: "active" },
  { id: "A006", category: "Resource Transfer Required", severity: "medium", confidence: 0.88, hospital: "BKC Superspeciality", generatedAt: "08:15 AM", action: "Transfer O₂ from Sion", evidence: "O₂ consumption up 28%. 6-hour stock-out window.", status: "acknowledged" },
  { id: "A007", category: "Unusual Resource Consumption", severity: "medium", confidence: 0.75, hospital: "Thane District Hospital", generatedAt: "11:30 AM", action: "Review procurement patterns", evidence: "PPE usage 3× baseline. No outbreak recorded.", status: "active" },
  { id: "A008", category: "Medicine Stock-Out Risk", severity: "high", confidence: 0.87, hospital: "Bandra PHC – Ward 5", generatedAt: "12:00 PM", action: "Redistribute from Mulund stock", evidence: "5 critical medicines below 30% threshold.", status: "active" },
  { id: "A009", category: "Bed Capacity Risk", severity: "medium", confidence: 0.79, hospital: "Kurla Sub-District Hospital", generatedAt: "01:15 PM", action: "Monitor and prepare overflow plan", evidence: "Occupancy trending upward. 88% at peak hours.", status: "acknowledged" },
  { id: "A010", category: "Staff Shortage", severity: "low", confidence: 0.70, hospital: "Mulund General Hospital", generatedAt: "02:00 PM", action: "No immediate action required", evidence: "1 nurse absent. Coverage maintained.", status: "resolved" },
];

// ---- Transfer Requests ----
export const transferRequests: TransferRequest[] = [
  { id: "T001", item: "Oxygen Cylinders", quantity: 50, from: "Sion Hospital", to: "BKC Superspeciality", status: "pending", urgency: "high", estimatedTime: "45 min", aiConfidence: 0.94 },
  { id: "T002", item: "Insulin Vials", quantity: 200, from: "Central Depot", to: "Dadar PHC – Ward 1", status: "approved", urgency: "critical", estimatedTime: "2 hours", aiConfidence: 0.92 },
  { id: "T003", item: "Paracetamol Stock", quantity: 500, from: "Mulund General Hospital", to: "Kurla Sub-District", status: "completed", urgency: "medium", estimatedTime: "1.5 hours", aiConfidence: 0.88 },
  { id: "T004", item: "Ventilator (Portable)", quantity: 2, from: "Mumbai Central GH", to: "Worli Critical Care", status: "pending", urgency: "critical", estimatedTime: "30 min", aiConfidence: 0.96 },
  { id: "T005", item: "PPE Kits", quantity: 200, from: "District Warehouse", to: "Thane District Hospital", status: "approved", urgency: "medium", estimatedTime: "3 hours", aiConfidence: 0.75 },
  { id: "T006", item: "Blood Units (O+)", quantity: 30, from: "Sion Hospital", to: "Andheri CHC", status: "pending", urgency: "high", estimatedTime: "1 hour", aiConfidence: 0.90 },
];

// ---- Citizen Feedback ----
export const citizenFeedback: CitizenFeedback = {
  overallSatisfaction: 3.7,
  totalReviews: 1842,
  distribution: [
    { stars: 5, count: 420, percentage: 22.8 },
    { stars: 4, count: 612, percentage: 33.2 },
    { stars: 3, count: 480, percentage: 26.1 },
    { stars: 2, count: 218, percentage: 11.8 },
    { stars: 1, count: 112, percentage: 6.1 },
  ],
  topComplaints: [
    { category: "Long Wait Times", count: 342, trend: "increasing" },
    { category: "Pharmacy Unavailable", count: 218, trend: "stable" },
    { category: "Cleanliness Issues", count: 186, trend: "decreasing" },
    { category: "Staff Behaviour", count: 134, trend: "stable" },
    { category: "Missing Reports", count: 98, trend: "increasing" },
  ],
  hospitalRatings: hospitals.map((h) => ({
    id: h.id,
    name: h.name,
    rating: h.citizenSatisfaction,
    reviews: Math.floor(Math.random() * 200) + 30,
  })).sort((a, b) => a.rating - b.rating),
};

// ---- Infrastructure Issues ----
export const infrastructureIssues: InfrastructureIssue[] = [
  { id: "I001", hospital: "Andheri CHC", type: "Water Supply", severity: "critical", description: "Ward 3 water tank pump failure. No running water in OPD area.", reportedAt: "09:10 AM", status: "open", estimatedResolution: "4 hours" },
  { id: "I002", hospital: "Kurla Sub-District", type: "HVAC System", severity: "high", description: "ICU air conditioning unit malfunction. Temperature rising above safe limits.", reportedAt: "07:45 AM", status: "in-progress", estimatedResolution: "2 hours" },
  { id: "I003", hospital: "Dadar PHC", type: "Electrical", severity: "high", description: "Frequent power fluctuations in Ward 1. Backup generator fuel low.", reportedAt: "06:30 AM", status: "open", estimatedResolution: "6 hours" },
  { id: "I004", hospital: "Worli Critical Care", type: "Medical Equipment", severity: "critical", description: "2 of 8 ventilators non-functional. Maintenance overdue by 3 weeks.", reportedAt: "05:00 AM", status: "open", estimatedResolution: "8 hours" },
  { id: "I005", hospital: "Thane District Hospital", type: "Network", severity: "medium", description: "Internet connectivity intermittent. Affecting digital records system.", reportedAt: "10:20 AM", status: "in-progress", estimatedResolution: "1 hour" },
  { id: "I006", hospital: "Bandra PHC", type: "Plumbing", severity: "medium", description: "Bathroom plumbing blockage in waiting area. Affecting 2 toilets.", reportedAt: "08:00 AM", status: "open", estimatedResolution: "3 hours" },
  { id: "I007", hospital: "Mumbai Central GH", type: "Elevator", severity: "low", description: "Service elevator on Floor 3 slow. Not affecting patient areas.", reportedAt: "11:00 AM", status: "in-progress", estimatedResolution: "2 hours" },
  { id: "I008", hospital: "BKC Superspeciality", type: "Fire Safety", severity: "high", description: "Smoke detector malfunction in Ward 5. Manual check scheduled.", reportedAt: "09:30 AM", status: "open", estimatedResolution: "4 hours" },
];

// ---- Executive Report Data ----
export const executiveReportData: ExecutiveReportData = {
  weeklyTrend: [
    { day: "Mon", score: 71, alerts: 8, transfers: 3 },
    { day: "Tue", score: 73, alerts: 6, transfers: 5 },
    { day: "Wed", score: 72, alerts: 9, transfers: 2 },
    { day: "Thu", score: 75, alerts: 7, transfers: 4 },
    { day: "Fri", score: 74, alerts: 10, transfers: 6 },
    { day: "Sat", score: 76, alerts: 5, transfers: 3 },
    { day: "Sun", score: 74, alerts: 10, transfers: 6 },
  ],
  hospitalPerformance: hospitals.map((h) => ({
    name: h.name.length > 20 ? h.name.slice(0, 20) + "…" : h.name,
    score: h.aiHealthScore,
    beds: h.beds.available,
    satisfaction: h.citizenSatisfaction,
  })),
  resourceUtilization: [
    { resource: "Beds", used: 72, available: 28 },
    { resource: "ICU", used: 86, available: 14 },
    { resource: "Doctors", used: 78, available: 22 },
    { resource: "Ambulances", used: 65, available: 35 },
    { resource: "Medicine", used: 62, available: 38 },
  ],
  monthlySummary: {
    totalAlerts: 148,
    resolvedAlerts: 126,
    totalTransfers: 42,
    completedTransfers: 38,
    avgSatisfaction: 3.7,
    totalPatients: 45200,
    emergencyResponses: 89,
    avgResponseTime: "12.4 min",
  },
};

// ---- AI Chat Messages (for Decision Assistant) ----
export const initialChatMessages: ChatMessage[] = [
  {
    id: 1,
    role: "assistant",
    content: "Welcome to the ArogyaOne AI Decision Assistant. I can help you analyze district health data, forecast resource needs, and recommend actions. What would you like to know?",
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
];

// ---- Settings Data ----
export const settingsData: SettingsData = {
  notifications: {
    criticalAlerts: true,
    highAlerts: true,
    mediumAlerts: false,
    lowAlerts: false,
    emailDigest: true,
    smsAlerts: true,
  },
  display: {
    theme: "light",
    language: "English",
    refreshInterval: 30,
    defaultMapView: "satellite",
  },
  access: [
    { name: "Dr. Priya Sharma", role: "District Health Officer", email: "dho@mumbai.gov.in", access: "Full Access", status: "active" },
    { name: "Dr. Rajesh Kulkarni", role: "Chief Medical Officer", email: "cmo@mumbai.gov.in", access: "Full Access", status: "active" },
    { name: "Anita Desai", role: "District Surveillance Officer", email: "surveillance@mumbai.gov.in", access: "Read + Approve", status: "active" },
    { name: "Vikram Patil", role: "Health Operations", email: "ops@mumbai.gov.in", access: "Read + Transfer", status: "active" },
    { name: "Sunita Reddy", role: "Emergency Coordinator", email: "emergency@mumbai.gov.in", access: "Full Access", status: "active" },
    { name: "Raj Mehta", role: "District Collector", email: "collector@mumbai.gov.in", access: "Read Only", status: "active" },
  ],
};

// ---- Utility helpers ----
export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    healthy: "#22c55e",
    warning: "#eab308",
    "high-risk": "#f97316",
    critical: "#ef4444",
  };
  return map[status] || "#94a3b8";
}

export function getSeverityColor(severity: string) {
  const map: Record<string, string> = {
    critical: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    low: "#22c55e",
  };
  return map[severity] || "#94a3b8";
}

export function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    healthy: "🟢 Healthy",
    warning: "🟡 Warning",
    "high-risk": "🟠 High Risk",
    critical: "🔴 Critical",
  };
  return map[status] || status;
}
