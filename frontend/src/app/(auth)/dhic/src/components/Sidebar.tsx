"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Building2,
  GitBranch,
  Bell,
  MessageSquare,
  Server,
  FileBarChart,
  Bot,
  Settings,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/dhic/app", icon: LayoutDashboard, label: "District Dashboard" },
  { to: "/dhic/app/hospitals", icon: Building2, label: "Hospital Intelligence" },
  { to: "/dhic/app/resources", icon: GitBranch, label: "Resource Management" },
  { to: "/dhic/app/alerts", icon: Bell, label: "AI Alert Centre" },
  { to: "/dhic/app/infrastructure", icon: Server, label: "Infrastructure" },
  { to: "/dhic/app/reports", icon: FileBarChart, label: "Executive Reports" },
  { to: "/dhic/app/assistant", icon: Bot, label: "AI Decision Assistant" },
  { to: "/dhic/app/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (to: string) => {
    if (to === "/dhic/app") return pathname === "/dhic/app" || pathname === "/dhic";
    return pathname.startsWith(to);
  };

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <Activity size={24} className="sidebar__logo" />
          {!collapsed && (
            <div>
              <h1 className="sidebar__title">ArogyaOne</h1>
              <p className="sidebar__subtitle">DHIC</p>
            </div>
          )}
        </div>
        <button
          className="sidebar__toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar__nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            href={to}
            className={`sidebar__link ${isActive(to) ? "sidebar__link--active" : ""}`}
            title={collapsed ? label : undefined}
          >
            <Icon size={20} />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      <div className="sidebar__footer">
        {!collapsed && (
          <div className="sidebar__district-badge">
            <span className="sidebar__district-dot" />
            <span>Palghar District</span>
          </div>
        )}
      </div>
    </aside>
  );
}
