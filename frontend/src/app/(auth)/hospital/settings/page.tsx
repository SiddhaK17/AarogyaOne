'use client';

import React, { useState } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  Settings,
  Shield,
  Bell,
  Database,
  Users,
  CheckCircle2,
  Save,
  Lock,
  Smartphone,
  Mail,
  Building2,
  Key,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { useAuth } from '@/context/AuthContext';

export default function HospitalSettingsPage() {
  const { activeHospital } = useAppData();
  const { user } = useAuth();
  
  // Form states
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [autoReorder, setAutoReorder] = useState(false);
  const [reorderThreshold, setReorderThreshold] = useState('15');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  const rbacRoles = [
    { role: 'Medical Superintendent', access: 'Full Hospital Management & Resource Transfer Approval', count: 1 },
    { role: 'Hospital Administrator', access: 'Profile, Infrastructure Tickets, Staff Attendance', count: 2 },
    { role: 'Pharmacist', access: 'Medicine Inventory & Reorder Logging Only', count: 4 },
    { role: 'Nurse Supervisor', access: 'Bed Management & Ward Occupancy Updates Only', count: 6 },
    { role: 'Medical Officer', access: 'Patient Statistics & Clinical Issue Reporting', count: 8 },
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md border border-indigo-500/30">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> System Preferences & RBAC
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Hospital Portal Settings
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-medium">
              Configure alert thresholds, automated stock replenishment triggers, multilingual notification preferences, and review active user permissions.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-500/25 border-0 font-bold self-start sm:self-center"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-300" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Navigation & Info */}
        <div className="md:col-span-1 space-y-6">
          <Card padding="md" className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 font-bold">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                  {activeHospital?.hospital_name || 'Government Hospital'}
                </h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {activeHospital?.facility_type || 'District Hospital'} • {activeHospital?.taluka || 'Palghar'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-600">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Registration No:</span>
                <span className="font-bold text-slate-900">{activeHospital?.registration_no || 'REG-2026-PHC'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">District Command:</span>
                <span className="font-bold text-indigo-600">{activeHospital?.district || 'Palghar'} DHIC</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Active Session Role:</span>
                <Badge variant="info">{activeHospital?.user_designation || 'Medical Officer'}</Badge>
              </div>
            </div>
          </Card>

          <Card padding="md" className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white space-y-3 border-0 shadow-lg">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
              <Database className="h-4 w-4" /> AI Synchronised Database
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Operational updates submitted through this portal are cached in Redis and permanently synchronized with the District Health Intelligence Centre (PostgreSQL) every 30 seconds.
            </p>
            <div className="pt-2 flex items-center justify-between text-[10px] text-emerald-400 font-black uppercase tracking-wider">
              <span>Status: Online</span>
              <span>Latency: 14ms</span>
            </div>
          </Card>
        </div>

        {/* Right Column: Interactive Configuration Panels */}
        <div className="md:col-span-2 space-y-6">
          {/* Notification Preferences */}
          <Card padding="lg" className="space-y-6">
            <CardHeader
              title="Notification & Alert Thresholds"
              subtitle="Control how AI demand forecasts and emergency alerts are dispatched to hospital staff."
            />

            <div className="space-y-4 divide-y divide-slate-100">
              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <Smartphone className="h-4 w-4 text-slate-400" /> SMS Emergency Broadcasts
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Receive instant text alerts when medicine stock falls below critical reorder levels.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsAlerts}
                    onChange={(e) => setSmsAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <Bell className="h-4 w-4 text-slate-400" /> WhatsApp Automated Summary
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Send daily 8:00 AM operational executive briefs to the Medical Superintendent's WhatsApp.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatsappAlerts}
                    onChange={(e) => setWhatsappAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <RefreshCw className="h-4 w-4 text-slate-400" /> AI Auto-Reorder Trigger
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Automatically draft a resource transfer request to DHIC when medicine inventory drops below threshold percentage.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={reorderThreshold}
                    onChange={(e) => setReorderThreshold(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="10">10% Stock Remaining</option>
                    <option value="15">15% Stock Remaining</option>
                    <option value="25">25% Stock Remaining</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Role-Based Access Control Audit */}
          <Card padding="lg" className="space-y-6">
            <CardHeader
              title="Role-Based Access Control (RBAC)"
              subtitle="User permission matrix defined for this medical institution as per Section 7.2."
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Designation Role</th>
                    <th className="py-3 px-4">Allowed Portal Access</th>
                    <th className="py-3 px-4 text-center">Active Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {rbacRoles.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-indigo-500" /> {r.role}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{r.access}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px]">
                          {r.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
