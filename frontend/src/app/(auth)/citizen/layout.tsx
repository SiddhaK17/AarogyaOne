"use client";

import React, { useState } from "react";
import Sidebar from "@/components/shared/Sidebar";
import Navbar from "@/components/shared/Navbar";
import { Megaphone } from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/ui/Loaders';
import { usePathname } from 'next/navigation';

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const isSearchException = pathname?.startsWith('/citizen/search') || pathname?.startsWith('/citizen/nearby');

  if (loading) {
    return <PageLoader message="Authenticating session..." />;
  }

  if (!user && !isSearchException) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Navbar collapsed={collapsed} onToggleSidebar={() => setCollapsed(!collapsed)} />

      <main
        className={`pt-[72px] transition-all duration-300 ${
          collapsed ? 'ml-[72px]' : 'ml-[260px]'
        } flex flex-col min-h-screen`}
      >

        <div className="p-6 lg:p-8 flex-1">{children}</div>
      </main>

    </div>
  );
}
