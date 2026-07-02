"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useDistrict } from "@/context/DistrictContext";
import {
  Settings as SettingsIcon,
  Bell,
  Eye,
  Shield,
  User,
  Save,
  CheckCircle,
} from "lucide-react";

export default function SettingsPage() {
  const { settingsData } = useDistrict();
  const [notifications, setNotifications] = useState(settingsData.notifications);
  const [saved, setSaved] = useState(false);

  const toggleNotif = (key: string) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <Header
        title="Settings & Administration"
        subtitle="Configure portal preferences and manage user access"
      />
      <div className="page">
        <div style={{ maxWidth: 800 }}>
          {/* Notifications */}
          <div className="settings-section">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Bell size={18} style={{ color: "#3b82f6" }} />
              <h3 className="settings-section__title">Notification Preferences</h3>
            </div>
            <p className="settings-section__desc">Control which alerts trigger notifications</p>
            <div className="card">
              <div className="card__body">
                {[
                  { key: "criticalAlerts", label: "Critical Alerts", desc: "Immediate notification for critical severity alerts" },
                  { key: "highAlerts", label: "High Alerts", desc: "Notification for high severity alerts" },
                  { key: "mediumAlerts", label: "Medium Alerts", desc: "Notification for medium severity alerts" },
                  { key: "lowAlerts", label: "Low Alerts", desc: "Notification for low severity alerts" },
                  { key: "emailDigest", label: "Daily Email Digest", desc: "Receive a daily summary of all district activity" },
                  { key: "smsAlerts", label: "SMS Alerts", desc: "Receive critical alerts via SMS" },
                ].map((item) => (
                  <div className="setting-row" key={item.key}>
                    <div>
                      <div className="setting-row__label">{item.label}</div>
                      <div className="setting-row__desc">{item.desc}</div>
                    </div>
                    <div
                      className={`toggle ${notifications[item.key as keyof typeof notifications] ? "toggle--active" : ""}`}
                      onClick={() => toggleNotif(item.key)}
                    >
                      <div className="toggle__knob" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="settings-section">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Eye size={18} style={{ color: "#8b5cf6" }} />
              <h3 className="settings-section__title">Display Settings</h3>
            </div>
            <p className="settings-section__desc">Customize the portal appearance and behavior</p>
            <div className="card">
              <div className="card__body">
                {[
                  { label: "Theme", value: "Light Mode" },
                  { label: "Language", value: "English" },
                  { label: "Auto-Refresh Interval", value: "30 seconds" },
                  { label: "Default Map View", value: "Satellite" },
                ].map((item) => (
                  <div className="setting-row" key={item.label}>
                    <div className="setting-row__label">{item.label}</div>
                    <span style={{ fontSize: 13, color: "#3b82f6", fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Access Management */}
          <div className="settings-section">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Shield size={18} style={{ color: "#22c55e" }} />
              <h3 className="settings-section__title">User Access Management</h3>
            </div>
            <p className="settings-section__desc">Manage who has access to the District Health Intelligence Centre</p>
            <div className="card">
              <div className="card__body card__body--flush">
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Email</th>
                        <th>Access Level</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settingsData.access.map((u, i) => (
                        <tr key={i}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: `hsl(${i * 60}, 50%, 90%)`,
                                color: `hsl(${i * 60}, 50%, 40%)`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 11, fontWeight: 700,
                              }}>
                                {u.name.split(" ").map((n) => n[0]).join("")}
                              </div>
                              <span style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{u.name}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: 12 }}>{u.role}</td>
                          <td style={{ fontSize: 12, color: "#94a3b8" }}>{u.email}</td>
                          <td>
                            <span className="badge" style={{
                              background: u.access === "Full Access" ? "rgba(34,197,94,0.1)" :
                                u.access === "Read Only" ? "rgba(148,163,184,0.1)" : "rgba(59,130,246,0.1)",
                              color: u.access === "Full Access" ? "#22c55e" :
                                u.access === "Read Only" ? "#94a3b8" : "#3b82f6",
                            }}>
                              {u.access}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge--completed">{u.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button className="btn btn--primary" onClick={handleSave}>
              {saved ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> Save Settings</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
