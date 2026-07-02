'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Shield, Building2, Map, Wrench, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

function LoginContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || '';

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [useOtp, setUseOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Citizen-specific fields
  const [linkAadhaar, setLinkAadhaar] = useState(false);
  const [aadhaar, setAadhaar] = useState('');

  // Hospital-specific fields
  const [frid, setFrid] = useState('');
  const [designation, setDesignation] = useState('Medical Superintendent');

  // DHIC-specific fields
  const [officerId, setOfficerId] = useState('');
  const [district, setDistrict] = useState('Mumbai District');

  // Government-specific fields
  const [employeeCode, setEmployeeCode] = useState('');
  const [department, setDepartment] = useState('Public Works Department (PWD)');

  const portals = [
    {
      id: 'citizen',
      name: 'Citizen Gateway',
      icon: <Users className="h-6 w-6 text-teal-600" />,
      bg: 'bg-teal-50',
      border: 'hover:border-teal-400',
      description: 'Report issues and track resolution',
      btnText: 'Login as Citizen',
    },
    {
      id: 'hospital',
      name: 'Hospital Portal',
      icon: <Building2 className="h-6 w-6 text-blue-600" />,
      bg: 'bg-blue-50',
      border: 'hover:border-blue-400',
      description: 'Authorized medical staff and administrators',
      btnText: 'Login to Hospital',
    },
    {
      id: 'dhic',
      name: 'District Command Centre',
      icon: <Map className="h-6 w-6 text-indigo-600" />,
      bg: 'bg-indigo-50',
      border: 'hover:border-indigo-400',
      description: 'District Health Officers and DHOs',
      btnText: 'Login to District Command',
    },
    {
      id: 'government',
      name: 'Govt. Authorities Portal',
      icon: <Wrench className="h-6 w-6 text-orange-600" />,
      bg: 'bg-orange-50',
      border: 'hover:border-orange-400',
      description: 'PWD, departments and repair resolvers',
      btnText: 'Login as Authority',
    },
  ];

  const router = useRouter();
  const selectedPortal = portals.find((p) => p.id === role);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Check if Firebase configuration environment variables are set
    const isFirebaseConfigured = 
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'PLACEHOLDER_API_KEY';

    if (!isFirebaseConfigured) {
      console.warn("Firebase credentials not configured in .env.local. Falling back to local authentication simulation.");
      
      // Simulate login token session
      document.cookie = "aarogya_token=mock-value; path=/; max-age=86400;";
      document.cookie = `portal_role=${role}; path=/; max-age=86400;`;
      
      let displayName = name || 'User';
      let displayRole = 'Representative';

      if (role === 'hospital') {
        if (!isSignUp) {
          displayName = designation === 'Medical Superintendent' 
            ? 'Dr. Arjun Mehta' 
            : designation === 'On-Duty Doctor' 
            ? 'Dr. Sarah Khan' 
            : 'Nurse Representative';
        }
        displayRole = designation;
        document.cookie = `hospital_designation=${displayRole}; path=/; max-age=86400;`;
      } else if (role === 'dhic') {
        if (!isSignUp) displayName = 'Dr. Priya Sharma';
        displayRole = 'District Health Officer';
        document.cookie = `dhic_district=${district}; path=/; max-age=86400;`;
      } else if (role === 'government') {
        if (!isSignUp) {
          displayName = department === 'Public Works Department (PWD)' 
            ? 'Rajesh Kumar' 
            : 'Operations Coordinator';
        }
        displayRole = `${department} Staff`;
      } else if (role === 'citizen') {
        if (!isSignUp) displayName = 'Rahul Sharma';
        displayRole = 'Citizen User';
      }

      document.cookie = `user_name=${displayName}; path=/; max-age=86400;`;
      document.cookie = `user_role=${displayRole}; path=/; max-age=86400;`;

      // Redirect
      if (role === 'hospital') {
        router.push('/hospital/dashboard');
      } else if (role === 'dhic') {
        router.push('/dhic');
      } else if (role === 'government') {
        router.push('/government/dashboard');
      } else if (role === 'citizen') {
        router.push('/citizen/search');
      }
      return;
    }

    // Real Firebase Authentication execution flow
    setLoading(true);
    try {
      if (isSignUp) {
        // 1. Sign Up in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Prepare metadata maps based on role
        let hospitalMetadata = null;
        let dhicMetadata = null;
        let governmentMetadata = null;
        let citizenMetadata = null;

        if (role === 'hospital') {
          hospitalMetadata = { frid, designation };
        } else if (role === 'dhic') {
          dhicMetadata = { officerId, district };
        } else if (role === 'government') {
          governmentMetadata = { employeeCode, department };
        } else if (role === 'citizen') {
          citizenMetadata = { 
            phone: email,
            aadhaar: linkAadhaar ? aadhaar : '' 
          };
        }

        // 3. Write profile to Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: name,
          email: user.email,
          role: role,
          createdAt: new Date().toISOString(),
          hospitalMetadata,
          dhicMetadata,
          governmentMetadata,
          citizenMetadata
        });

        // 4. Set Session Cookies
        document.cookie = "aarogya_token=mock-value; path=/; max-age=86400;";
        document.cookie = `portal_role=${role}; path=/; max-age=86400;`;

        let displayRole = role;
        if (role === 'hospital') {
          displayRole = designation;
          document.cookie = `hospital_designation=${displayRole}; path=/; max-age=86400;`;
        } else if (role === 'dhic') {
          displayRole = 'District Health Officer';
          document.cookie = `dhic_district=${district}; path=/; max-age=86400;`;
        } else if (role === 'government') {
          displayRole = `${department} Staff`;
        } else if (role === 'citizen') {
          displayRole = 'Citizen User';
        }

        document.cookie = `user_name=${name}; path=/; max-age=86400;`;
        document.cookie = `user_role=${displayRole}; path=/; max-age=86400;`;

      } else {
        // 1. Sign In using email and password
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Query Firestore Database for this User Uid Profile
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          throw new Error("No database user profile found. Please contact administrator.");
        }

        const userData = userDocSnap.data();

        // 3. Verify Role matches the portal route
        if (userData.role !== role) {
          throw new Error(`Access Denied: Your account does not have authorization for the ${selectedPortal?.name}.`);
        }

        // 4. Set Session Cookies
        document.cookie = "aarogya_token=mock-value; path=/; max-age=86400;";
        document.cookie = `portal_role=${role}; path=/; max-age=86400;`;
        
        const displayName = userData.name || user.email || 'User';
        let displayRole = userData.role;

        if (role === 'hospital') {
          displayRole = userData.hospitalMetadata?.designation || designation;
          document.cookie = `hospital_designation=${displayRole}; path=/; max-age=86400;`;
        } else if (role === 'dhic') {
          displayRole = 'District Health Officer';
          const dist = userData.dhicMetadata?.district || district;
          document.cookie = `dhic_district=${dist}; path=/; max-age=86400;`;
        } else if (role === 'government') {
          displayRole = `${userData.governmentMetadata?.department || department} Staff`;
        } else if (role === 'citizen') {
          displayRole = 'Citizen User';
        }

        document.cookie = `user_name=${displayName}; path=/; max-age=86400;`;
        document.cookie = `user_role=${displayRole}; path=/; max-age=86400;`;
      }

      // 5. Successful redirect
      if (role === 'hospital') {
        router.push('/hospital/dashboard');
      } else if (role === 'dhic') {
        router.push('/dhic');
      } else if (role === 'government') {
        router.push('/government/dashboard');
      } else if (role === 'citizen') {
        router.push('/citizen/search');
      }
    } catch (err: any) {
      console.error("Firebase Auth Error: ", err);
      let errMsg = err.message || "Unable to login. Please try again later.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        errMsg = "Invalid email or password. Please verify your credentials.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "Please enter a valid email address.";
      } else if (err.code === "auth/email-already-in-use") {
        errMsg = "This email is already registered. Please sign in instead.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "Password is too weak. Please enter at least 6 characters.";
      }
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (selectedPortal) {
    return (
      <div className="w-full max-w-md p-8 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
        <Link
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            router.push('/login');
          }}
          className="inline-flex items-center gap-2 mb-8 text-sm text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Change Portal</span>
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-slate-50 mb-4">
            {selectedPortal.icon}
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">{selectedPortal.name}</h2>
          <p className="text-sm text-slate-500">{selectedPortal.description}</p>
        </div>

        {/* Dynamic Mode Selector (Sign In / Sign Up) */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${!isSignUp ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${isSignUp ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
          >
            Sign Up
          </button>
        </div>

        {/* Display descriptive login/signup errors */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-xs font-semibold text-rose-600">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm bg-slate-50 placeholder:text-slate-400"
              />
            </div>
          )}

          {role === 'citizen' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm bg-slate-50 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {isSignUp ? "Create Password" : "Password"}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm bg-slate-50 placeholder:text-slate-400"
                />
              </div>

              <div className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={linkAadhaar}
                    onChange={(e) => setLinkAadhaar(e.target.checked)}
                    className="rounded text-slate-900 focus:ring-0"
                  />
                  Link Aadhaar for Grievance Verification
                </label>
                
                {linkAadhaar && (
                  <div className="transition-all duration-300">
                    <input
                      type="text"
                      placeholder="12-digit Aadhaar Number"
                      maxLength={12}
                      required
                      value={aadhaar}
                      onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm bg-white placeholder:text-slate-400"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {role === 'hospital' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">ABHA Facility Registry ID (FRID)</label>
                <input
                  type="text"
                  placeholder="FRID-MUM-902"
                  required
                  value={frid}
                  onChange={(e) => setFrid(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm bg-slate-50 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Professional Email</label>
                <input
                  type="email"
                  placeholder="dr.mehta@civilhospital.gov.in"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm bg-slate-50 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Staff Designation</label>
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm bg-slate-50 text-slate-700 font-semibold"
                >
                  <option value="Medical Superintendent">Medical Superintendent</option>
                  <option value="Inventory Manager">Inventory Manager</option>
                  <option value="On-Duty Doctor">On-Duty Doctor</option>
                  <option value="Head Nurse">Head Nurse</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {isSignUp ? "Create Password" : "Password"}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm bg-slate-50 placeholder:text-slate-400"
                />
              </div>
            </>
          )}

          {role === 'dhic' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Government Officer ID (NIC Code)</label>
                <input
                  type="text"
                  placeholder="GOV-OFF-9018"
                  required
                  value={officerId}
                  onChange={(e) => setOfficerId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm bg-slate-50 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Official Government Email</label>
                <input
                  type="email"
                  placeholder="dho.mumbai@gov.in"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm bg-slate-50 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">District Jurisdiction</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm bg-slate-50 text-slate-700 font-semibold"
                >
                  <option value="Mumbai District">Mumbai District</option>
                  <option value="Pune District">Pune District</option>
                  <option value="Satara District">Satara District</option>
                  <option value="Nagpur District">Nagpur District</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {isSignUp ? "Create Password" : "Password"}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm bg-slate-50 placeholder:text-slate-400"
                />
              </div>
            </>
          )}

          {role === 'government' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Officer Employee Code</label>
                <input
                  type="text"
                  placeholder="EMP-PWD-3392"
                  required
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm bg-slate-50 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Official Email Address</label>
                <input
                  type="email"
                  placeholder="rajesh.kumar@pwd.gov.in"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm bg-slate-50 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Department Division</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm bg-slate-50 text-slate-700 font-semibold"
                >
                  <option value="Public Works Department (PWD)">Public Works Department (PWD)</option>
                  <option value="Biomedical Engineering Team">Biomedical Engineering Team</option>
                  <option value="Electricity Board">Electricity Board</option>
                  <option value="Water Supply Department">Water Supply Department</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {isSignUp ? "Create Password" : "Password"}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm bg-slate-50 placeholder:text-slate-400"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded text-slate-900 focus:ring-0" />
              Remember me
            </label>
            <a href="#" className="hover:text-slate-900">Forgot Password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              isSignUp ? "Sign Up & Register" : "Sign In"
            )}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl px-4 py-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
          Select Your Portal
        </h2>
        <p className="text-slate-500 font-medium">
          Choose the portal you wish to access to log in.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {portals.map((portal) => (
          <Link
            key={portal.id}
            href={`/login?role=${portal.id}`}
            className={`bg-white border-2 border-slate-100 hover:border-slate-200 rounded-[2rem] p-6 hover:shadow-xl transition-all duration-300 flex flex-col items-start text-left group`}
          >
            <div className={`p-3 rounded-2xl ${portal.bg} mb-4 group-hover:scale-105 transition-transform duration-300`}>
              {portal.icon}
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-slate-800">
              {portal.name}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium mb-6">
              {portal.description}
            </p>
            <span className="text-xs font-bold text-slate-900 group-hover:underline mt-auto flex items-center gap-1">
              Select Portal →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="absolute top-8 left-8 flex items-center gap-2 font-black text-lg text-slate-900 tracking-tight">
        <Shield className="h-6 w-6 text-teal-600" />
        AarogyaOne
      </div>
      <Suspense fallback={<div className="text-slate-500">Loading...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
