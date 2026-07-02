<<<<<<< feature/government-portal
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
=======
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, FileText, Search, Map, ClipboardList, 
  BrainCircuit, Info, User, LogOut, Menu, X, 
  Activity, ShieldCheck, Megaphone, Bell
} from "lucide-react";

interface SidebarLink {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const SIDEBAR_LINKS: SidebarLink[] = [
  { name: "Dashboard", href: "/citizen", icon: Home },
  { name: "File a Grievance", href: "/citizen/report", icon: FileText },
  { name: "Hospital Search", href: "/citizen/search", icon: Search },
  { name: "Nearby Centres", href: "/citizen/nearby", icon: Map },
  { name: "Track Complaint", href: "/citizen/track", icon: ClipboardList },
  { name: "AI Health Assistant", href: "/citizen/assistant", icon: BrainCircuit },
  { name: "About & Tech", href: "/citizen/about", icon: Info },
  { name: "Profile & Settings", href: "/citizen/profile", icon: User },
];

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  useEffect(() => {
    // Generate some mock real-time notices
    setNotifications([
      "Notice: OPD services temporarily delayed at Pune CHC due to emergency triage.",
      "Warning: Heavy rains in Satara district might disrupt ambulance routing.",
      "Update: Baramati District Hospital bed stock replenished via AI transfer."
    ]);
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans antialiased">
      
      {/* 1. MOBILE SIDEBAR DRAWER */}
      <div className={`fixed inset-0 z-50 flex md:hidden transition-opacity duration-300 ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        {/* Backdrop overlay */}
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
        
        {/* Sidebar container */}
        <div className={`relative flex flex-col w-72 max-w-xs bg-slate-900 text-white h-full p-6 shadow-2xl transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between mb-8">
            <Link href="/citizen" className="flex items-center gap-2 group" onClick={() => setSidebarOpen(false)}>
              <div className="bg-gradient-to-br from-teal-400 to-blue-500 p-1.5 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">AarogyaPulse</span>
            </Link>
            <button className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/80 mb-6 border border-slate-700/50">
            <div className="h-10 w-10 rounded-full bg-teal-500/25 flex items-center justify-center text-teal-400 font-bold border border-teal-500/30">
              RS
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100">Rahul Sharma</h4>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Aadhaar Verified
              </span>
            </div>
          </div>

          <nav className="flex-1 space-y-1.5">
            {SIDEBAR_LINKS.map((link) => {
              const active = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                    active 
                      ? "bg-gradient-to-r from-teal-500/20 to-blue-500/10 text-teal-300 border-l-4 border-teal-500" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-teal-400" : "text-slate-400"}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-800 mt-6">
            <Link 
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Exit Portal
            </Link>
          </div>
        </div>
      </div>

      {/* 2. DESKTOP PERMANENT SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 bg-[#0F172A] text-white p-6 shrink-0 shadow-lg relative border-r border-slate-800">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>

        <div className="flex items-center gap-3 mb-10">
          <Link href="/citizen" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-br from-teal-500 to-blue-600 p-2 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white group-hover:text-teal-400 transition-colors">
              AarogyaPulse
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/50 border border-slate-800/50 mb-8 backdrop-blur-md">
          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-teal-400/20 to-blue-500/20 flex items-center justify-center text-teal-400 font-bold border border-teal-400/30">
            RS
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-100">Rahul Sharma</h4>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Aadhaar Verified
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5">
          {SIDEBAR_LINKS.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  active 
                    ? "bg-slate-800/80 text-teal-400 shadow-md border-r-4 border-teal-500" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-teal-400" : "text-slate-400"}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-800/60 mt-8">
          <Link 
            href="/"
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Exit Portal
          </Link>
        </div>
      </aside>

      {/* 3. MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* TOP BAR / NAVIGATION HEADER */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between shrink-0">
          
          <div className="flex items-center gap-4">
            <button 
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="hidden sm:block">
              <h2 className="text-xl font-extrabold text-slate-900">
                {pathname === "/citizen" && "Citizen Dashboard"}
                {pathname === "/citizen/report" && "File a New Grievance"}
                {pathname === "/citizen/search" && "Search Government Hospitals"}
                {pathname === "/citizen/nearby" && "Nearby Healthcare Centres"}
                {pathname === "/citizen/track" && "Grievance Status Tracker"}
                {pathname === "/citizen/assistant" && "AI Health Assistant"}
                {pathname === "/citizen/about" && "About Platform Technology"}
                {pathname === "/citizen/profile" && "Account & Settings"}
              </h2>
              <p className="text-xs font-semibold text-slate-500">AarogyaPulse National Public Health Interface</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors relative"
                onClick={() => setShowNotificationPopup(!showNotificationPopup)}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
              </button>
              
              {showNotificationPopup && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-sm text-slate-900">Recent Alerts</h4>
                    <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-full">New</span>
                  </div>
                  <div className="space-y-3">
                    {notifications.map((n, i) => (
                      <div key={i} className="flex gap-2.5 items-start text-xs text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0"></span>
                        <p className="leading-normal">{n}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Language Pill */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200/50">
              <span className="text-teal-600">EN</span>
              <span className="text-slate-300">|</span>
              <span className="hover:text-slate-900 cursor-pointer">हिं</span>
              <span className="text-slate-300">|</span>
              <span className="hover:text-slate-900 cursor-pointer">मरा</span>
            </div>

            {/* National Emblem Badge (Symbol of Authority) */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <div className="text-right hidden xl:block">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Government of India</p>
                <p className="text-[10px] font-bold text-teal-600">Ministry of Health</p>
              </div>
              <div className="h-9 w-9 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-xs text-slate-600 border border-slate-200">
                GOI
              </div>
            </div>

          </div>

        </header>

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

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>

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
>>>>>>> main
}
