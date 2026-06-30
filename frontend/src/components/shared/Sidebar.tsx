'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  BedDouble,
  Users,
  BarChart3,
  AlertTriangle,
  ArrowLeftRight,
  Building2,
  FileText,
  Bell,
  Mic,
  Settings,
  LogOut,
  Activity,
  ChevronLeft,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/hospital/dashboard', icon: LayoutDashboard },
  { label: 'Inventory', href: '/hospital/inventory', icon: Package },
  { label: 'Bed Management', href: '/hospital/beds', icon: BedDouble },
  { label: 'Staff & Attendance', href: '/hospital/staff', icon: Users },
  { label: 'Patient Statistics', href: '/hospital/statistics', icon: BarChart3 },
  { label: 'Infrastructure', href: '/hospital/infrastructure', icon: AlertTriangle },
  { label: 'Resource Transfers', href: '/hospital/transfers', icon: ArrowLeftRight },
  { label: 'Reports', href: '/hospital/reports', icon: FileText },
  { label: 'Profile', href: '/hospital/profile', icon: Building2 },
];

const secondaryItems = [
  { label: 'Notifications', href: '/hospital/notifications', icon: Bell },
  { label: 'Voice Assistant', href: '/hospital/voice', icon: Mic },
  { label: 'Settings', href: '/hospital/settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-[#0B1120] border-r border-slate-800/50 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Logo */}
      <div className="h-[72px] flex items-center gap-3 px-5 border-b border-slate-800/50 flex-shrink-0">
        <div className="bg-gradient-to-br from-teal-500 to-blue-600 p-2 rounded-xl shadow-lg shadow-teal-500/20 flex-shrink-0">
          <Activity className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-extrabold text-lg text-white tracking-tight whitespace-nowrap">
            AarogyaOne
          </span>
        )}
      </div>

      {/* Portal label */}
      {!collapsed && (
        <div className="px-5 py-4 border-b border-slate-800/50">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Hospital Portal
          </span>
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                isActive
                  ? 'bg-teal-500/10 text-teal-400 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] flex-shrink-0 ${
                  isActive
                    ? 'text-teal-400'
                    : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              {isActive && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />
              )}
            </Link>
          );
        })}

        {/* Separator */}
        <div className="!my-4 border-t border-slate-800/50" />

        {secondaryItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
              }`}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-4 border-t border-slate-800/50">
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 text-sm font-semibold transition-all"
        >
          <ChevronLeft
            className={`h-[18px] w-[18px] flex-shrink-0 transition-transform duration-300 ${
              collapsed ? 'rotate-180' : ''
            }`}
          />
          {!collapsed && <span>Collapse</span>}
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 text-sm font-semibold transition-all mt-1">
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
