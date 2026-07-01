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

export const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: "hosp-1",
    name: "Mumbai District Civil Hospital",
    type: "District Hospital",
    district: "Mumbai",
    taluka: "Mumbai",
    pinCode: "400001",
    address: "Dr. Annie Besant Rd, Worli, Mumbai, Maharashtra 400018",
    contactNumber: "+91 22 2493 1234",
    departments: ["Emergency", "Cardiology", "Pediatrics", "Radiology", "General Medicine"],
    emergencyServices: ["24x7 ICU", "Ambulance", "Oxygen Plant", "Trauma Care"],
    totalBeds: 250,
    availableBeds: 45,
    icuCapacity: 30,
    availableIcuBeds: 4,
    doctorAttendance: "18 / 22 present",
    aiHealthScore: 88,
    citizenSatisfaction: 84,
    latitude: 150, // Coordinates for our beautiful interactive map
    longitude: 180,
    activeIssues: 2,
    averageWaitingTime: "45 minutes",
    statusColor: "Healthy"
  },
  {
    id: "hosp-2",
    name: "Pune Community Health Centre (CHC)",
    type: "CHC",
    district: "Pune",
    taluka: "Haveli",
    pinCode: "411001",
    address: "Near Shivajinagar Railway Station, Pune, Maharashtra 411005",
    contactNumber: "+91 20 2553 5678",
    departments: ["General Medicine", "Gynaecology", "Pediatrics", "Dental"],
    emergencyServices: ["24x7 OPD", "Ambulance", "Basic ICU"],
    totalBeds: 80,
    availableBeds: 12,
    icuCapacity: 8,
    availableIcuBeds: 0,
    doctorAttendance: "5 / 8 present",
    aiHealthScore: 68,
    citizenSatisfaction: 62,
    latitude: 350,
    longitude: 250,
    activeIssues: 5,
    averageWaitingTime: "90 minutes",
    statusColor: "Warning"
  },
  {
    id: "hosp-3",
    name: "Nashik Primary Health Centre (PHC)",
    type: "PHC",
    district: "Nashik",
    taluka: "Nashik",
    pinCode: "422001",
    address: "Trimbak Road, Near Golf Club Ground, Nashik, Maharashtra 422002",
    contactNumber: "+91 253 257 8901",
    departments: ["General Medicine", "Immunization", "Family Welfare"],
    emergencyServices: ["First Aid", "Ambulance Station"],
    totalBeds: 25,
    availableBeds: 2,
    icuCapacity: 0,
    availableIcuBeds: 0,
    doctorAttendance: "1 / 3 present",
    aiHealthScore: 42,
    citizenSatisfaction: 39,
    latitude: 220,
    longitude: 420,
    activeIssues: 8,
    averageWaitingTime: "120 minutes",
    statusColor: "High Risk"
  },
  {
    id: "hosp-4",
    name: "Baramati Sub-District Government Hospital",
    type: "District Hospital",
    district: "Pune",
    taluka: "Baramati",
    pinCode: "413102",
    address: "Indapur Road, Baramati, District Pune, Maharashtra 413102",
    contactNumber: "+91 2112 222 345",
    departments: ["General Medicine", "Emergency", "Surgery", "Orthopedics", "Pathology"],
    emergencyServices: ["24x7 ICU", "Ambulance", "Blood Bank"],
    totalBeds: 150,
    availableBeds: 3,
    icuCapacity: 15,
    availableIcuBeds: 1,
    doctorAttendance: "6 / 12 present",
    aiHealthScore: 35,
    citizenSatisfaction: 45,
    latitude: 450,
    longitude: 320,
    activeIssues: 12,
    averageWaitingTime: "150 minutes",
    statusColor: "Critical"
  },
  {
    id: "hosp-5",
    name: "Karad Rural Hospital (CHC)",
    type: "CHC",
    district: "Satara",
    taluka: "Karad",
    pinCode: "415110",
    address: "Opposite Town Hall, Karad, District Satara, Maharashtra 415110",
    contactNumber: "+91 2164 220 102",
    departments: ["General Medicine", "Pediatrics", "Ophthalmology"],
    emergencyServices: ["OPD", "Basic Laboratory", "Ambulance"],
    totalBeds: 60,
    availableBeds: 22,
    icuCapacity: 4,
    availableIcuBeds: 2,
    doctorAttendance: "7 / 7 present",
    aiHealthScore: 92,
    citizenSatisfaction: 89,
    latitude: 520,
    longitude: 160,
    activeIssues: 0,
    averageWaitingTime: "20 minutes",
    statusColor: "Healthy"
  }
];

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: "GRI-883012",
    hospitalId: "hosp-3",
    hospitalName: "Nashik Primary Health Centre (PHC)",
    category: "Doctor Unavailable",
    description: "I visited the PHC at 11 AM today. No doctor was available at the OPD. The staff mentioned that the doctor has not checked in. There were 20 patients waiting in line.",
    dateOfVisit: "2026-06-30",
    isAnonymous: false,
    contactInfo: "Rahul Sharma, +91 98765 43210",
    status: "Investigation in Progress",
    department: "District Health Office",
    severity: "High",
    priority: "High Priority",
    confidence: 97,
    sentiment: "Negative Experience",
    createdAt: "2026-06-30T11:15:00Z",
    updates: [
      {
        status: "Received",
        description: "Grievance successfully submitted by citizen.",
        timestamp: "2026-06-30T11:15:00Z",
        updatedBy: "System"
      },
      {
        status: "Under AI Analysis",
        description: "AI Classifier labeled the complaint as 'Doctor Unavailable' (Confidence: 97%) and routed it to 'District Health Office'.",
        timestamp: "2026-06-30T11:15:05Z",
        updatedBy: "AI Orchestration Layer"
      },
      {
        status: "Assigned to Department",
        description: "Grievance assigned to the District Health Officer (DHO) for verification.",
        timestamp: "2026-06-30T13:45:00Z",
        updatedBy: "District Command Centre"
      },
      {
        status: "Investigation in Progress",
        description: "Officer visited the site and requested explanation from the medical officer in charge regarding absence.",
        timestamp: "2026-07-01T09:30:00Z",
        updatedBy: "District Health Officer"
      }
    ]
  },
  {
    id: "GRI-472091",
    hospitalId: "hosp-4",
    hospitalName: "Baramati Sub-District Government Hospital",
    category: "Medicine Not Available",
    description: "The pharmacist said there is no paracetamol or basic antibiotics in stock. I have been asked to buy them from a private pharmacy outside. This is a government hospital and it should be free.",
    dateOfVisit: "2026-06-29",
    isAnonymous: true,
    status: "Resolved",
    department: "District Medical Store",
    severity: "High",
    priority: "High Priority",
    confidence: 95,
    sentiment: "Negative Experience",
    createdAt: "2026-06-29T14:20:00Z",
    updates: [
      {
        status: "Received",
        description: "Grievance submitted anonymously.",
        timestamp: "2026-06-29T14:20:00Z",
        updatedBy: "System"
      },
      {
        status: "Under AI Analysis",
        description: "AI Classifier labeled as 'Medicine Shortage' and recommended routing to 'District Medical Store'.",
        timestamp: "2026-06-29T14:20:03Z",
        updatedBy: "AI Orchestration Layer"
      },
      {
        status: "Assigned to Department",
        description: "Transferred to District Medical Store inventory coordinator.",
        timestamp: "2026-06-29T16:00:00Z",
        updatedBy: "District Command Centre"
      },
      {
        status: "Investigation in Progress",
        description: "Restocking order initiated. Surplus inventory from Satara CHC was identified.",
        timestamp: "2026-06-30T10:00:00Z",
        updatedBy: "District Medical Store"
      },
      {
        status: "Resolved",
        description: "Surplus stock of 500 units of basic medicines delivered to hospital pharmacy. Availability updated in system.",
        timestamp: "2026-07-01T12:00:00Z",
        updatedBy: "District Medical Store"
      }
    ]
  }
];

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

export function getComplaints(): Complaint[] {
  if (IS_SERVER) return INITIAL_COMPLAINTS;
  const stored = localStorage.getItem("arogya_complaints");
  if (!stored) {
    localStorage.setItem("arogya_complaints", JSON.stringify(INITIAL_COMPLAINTS));
    return INITIAL_COMPLAINTS;
  }
  return JSON.parse(stored);
}

export function saveComplaint(complaint: Omit<Complaint, "id" | "status" | "createdAt" | "updates" | "confidence" | "severity" | "priority" | "department" | "sentiment">): Complaint {
  const complaints = getComplaints();
  
  // AI analysis mock logic depending on text keyword
  const text = complaint.description.toLowerCase();
  let category = complaint.category;
  let severity: "Low" | "Medium" | "High" | "Critical" = "Medium";
  let department = "District Health Office";
  let priority: "Routine Investigation" | "High Priority" | "Immediate Attention" = "Routine Investigation";
  let sentiment: "Positive Experience" | "Neutral Feedback" | "Negative Experience" = "Negative Experience";
  
  if (text.includes("leak") || text.includes("water") || text.includes("broken") || text.includes("infrastructure") || text.includes("damage") || text.includes("mri") || text.includes("x-ray")) {
    department = "Public Works Department";
    severity = "High";
    priority = "High Priority";
  } else if (text.includes("medicine") || text.includes("medicine not available") || text.includes("drug") || text.includes("paracetamol") || text.includes("antibiotic")) {
    department = "District Medical Store";
    severity = "High";
    priority = "High Priority";
  } else if (text.includes("icu") || text.includes("oxygen") || text.includes("critical") || text.includes("ventilator") || text.includes("dying") || text.includes("accident")) {
    severity = "Critical";
    priority = "Immediate Attention";
    department = "Emergency Logistics Team";
  } else if (text.includes("clean") || text.includes("garbage") || text.includes("dirt") || text.includes("toilet") || text.includes("smell")) {
    department = "Hospital Sanitation Committee";
    severity = "Low";
    priority = "Routine Investigation";
  }

  if (text.includes("good") || text.includes("thank") || text.includes("helpful") || text.includes("nice")) {
    sentiment = "Positive Experience";
    severity = "Low";
    priority = "Routine Investigation";
  }

  const newId = `GRI-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();
  
  const newComplaint: Complaint = {
    ...complaint,
    id: newId,
    status: "Received",
    createdAt: now,
    severity,
    priority,
    department,
    confidence: Math.floor(88 + Math.random() * 11),
    sentiment,
    updates: [
      {
        status: "Received",
        description: `Grievance registered in the system under ticket ID ${newId}.`,
        timestamp: now,
        updatedBy: "System"
      },
      {
        status: "Under AI Analysis",
        description: `AI Classifier (IndicBERT) auto-classified this issue under "${category}" and recommended routing to "${department}".`,
        timestamp: new Date(Date.now() + 2000).toISOString(),
        updatedBy: "AI Orchestration Layer"
      }
    ]
  };

  const updatedList = [newComplaint, ...complaints];
  localStorage.setItem("arogya_complaints", JSON.stringify(updatedList));

  // Also update hospital health score temporarily to simulate effect
  const hospitals = getHospitals();
  const index = hospitals.findIndex(h => h.id === complaint.hospitalId);
  if (index !== -1) {
    const updatedHosp = { ...hospitals[index] };
    updatedHosp.activeIssues += 1;
    updatedHosp.aiHealthScore = Math.max(20, updatedHosp.aiHealthScore - 4);
    updatedHosp.citizenSatisfaction = Math.max(20, updatedHosp.citizenSatisfaction - 5);
    if (updatedHosp.aiHealthScore < 40) {
      updatedHosp.statusColor = "Critical";
    } else if (updatedHosp.aiHealthScore < 60) {
      updatedHosp.statusColor = "High Risk";
    } else if (updatedHosp.aiHealthScore < 75) {
      updatedHosp.statusColor = "Warning";
    }
    hospitals[index] = updatedHosp;
    localStorage.setItem("arogya_hospitals", JSON.stringify(hospitals));
  }

  return newComplaint;
}

export function updateComplaintStatusInMock(id: string, nextStatus: Complaint["status"], desc: string): Complaint | null {
  const complaints = getComplaints();
  const index = complaints.findIndex(c => c.id === id);
  if (index === -1) return null;

  const complaint = { ...complaints[index] };
  complaint.status = nextStatus;
  complaint.updates = [
    ...complaint.updates,
    {
      status: nextStatus,
      description: desc,
      timestamp: new Date().toISOString(),
      updatedBy: complaint.department
    }
  ];

  complaints[index] = complaint;
  localStorage.setItem("arogya_complaints", JSON.stringify(complaints));
  return complaint;
}
