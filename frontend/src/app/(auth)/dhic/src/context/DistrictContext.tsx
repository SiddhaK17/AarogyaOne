"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from "react";
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
  alerts as mockAlerts,
  transferRequests as mockTransferRequests,
  citizenFeedback as mockCitizenFeedback,
  executiveReportData as mockExecutiveReportData,
  settingsData as mockSettingsData,
  aiRecommendations as mockAiRecommendations,
} from "@/data/mockData";
import { PALGHAR_HOSPITALS } from "@/data/palgharHospitals";
import { useAppData } from "@/context/AppDataContext";

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
}

const DistrictContext = createContext<DistrictContextValue | null>(null);

export function DistrictProvider({ children }: { children: ReactNode }) {
  const { complaints, infraIssues } = useAppData();
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((msg: string) => {
    setNotifications((prev) => [
      { id: Date.now(), message: msg, read: false },
      ...prev,
    ]);
  }, []);

  // Compute District Info (Palghar Scoped)
  const districtInfo = useMemo<DistrictInfo>(() => ({
    name: "Palghar District",
    code: "MH-48",
    state: "Maharashtra",
    population: "3.0 Million",
    area: "4,696 km²",
    dho: "Dr. Rajesh Patil",
    cmo: "Dr. Priya Sharma",
    lastUpdated: new Date().toISOString(),
  }), []);

  // Compute Dynamic Hospitals List
  const hospitalsList = useMemo<Hospital[]>(() => {
    return PALGHAR_HOSPITALS.map((h, idx) => {
      // Find active complaints & issues from context
      const activeComplaints = complaints.filter(
        c => c.hospital_id === h.id && c.status !== 'Resolved' && c.status !== 'Closed'
      ).length;

      const activeIssues = infraIssues.filter(
        i => i.hospital_id === h.id && i.status !== 'Resolved'
      ).length;

      // Seed dynamic properties based on hospital metadata
      const totalBeds = h.total_beds;
      const availableBeds = Math.floor(totalBeds * 0.45); // 45% available
      const totalICU = h.icu_capacity;
      const availableICU = Math.floor(totalICU * 0.35); // 35% available

      // Determine status
      let status = "healthy";
      if (activeComplaints > 2 || activeIssues > 2) status = "critical";
      else if (activeComplaints > 0 || activeIssues > 0 || availableBeds < 5) status = "warning";

      // AI Health Score calculation
      const baseScore = h.services_24x7 ? 80 : 60;
      const deduction = (activeComplaints * 8) + (activeIssues * 10);
      const aiHealthScore = Math.max(30, Math.min(100, baseScore - deduction));

      return {
        id: `H${String(h.id).padStart(3, "0")}`,
        name: h.name,
        type: h.facility_type,
        lat: h.latitude,
        lng: h.longitude,
        status,
        beds: {
          total: totalBeds,
          available: availableBeds,
          icu: { total: totalICU, available: availableICU }
        },
        doctors: {
          total: Math.max(2, Math.floor(totalBeds / 8)),
          onDuty: Math.max(1, Math.floor(totalBeds / 10))
        },
        medicineStock: Math.max(40, 95 - (idx * 2) % 35), // dynamic stock
        citizenSatisfaction: parseFloat((3.8 + (idx * 0.1) % 1.2).toFixed(1)),
        aiHealthScore,
        activeIssues,
        ambulances: h.has_ambulance ? 2 : 0,
        activeTransfers: 0,
        activeComplaints,
      };
    });
  }, [complaints, infraIssues]);

  // Compute District Summary Cards
  const districtSummary = useMemo<DistrictSummary>(() => {
    let totalBeds = 0;
    let icuBeds = 0;
    let doctorsOnDuty = 0;
    let ambulances = 0;

    hospitalsList.forEach(h => {
      totalBeds += h.beds.available;
      icuBeds += h.beds.icu.available;
      doctorsOnDuty += h.doctors.onDuty;
      ambulances += h.ambulances;
    });

    const activePHCs = PALGHAR_HOSPITALS.filter(h => h.facility_type === "Primary Health Centre (PHC)").length;
    const activeCHCs = PALGHAR_HOSPITALS.filter(h => h.facility_type.includes("Rural") || h.facility_type.includes("Sub-District")).length;

    return {
      totalHospitalsConnected: PALGHAR_HOSPITALS.length,
      activePHCs,
      activeCHCs,
      totalAvailableBeds: totalBeds,
      icuBedsAvailable: icuBeds,
      doctorsOnDuty,
      activeAmbulances: ambulances,
      pendingCriticalIssues: complaints.filter(c => c.severity === 'Critical').length + infraIssues.filter(i => i.priority === 'Critical').length,
    };
  }, [hospitalsList, complaints, infraIssues]);

  // Compute District Health Score
  const districtHealthScore = useMemo<DistrictHealthScore>(() => {
    const totalScore = hospitalsList.reduce((acc, h) => acc + h.aiHealthScore, 0);
    const avgScore = Math.round(totalScore / hospitalsList.length);

    return {
      overall: avgScore,
      breakdown: {
        resourceAvailability: 76,
        bedCapacity: 74,
        staffAvailability: 68,
        citizenSatisfaction: 80,
        infrastructureHealth: 72,
        aiRiskPredictions: 75,
      },
      trend: avgScore > 70 ? "stable" : "declining",
      previousScore: 73,
    };
  }, [hospitalsList]);

  // Compute Risk Distribution
  const riskDistribution = useMemo<RiskDistributionItem[]>(() => {
    const low = hospitalsList.filter(h => h.status === "healthy").length;
    const medium = hospitalsList.filter(h => h.status === "warning").length;
    const critical = hospitalsList.filter(h => h.status === "critical").length;

    return [
      { level: "Low Risk", count: low, color: "#22c55e", hospitals: [] },
      { level: "Medium Risk", count: medium, color: "#eab308", hospitals: [] },
      { level: "High Risk", count: 0, color: "#f97316", hospitals: [] },
      { level: "Critical", count: critical, color: "#ef4444", hospitals: [] },
    ];
  }, [hospitalsList]);

  // Compute Operational Events Feed
  const operationalEvents = useMemo<OperationalEvent[]>(() => {
    const events: OperationalEvent[] = [];

    complaints.slice(0, 5).forEach((c, idx) => {
      events.push({
        id: idx + 1,
        type: "complaint",
        title: `Citizen Complaint: ${c.category}`,
        detail: `Reported at ${c.hospital_short_name} (${c.taluka} Taluka). Status: ${c.status}`,
        time: new Date(c.created_at).toLocaleTimeString('en-IN'),
        icon: "complaint",
      });
    });

    infraIssues.slice(0, 5).forEach((i, idx) => {
      events.push({
        id: idx + 10,
        type: "infrastructure",
        title: `Hospital Issue: ${i.title}`,
        detail: `Logged by ${i.hospital_name} (${i.taluka} Taluka). Status: ${i.status}`,
        time: new Date(i.created_at).toLocaleTimeString('en-IN'),
        icon: "infrastructure",
      });
    });

    return events.sort((a, b) => b.id - a.id);
  }, [complaints, infraIssues]);

  const value: DistrictContextValue = {
    districtInfo,
    districtSummary,
    districtHealthScore,
    riskDistribution,
    hospitals: hospitalsList,
    operationalEvents,
    aiRecommendations: mockAiRecommendations,
    alerts: mockAlerts,
    transferRequests: mockTransferRequests,
    citizenFeedback: mockCitizenFeedback,
    infrastructureIssues: infraIssues as any,
    executiveReportData: mockExecutiveReportData,
    settingsData: mockSettingsData,
    activeFilter,
    setActiveFilter,
    selectedHospital,
    setSelectedHospital,
    notifications,
    addNotification,
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
