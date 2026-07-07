'use client';

import React, { Suspense, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Shield, Building2, Map, Wrench, Users, ArrowLeft, 
  Loader2, MapPin, CheckCircle2, ChevronDown 
} from 'lucide-react';
import {
  PALGHAR_HOSPITALS,
  PALGHAR_TALUKAS,
  getHospitalsByTaluka,
  type PalgharHospital,
} from '@/data/palgharHospitals';
import { useAppData } from '@/context/AppDataContext';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authApi } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

const HOSPITAL_DESIGNATIONS = [
  'Medical Superintendent',
  'Hospital Administrator',
  'Medical Officer',
  'Pharmacist / Inventory Manager',
  'Nurse Supervisor',
];

const GOVERNMENT_DEPARTMENTS = [
  'Public Works Department (PWD)',
  'Biomedical Engineering Team',
  'Electricity Board (MSEDCL)',
  'Water Supply & Sanitation',
  'District Medical Store',
];

const ROLE_MAP: Record<string, string> = {
  'Medical Superintendent': 'medical_superintendent',
  'Hospital Administrator': 'hospital_administrator',
  'Medical Officer': 'medical_officer',
  'Pharmacist / Inventory Manager': 'pharmacist',
  'Nurse Supervisor': 'nurse_supervisor',
  'District Health Officer': 'district_health_officer',
  'Chief Medical Officer': 'chief_medical_officer',
  'Surveillance Officer': 'surveillance_officer',
};

function getPortalByRole(role: string): string {
  const hospitalRoles = ['medical_superintendent', 'hospital_administrator', 'pharmacist', 'nurse_supervisor', 'medical_officer', 'inventory_manager'];
  const dhicRoles = ['district_health_officer', 'chief_medical_officer', 'surveillance_officer'];
  const governmentRoles = ['engineer', 'supplier'];
  
  if (hospitalRoles.includes(role)) return 'hospital';
  if (dhicRoles.includes(role)) return 'dhic';
  if (governmentRoles.includes(role)) return 'government';
  return 'citizen';
}

function getFriendlyErrorMessage(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/user-not-found':
      return 'No account found. Please register first.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a moment before trying again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    default:
      return error?.message || 'Authentication failed. Please try again.';
  }
}

function LoginContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || '';
  const isExpired = searchParams.get('expired') === 'true';
  const router = useRouter();
  const { setActiveHospital } = useAppData();
  const { toast } = useToast();

  useEffect(() => {
    if (isExpired) {
      toast("Your session has expired. Please sign in again.", "error");
      // Clean up the URL
      const url = new URL(window.location.href);
      url.searchParams.delete('expired');
      window.history.replaceState({}, '', url);
    }
  }, [isExpired, toast]);

  // ── Authentication view toggle ──────────────────────────────────────────────
  const [isSignUp, setIsSignUp] = useState(false);

  // ── Shared fields ────────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // ── Hospital-specific state ─────────────────────────────────────────────────
  const [selectedTaluka, setSelectedTaluka] = useState<string>('');
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);
  const [designation, setDesignation] = useState(HOSPITAL_DESIGNATIONS[0]);

  // ── DHIC specific state ──────────────────────────────────────────────────────
  const [dhicDesignation, setDhicDesignation] = useState('District Health Officer');

  // ── Government state ─────────────────────────────────────────────────────────
  const [govDepartment, setGovDepartment] = useState(GOVERNMENT_DEPARTMENTS[0]);

  // ── Loading & Errors ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ── Computed ────────────────────────────────────────────────────────────────
  const hospitalsInTaluka = useMemo(
    () => (selectedTaluka ? getHospitalsByTaluka(selectedTaluka) : []),
    [selectedTaluka]
  );
  const selectedHospital: PalgharHospital | null = useMemo(
    () => (selectedHospitalId ? (PALGHAR_HOSPITALS.find((h) => h.id === selectedHospitalId) ?? null) : null),
    [selectedHospitalId]
  );

  const portals = [
    {
      id: 'citizen',
      name: 'Citizen Gateway',
      icon: <Users className="h-6 w-6 text-teal-600" />,
      bg: 'bg-teal-50',
      description: 'Report healthcare issues, track complaints and locate hospitals in Palghar',
    },
    {
      id: 'hospital',
      name: 'Hospital Portal',
      icon: <Building2 className="h-6 w-6 text-blue-600" />,
      bg: 'bg-blue-50',
      description: 'For medical staff of government hospitals in Palghar district',
    },
    {
      id: 'dhic',
      name: 'District Command Centre',
      icon: <Map className="h-6 w-6 text-indigo-600" />,
      bg: 'bg-indigo-50',
      description: 'District Health Intelligence Centre — DHO, CMO, Surveillance Officers',
    },
    {
      id: 'government',
      name: 'Govt. Authorities Portal',
      icon: <Wrench className="h-6 w-6 text-orange-600" />,
      bg: 'bg-orange-50',
      description: 'PWD, Biomedical, MSEDCL — resolve infrastructure and supply issues',
    },
  ];

  const selectedPortal = portals.find((p) => p.id === role);

  const writeSessionCookies = (token: string, profile: any) => {
    document.cookie = `aarogya_token=${token}; path=/; max-age=86400; SameSite=Lax;`;
    const resolvedPortalRole = getPortalByRole(profile.role);
    document.cookie = `portal_role=${resolvedPortalRole}; path=/; max-age=86400; SameSite=Lax;`;
    document.cookie = `user_name=${encodeURIComponent(profile.full_name)}; path=/; max-age=86400; SameSite=Lax;`;
    if (profile.location) {
      document.cookie = `user_location=${encodeURIComponent(profile.location)}; path=/; max-age=86400; SameSite=Lax;`;
    }

    // Scoped context cookie setting
    if (resolvedPortalRole === 'hospital' && profile.hospital_id) {
      const h = PALGHAR_HOSPITALS.find(hospital => hospital.id === profile.hospital_id);
      if (h) {
        document.cookie = `hospital_id=${h.id}; path=/; max-age=86400; SameSite=Lax;`;
        document.cookie = `hospital_name=${encodeURIComponent(h.name)}; path=/; max-age=86400; SameSite=Lax;`;
        document.cookie = `hospital_taluka=${h.taluka}; path=/; max-age=86400; SameSite=Lax;`;
        document.cookie = `user_role=${encodeURIComponent(profile.role)}; path=/; max-age=86400; SameSite=Lax;`;
        
        setActiveHospital({
          hospital_id: h.id,
          hospital_name: h.name,
          hospital_short_name: h.short_name,
          taluka: h.taluka,
          district: h.district,
          facility_type: h.facility_type,
          registration_no: h.registration_no,
          user_name: profile.full_name,
          user_designation: profile.role,
        });
      }
    } else if (resolvedPortalRole === 'dhic') {
      document.cookie = `dhic_district=${encodeURIComponent(profile.district || 'Palghar')}; path=/; max-age=86400; SameSite=Lax;`;
      document.cookie = `user_role=${encodeURIComponent(profile.role)}; path=/; max-age=86400; SameSite=Lax;`;
    } else if (resolvedPortalRole === 'government') {
      document.cookie = `gov_department=${encodeURIComponent(profile.department || 'Public Works Department (PWD)')}; path=/; max-age=86400; SameSite=Lax;`;
      document.cookie = `user_role=${encodeURIComponent(profile.role + ' Officer')}; path=/; max-age=86400; SameSite=Lax;`;
    } else {
      document.cookie = `portal_role=citizen; path=/; max-age=86400; SameSite=Lax;`;
      document.cookie = `user_role=Citizen User; path=/; max-age=86400; SameSite=Lax;`;
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[AUTH] START AUTH SUBMIT");
    setErrorMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        console.log("[AUTH] START REGISTER");
        if (role === 'hospital' && !selectedHospitalId) {
          throw new Error('Please select a hospital to register.');
        }

        console.log("[AUTH] Creating Firebase User...");
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("[AUTH] Firebase User Created");

        const token = await credential.user.getIdToken();
        console.log("[AUTH] ID Token Received");

        let dbRole = 'citizen';
        let requestHospitalId: number | undefined;
        let requestDistrict: string | undefined;
        let requestDepartment: string | undefined;

        if (role === 'hospital') {
          dbRole = ROLE_MAP[designation] || 'medical_officer';
          requestHospitalId = selectedHospitalId || undefined;
        } else if (role === 'dhic') {
          dbRole = ROLE_MAP[dhicDesignation] || 'district_health_officer';
          requestDistrict = 'Palghar';
        } else if (role === 'government') {
          dbRole = 'engineer';
          requestDepartment = govDepartment;
        }

        try {
          console.log("[AUTH] Calling authApi.register...");
          const profile = await authApi.register({
            firebase_uid: credential.user.uid,
            email: credential.user.email,
            full_name: name,
            role: dbRole,
            hospital_id: requestHospitalId,
            district: requestDistrict,
            department: requestDepartment,
          });
          console.log("[AUTH] Backend Registration Success");

          // CRITICAL: Force token refresh to pick up custom claims just set by backend.
          // The token fetched before register() has NO claims. We must get a new one.
          console.log("[AUTH] Force-refreshing token to pick up custom claims...");
          const freshToken = await credential.user.getIdToken(true); // true = force refresh
          console.log("[AUTH] Fresh token with claims obtained");

          console.log("[AUTH] Writing Session Cookies...");
          writeSessionCookies(freshToken, profile);
          console.log("[AUTH] Session Cookies Written");
        } catch (dbErr: any) {
          if (credential && credential.user) {
            await credential.user.delete();
          }
          throw new Error(`Profile registration failed: ${dbErr?.message || 'Database error'}`);
        }
      } else {
        console.log("[AUTH] START SIGN IN");
        console.log("[AUTH] Signing into Firebase...");
        const credential = await signInWithEmailAndPassword(auth, email, password);
        console.log("[AUTH] Firebase Sign In Success");

        const token = await credential.user.getIdToken();
        console.log("[AUTH] ID Token Received");

        console.log("[AUTH] Calling authApi.getMe...");
        const profile = await authApi.getMe(token);
        console.log("[AUTH] Backend /auth/me Success");

        // Validate portal-role match — prevent cross-portal sign-in
        const resolvedPortal = getPortalByRole(profile.role);
        const attemptedPortal = role || 'citizen';
        
        if (resolvedPortal !== attemptedPortal) {
          await signOut(auth);
          throw new Error("You are not authorized to access this portal.");
        }

        console.log("[AUTH] Writing Session Cookies...");
        writeSessionCookies(token, profile);
        console.log("[AUTH] Session Cookies Written");
      }

      // Signal to AuthContext that this is an intentional login — do not clear session
      sessionStorage.setItem('aarogya_login_in_progress', 'true');

      setTimeout(() => {
        console.log(`[AUTH] Executing redirect to portal: ${role || 'citizen'}`);
        if (role === 'hospital') window.location.href = '/hospital/dashboard';
        else if (role === 'dhic') window.location.href = '/dhic';
        else if (role === 'government') window.location.href = '/government/dashboard';
        else window.location.href = '/citizen';
      }, 1000);

    } catch (err: any) {
      console.error("[AUTH] Error caught in try block:", err);
      setErrorMsg(getFriendlyErrorMessage(err));
      console.log("[AUTH] Attempting to sign out corrupted session...");
      signOut(auth).catch(() => {});
    } finally {
      console.log("[AUTH] Finally block executing - setting loading to false");
      setLoading(false);
    }
  };

  if (!selectedPortal) {
    return (
      <div className="w-full max-w-2xl px-4 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold uppercase tracking-wider mb-6">
            <MapPin className="h-3 w-3" /> Palghar District, Maharashtra
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
            Select Your Portal
          </h2>
          <p className="text-slate-500 font-medium">
            AarogyaOne — Unified Healthcare Intelligence for Palghar District
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {portals.map((portal) => (
            <Link
              key={portal.id}
              href={`/login?role=${portal.id}`}
              className="bg-white border-2 border-slate-100 hover:border-slate-300 rounded-[2rem] p-6 hover:shadow-xl transition-all duration-300 flex flex-col items-start text-left group"
            >
              <div className={`p-3 rounded-2xl ${portal.bg} mb-4 group-hover:scale-105 transition-transform duration-300`}>
                {portal.icon}
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">{portal.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium mb-6">{portal.description}</p>
              <span className="text-xs font-bold text-slate-900 mt-auto flex items-center gap-1 group-hover:underline">
                Enter Portal →
              </span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg p-8 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
      <Link
        href="/login"
        className="inline-flex items-center gap-2 mb-6 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Change Portal</span>
      </Link>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-slate-50 mb-3">
          {selectedPortal.icon}
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-1">{selectedPortal.name}</h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{isSignUp ? 'Registration Account Setup' : 'Secure Officer Login'}</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
        <button
          type="button"
          onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${!isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Sign Up / Register
        </button>
      </div>

      {errorMsg && (
        <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-100 text-xs font-semibold text-rose-600">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleAuthSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Patil"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-slate-50 placeholder:text-slate-400 font-semibold"
            />
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
          <input
            type="email"
            required
            placeholder="officer@aarogyaone.gov.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-slate-50 placeholder:text-slate-400 font-semibold"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">Password</label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-slate-50 placeholder:text-slate-400 font-semibold"
          />
        </div>

        {/* Signup dynamic fields */}
        {isSignUp && role === 'hospital' && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">Select Taluka</label>
              <div className="relative">
                <select
                  value={selectedTaluka}
                  onChange={(e) => {
                    setSelectedTaluka(e.target.value);
                    setSelectedHospitalId(null);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 text-slate-700 font-semibold appearance-none"
                >
                  <option value="">— Select Taluka —</option>
                  {PALGHAR_TALUKAS.map((t) => (
                    <option key={t} value={t}>{t} Taluka</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">Select Your Hospital</label>
              <div className="relative">
                <select
                  value={selectedHospitalId ?? ''}
                  onChange={(e) => setSelectedHospitalId(Number(e.target.value) || null)}
                  disabled={!selectedTaluka}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 text-slate-700 font-semibold appearance-none disabled:opacity-50"
                >
                  <option value="">{selectedTaluka ? `— Select Hospital in ${selectedTaluka} —` : '— Select a Taluka first —'}</option>
                  {hospitalsInTaluka.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {selectedHospital && (
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 space-y-1.5">
                <p className="text-sm font-black text-slate-900">{selectedHospital.name}</p>
                <p className="text-xs text-slate-500">{selectedHospital.address}</p>
                <div className="flex gap-4 pt-1 text-[10px] text-blue-700 font-bold">
                  <span>Reg: {selectedHospital.registration_no}</span>
                  <span>{selectedHospital.total_beds} Beds</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">Your Designation</label>
              <div className="relative">
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 text-slate-700 font-semibold appearance-none"
                >
                  {HOSPITAL_DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {isSignUp && role === 'dhic' && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">Designation</label>
              <div className="relative">
                <select
                  value={dhicDesignation}
                  onChange={(e) => setDhicDesignation(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 text-slate-700 font-semibold appearance-none"
                >
                  <option value="District Health Officer">District Health Officer</option>
                  <option value="Chief Medical Officer">Chief Medical Officer</option>
                  <option value="Surveillance Officer">Surveillance Officer</option>
                </select>
                <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">District Jurisdiction</span>
              </div>
              <p className="text-sm font-black text-slate-900">Palghar District</p>
              <p className="text-xs text-slate-500">Maharashtra · 8 Talukas · {PALGHAR_HOSPITALS.length} Facilities</p>
            </div>
          </div>
        )}

        {isSignUp && role === 'government' && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">Department Division</label>
              <div className="relative">
                <select
                  value={govDepartment}
                  onChange={(e) => setGovDepartment(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-slate-50 text-slate-700 font-semibold appearance-none"
                >
                  {GOVERNMENT_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 text-sm mt-3 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
          ) : (
            isSignUp ? 'Register & Enter Portal' : `Enter Portal →`
          )}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="absolute top-8 left-8 flex items-center gap-2 font-black text-lg text-slate-900 tracking-tight">
        <Shield className="h-6 w-6 text-teal-600" />
        AarogyaOne
        <span className="text-xs font-semibold text-slate-400 ml-1 border border-slate-200 rounded-full px-2 py-0.5">Palghar Pilot</span>
      </div>
      <Suspense fallback={<div className="text-slate-500">Loading...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
