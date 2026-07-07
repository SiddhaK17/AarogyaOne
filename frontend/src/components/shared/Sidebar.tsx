'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
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
  CheckCircle2,
  Home,
  Search,
  Map,
  ClipboardList,
  BrainCircuit,
  Info,
  User,
  GitBranch,
  MessageSquare,
  Server,
  FileBarChart,
  Bot,
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

const govtNavItems = [
  { label: 'Performance Analytics', href: '/government', icon: BarChart3 },
  { label: 'Pending Issues', href: '/government/dashboard', icon: AlertTriangle },
  { label: 'Action Panel', href: '/government/tasks', icon: ClipboardList },
  { label: 'Resolved Archive', href: '/government/completed', icon: CheckCircle2 },
];

const govtSecondaryItems = [
  { label: 'System Health', href: '/government/system', icon: Server },
  { label: 'Department Audit', href: '/government/reports', icon: FileBarChart },
];

const citizenNavItems = [
  { label: 'Dashboard', href: '/citizen', icon: Home },
  { label: 'File a Grievance', href: '/citizen/report', icon: FileText },
  { label: 'Hospital Search', href: '/citizen/search', icon: Search },
  { label: 'Nearby Centres', href: '/citizen/nearby', icon: Map },
  { label: 'Track Complaint', href: '/citizen/track', icon: ClipboardList },
  { label: 'AI Health Assistant', href: '/citizen/assistant', icon: BrainCircuit },
  { label: 'About & Tech', href: '/citizen/about', icon: Info },
  { label: 'Profile & Settings', href: '/citizen/profile', icon: User },
];

const dhicNavItems = [
  { label: 'District Dashboard', href: '/dhic', icon: LayoutDashboard },
  { label: 'Hospital Intelligence', href: '/dhic/hospitals', icon: Building2 },
  { label: 'Resource Management', href: '/dhic/resources', icon: GitBranch },
  { label: 'AI Alert Centre', href: '/dhic/alerts', icon: Bell },
  { label: 'Infrastructure', href: '/dhic/infrastructure', icon: Server },
  { label: 'Executive Reports', href: '/dhic/reports', icon: FileBarChart },
  { label: 'AI Decision Assistant', href: '/dhic/assistant', icon: Bot },
  { label: 'Settings', href: '/dhic/settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isGovernment = pathname?.startsWith('/government');
  const isDHIC = pathname?.startsWith('/dhic');
  const isCitizen = pathname?.startsWith('/citizen');

  const { user, logout } = useAuth();
  
  const handleSignOut = async () => {
    await logout();
  };

  let items = navItems;
  let secItems = secondaryItems;
  let portalLabel = 'Hospital Portal';

  if (isGovernment) {
    items = govtNavItems;
    secItems = govtSecondaryItems;
    portalLabel = 'Government Portal';
  } else if (isDHIC) {
    items = dhicNavItems;
    secItems = [];
    portalLabel = 'District Command';
  } else if (isCitizen) {
    items = user ? citizenNavItems : citizenNavItems.filter(item => 
      ['/citizen/search', '/citizen/nearby', '/citizen/about'].includes(item.href)
    );
    secItems = [];
    portalLabel = user ? 'Citizen Gateway' : 'Public Access';
  }

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-brand-navy border-r border-slate-800/50 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
      aria-label={`${portalLabel} Sidebar`}
    >
      {/* Logo */}
      <div className="h-[72px] flex items-center gap-3 px-5 border-b border-slate-800/50 flex-shrink-0">
        <div className="bg-gradient-to-br from-brand-cyan to-brand-blue p-2 rounded-xl shadow-lg shadow-brand-cyan/20 flex-shrink-0" aria-hidden="true">
          <Activity className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-extrabold text-lg text-white tracking-tight whitespace-nowrap">
            AarogyaOne
          </span>
        )}
      </div>

      {/* Portal label */}
      {!collapsed && user && (
        <div className="px-5 py-4 border-b border-slate-800/50" aria-hidden="true">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {portalLabel}
          </span>
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 no-scrollbar" aria-label="Main Navigation">
        {items.map((item) => {
          const isDashboard = item.href.endsWith('/dashboard') || item.href === '/citizen' || item.href === '/dhic';
          const isActive = isDashboard 
            ? pathname === item.href 
            : (pathname === item.href || pathname.startsWith(item.href + '/'));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-brand-cyan ${
                isActive
                  ? 'bg-brand-cyan/10 text-brand-cyan shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] flex-shrink-0 ${
                  isActive
                    ? 'text-brand-cyan'
                    : 'text-slate-500 group-hover:text-slate-300'
                }`}
                aria-hidden="true"
              />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              {isActive && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-cyan" aria-hidden="true" />
              )}
            </Link>
          );
        })}

        {/* Separator */}
        <div className="!my-4 border-t border-slate-800/50" role="separator" />

        {secItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-brand-cyan ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
              }`}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-4 border-t border-slate-800/50">
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan"
        >
          <ChevronLeft
            className={`h-[18px] w-[18px] flex-shrink-0 transition-transform duration-300 ${
              collapsed ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
          {!collapsed && <span>Collapse</span>}
        </button>

        {user ? (
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 text-sm font-semibold transition-all mt-1 focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        ) : (
          <Link
            href="/login"
            aria-label="Sign in"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-brand-cyan/70 hover:text-brand-cyan hover:bg-brand-cyan/10 text-sm font-semibold transition-all mt-1 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
          >
            <User className="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
            {!collapsed && <span>Sign In</span>}
          </Link>
        )}
      </div>
    </aside>
  );
}
