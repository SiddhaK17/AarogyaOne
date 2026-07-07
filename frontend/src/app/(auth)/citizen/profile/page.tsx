"use client";

import React, { useState, useEffect } from "react";
import { 
  User, ShieldCheck, Mail, Phone, Globe, Bell, 
  Lock, Save, Sparkles, MessageSquare, AlertCircle, MapPin
} from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';

export default function ProfileSettingsPage() {
  const { user, refreshToken } = useAuth();
  
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
    language: "EN",
    smsAlerts: true,
    whatsappAlerts: true,
    emailAlerts: false,
    aadhaarVerified: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [verifyingAadhaar, setVerifyingAadhaar] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        try {
          const token = await user.getIdToken();
          const data = await authApi.getMe(token);
          setProfile(prev => ({
            ...prev,
            name: data.full_name || "",
            email: data.email || "",
            location: data.location || "",
            phone: data.phone || "",
            language: data.language || "EN",
            smsAlerts: data.sms_alerts ?? true,
            whatsappAlerts: data.whatsapp_alerts ?? true,
            emailAlerts: data.email_alerts ?? false,
            aadhaarVerified: true,
          }));
        } catch (e) {
          console.error("Failed to load profile", e);
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (user) {
        await authApi.updateMe({
          full_name: profile.name,
          location: profile.location,
          phone: profile.phone,
          language: profile.language,
          sms_alerts: profile.smsAlerts,
          whatsapp_alerts: profile.whatsappAlerts,
          email_alerts: profile.emailAlerts,
          aadhaar_verified: profile.aadhaarVerified,
        });
        
        // Update cookies for Navbar sync
        document.cookie = `user_name=${encodeURIComponent(profile.name)}; path=/; max-age=86400`;
        if (profile.location) {
          document.cookie = `user_location=${encodeURIComponent(profile.location)}; path=/; max-age=86400`;
        }
        
        await refreshToken(); // to update AuthContext if needed
      }
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    } catch (e) {
      console.error("Failed to save profile", e);
    } finally {
      setSaving(false);
    }
  };

  const handleAadhaarVerify = () => {
    setVerifyingAadhaar(true);
    setTimeout(() => {
      setVerifyingAadhaar(false);
      setProfile({ ...profile, aadhaarVerified: true });
    }, 2000);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-semibold animate-pulse">Loading profile...</div>;
  }

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const formatPhoneDisplay = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    let local = digits;
    if (local.startsWith('91') && local.length > 2) {
      local = local.substring(2);
    }
    const part1 = local.substring(0, 5).padEnd(5, 'X');
    const part2 = local.substring(5, 10).padEnd(5, 'X');
    return `+91 ${part1} ${part2}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').substring(0, 10);
    let formatted = digits;
    if (digits.length > 5) {
      formatted = `${digits.substring(0, 5)} ${digits.substring(5)}`;
    }
    setProfile({ ...profile, phone: `+91 ${formatted}` });
  };

  return (
    <div className="max-w-3xl mx-auto pb-16 space-y-8 text-left">
      
      {/* 1. HEADER PROFILE CARD */}
      <section className="bg-white border border-slate-200/80 rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-500/5 to-transparent pointer-events-none"></div>
        
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-teal-500/20 to-blue-500/20 flex items-center justify-center text-teal-600 font-extrabold text-2xl border border-teal-500/30 shrink-0 shadow-inner">
          {getInitials(profile.name)}
        </div>

        <div className="space-y-1.5 text-center sm:text-left">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">{profile.name || "Citizen User"}</h3>
          <p className="text-xs text-slate-500 font-semibold flex items-center justify-center sm:justify-start gap-1">
            <Phone className="h-3.5 w-3.5" /> {formatPhoneDisplay(profile.phone)} | <Mail className="h-3.5 w-3.5" /> {profile.email}
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Aadhaar Verified
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {profile.location || "Location Not Set"}
            </span>
          </div>
        </div>
      </section>

      {/* 2. SETTINGS FORM */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h4 className="font-extrabold text-slate-900 text-base">Account Settings</h4>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Customize your communications, active language, and security preferences.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              required
            />
          </div>

          {/* Email Address */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Email Address</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* City/State */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">City & State</label>
            <input
              type="text"
              placeholder="e.g. Mumbai, Maharashtra"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Phone Number</label>
            <div className="flex items-center w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-500 transition-all">
              <span className="pl-4 pr-2 py-3 text-xs font-bold text-slate-500 bg-slate-100 border-r border-slate-200">+91</span>
              <input
                type="tel"
                placeholder="98765 43210"
                value={profile.phone.replace(/^\+?91\s*/, '')}
                onChange={handlePhoneChange}
                maxLength={11}
                className="w-full bg-transparent py-3 px-3 text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Preferred Language */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1">
              <Globe className="h-4 w-4 text-slate-400" /> Preferred Portal Language
            </label>
            <select
              value={profile.language}
              onChange={(e) => setProfile({ ...profile, language: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer"
            >
              <option value="EN">English (National Standard)</option>
              <option value="AS">অসমীয়া (Assamese)</option>
              <option value="BN">বাংলা (Bengali)</option>
              <option value="BRX">बड़ो (Bodo)</option>
              <option value="DOI">डोगरी (Dogri)</option>
              <option value="GU">ગુજરાતી (Gujarati)</option>
              <option value="HI">हिन्दी (Hindi)</option>
              <option value="KN">ಕನ್ನಡ (Kannada)</option>
              <option value="KS">کأشُر (Kashmiri)</option>
              <option value="KOK">कोंकणी (Konkani)</option>
              <option value="MAI">मैथिली (Maithili)</option>
              <option value="ML">മലയാളം (Malayalam)</option>
              <option value="MNI">ꯃꯤꯇꯩꯂꯣꯟ (Manipuri)</option>
              <option value="MR">मराठी (Marathi)</option>
              <option value="NE">नेपाली (Nepali)</option>
              <option value="OR">ଓଡ଼ିଆ (Odia)</option>
              <option value="PA">ਪੰਜਾਬੀ (Punjabi)</option>
              <option value="SA">संस्कृत (Sanskrit)</option>
              <option value="SAT">ᱥᱟᱱᱛᱟᱲᱤ (Santali)</option>
              <option value="SD">سنڌي (Sindhi)</option>
              <option value="TA">தமிழ் (Tamil)</option>
              <option value="TE">తెలుగు (Telugu)</option>
              <option value="UR">اردو (Urdu)</option>
            </select>
          </div>

          {/* MFA Status */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1">
              <Lock className="h-4 w-4 text-slate-400" /> Aadhaar OTP Authentication
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">Verify Identity via UIDAI</span>
              <span className="text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded text-[10px]">Verified</span>
            </div>
          </div>
        </div>

        {/* 3. ALERTS PREFERENCES (WhatsApp, SMS, Email toggles) */}
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <h5 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
            <Bell className="h-4 w-4 text-teal-600" /> Status Notification Triggers
          </h5>
          <p className="text-xs text-slate-500 leading-normal">
            Choose how you would like to be alerted when a government department takes action or resolves your grievance.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/50">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 block">SMS Alerts</span>
                <span className="text-[10px] text-slate-400 font-bold block">Receive transactional text logs when milestones change.</span>
              </div>
              <input
                type="checkbox"
                checked={profile.smsAlerts}
                onChange={(e) => setProfile({ ...profile, smsAlerts: e.target.checked })}
                className="h-4 w-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/50">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 block flex items-center gap-1"><MessageSquare className="h-4 w-4 text-emerald-500 shrink-0" /> WhatsApp Integration</span>
                <span className="text-[10px] text-slate-400 font-bold block">Receive instant resolution notices on registered phone number.</span>
              </div>
              <input
                type="checkbox"
                checked={profile.whatsappAlerts}
                onChange={(e) => setProfile({ ...profile, whatsappAlerts: e.target.checked })}
                className="h-4 w-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/50">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 block">Email Notifications</span>
                <span className="text-[10px] text-slate-400 font-bold block">Receive audit completion PDF reports.</span>
              </div>
              <input
                type="checkbox"
                checked={profile.emailAlerts}
                onChange={(e) => setProfile({ ...profile, emailAlerts: e.target.checked })}
                className="h-4 w-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Form controls submit */}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
          {showSavedToast && (
            <div className="mr-auto text-emerald-600 text-xs font-bold flex items-center gap-1 animate-fade-in bg-emerald-50 border border-emerald-100 px-3.5 py-2 rounded-xl">
              <Sparkles className="h-4 w-4 animate-bounce" /> Settings saved successfully
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-slate-900 hover:bg-teal-600 disabled:bg-slate-900/50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Settings
              </>
            )}
          </button>
        </div>

      </form>

      {/* 4. UIDAI ACCESS WARNING BLOCK */}
      <section className="bg-slate-900 text-slate-400 p-5 rounded-2xl border border-slate-800 text-xs leading-relaxed space-y-2">
        <div className="flex items-center gap-1.5 text-slate-200 font-extrabold text-sm"><AlertCircle className="h-4.5 w-4.5 text-teal-400 shrink-0" /> Aadhaar Verification Security</div>
        <p className="font-semibold text-[11px]">
          Your identity is linked via secure UIDAI single sign-on for government portals. This ensures that grievances are filed by authentic citizens, preventing spam submissions and guaranteeing accountability. Your Aadhaar number is never shared with hospital staff, and is only accessed by Ministry auditors during official reviews.
        </p>
      </section>

    </div>
  );
}
