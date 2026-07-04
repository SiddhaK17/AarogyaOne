'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import Navbar from '@/components/shared/Navbar';
import { useAppData, type ActiveHospitalSession } from '@/context/AppDataContext';
import { PALGHAR_HOSPITALS } from '@/data/palgharHospitals';

// ── Hospital Session Context ─────────────────────────────────────────────────
// Lets all hospital portal pages read the active hospital without prop drilling

interface HospitalSessionContextValue {
  session: ActiveHospitalSession | null;
}

const HospitalSessionContext = createContext<HospitalSessionContextValue>({ session: null });

export function useHospitalSession() {
  return useContext(HospitalSessionContext);
}

// ── Layout ───────────────────────────────────────────────────────────────────

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { activeHospital, setActiveHospital } = useAppData();

  // On mount — if no session in context, try reading from cookies (handles page refresh)
  useEffect(() => {
    if (!activeHospital) {
      const getCookie = (name: string) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)'));
        return match ? decodeURIComponent(match[2]) : '';
      };
      const hospitalId = parseInt(getCookie('hospital_id'));
      if (hospitalId) {
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
  }, []);

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
