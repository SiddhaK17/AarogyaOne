"use client";

import React, { useState } from "react";
import Sidebar from "@/components/shared/Sidebar";
import Navbar from "@/components/shared/Navbar";
import { Megaphone } from "lucide-react";

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Navbar collapsed={collapsed} onToggleSidebar={() => setCollapsed(!collapsed)} />

      <main
        className={`pt-[72px] transition-all duration-300 ${
          collapsed ? 'ml-[72px]' : 'ml-[260px]'
        } flex flex-col min-h-screen`}
      >
        {/* EMERGENCY HEALTH NOTICE MARQUEE TICKER */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-blue-900 text-white py-2.5 px-4 sm:px-6 lg:px-8 flex items-center gap-3 overflow-hidden shadow-inner text-xs sm:text-sm font-bold relative shrink-0">
          <div className="flex items-center gap-1.5 bg-rose-600 text-[10px] sm:text-xs text-white px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse shrink-0">
            <Megaphone className="h-3 sm:h-3.5 w-3 sm:w-3.5" /> Emergency Notice
          </div>
          <div className="animate-marquee whitespace-nowrap flex gap-12">
            <span>📢 Health Outbreak Alert: Influenza cases rising in Baramati Taluka. Precautionary masks recommended at all public clinics.</span>
            <span className="hidden lg:inline">⚡ Vaccine drive scheduled at Karad Rural Hospital this Sunday from 9:00 AM to 5:00 PM.</span>
            <span className="hidden md:inline">🏥 Public OPD registrations now active online for Pune CHC and Mumbai Civil Hospital.</span>
          </div>
        </div>

        <div className="p-6 lg:p-8 flex-1">{children}</div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />
    </div>
  );
}
