'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, Mic, Menu, UserCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';
import Link from 'next/link';

interface NavbarProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Navbar({ collapsed, onToggleSidebar }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { activeHospital } = useAppData();

  const getInitials = (name: string, defaultInitials: string) => {
    if (!name) return defaultInitials;
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
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-navy" />
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2 text-slate-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-cyan focus-within:text-slate-900 transition-all border border-transparent focus-within:border-brand-cyan/20 w-64 lg:w-96 shadow-sm">
          <Search className="h-4 w-4 shrink-0" />
          <input
            type="text"
            placeholder="Search patients, resources, or alerts..."
            className="bg-transparent border-none focus:outline-none text-xs font-semibold w-full placeholder:text-slate-400"
          />
          <Mic className="h-4 w-4 shrink-0 text-slate-400 hover:text-brand-cyan cursor-pointer transition-colors" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-400 hover:text-brand-cyan transition-colors group">
          <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {user.displayName || 'Authenticated User'}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  {activeHospital ? activeHospital.user_designation : 'Staff Member'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-cyan to-brand-blue flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-brand-cyan/20">
                {getInitials(user.displayName || '', 'U')}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900 leading-tight">Guest User</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Public Access</p>
              </div>
              <Link href="/login" className="flex items-center justify-center px-3 py-1.5 bg-brand-cyan hover:bg-brand-blue text-white rounded-lg text-xs font-bold transition-colors">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
