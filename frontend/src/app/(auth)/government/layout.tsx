'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import Navbar from '@/components/shared/Navbar';

export default function GovernmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Navbar collapsed={collapsed} onToggleSidebar={() => setCollapsed(!collapsed)} />

      <main
        className={`pt-[72px] transition-all duration-300 ${
          collapsed ? 'ml-[72px]' : 'ml-[260px]'
        }`}
      >
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
