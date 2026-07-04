'use client';

/**
 * AarogyaOne — Cross-Portal Application Data Context
 * ====================================================
 * Provides a shared data bridge so that:
 *  - Citizen complaints filed appear in Hospital + Government portals
 *  - Hospital issues appear in Government portal
 *  - DHIC sees aggregated stats from all portals
 *
 * Uses localStorage for persistence across browser tabs + page navigations,
 * with React state for reactivity within a portal session.
 *
 * Keys:
 *   aarogya_complaints      — CitizenComplaint[]
 *   aarogya_infra_issues    — InfrastructureIssue[]
 *   aarogya_active_hospital — ActiveHospitalSession
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { PalgharHospital } from '@/data/palgharHospitals';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ComplaintStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned to Department'
  | 'In Progress'
  | 'Resolved'
  | 'Closed';

export type IssueSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintCategory =
  | 'Medicine Not Available'
  | 'Doctor Unavailable'
  | 'Long Waiting Time'
  | 'Equipment Not Working'
  | 'Cleanliness Issues'
  | 'Staff Behaviour'
  | 'Infrastructure Damage'
  | 'Emergency Services'
  | 'Other';

export interface CitizenComplaint {
  id: string;
  // Hospital context
  hospital_id: number;
  hospital_name: string;
  hospital_short_name: string;
  taluka: string;
  district: 'Palghar';
  hospital_address: string;
  hospital_phone: string;
  // Complaint details
  category: ComplaintCategory;
  description: string;
  severity: IssueSeverity;
  priority: 'Routine' | 'High Priority' | 'Immediate Attention';
  date_of_visit: string;
  // Contact
  is_anonymous: boolean;
  contact_info?: string;
  reporter_name?: string;
  // Media
  photo_url?: string;
  voice_transcript?: string;
  // Status tracking
  status: ComplaintStatus;
  assigned_department?: string;
  ai_classification?: string;
  ai_confidence?: number;
  // Timestamps
  created_at: string;
  updated_at: string;
  // History
  timeline: Array<{ time: string; actor: string; note: string }>;
}

export interface InfrastructureIssue {
  id: string;
  hospital_id: number;
  hospital_name: string;
  taluka: string;
  district: 'Palghar';
  title: string;
  description: string;
  type: string;
  department: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved';
  reporter: string;
  ai_category: string;
  ai_severity: string;
  ai_urgency: string;
  created_at: string;
  updated_at: string;
}

export interface ActiveHospitalSession {
  hospital_id: number;
  hospital_name: string;
  hospital_short_name: string;
  taluka: string;
  district: string;
  facility_type: string;
  registration_no: string;
  user_name: string;
  user_designation: string;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const KEYS = {
  COMPLAINTS: 'aarogya_complaints',
  INFRA_ISSUES: 'aarogya_infra_issues',
  HOSPITAL_SESSION: 'aarogya_hospital_session',
} as const;

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLS<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota */ }
}

// ─── Seed demo complaints for hackathon demo ──────────────────────────────────

const DEMO_COMPLAINTS: CitizenComplaint[] = [
  {
    id: 'CMP-001',
    hospital_id: 1,
    hospital_name: 'District General Hospital Palghar',
    hospital_short_name: 'DGH Palghar',
    taluka: 'Palghar',
    district: 'Palghar',
    hospital_address: 'Civil Hospital Road, Near Collectorate, Palghar - 401404',
    hospital_phone: '02525-252021',
    category: 'Doctor Unavailable',
    description: 'No doctor was available in the OPD from 10 AM to 12 PM. Patients including elderly were made to wait for over 2 hours without any information.',
    severity: 'High',
    priority: 'High Priority',
    date_of_visit: '2026-07-01',
    is_anonymous: false,
    reporter_name: 'Ramesh Patil',
    contact_info: '9876543210',
    status: 'Assigned to Department',
    assigned_department: 'Medical Superintendent Office',
    ai_classification: 'Staffing Gap — OPD Coverage',
    ai_confidence: 91,
    created_at: '2026-07-01T12:30:00Z',
    updated_at: '2026-07-01T14:00:00Z',
    timeline: [
      { time: '2026-07-01 12:30 PM', actor: 'Ramesh Patil (Citizen)', note: 'Complaint submitted via AarogyaOne.' },
      { time: '2026-07-01 12:31 PM', actor: 'AI System', note: 'Auto-classified as Staffing Gap. Severity: High. Routed to Medical Superintendent.' },
      { time: '2026-07-01 2:00 PM', actor: 'Govt. Authority', note: 'Assigned to Medical Superintendent Office for investigation.' },
    ],
  },
  {
    id: 'CMP-002',
    hospital_id: 4,
    hospital_name: 'Primary Health Centre Agashi',
    hospital_short_name: 'PHC Agashi',
    taluka: 'Palghar',
    district: 'Palghar',
    hospital_address: 'Agashi Village, Near Agashi Beach Road, Palghar - 401301',
    hospital_phone: '02525-224100',
    category: 'Medicine Not Available',
    description: 'Paracetamol and ORS packets were not available. Pharmacist said stock has been out for 3 days. Patients had to buy from private pharmacy.',
    severity: 'Critical',
    priority: 'Immediate Attention',
    date_of_visit: '2026-07-02',
    is_anonymous: false,
    reporter_name: 'Sunita Borse',
    contact_info: '9823456710',
    status: 'In Progress',
    assigned_department: 'District Medical Store',
    ai_classification: 'Medicine Stockout — Essential Drugs',
    ai_confidence: 97,
    created_at: '2026-07-02T09:15:00Z',
    updated_at: '2026-07-02T11:00:00Z',
    timeline: [
      { time: '2026-07-02 9:15 AM', actor: 'Sunita Borse (Citizen)', note: 'Complaint submitted via AarogyaOne.' },
      { time: '2026-07-02 9:16 AM', actor: 'AI System', note: 'Critical stockout detected. Immediate attention required. Routed to District Medical Store.' },
      { time: '2026-07-02 11:00 AM', actor: 'Govt. Authority', note: 'Emergency resupply order raised with District Medical Store.' },
    ],
  },
  {
    id: 'CMP-003',
    hospital_id: 12,
    hospital_name: 'Rural Hospital Dahanu',
    hospital_short_name: 'RH Dahanu',
    taluka: 'Dahanu',
    district: 'Palghar',
    hospital_address: 'Dahanu Road, Near Dahanu Railway Station, Dahanu - 401602',
    hospital_phone: '02528-222100',
    category: 'Equipment Not Working',
    description: 'X-Ray machine has been non-functional for the past week. Patients are being referred to private hospitals for basic X-ray imaging.',
    severity: 'High',
    priority: 'High Priority',
    date_of_visit: '2026-07-01',
    is_anonymous: true,
    status: 'Submitted',
    ai_classification: 'Biomedical Equipment Failure',
    ai_confidence: 88,
    created_at: '2026-07-01T16:45:00Z',
    updated_at: '2026-07-01T16:45:00Z',
    timeline: [
      { time: '2026-07-01 4:45 PM', actor: 'Anonymous Citizen', note: 'Complaint submitted via AarogyaOne.' },
      { time: '2026-07-01 4:46 PM', actor: 'AI System', note: 'Biomedical equipment failure detected. Routed to Biomedical Engineering Team.' },
    ],
  },
];

const DEMO_ISSUES: InfrastructureIssue[] = [
  {
    id: 'ISS-001',
    hospital_id: 1,
    hospital_name: 'District General Hospital Palghar',
    taluka: 'Palghar',
    district: 'Palghar',
    title: 'Generator Not Starting',
    description: 'Main backup generator failed during morning power outage. ICU is on manual backup.',
    type: 'Electrical',
    department: 'Facilities',
    priority: 'Critical',
    status: 'Open',
    reporter: 'Suresh Gade',
    ai_category: 'Electrical / PWD',
    ai_severity: 'Critical',
    ai_urgency: 'Immediate',
    created_at: '2026-07-02T08:00:00Z',
    updated_at: '2026-07-02T08:00:00Z',
  },
  {
    id: 'ISS-002',
    hospital_id: 7,
    hospital_name: 'Sub-District Hospital Vasai',
    taluka: 'Vasai',
    district: 'Palghar',
    title: 'Roof Leakage in Ward B',
    description: 'Heavy rain causing water leakage from roof in Ward B. Patients being shifted.',
    type: 'Civil',
    department: 'General Ward',
    priority: 'High',
    status: 'In Progress',
    reporter: 'Nurse Coordinator',
    ai_category: 'PWD / Civil',
    ai_severity: 'High',
    ai_urgency: 'Within 24 Hours',
    created_at: '2026-07-01T10:00:00Z',
    updated_at: '2026-07-01T14:00:00Z',
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppDataContextValue {
  // Complaints
  complaints: CitizenComplaint[];
  addComplaint: (c: Omit<CitizenComplaint, 'id' | 'created_at' | 'updated_at' | 'timeline'>) => CitizenComplaint;
  updateComplaintStatus: (id: string, status: ComplaintStatus, actor: string, note: string) => void;
  getComplaintsForHospital: (hospitalId: number) => CitizenComplaint[];

  // Infrastructure Issues
  infraIssues: InfrastructureIssue[];
  addInfraIssue: (issue: Omit<InfrastructureIssue, 'id' | 'created_at' | 'updated_at'>) => void;
  updateIssueStatus: (id: string, status: InfrastructureIssue['status']) => void;
  getIssuesForHospital: (hospitalId: number) => InfrastructureIssue[];

  // Active hospital session
  activeHospital: ActiveHospitalSession | null;
  setActiveHospital: (session: ActiveHospitalSession | null) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [complaints, setComplaints] = useState<CitizenComplaint[]>(() =>
    readLS(KEYS.COMPLAINTS, DEMO_COMPLAINTS)
  );
  const [infraIssues, setInfraIssues] = useState<InfrastructureIssue[]>(() =>
    readLS(KEYS.INFRA_ISSUES, DEMO_ISSUES)
  );
  const [activeHospital, setActiveHospitalState] = useState<ActiveHospitalSession | null>(() =>
    readLS(KEYS.HOSPITAL_SESSION, null)
  );

  // Sync to localStorage on change
  useEffect(() => { writeLS(KEYS.COMPLAINTS, complaints); }, [complaints]);
  useEffect(() => { writeLS(KEYS.INFRA_ISSUES, infraIssues); }, [infraIssues]);
  useEffect(() => { writeLS(KEYS.HOSPITAL_SESSION, activeHospital); }, [activeHospital]);

  const addComplaint = useCallback(
    (data: Omit<CitizenComplaint, 'id' | 'created_at' | 'updated_at' | 'timeline'>): CitizenComplaint => {
      const now = new Date().toISOString();
      const id = `CMP-${String(Date.now()).slice(-6)}`;
      const complaint: CitizenComplaint = {
        ...data,
        id,
        created_at: now,
        updated_at: now,
        timeline: [
          {
            time: new Date().toLocaleString('en-IN'),
            actor: data.is_anonymous ? 'Anonymous Citizen' : (data.reporter_name ?? 'Citizen'),
            note: 'Complaint submitted via AarogyaOne portal.',
          },
          {
            time: new Date().toLocaleString('en-IN'),
            actor: 'AI System',
            note: `Auto-classified as "${data.ai_classification ?? data.category}". Severity: ${data.severity}. Routed to concerned department.`,
          },
        ],
      };
      setComplaints((prev) => [complaint, ...prev]);
      return complaint;
    },
    []
  );

  const updateComplaintStatus = useCallback(
    (id: string, status: ComplaintStatus, actor: string, note: string) => {
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status,
                updated_at: new Date().toISOString(),
                timeline: [
                  ...c.timeline,
                  { time: new Date().toLocaleString('en-IN'), actor, note },
                ],
              }
            : c
        )
      );
    },
    []
  );

  const getComplaintsForHospital = useCallback(
    (hospitalId: number) => complaints.filter((c) => c.hospital_id === hospitalId),
    [complaints]
  );

  const addInfraIssue = useCallback(
    (data: Omit<InfrastructureIssue, 'id' | 'created_at' | 'updated_at'>) => {
      const now = new Date().toISOString();
      const issue: InfrastructureIssue = {
        ...data,
        id: `ISS-${String(Date.now()).slice(-6)}`,
        created_at: now,
        updated_at: now,
      };
      setInfraIssues((prev) => [issue, ...prev]);
    },
    []
  );

  const updateIssueStatus = useCallback(
    (id: string, status: InfrastructureIssue['status']) => {
      setInfraIssues((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, status, updated_at: new Date().toISOString() } : i
        )
      );
    },
    []
  );

  const getIssuesForHospital = useCallback(
    (hospitalId: number) => infraIssues.filter((i) => i.hospital_id === hospitalId),
    [infraIssues]
  );

  const setActiveHospital = useCallback((session: ActiveHospitalSession | null) => {
    setActiveHospitalState(session);
  }, []);

  return (
    <AppDataContext.Provider
      value={{
        complaints,
        addComplaint,
        updateComplaintStatus,
        getComplaintsForHospital,
        infraIssues,
        addInfraIssue,
        updateIssueStatus,
        getIssuesForHospital,
        activeHospital,
        setActiveHospital,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside <AppDataProvider>');
  return ctx;
}
