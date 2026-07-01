"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
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
  districtInfo,
  districtSummary,
  districtHealthScore,
  riskDistribution,
  hospitals,
  operationalEvents,
  aiRecommendations,
  alerts,
  transferRequests,
  citizenFeedback,
  infrastructureIssues,
  executiveReportData,
  settingsData,
} from "@/data/mockData";

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
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((msg: string) => {
    setNotifications((prev) => [
      { id: Date.now(), message: msg, read: false },
      ...prev,
    ]);
  }, []);

  const value: DistrictContextValue = {
    districtInfo,
    districtSummary,
    districtHealthScore,
    riskDistribution,
    hospitals,
    operationalEvents,
    aiRecommendations,
    alerts,
    transferRequests,
    citizenFeedback,
    infrastructureIssues,
    executiveReportData,
    settingsData,
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
