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
  { to: "/", icon: LayoutDashboard, label: "District Dashboard" },
  { to: "/map", icon: Map, label: "Live District Map" },
  { to: "/hospitals", icon: Building2, label: "Hospital Intelligence" },
  { to: "/resources", icon: GitBranch, label: "Resource Management" },
  { to: "/alerts", icon: Bell, label: "AI Alert Centre" },
  { to: "/feedback", icon: MessageSquare, label: "Citizen Feedback" },
  { to: "/infrastructure", icon: Server, label: "Infrastructure" },
  { to: "/reports", icon: FileBarChart, label: "Executive Reports" },
  { to: "/assistant", icon: Bot, label: "AI Decision Assistant" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (to: string) => {
    if (to === "/") return pathname === "/";
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
            <span>Mumbai District</span>
          </div>
        )}
      </div>
    </aside>
  );
}
