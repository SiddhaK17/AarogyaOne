// ---- District Info ----
export interface DistrictInfo {
  name: string;
  code: string;
  state: string;
  population: string;
  area: string;
  dho: string;
  cmo: string;
  lastUpdated: string;
}

// ---- Summary Cards ----
export interface DistrictSummary {
  totalHospitalsConnected: number;
  activePHCs: number;
  activeCHCs: number;
  totalAvailableBeds: number;
  icuBedsAvailable: number;
  doctorsOnDuty: number;
  activeAmbulances: number;
  pendingCriticalIssues: number;
  [key: string]: number;
}

// ---- Health Score ----
export interface HealthScoreBreakdown {
  resourceAvailability: number;
  bedCapacity: number;
  staffAvailability: number;
  citizenSatisfaction: number;
  infrastructureHealth: number;
  aiRiskPredictions: number;
  [key: string]: number;
}

export interface DistrictHealthScore {
  overall: number;
  breakdown: HealthScoreBreakdown;
  trend: string;
  previousScore: number;
}

// ---- Risk ----
export interface RiskDistributionItem {
  level: string;
  count: number;
  color: string;
  hospitals: string[];
}

// ---- Hospital ----
export interface BedInfo {
  total: number;
  available: number;
  icu: { total: number; available: number };
}

export interface DoctorInfo {
  total: number;
  onDuty: number;
}

export interface Hospital {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  status: string;
  beds: BedInfo;
  doctors: DoctorInfo;
  medicineStock: number;
  citizenSatisfaction: number;
  aiHealthScore: number;
  activeIssues: number;
  ambulances: number;
  activeTransfers: number;
  activeComplaints: number;
}

// ---- Events ----
export interface OperationalEvent {
  id: number;
  type: string;
  title: string;
  detail: string;
  time: string;
  icon: string;
}

// ---- AI Recommendations ----
export interface AIRecommendation {
  id: string;
  title: string;
  confidence: number;
  reasoning: string;
  supportingData: string;
  expectedOutcome: string;
  priority: string;
  status: string;
}

// ---- Alerts ----
export interface Alert {
  id: string;
  category: string;
  severity: string;
  confidence: number;
  hospital: string;
  generatedAt: string;
  action: string;
  evidence: string;
  status: string;
}

// ---- Transfer Requests ----
export interface TransferRequest {
  id: string;
  item: string;
  quantity: number;
  from: string;
  to: string;
  status: string;
  urgency: string;
  estimatedTime: string;
  aiConfidence: number;
}

// ---- Citizen Feedback ----
export interface FeedbackDistribution {
  stars: number;
  count: number;
  percentage: number;
}

export interface ComplaintCategory {
  category: string;
  count: number;
  trend: string;
}

export interface HospitalRating {
  id: string;
  name: string;
  rating: number;
  reviews: number;
}

export interface CitizenFeedback {
  overallSatisfaction: number;
  totalReviews: number;
  distribution: FeedbackDistribution[];
  topComplaints: ComplaintCategory[];
  hospitalRatings: HospitalRating[];
}

// ---- Infrastructure ----
export interface InfrastructureIssue {
  id: string;
  hospital: string;
  type: string;
  severity: string;
  description: string;
  reportedAt: string;
  status: string;
  estimatedResolution: string;
}

// ---- Executive Reports ----
export interface WeeklyTrend {
  day: string;
  score: number;
  alerts: number;
  transfers: number;
}

export interface HospitalPerformance {
  name: string;
  score: number;
  beds: number;
  satisfaction: number;
}

export interface ResourceUtilization {
  resource: string;
  used: number;
  available: number;
}

export interface MonthlySummary {
  totalAlerts: number;
  resolvedAlerts: number;
  totalTransfers: number;
  completedTransfers: number;
  avgSatisfaction: number;
  totalPatients: number;
  emergencyResponses: number;
  avgResponseTime: string;
}

export interface ExecutiveReportData {
  weeklyTrend: WeeklyTrend[];
  hospitalPerformance: HospitalPerformance[];
  resourceUtilization: ResourceUtilization[];
  monthlySummary: MonthlySummary;
}

// ---- Settings ----
export interface NotificationSettings {
  criticalAlerts: boolean;
  highAlerts: boolean;
  mediumAlerts: boolean;
  lowAlerts: boolean;
  emailDigest: boolean;
  smsAlerts: boolean;
  [key: string]: boolean;
}

export interface DisplaySettings {
  theme: string;
  language: string;
  refreshInterval: number;
  defaultMapView: string;
}

export interface AccessUser {
  name: string;
  role: string;
  email: string;
  access: string;
  status: string;
}

export interface SettingsData {
  notifications: NotificationSettings;
  display: DisplaySettings;
  access: AccessUser[];
}

// ---- Notification ----
export interface Notification {
  id: number;
  message: string;
  read: boolean;
}

// ---- Score Dimensions ----
export interface ScoreDimensions {
  operationalEfficiency: number;
  medicineAvailability: number;
  infrastructureReliability: number;
  citizenSatisfaction: number;
  attendanceConsistency: number;
  emergencyReadiness: number;
  [key: string]: number;
}

// ---- AI Chat Message ----
export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  confidence?: number;
  timestamp: string;
}

// ---- AI Insight ----
export interface AIInsight {
  type: string;
  text: string;
}

// ---- Event Icon Map ----
export interface EventIconEntry {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  className: string;
}

export interface EventIconMap {
  [key: string]: EventIconEntry;
}
