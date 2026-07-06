"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
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
  Notification,
} from "@/types";
import {
  executiveReportData as mockExecutiveReportData,
  settingsData as mockSettingsData,
  aiRecommendations as mockAiRecommendations,
} from "@/data/mockData";
import { dhicApi, subscribeToInventoryChanges, subscribeToBedChanges, subscribeToComplaints } from "@/lib/api";

interface DistrictContextValue {
  districtInfo: DistrictInfo;
  districtSummary: DistrictSummary;
  districtHealthScore: DistrictHealthScore;
  riskDistribution: RiskDistributionItem[];
  hospitals: Hospital[];
  operationalEvents: OperationalEvent[];
  aiRecommendations: AIRecommendation[];
  alerts: Alert[];
  transferRequests: TransferRequest[];
  citizenFeedback: CitizenFeedback;
  infrastructureIssues: InfrastructureIssue[];
  executiveReportData: ExecutiveReportData;
  settingsData: SettingsData;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  selectedHospital: Hospital | null;
  setSelectedHospital: (hospital: Hospital | null) => void;
  notifications: Notification[];
  addNotification: (msg: string) => void;
  acknowledgeAlert: (id: string) => Promise<void>;
  approveRecommendation: (id: string) => void;
  deferRecommendation: (id: string) => void;
}

const DistrictContext = createContext<DistrictContextValue | null>(null);

export function DistrictProvider({ children }: { children: ReactNode }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [districtSummary, setDistrictSummary] = useState<DistrictSummary | null>(null);
  const [districtHealthScore, setDistrictHealthScore] = useState<DistrictHealthScore | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [riskDistribution, setRiskDistribution] = useState<RiskDistributionItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [citizenFeedback, setCitizenFeedback] = useState<CitizenFeedback | null>(null);
  const [infrastructureIssues, setInfrastructureIssues] = useState<InfrastructureIssue[]>([]);
  const [operationalEvents, setOperationalEvents] = useState<OperationalEvent[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>(mockAiRecommendations);

  const acknowledgeAlert = async (id: string) => {
    try {
      await dhicApi.acknowledgeAlert(parseInt(id));
    } catch (e) {
      console.warn('API offline, optimistic update for alert:', id);
    }
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'acknowledged' as any } : a)));
    addNotification(`Alert #${id} acknowledged.`);
  };

  const approveRecommendation = (id: string) => {
    setAiRecommendations((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved' as any } : r)));
    addNotification(`AI Recommendation approved.`);
  };

  const deferRecommendation = (id: string) => {
    setAiRecommendations((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'deferred' as any } : r)));
    addNotification(`AI Recommendation deferred.`);
  };

  const addNotification = useCallback((msg: string) => {
    setNotifications((prev) => [
      { id: Date.now(), message: msg, read: false },
      ...prev,
    ]);
  }, []);

  const districtInfo: DistrictInfo = {
    name: "Palghar District",
    code: "MH-48",
    state: "Maharashtra",
    population: "3.0 Million",
    area: "4,696 km²",
    dho: "Dr. Rajesh Patil",
    cmo: "Dr. Priya Sharma",
    lastUpdated: new Date().toISOString(),
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashboardRes, hospitalsRes, alertsRes, transfersRes, feedbackRes, infraRes] = await Promise.all([
          dhicApi.getDashboard().catch(() => null) as Promise<any>,
          dhicApi.getHospitals().catch(() => []) as Promise<any[]>,
          dhicApi.getAlerts().catch(() => []) as Promise<any[]>,
          dhicApi.getTransfers().catch(() => []) as Promise<any[]>,
          dhicApi.getFeedback().catch(() => null) as Promise<any>,
          dhicApi.getInfrastructure().catch(() => []) as Promise<any[]>
        ]);

        if (dashboardRes) {
          setDistrictSummary({
            totalHospitalsConnected: dashboardRes.total_hospitals || 0,
            activePHCs: dashboardRes.phc_count || 0,
            activeCHCs: dashboardRes.chc_count || 0,
            totalAvailableBeds: dashboardRes.total_available_beds || 0,
            icuBedsAvailable: dashboardRes.icu_beds_available || 0,
            doctorsOnDuty: dashboardRes.doctors_on_duty || 0,
            activeAmbulances: dashboardRes.active_ambulances || 0,
            pendingCriticalIssues: dashboardRes.pending_critical_issues || 0,
          });
          
          setDistrictHealthScore({
            overall: dashboardRes.district_health_score || 0,
            breakdown: {
              resourceAvailability: 76,
              bedCapacity: 74,
              staffAvailability: 68,
              citizenSatisfaction: 80,
              infrastructureHealth: 72,
              aiRiskPredictions: 75,
            },
            trend: (dashboardRes.district_health_score || 0) > 70 ? "stable" : "declining",
            previousScore: 73,
          });
        }

        if (hospitalsRes && Array.isArray(hospitalsRes)) {
          const mappedHospitals: Hospital[] = hospitalsRes.map((h: any) => ({
            id: String(h.id),
            name: h.name,
            type: h.facility_type,
            lat: h.latitude || 0,
            lng: h.longitude || 0,
            status: h.risk_level === 'Critical' ? 'critical' : h.risk_level === 'High' ? 'warning' : 'healthy',
            beds: {
              total: h.total_beds,
              available: h.available_beds,
              icu: { total: 0, available: 0 }
            },
            doctors: { total: 0, onDuty: 0 },
            medicineStock: 100 - ((h.low_stock_count || 0) * 5),
            citizenSatisfaction: 4.0,
            aiHealthScore: h.health_score,
            activeIssues: h.open_issues,
            ambulances: 0,
            activeTransfers: 0,
            activeComplaints: 0,
          }));
          setHospitals(mappedHospitals);

          const low = mappedHospitals.filter(h => h.status === "healthy").length;
          const medium = mappedHospitals.filter(h => h.status === "warning").length;
          const critical = mappedHospitals.filter(h => h.status === "critical").length;

          setRiskDistribution([
            { level: "Low Risk", count: low, color: "#22c55e", hospitals: [] },
            { level: "Medium Risk", count: medium, color: "#eab308", hospitals: [] },
            { level: "High Risk", count: 0, color: "#f97316", hospitals: [] },
            { level: "Critical", count: critical, color: "#ef4444", hospitals: [] },
          ]);
        }
        
        if (alertsRes && Array.isArray(alertsRes)) {
           setAlerts(alertsRes.map((a: any) => ({
             id: String(a.id),
             category: a.category || 'System',
             severity: (a.priority || 'Low').toLowerCase(),
             confidence: 90,
             hospital: '',
             generatedAt: a.created_at,
             action: a.action_url || '',
             evidence: '',
             status: a.is_read ? 'Read' : 'Unread'
           })));
        }
        
        if (transfersRes && Array.isArray(transfersRes)) {
           setTransferRequests(transfersRes.map((t: any) => ({
             id: String(t.id),
             item: t.item,
             quantity: t.quantity,
             from: t.from_hospital,
             to: t.to_hospital,
             status: t.status,
             urgency: 'Medium',
             estimatedTime: `${t.eta_minutes} mins`,
             aiConfidence: 95
           })));
        }

        if (infraRes && Array.isArray(infraRes)) {
           setInfrastructureIssues(infraRes.map((i: any) => ({
             id: String(i.id),
             hospital: i.hospital_name,
             type: i.issue_type,
             severity: i.priority,
             description: i.title,
             reportedAt: i.created_at,
             status: i.status,
             estimatedResolution: '24 hrs',
             ai_assigned_department: i.ai_assigned_department
           })));
           
           setOperationalEvents(infraRes.map((i: any, idx: number) => ({
             id: i.id || idx,
             type: "infrastructure",
             title: `Hospital Issue: ${i.title}`,
             detail: `Status: ${i.status}`,
             time: new Date(i.created_at).toLocaleTimeString('en-IN'),
             icon: "infrastructure",
           })));
        }
        
        if (feedbackRes) {
           setCitizenFeedback(feedbackRes as CitizenFeedback);
        }

      } catch (err) {
        console.error("Failed to load DHIC data", err);
      }
    }
    
    fetchData();

    // Subscribe to realtime changes
    const unsubInv = subscribeToInventoryChanges(() => fetchData());
    const unsubBed = subscribeToBedChanges(() => fetchData());
    const unsubComp = subscribeToComplaints(() => fetchData());

    return () => {
      unsubInv();
      unsubBed();
      unsubComp();
    };
  }, []);

  const value: DistrictContextValue = {
    districtInfo,
    districtSummary: districtSummary || {
      totalHospitalsConnected: 0, activePHCs: 0, activeCHCs: 0,
      totalAvailableBeds: 0, icuBedsAvailable: 0, doctorsOnDuty: 0,
      activeAmbulances: 0, pendingCriticalIssues: 0
    },
    districtHealthScore: districtHealthScore || {
      overall: 0, breakdown: { resourceAvailability: 0, bedCapacity: 0, staffAvailability: 0, citizenSatisfaction: 0, infrastructureHealth: 0, aiRiskPredictions: 0 },
      trend: "stable", previousScore: 0
    },
    riskDistribution,
    hospitals,
    operationalEvents,
    aiRecommendations,
    alerts,
    transferRequests,
    citizenFeedback: citizenFeedback || { overallSatisfaction: 0, totalReviews: 0, distribution: [], topComplaints: [], hospitalRatings: [] },
    infrastructureIssues,
    executiveReportData: mockExecutiveReportData,
    settingsData: mockSettingsData,
    activeFilter,
    setActiveFilter,
    selectedHospital,
    setSelectedHospital,
    notifications,
    addNotification,
    acknowledgeAlert,
    approveRecommendation,
    deferRecommendation,
  };

  return (
    <DistrictContext.Provider value={value}>{children}</DistrictContext.Provider>
  );
}

export function useDistrict(): DistrictContextValue {
  const ctx = useContext(DistrictContext);
  if (!ctx) throw new Error("useDistrict must be used within DistrictProvider");
  return ctx;
}
