import Link from "next/link";
import { ArrowLeft, Activity, ShieldAlert, Heart, Cpu, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors font-bold">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>

        {/* Hero Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 mb-6 shadow-sm">
            <Activity className="h-8 w-8" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
            About AarogyaOne
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The Vision and Technology powering India's unified public healthcare intelligence network.
          </p>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-12">
          {/* Mission */}
          <div className="bg-white rounded-[2rem] p-8 sm:p-10 border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl -z-10"></div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Heart className="h-6 w-6 text-rose-500" /> Our Mission
            </h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              AarogyaOne was designed during the Hack2Skill Hackathon as a solution to critical operational bottlenecks in district public healthcare systems. Our goal is to transform reactive healthcare administration into a proactive, data-driven, and patient-centric ecosystem. By predicting shortages before they happen and automating resource routing, AarogyaOne saves time, resources, and lives.
            </p>
          </div>

          {/* Pillars of Intelligence */}
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-6 text-center">Pillars of Intelligence</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
                  <Cpu className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 mb-2">Predictive AI Analytics</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Monitors real-time drug stock, forecasts OPD footfall, and predicts bed shortages up to 72 hours in advance using advanced AI models.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 border border-teal-100">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 mb-2">Unified Portals</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Integrates public services, hospital workflows, district administration, and resolving authorities (like PWD) into one synchronized communication framework.
                </p>
              </div>
            </div>
          </div>

          {/* Compliance & Security */}
          <div className="bg-slate-900 text-white rounded-[2rem] p-8 sm:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
            <h2 className="text-2xl font-extrabold mb-4 flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-teal-400" /> Security & Authority
            </h2>
            <p className="text-slate-300 leading-relaxed text-sm font-medium">
              We align strictly with ABDM (Ayushman Bharat Digital Mission) standards, ensuring encrypted data vaults, consent-based health record sharing, and secure portal access logs verified through Aadhaar APIs for total system transparency.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider">
          AarogyaOne Platform © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
