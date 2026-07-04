import { PALGHAR_HOSPITALS, type PalgharHospital } from "@/data/palgharHospitals";

export interface Hospital {
  id: string;
  name: string;
  type: "PHC" | "CHC" | "District Hospital";
  district: string;
  taluka: string;
  pinCode: string;
  address: string;
  contactNumber: string;
  departments: string[];
  emergencyServices: string[];
  totalBeds: number;
  availableBeds: number;
  icuCapacity: number;
  availableIcuBeds: number;
  doctorAttendance: string; // e.g. "8/10 Doctors Present"
  aiHealthScore: number; // out of 100
  citizenSatisfaction: number; // out of 100
  latitude: number; // for SVG map positioning
  longitude: number;
  activeIssues: number;
  averageWaitingTime: string;
  statusColor: "Healthy" | "Warning" | "High Risk" | "Critical";
}

export interface TimelineEvent {
  status: string;
  description: string;
  timestamp: string;
  updatedBy: string;
}

export interface Complaint {
  id: string;
  hospitalId: string;
  hospitalName: string;
  category: string;
  description: string;
  photoUrl?: string;
  videoUrl?: string;
  voiceUrl?: string;
  dateOfVisit: string;
  contactInfo?: string;
  isAnonymous: boolean;
  status: "Received" | "Under AI Analysis" | "Assigned to Department" | "Investigation in Progress" | "Resolved" | "Closed";
  department: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  priority: "Routine Investigation" | "High Priority" | "Immediate Attention";
  confidence: number; // e.g. 96
  sentiment: "Positive Experience" | "Neutral Feedback" | "Negative Experience";
  createdAt: string;
  updates: TimelineEvent[];
}

// Map Palghar hospitals to citizen portal expected format
export const INITIAL_HOSPITALS: Hospital[] = PALGHAR_HOSPITALS.map((h) => {
  const typeMap = (t: string): Hospital["type"] => {
    if (t.includes("Primary")) return "PHC";
    if (t.includes("Rural") || t.includes("Community")) return "CHC";
    return "District Hospital";
  };

  const statusColorMap = (id: number): Hospital["statusColor"] => {
    if (id % 5 === 0) return "Warning";
    if (id % 9 === 0) return "Critical";
    return "Healthy";
  };

  return {
    id: String(h.id),
    name: h.name,
    type: typeMap(h.facility_type),
    district: h.district,
    taluka: h.taluka,
    pinCode: h.pincode,
    address: h.address,
    contactNumber: h.phone,
    departments: h.departments,
    emergencyServices: h.services_24x7 ? ["24x7 ICU", "Ambulance", "Emergency Operations"] : ["General OPD"],
    totalBeds: h.total_beds,
    availableBeds: Math.floor(h.total_beds * 0.4),
    icuCapacity: h.icu_capacity,
    availableIcuBeds: Math.floor(h.icu_capacity * 0.3),
    doctorAttendance: `${Math.max(1, Math.floor(h.total_beds / 12))} / ${Math.max(2, Math.floor(h.total_beds / 8))} present`,
    aiHealthScore: h.services_24x7 ? 82 : 64,
    citizenSatisfaction: 75 + (h.id % 20),
    latitude: h.latitude,
    longitude: h.longitude,
    activeIssues: h.id % 4 === 0 ? 2 : 0,
    averageWaitingTime: `${20 + (h.id % 4) * 15} minutes`,
    statusColor: statusColorMap(h.id),
  };
});

// Helper functions for localStorage
const IS_SERVER = typeof window === "undefined";

export function getHospitals(): Hospital[] {
  if (IS_SERVER) return INITIAL_HOSPITALS;
  const stored = localStorage.getItem("arogya_hospitals");
  if (!stored) {
    localStorage.setItem("arogya_hospitals", JSON.stringify(INITIAL_HOSPITALS));
    return INITIAL_HOSPITALS;
  }
  return JSON.parse(stored);
}

// Synchronize citizen complaints read logic with the main shared context store!
export function getComplaints(): Complaint[] {
  if (IS_SERVER) return [];
  const stored = localStorage.getItem("aarogya_complaints");
  if (!stored) return [];
  
  const rawList = JSON.parse(stored) as any[];
  // Map AppDataContext Complaint to Citizen Complaint format
  return rawList.map((c) => {
    let displayStatus: Complaint["status"] = "Received";
    if (c.status === "Submitted") displayStatus = "Received";
    else if (c.status === "Under Review") displayStatus = "Under AI Analysis";
    else if (c.status === "Assigned to Department") displayStatus = "Assigned to Department";
    else if (c.status === "In Progress") displayStatus = "Investigation in Progress";
    else if (c.status === "Resolved") displayStatus = "Resolved";
    else if (c.status === "Closed") displayStatus = "Closed";

    return {
      id: c.id,
      hospitalId: String(c.hospital_id),
      hospitalName: c.hospital_name,
      category: c.category,
      description: c.description,
      dateOfVisit: c.date_of_visit,
      isAnonymous: c.is_anonymous,
      contactInfo: c.contact_info,
      status: displayStatus,
      department: c.assigned_department || "District Health Office",
      severity: c.severity,
      priority: c.priority === "Immediate Attention" ? "Immediate Attention" : c.priority === "High Priority" ? "High Priority" : "Routine Investigation",
      confidence: c.ai_confidence || 90,
      sentiment: c.severity === "Low" ? "Neutral Feedback" : "Negative Experience",
      createdAt: c.created_at,
      updates: c.timeline.map((t: any) => ({
        status: t.note.includes("classified") ? "Under AI Analysis" : displayStatus,
        description: t.note,
        timestamp: t.time,
        updatedBy: t.actor,
      })),
    };
  });
}

export function saveComplaint(complaint: Omit<Complaint, "id" | "status" | "createdAt" | "updates" | "confidence" | "severity" | "priority" | "department" | "sentiment">): Complaint {
  // Read existing complaints from the unified store
  const storedStr = localStorage.getItem("aarogya_complaints") || "[]";
  const complaintsList = JSON.parse(storedStr);

  const text = complaint.description.toLowerCase();
  let severity: "Low" | "Medium" | "High" | "Critical" = "Medium";
  let department = "District Health Office";
  let confidence = Math.floor(88 + Math.random() * 11);

  if (text.includes("leak") || text.includes("water") || text.includes("broken") || text.includes("infrastructure") || text.includes("damage") || text.includes("mri") || text.includes("x-ray")) {
    department = "Public Works Department";
    severity = "High";
  } else if (text.includes("medicine") || text.includes("paracetamol") || text.includes("antibiotic")) {
    department = "District Medical Store";
    severity = "Critical";
  } else if (text.includes("icu") || text.includes("oxygen") || text.includes("critical") || text.includes("ventilator")) {
    severity = "Critical";
    department = "Emergency Logistics Team";
  }

  const now = new Date().toISOString();
  const newId = `CMP-${String(Date.now()).slice(-6)}`;

  // Find full hospital name/details from ID
  const selectedHosp = PALGHAR_HOSPITALS.find((h) => String(h.id) === complaint.hospitalId) || PALGHAR_HOSPITALS[0];

  const newUnifiedComplaint = {
    id: newId,
    hospital_id: selectedHosp.id,
    hospital_name: selectedHosp.name,
    hospital_short_name: selectedHosp.short_name,
    taluka: selectedHosp.taluka,
    district: "Palghar",
    hospital_address: selectedHosp.address,
    hospital_phone: selectedHosp.phone,
    category: complaint.category,
    description: complaint.description,
    severity,
    priority: severity === "Critical" ? "Immediate Attention" : severity === "High" ? "High Priority" : "Routine",
    date_of_visit: complaint.dateOfVisit,
    is_anonymous: complaint.isAnonymous,
    reporter_name: complaint.isAnonymous ? undefined : "Citizen User",
    contact_info: complaint.contactInfo,
    status: "Submitted",
    ai_classification: complaint.category,
    ai_confidence: confidence,
    assigned_department: department,
    created_at: now,
    updated_at: now,
    timeline: [
      {
        time: new Date().toLocaleString("en-IN"),
        actor: complaint.isAnonymous ? "Anonymous Citizen" : "Citizen User",
        note: "Complaint submitted via AarogyaOne portal.",
      },
      {
        time: new Date().toLocaleString("en-IN"),
        actor: "AI System",
        note: `Auto-classified to ${department} with ${confidence}% confidence.`,
      },
    ],
  };

  const updatedList = [newUnifiedComplaint, ...complaintsList];
  localStorage.setItem("aarogya_complaints", JSON.stringify(updatedList));

  // Map back to output format
  return {
    id: newId,
    hospitalId: complaint.hospitalId,
    hospitalName: selectedHosp.name,
    category: complaint.category,
    description: complaint.description,
    dateOfVisit: complaint.dateOfVisit,
    isAnonymous: complaint.isAnonymous,
    status: "Received",
    department,
    severity,
    priority: severity === "Critical" ? "Immediate Attention" : severity === "High" ? "High Priority" : "Routine Investigation",
    confidence,
    sentiment: severity === "Low" ? "Neutral Feedback" : "Negative Experience",
    createdAt: now,
    updates: [
      {
        status: "Received",
        description: `Grievance registered in the system under ticket ID ${newId}.`,
        timestamp: now,
        updatedBy: "System",
      },
    ],
  };
}

export function updateComplaintStatusInMock(id: string, nextStatus: Complaint["status"], desc: string): Complaint | null {
  const storedStr = localStorage.getItem("aarogya_complaints") || "[]";
  const complaints = JSON.parse(storedStr);
  const index = complaints.findIndex((c: any) => c.id === id);
  if (index === -1) return null;

  // Map citizen nextStatus back to AppDataContext ComplaintStatus
  let targetStatus = "Submitted";
  if (nextStatus === "Investigation in Progress") targetStatus = "In Progress";
  else if (nextStatus === "Resolved") targetStatus = "Resolved";
  else if (nextStatus === "Closed") targetStatus = "Closed";
  else if (nextStatus === "Assigned to Department") targetStatus = "Assigned to Department";
  else if (nextStatus === "Under AI Analysis") targetStatus = "Under Review";

  const complaint = { ...complaints[index] };
  complaint.status = targetStatus;
  complaint.timeline = [
    ...complaint.timeline,
    {
      time: new Date().toLocaleString("en-IN"),
      actor: "Department Officer",
      note: desc,
    },
  ];

  complaints[index] = complaint;
  localStorage.setItem("aarogya_complaints", JSON.stringify(complaints));

  return getComplaints().find((c) => c.id === id) || null;
}
