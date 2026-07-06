'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import Navbar from '@/components/shared/Navbar';
import { useAppData, type ActiveHospitalSession } from '@/context/AppDataContext';
import { PALGHAR_HOSPITALS } from '@/data/palgharHospitals';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/ui/Loaders';
import { useRouter } from 'next/navigation';

import { HospitalSessionContext } from '@/context/HospitalSessionContext';

// ── Layout ───────────────────────────────────────────────────────────────────

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { activeHospital, setActiveHospital } = useAppData();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[2]) : '';
    };

    // Always try to restore from cookies on mount — don't wait for user
    if (!activeHospital) {
      const hospitalId = parseInt(getCookie('hospital_id'));
      if (hospitalId && !isNaN(hospitalId)) {
        const h = PALGHAR_HOSPITALS.find((h) => h.id === hospitalId);
        if (h) {
          setActiveHospital({
            hospital_id: h.id,
            hospital_name: h.name,
            hospital_short_name: h.short_name,
            taluka: h.taluka,
            district: h.district,
            facility_type: h.facility_type,
            registration_no: h.registration_no,
            user_name: getCookie('user_name') || 'Staff Member',
            user_designation: getCookie('user_role') || 'Medical Staff',
          });
        }
      }
    }
  }, []); // Run once on mount only — empty deps, no re-runs

  if (loading && !activeHospital) {
    return <PageLoader message="Restoring hospital session..." />;
  }

  if (!user && !loading) {
    router.replace('/login?role=hospital');
    return null;
  }

  return (
    <HospitalSessionContext.Provider value={{ session: activeHospital }}>
      <div className="min-h-screen bg-[#F8FAFC]">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <Navbar collapsed={collapsed} onToggleSidebar={() => setCollapsed(!collapsed)} />
        <main className={`pt-[72px] transition-all duration-300 ${collapsed ? 'ml-[72px]' : 'ml-[260px]'}`}>
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </HospitalSessionContext.Provider>
  );
}
