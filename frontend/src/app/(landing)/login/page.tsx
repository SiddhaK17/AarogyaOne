'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Shield, Building2, Map, Wrench, Users, ArrowLeft } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || '';

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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Set mock cookie token so middleware/routing checks pass
    document.cookie = "aarogya_token=mock-value; path=/; max-age=86400;";
    
    // Redirect to respective portal
    if (role === 'hospital') {
      router.push('/hospital/dashboard');
    } else if (role === 'dhic') {
      router.push('/dhic');
    } else if (role === 'government') {
      router.push('/government');
    } else if (role === 'citizen') {
      router.push('/citizen/search');
    } else {
      router.push('/');
    }
  };

  if (selectedPortal) {
    return (
      <div className="w-full max-w-md p-8 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-2 mb-8 text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/login">Change Portal</Link>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-slate-50 mb-4">
            {selectedPortal.icon}
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">{selectedPortal.name}</h2>
          <p className="text-sm text-slate-500">{selectedPortal.description}</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Username or Email</label>
            <input
              type="text"
              placeholder="name@authority.gov.in"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm bg-slate-50 placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm bg-slate-50 placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded text-slate-900 focus:ring-0" />
              Remember me
            </label>
            <a href="#" className="hover:text-slate-900">Forgot Password?</a>
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 text-sm mt-2"
          >
            Sign In
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
