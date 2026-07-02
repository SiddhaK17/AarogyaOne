/**
 * AarogyaOne – Authentication Helpers
 * 
 * Utility functions for token management, session validation,
 * and role-based access control across all portals.
 */

export type PortalRole =
  | 'citizen'
  | 'medical_superintendent'
  | 'hospital_administrator'
  | 'pharmacist'
  | 'nurse_supervisor'
  | 'medical_officer'
  | 'inventory_manager'
  | 'district_health_officer'
  | 'chief_medical_officer'
  | 'surveillance_officer'
  | 'engineer'
  | 'supplier';

export interface UserSession {
  sub: string;
  role: PortalRole;
  name: string;
  hospital_id?: string;
  district_id?: string;
  exp: number;
}

/**
 * Mapping of route path prefixes to the roles allowed to access them.
 */
export const ROLE_ACCESS_MAP: Record<string, PortalRole[]> = {
  '/hospital': [
    'medical_superintendent',
    'hospital_administrator',
    'pharmacist',
    'nurse_supervisor',
    'medical_officer',
    'inventory_manager',
  ],
  '/dhic': [
    'district_health_officer',
    'chief_medical_officer',
    'surveillance_officer',
  ],
  '/government': [
    'engineer',
    'supplier',
  ],
  '/citizen': [
    'citizen',
  ],
};

/**
 * Decodes a JWT token payload without verification.
 * Used client-side only for reading claims; the server must verify signatures.
 */
export function decodeToken(token: string): UserSession | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload as UserSession;
  } catch {
    return null;
  }
}

/**
 * Checks if a token is expired.
 */
export function isTokenExpired(session: UserSession): boolean {
  return Date.now() >= session.exp * 1000;
}

/**
 * Determines if a user role is authorized to access a given pathname.
 */
export function isAuthorized(pathname: string, role: PortalRole): boolean {
  for (const [prefix, roles] of Object.entries(ROLE_ACCESS_MAP)) {
    if (pathname.startsWith(prefix)) {
      return roles.includes(role);
    }
  }
  // If no matching prefix, allow access (public routes)
  return true;
}

/**
 * Returns the login redirect URL for a given portal path.
 */
export function getLoginRedirect(pathname: string): string {
  if (pathname.startsWith('/hospital')) return '/login?role=hospital';
  if (pathname.startsWith('/dhic')) return '/login?role=dhic';
  if (pathname.startsWith('/government')) return '/login?role=government';
  if (pathname.startsWith('/citizen')) return '/login?role=citizen';
  return '/login';
}
