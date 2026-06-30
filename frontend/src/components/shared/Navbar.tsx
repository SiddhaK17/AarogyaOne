'use client';

import React from 'react';
import { Bell, Search, Mic, Menu } from 'lucide-react';

interface NavbarProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Navbar({ collapsed, onToggleSidebar }: NavbarProps) {
  return (
    <header
      className={`fixed top-0 right-0 z-30 h-[72px] bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-6 lg:px-8 transition-all duration-300 ${
        collapsed ? 'left-[72px]' : 'left-[260px]'
      }`}
    >
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
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-slate-900 leading-tight">
              Dr. Arjun Mehta
            </p>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              Medical Superintendent
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-teal-500/20">
            AM
          </div>
        </div>
      </div>
    </header>
  );
}
