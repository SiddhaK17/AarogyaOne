'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Menu, UserCircle } from 'lucide-react';
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
  const [userName, setUserName] = React.useState('');
  const [userLocation, setUserLocation] = React.useState('');

  React.useEffect(() => {
    if (user) {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
        return '';
      };
      setUserName(getCookie('user_name') || user.displayName || 'User');
      const cookieLoc = getCookie('user_location');
      if (cookieLoc) {
        setUserLocation(cookieLoc);
      } else if (activeHospital) {
        setUserLocation(`${activeHospital.taluka}, Maharashtra`);
      } else {
        setUserLocation('');
      }
    }
  }, [user, activeHospital]);

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
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {user ? (
            <Link 
              href={pathname.startsWith('/hospital') ? '/hospital/profile' : pathname.startsWith('/dhic') ? '/dhic/settings' : pathname.startsWith('/government') ? '/government/dashboard' : '/citizen/profile'}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {userName}
                </p>
                {userLocation && (
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    {userLocation}
                  </p>
                )}
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-cyan to-brand-blue flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-brand-cyan/20">
                {getInitials(userName, 'U')}
              </div>
            </Link>
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
