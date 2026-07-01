"use client";

import { Bell, User, RefreshCw } from "lucide-react";
import { useDistrict } from "@/context/DistrictContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { districtInfo, notifications } = useDistrict();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="header">
      <div className="header__left">
        <div>
          <h2 className="header__title">{title}</h2>
          {subtitle && <p className="header__subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="header__right">
        <div className="header__district-tag">
          <span className="header__live-dot" />
          {districtInfo.name}
        </div>
        <button className="header__icon-btn" title="Refresh data">
          <RefreshCw size={18} />
        </button>
        <button className="header__icon-btn header__notif-btn" title="Notifications">
          <Bell size={18} />
          {unreadCount > 0 && <span className="header__notif-badge">{unreadCount}</span>}
        </button>
        <div className="header__user">
          <div className="header__avatar">PS</div>
          <div className="header__user-info">
            <span className="header__user-name">Dr. Priya Sharma</span>
            <span className="header__user-role">District Health Officer</span>
          </div>
        </div>
      </div>
    </header>
  );
}
