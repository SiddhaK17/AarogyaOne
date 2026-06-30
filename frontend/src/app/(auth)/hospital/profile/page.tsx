'use client';

import React from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Edit3,
  CheckCircle2,
  Globe,
  BedDouble,
  Stethoscope,
  FlaskConical,
  Ambulance,
  ShieldCheck,
} from 'lucide-react';

/* ─── Mock Hospital Profile ─── */
const profile = {
  name: 'Primary Health Centre (PHC) Kothrud',
  registrationNo: 'MH-PUNE-PHC-00347',
  type: 'Primary Health Centre (PHC)',
  district: 'Pune',
  taluka: 'Haveli',
  address: 'Plot No. 42, Kothrud Main Road, Near Paud Phata, Kothrud, Pune - 411038',
  coordinates: { lat: 18.5074, lng: 73.8077 },
  phone: '+91-20-2543-8800',
  email: 'phc.kothrud@nhm.gov.in',
  operatingHours: '24/7 Emergency | OPD: 8:00 AM - 5:00 PM',
  status: 'Active',
  activatedOn: '15 March 2024',
  approvedBy: 'Dr. Sunil Wagh, District Health Officer, Pune',
};

const facilities = [
  { label: 'Total Beds', value: '147', icon: BedDouble, bg: 'bg-blue-50', color: 'text-blue-600' },
  { label: 'ICU Capacity', value: '20', icon: BedDouble, bg: 'bg-rose-50', color: 'text-rose-600' },
  { label: 'Departments', value: '12', icon: Building2, bg: 'bg-indigo-50', color: 'text-indigo-600' },
  { label: 'Doctors', value: '18', icon: Stethoscope, bg: 'bg-teal-50', color: 'text-teal-600' },
  { label: 'Lab Facilities', value: 'Full', icon: FlaskConical, bg: 'bg-violet-50', color: 'text-violet-600' },
  { label: 'Ambulances', value: '4', icon: Ambulance, bg: 'bg-orange-50', color: 'text-orange-600' },
];

const departments = [
  'General Medicine', 'Pediatrics', 'Obstetrics & Gynecology', 'Orthopedics',
  'ENT', 'Ophthalmology', 'Dermatology', 'Dental', 'Radiology',
  'Pathology', 'Emergency Medicine', 'Pharmacy',
];

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hospital Profile</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage your facility information and registration details</p>
        </div>
        <Button variant="outline" size="sm"><Edit3 className="h-4 w-4" /> Edit Profile</Button>
      </div>

      {/* ─── Profile Card ─── */}
      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-50/40 via-transparent to-blue-50/40" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-teal-500 to-blue-600 p-3 rounded-2xl shadow-lg shadow-teal-500/20">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">{profile.name}</h2>
                  <p className="text-xs text-slate-500 font-medium">{profile.registrationNo}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <Badge variant="healthy" dot size="md">{profile.status}</Badge>
                <Badge variant="info" size="md">{profile.type}</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-50"><MapPin className="h-4 w-4 text-slate-500" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address</p>
                    <p className="text-xs text-slate-700 font-medium mt-0.5">{profile.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-50"><Globe className="h-4 w-4 text-slate-500" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GPS Coordinates</p>
                    <p className="text-xs text-slate-700 font-medium mt-0.5">{profile.coordinates.lat}°N, {profile.coordinates.lng}°E</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-50"><Phone className="h-4 w-4 text-slate-500" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                    <p className="text-xs text-slate-700 font-medium mt-0.5">{profile.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-50"><Mail className="h-4 w-4 text-slate-500" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                    <p className="text-xs text-slate-700 font-medium mt-0.5">{profile.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-50"><Clock className="h-4 w-4 text-slate-500" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operating Hours</p>
                    <p className="text-xs text-slate-700 font-medium mt-0.5">{profile.operatingHours}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-50"><ShieldCheck className="h-4 w-4 text-slate-500" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">District & Taluka</p>
                    <p className="text-xs text-slate-700 font-medium mt-0.5">{profile.district}, {profile.taluka}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right – Verification Card */}
            <div className="md:w-[280px] flex-shrink-0 bg-white/80 rounded-xl border border-emerald-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Verified & Active</span>
              </div>
              <div className="space-y-3 text-[10px]">
                <div>
                  <span className="text-slate-400 font-medium">Activated On</span>
                  <p className="font-bold text-slate-800 mt-0.5">{profile.activatedOn}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Approved By</span>
                  <p className="font-bold text-slate-800 mt-0.5">{profile.approvedBy}</p>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 font-medium">Registration</span>
                  <p className="font-bold text-slate-800 mt-0.5">{profile.registrationNo}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── Facility Summary ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {facilities.map((fac) => {
          const Icon = fac.icon;
          return (
            <Card key={fac.label} padding="md" className="text-center">
              <div className={`p-2.5 rounded-xl ${fac.bg} w-fit mx-auto mb-2`}>
                <Icon className={`h-5 w-5 ${fac.color}`} />
              </div>
              <p className="text-xl font-black text-slate-900">{fac.value}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{fac.label}</p>
            </Card>
          );
        })}
      </div>

      {/* ─── Departments ─── */}
      <Card padding="md">
        <CardHeader title="Departments" subtitle={`${departments.length} departments registered at this facility`} />
        <div className="flex flex-wrap gap-2">
          {departments.map((dept) => (
            <Badge key={dept} variant="neutral" size="md">
              {dept}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
