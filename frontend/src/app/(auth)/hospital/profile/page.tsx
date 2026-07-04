'use client';

import React, { useState } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useHospitalSession } from '../layout';
import { PALGHAR_HOSPITALS, type PalgharHospital } from '@/data/palgharHospitals';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Shield,
  Activity,
  Award,
  Clock,
  Save,
  Check,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function HospitalProfilePage() {
  const { session } = useHospitalSession();
  
  // Find real hospital metadata from session
  const hospitalMaster = PALGHAR_HOSPITALS.find((h) => h.id === session?.hospital_id) || PALGHAR_HOSPITALS[0];

  const [phone, setPhone] = useState(hospitalMaster.phone);
  const [email, setEmail] = useState(hospitalMaster.email);
  const [hasLab, setHasLab] = useState(hospitalMaster.has_laboratory);
  const [hasAmbulance, setHasAmbulance] = useState(hospitalMaster.has_ambulance);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Simulate API update
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Hospital <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Profile</span>
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Manage facility information, public contacts, and operational statuses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Hospital Stats Summary Card */}
        <div className="md:col-span-1 space-y-6">
          <Card padding="lg" className="text-center relative overflow-hidden flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 -z-10" />
            <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-black text-slate-900 text-lg leading-tight">{hospitalMaster.name}</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wider">{hospitalMaster.facility_type}</p>
            
            <div className="mt-6 w-full space-y-3 pt-6 border-t border-slate-100 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Registration No</span>
                <span className="font-mono font-bold text-slate-800">{hospitalMaster.registration_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Taluka Jurisdiction</span>
                <span className="font-bold text-slate-800">{hospitalMaster.taluka}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Bed Capacity</span>
                <span className="font-bold text-slate-800">{hospitalMaster.total_beds} Beds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">ICU Beds</span>
                <span className="font-bold text-slate-800">{hospitalMaster.icu_capacity} Beds</span>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <CardHeader title="System Authority" subtitle="Assigned staff access logs" />
            <div className="space-y-4 mt-2">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
                  <Award className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{session?.user_name || 'Dr. Arjun Mehta'}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{session?.user_designation || 'Medical Superintendent'}</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Authorized under Palghar Zilla Parishad Health Command network. Changes will sync to citizen search registry.
              </p>
            </div>
          </Card>
        </div>

        {/* Right Side: Manage Profile Form */}
        <div className="md:col-span-2">
          <Card padding="lg">
            <CardHeader title="Facility Details & Settings" subtitle="Verify and edit contact details and utility setups" />
            
            <form onSubmit={handleSave} className="space-y-6 mt-6">
              {/* Read Only Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hospital Name</label>
                  <input
                    type="text"
                    disabled
                    value={hospitalMaster.name}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-bold cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ABHA Registration ID</label>
                  <input
                    type="text"
                    disabled
                    value={hospitalMaster.registration_no}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Physical Location</label>
                <div className="flex gap-2 items-start px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                  <MapPin className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-slate-700">{hospitalMaster.address}</p>
                    <p className="text-xs text-slate-400 mt-1">Coordinates: {hospitalMaster.latitude}°N, {hospitalMaster.longitude}°E</p>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Public Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Public Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Toggle operational settings */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Facility Features</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-200/60">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Laboratory Services</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Enable on-site lab reports status</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHasLab(!hasLab)}
                      className={`relative w-10 h-6 rounded-full transition-colors ${hasLab ? "bg-blue-600" : "bg-slate-300"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${hasLab ? "translate-x-5" : "translate-x-1"}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-200/60">
                    <div>
                      <p className="text-xs font-bold text-slate-800">24×7 Ambulance Service</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Show ambulance as ready on citizen search</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHasAmbulance(!hasAmbulance)}
                      className={`relative w-10 h-6 rounded-full transition-colors ${hasAmbulance ? "bg-blue-600" : "bg-slate-300"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${hasAmbulance ? "translate-x-5" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                {success && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mr-auto">
                    <CheckCircle className="h-4 w-4" /> Profile saved successfully!
                  </span>
                )}
                <Button
                  type="submit"
                  disabled={saving}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
