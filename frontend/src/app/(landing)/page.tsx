import Link from "next/link";
import { 
  Building2, Users, Map, Wrench, 
  BrainCircuit, TrendingUp, Mic, ArrowRight, Activity, Search, ShieldAlert, FileText, CheckCircle2
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full overflow-hidden">
      
      {/* 1. HERO SECTION (Expansive & Clean) */}
      <section className="relative bg-white pt-20 pb-32 lg:pt-32 lg:pb-48 overflow-hidden flex flex-col items-center justify-center text-center">
        {/* Abstract Gradient Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50 via-white to-white -z-10"></div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 text-xs sm:text-sm font-bold mb-8 transition-transform hover:scale-105">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            National Public Healthcare Intelligence Network
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.05] mb-8">
            Anticipate Shortages. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-700">
              Automate Healthcare.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 mb-12 leading-relaxed max-w-3xl mx-auto font-medium">
            AarogyaOne is a proactive operational ecosystem for primary and community health centres. We utilize predictive AI to monitor district inventory, forecast bed capacity, and route life-saving resources before emergencies escalate.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="#ecosystem" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-teal-700 hover:shadow-teal-500/30 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2">
              Explore the Platform <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/citizen/search" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border-2 border-slate-200 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2">
              <Search className="h-5 w-5 text-slate-400" /> Find Nearby Hospitals
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THE ECOSYSTEM (Bento Box Grid) */}
      <section id="ecosystem" className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 lg:mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">The Unified Ecosystem</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg font-medium">
              AarogyaOne connects every stakeholder. Citizens access public services freely, while hospital staff and district authorities log in to secure command centers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* CITIZEN PORTAL - Emphasizing Public vs Private Flow */}
            <div className="lg:col-span-3 bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-200 hover:shadow-xl transition-shadow flex flex-col md:flex-row gap-8 items-center justify-between group overflow-hidden relative">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-teal-50 rounded-full blur-3xl group-hover:bg-teal-100 transition-colors duration-700 -z-10"></div>
              
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 text-teal-600 font-bold tracking-wider text-xs uppercase mb-4">
                  <Users className="h-4 w-4" /> For the Public
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Citizen Gateway</h3>
                <p className="text-slate-600 text-base mb-8 leading-relaxed max-w-xl">
                  Instantly locate the nearest operational government hospitals and emergency services without an account. To ensure accountability, citizens can securely log in to submit voice-based operational grievances and track real-time issue resolution.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/citizen/search" className="px-6 py-3 bg-teal-50 text-teal-700 rounded-xl font-bold hover:bg-teal-100 transition-colors flex items-center gap-2">
                    <Search className="h-4 w-4" /> Public Hospital Search
                  </Link>
                  <Link href="/login?role=citizen" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" /> Login to Report Issue
                  </Link>
                </div>
              </div>

              <div className="hidden md:flex flex-col gap-4 w-full max-w-xs">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-start gap-4">
                  <div className="bg-white p-2 rounded-full shadow-sm"><Mic className="h-5 w-5 text-teal-600" /></div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Multilingual Voice</h4>
                    <p className="text-xs text-slate-500 mt-1">Speak issues directly in Hindi or Marathi.</p>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-start gap-4">
                  <div className="bg-white p-2 rounded-full shadow-sm"><Activity className="h-5 w-5 text-blue-600" /></div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Live Tracking</h4>
                    <p className="text-xs text-slate-500 mt-1">See exactly when your grievance is resolved.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SECURE ADMIN PORTALS */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 group">
              <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Hospital Portal</h3>
              <p className="text-slate-600 text-sm mb-8 leading-relaxed font-medium">
                For authorized PHC/CHC medical officers to log daily inventory, bed occupancy, and staff attendance. Data fed here powers the entire AI network.
              </p>
              <Link href="/login?role=hospital" className="text-blue-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                Authorized Login <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 group">
              <div className="bg-indigo-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <Map className="h-7 w-7 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">District Command</h3>
              <p className="text-slate-600 text-sm mb-8 leading-relaxed font-medium">
                The supervisory dashboard for District Health Officers. View geographic risk heatmaps, approve AI resource transfers, and intervene early.
              </p>
              <Link href="/login?role=dhic" className="text-indigo-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                Authorized Login <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 group">
              <div className="bg-orange-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <Wrench className="h-7 w-7 text-orange-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Govt. Authorities</h3>
              <p className="text-slate-600 text-sm mb-8 leading-relaxed font-medium">
                PWD, Medical Stores, and engineers receive AI-routed infrastructure repair tasks, upload photographic evidence, and manage resolutions.
              </p>
              <Link href="/login?role=government" className="text-orange-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                Authorized Login <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (Data Flow Visualization) */}
      <section id="how-it-works" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">The Operational Workflow</h2>
            <p className="text-slate-600 text-lg font-medium">How raw hospital data becomes actionable district intelligence.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting Line for Desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>

            {[
              { step: "01", title: "Data Ingestion", desc: "Hospitals report daily inventory and citizens log grievances.", icon: <FileText className="h-6 w-6 text-slate-600" /> },
              { step: "02", title: "AI Analysis", desc: "The engine predicts shortages and classifies unstructured complaints.", icon: <BrainCircuit className="h-6 w-6 text-blue-600" /> },
              { step: "03", title: "Optimization", desc: "OR-Tools maps the fastest route to redistribute surplus resources.", icon: <Map className="h-6 w-6 text-indigo-600" /> },
              { step: "04", title: "Execution", desc: "District officers approve actions, ensuring rapid on-ground resolution.", icon: <CheckCircle2 className="h-6 w-6 text-teal-600" /> }
            ].map((item, index) => (
              <div key={index} className="relative z-10 flex flex-col items-center text-center bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="text-5xl font-black text-slate-100 absolute top-4 left-6 -z-10">{item.step}</div>
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  {item.icon}
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h4>
                <p className="text-sm text-slate-600 font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. AI CAPABILITIES SECTION */}
      <section id="intelligence" className="py-24 lg:py-32 bg-[#0B1120] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">
            The Intelligence <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">Engine</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-20 font-medium leading-relaxed">
            AarogyaOne relies on a modular architecture of specialized machine learning models working together, ensuring blazingly fast inference and highly accurate operational decision support.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-slate-900/50 border border-slate-800 p-10 rounded-[2rem] hover:bg-slate-800/80 transition-colors text-left group">
              <TrendingUp className="h-10 w-10 text-teal-400 mb-8 group-hover:scale-110 transition-transform" />
              <h4 className="text-2xl font-bold text-white mb-4">Demand Forecasting</h4>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Powered by LightGBM. The engine analyzes historical tabular data to accurately predict medicine stock-outs and bed capacity shortages 4-7 days in advance.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-10 rounded-[2rem] hover:bg-slate-800/80 transition-colors text-left group">
              <BrainCircuit className="h-10 w-10 text-blue-400 mb-8 group-hover:scale-110 transition-transform" />
              <h4 className="text-2xl font-bold text-white mb-4">Resource Routing</h4>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Driven by Google OR-Tools. Calculates the most efficient nearby hospital to transfer resources from when severe shortages trigger, balancing district logistics.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-10 rounded-[2rem] hover:bg-slate-800/80 transition-colors text-left group">
              <Mic className="h-10 w-10 text-emerald-400 mb-8 group-hover:scale-110 transition-transform" />
              <h4 className="text-2xl font-bold text-white mb-4">Indic Text & Speech</h4>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Integrating IndicWhisper & IndicBERT. Classifies unstructured citizen complaints in Hindi and Marathi into structured operational workflows with severity scores.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}