/**
 * AarogyaOne — Typed API Client
 * ================================
 * All HTTP calls to the FastAPI backend pass through this module.
 * Firebase ID Token is automatically injected on every protected request.
 * Supabase Realtime subscription helpers are also exported from here.
 *
 * Usage:
 *   import { hospitalApi, dhicApi, citizenApi, governmentApi } from '@/lib/api';
 *   const dashboard = await hospitalApi.getDashboard();
 */

import { auth } from './firebase';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// ---------------------------------------------------------------------------
// Supabase Realtime client (anon key — safe for frontend, protected by RLS)
// ---------------------------------------------------------------------------

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------------------------------------------------------------------------
// Core HTTP helper
// ---------------------------------------------------------------------------

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getFirebaseToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken(/* forceRefresh */ false);
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { public?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!options.public) {
    const token = await getFirebaseToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail ?? detail;
    } catch { /* ignore */ }
    throw new ApiError(response.status, detail);
  }

  // 204 No Content
  if (response.status === 204) return undefined as unknown as T;
  return response.json();
}

async function uploadFile(path: string, file: File, extraParams: Record<string, string> = {}): Promise<unknown> {
  const token = await getFirebaseToken();
  const form = new FormData();
  form.append('file', file);

  const url = new URL(`${API_BASE}${path}`);
  Object.entries(extraParams).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.detail ?? `HTTP ${response.status}`);
  }
  return response.json();
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export interface RegisterRequest {
  full_name: string;
  role: string;
  hospital_id?: number;
  district?: string;
  department?: string;
}

export interface UserProfile {
  firebase_uid: string;
  email: string;
  full_name: string;
  role: string;
  hospital_id?: number;
  district?: string;
  department?: string;
  is_active: boolean;
}

export const authApi = {
  register: (data: RegisterRequest) =>
    request<UserProfile>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  getMe: () =>
    request<UserProfile>('/api/auth/me', { method: 'POST' }),

  updateMe: (data: { full_name?: string }) =>
    request<UserProfile>('/api/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
};

// ---------------------------------------------------------------------------
// Hospital Portal API
// ---------------------------------------------------------------------------

export const hospitalApi = {
  getDashboard: () =>
    request('/api/hospitals/dashboard'),

  getProfile: () =>
    request('/api/hospitals/profile'),

  updateProfile: (data: object) =>
    request('/api/hospitals/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Inventory
  getInventory: () =>
    request<unknown[]>('/api/hospitals/inventory'),

  addInventoryItem: (data: object) =>
    request('/api/hospitals/inventory', { method: 'POST', body: JSON.stringify(data) }),

  updateInventoryItem: (itemId: number, data: object) =>
    request(`/api/hospitals/inventory/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Beds
  getBeds: () =>
    request<unknown[]>('/api/hospitals/beds'),

  updateBed: (bedId: number, data: object) =>
    request(`/api/hospitals/beds/${bedId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Staff
  getStaff: (date?: string) =>
    request<unknown[]>(`/api/hospitals/staff${date ? `?attendance_date=${date}` : ''}`),

  logAttendance: (data: object) =>
    request('/api/hospitals/staff', { method: 'POST', body: JSON.stringify(data) }),

  // Patient Stats
  getStatistics: (days = 7) =>
    request<unknown[]>(`/api/hospitals/statistics?days=${days}`),

  submitStatistics: (data: object) =>
    request('/api/hospitals/statistics', { method: 'POST', body: JSON.stringify(data) }),

  // Issues
  getIssues: (status?: string) =>
    request<unknown[]>(`/api/hospitals/issues${status ? `?status_filter=${status}` : ''}`),

  reportIssue: (data: object) =>
    request('/api/hospitals/issues', { method: 'POST', body: JSON.stringify(data) }),

  // Transfers
  getTransfers: () =>
    request<unknown[]>('/api/hospitals/transfers'),

  requestTransfer: (data: object) =>
    request('/api/hospitals/transfers/request', { method: 'POST', body: JSON.stringify(data) }),

  updateTransferStatus: (transferId: number, status: string) =>
    request(`/api/hospitals/transfers/${transferId}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Notifications
  getNotifications: (unreadOnly = false) =>
    request<unknown[]>(`/api/hospitals/notifications${unreadOnly ? '?unread_only=true' : ''}`),

  markNotificationRead: (id: number) =>
    request(`/api/hospitals/notifications/${id}/read`, { method: 'PUT' }),
};

// ---------------------------------------------------------------------------
// DHIC API
// ---------------------------------------------------------------------------

export const dhicApi = {
  getDashboard: () =>
    request('/api/dhic/dashboard'),

  getMap: () =>
    request<unknown[]>('/api/dhic/map'),

  getHospitals: (params?: { risk_level?: string; facility_type?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<unknown[]>(`/api/dhic/hospitals${qs ? `?${qs}` : ''}`);
  },

  getHospitalDetail: (hospitalId: number) =>
    request(`/api/dhic/hospitals/${hospitalId}`),

  getTransfers: (status?: string) =>
    request(`/api/dhic/resources/transfers${status ? `?status_filter=${status}` : ''}`),

  approveTransfer: (transferId: number, note?: string) =>
    request(`/api/dhic/resources/transfers/${transferId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ note }),
    }),

  rejectTransfer: (transferId: number) =>
    request(`/api/dhic/resources/transfers/${transferId}/reject`, { method: 'PUT' }),

  getAlerts: (params?: { priority?: string; unread_only?: boolean }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<unknown[]>(`/api/dhic/alerts${qs ? `?${qs}` : ''}`);
  },

  acknowledgeAlert: (alertId: number) =>
    request(`/api/dhic/alerts/${alertId}/acknowledge`, { method: 'PUT' }),

  getFeedback: (days = 30) =>
    request(`/api/dhic/feedback?days=${days}`),

  getInfrastructure: (priority?: string) =>
    request(`/api/dhic/infrastructure${priority ? `?priority=${priority}` : ''}`),

  getDistrictReport: () =>
    request('/api/dhic/reports/district'),
};

// ---------------------------------------------------------------------------
// Citizen API
// ---------------------------------------------------------------------------

export interface ComplaintSubmitRequest {
  hospital_id: number;
  category: string;
  description: string;
  date_of_visit?: string;
  is_anonymous?: boolean;
  contact_info?: string;
}

export const citizenApi = {
  submitComplaint: (data: ComplaintSubmitRequest) =>
    request('/api/citizens/report', { method: 'POST', body: JSON.stringify(data), public: true }),

  uploadMedia: (complaintId: number, file: File) =>
    uploadFile('/api/citizens/report/upload', file, { complaint_id: String(complaintId) }),

  trackComplaint: (referenceNumber: string) =>
    request(`/api/citizens/track/${referenceNumber}`, { public: true }),

  searchHospitals: (params: { name?: string; district?: string; facility_type?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<unknown[]>(`/api/citizens/hospitals?${qs}`, { public: true });
  },

  findNearby: (lat: number, lng: number, radiusKm = 25) =>
    request<unknown[]>(
      `/api/citizens/hospitals/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`,
      { public: true }
    ),
};

// ---------------------------------------------------------------------------
// Government API
// ---------------------------------------------------------------------------

export const governmentApi = {
  getTasks: (params?: { priority?: string; status?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<unknown[]>(`/api/government/tasks${qs ? `?${qs}` : ''}`);
  },

  getTaskDetail: (taskId: number) =>
    request(`/api/government/tasks/${taskId}`),

  updateTaskStatus: (taskId: number, data: { status: string; note?: string; officer_name?: string }) =>
    request(`/api/government/tasks/${taskId}/status`, { method: 'PUT', body: JSON.stringify(data) }),

  uploadEvidence: (taskId: number, file: File) =>
    uploadFile(`/api/government/tasks/${taskId}/upload`, file),

  getCompletedTasks: (limit = 50) =>
    request<unknown[]>(`/api/government/completed?limit=${limit}`),

  getAnalytics: () =>
    request('/api/government/analytics'),
};

// ---------------------------------------------------------------------------
// Supabase Realtime Subscription Helpers
// ---------------------------------------------------------------------------

type RealtimeHandler = (payload: unknown) => void;

/**
 * Subscribe to inventory changes for the DHIC live dashboard.
 * Returns an unsubscribe function.
 */
export function subscribeToInventoryChanges(handler: RealtimeHandler): () => void {
  const channel = supabase
    .channel('inventory-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, handler)
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

/**
 * Subscribe to bed occupancy changes for the live district map.
 */
export function subscribeToBedChanges(handler: RealtimeHandler): () => void {
  const channel = supabase
    .channel('bed-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bed_occupancy' }, handler)
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

/**
 * Subscribe to new citizen complaints for the DHIC feedback page.
 */
export function subscribeToComplaints(handler: RealtimeHandler): () => void {
  const channel = supabase
    .channel('new-complaints')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'citizen_complaints' }, handler)
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

/**
 * Subscribe to new notifications for the current portal.
 * Filter by recipientId (hospital_id, district name, or department name).
 */
export function subscribeToNotifications(
  recipientRole: string,
  recipientId: string,
  handler: RealtimeHandler
): () => void {
  const channel = supabase
    .channel(`notifications-${recipientRole}-${recipientId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_role=eq.${recipientRole}`,
      },
      (payload) => {
        // Client-side filter by recipient_id (RLS handles security)
        const record = (payload as { new: Record<string, string> }).new;
        if (record?.recipient_id === recipientId) {
          handler(payload);
        }
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

/**
 * Subscribe to government task updates for the Government Portal.
 */
export function subscribeToTaskUpdates(handler: RealtimeHandler): () => void {
  const channel = supabase
    .channel('task-updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'government_tasks' }, handler)
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
