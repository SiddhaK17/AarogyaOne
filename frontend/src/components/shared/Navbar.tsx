'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search, Mic, Menu } from 'lucide-react';

interface NavbarProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Navbar({ collapsed, onToggleSidebar }: NavbarProps) {
  const pathname = usePathname();
  const isGovernment = pathname?.startsWith('/government');
  const isDHIC = pathname?.startsWith('/dhic');
  const isCitizen = pathname?.startsWith('/citizen');

  const [profileName, setProfileName] = useState('');
  const [profileRole, setProfileRole] = useState('');

  useEffect(() => {
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[2]) : '';
    };

    const cookieName = getCookie('user_name');
    const cookieRole = getCookie('user_role');

    if (cookieName) setProfileName(cookieName);
    if (cookieRole) setProfileRole(cookieRole);
  }, [pathname]);

  const getInitials = (name: string, defaultInitials: string) => {
    if (!name) return defaultInitials;
    // Clean and split words
    const cleanName = name.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, '');
    const parts = cleanName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0]) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return defaultInitials;
  };

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-[72px] bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-6 lg:px-8 transition-all duration-300 ${
        collapsed ? 'left-[72px]' : 'left-[260px]'
      }`}
    >
      {/* Top Brand Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-navy" />
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-100/80 rounded-xl px-4 py-2.5 w-[320px] group focus-within:ring-2 focus-within:ring-slate-900 focus-within:bg-white transition-all">
          <Search className="h-4 w-4 text-slate-400 group-focus-within:text-slate-600" />
          <input
            type="text"
            placeholder="Search inventory, staff, issues..."
            className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none w-full font-medium"
          />
          <kbd className="hidden md:inline-flex px-1.5 py-0.5 text-[9px] font-bold text-slate-400 bg-slate-200/60 rounded border border-slate-200">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Voice */}
        <button className="p-2.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all">
          <Mic className="h-[18px] w-[18px]" />
        </button>

        {/* Notifications */}
        <button className="relative p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Separator */}
        <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block" />

        {/* User profile */}
        <div className="flex items-center gap-3">
          {isGovernment && (
            <>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {profileName || 'Rajesh Kumar'}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  {profileRole || 'PWD Operations Officer'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-cyan to-brand-blue flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-brand-cyan/20">
                {getInitials(profileName, 'RK')}
              </div>
            </>
          )}
          {isDHIC && (
            <>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {profileName || 'Dr. Priya Sharma'}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  {profileRole || 'District Health Officer'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-cyan to-brand-blue flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-brand-cyan/20">
                {getInitials(profileName, 'PS')}
              </div>
            </>
          )}
          {isCitizen && (
            <>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {profileName || 'Rahul Sharma'}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  {profileRole || 'Citizen User'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-cyan to-brand-blue flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-brand-cyan/20">
                {getInitials(profileName, 'RS')}
              </div>
            </>
          )}
          {!isGovernment && !isDHIC && !isCitizen && (
            <>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {profileName || 'Dr. Arjun Mehta'}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  {profileRole || 'Medical Superintendent'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-cyan to-brand-blue flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-brand-cyan/20">
                {getInitials(profileName, 'AM')}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
