import Link from "next/link";
import { ShieldCheck, HeartPulse, Menu, Mic, Globe2, Activity } from "lucide-react";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-sans selection:bg-teal-200">
      {/* Glassmorphism Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Custom Logo Section */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* Temporary Placeholder Icon until logo.png is ready */}
            <div className="bg-gradient-to-br from-teal-500 to-blue-600 p-2 rounded-xl shadow-sm group-hover:shadow-md transition-all">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
              AarogyaOne
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-8 font-semibold text-sm text-slate-600">
            <Link href="#ecosystem" className="hover:text-teal-600 transition-colors">The Ecosystem</Link>
            <Link href="#intelligence" className="hover:text-teal-600 transition-colors">AI Intelligence</Link>
            <Link href="#how-it-works" className="hover:text-teal-600 transition-colors">How it Works</Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full mr-2">
              <Globe2 className="h-3.5 w-3.5 text-teal-600" /> English / हिन्दी / मराठी
            </div>
            <Link 
              href="/login" 
              className="hidden sm:inline-flex px-6 py-2.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              Secure Login
            </Link>
            {/* Mobile Menu Icon */}
            <button className="md:hidden p-2 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg transition-colors">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Production-Grade Footer */}
      <footer className="bg-[#0B1120] text-slate-300 py-16 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              {/* Temporary Placeholder Icon */}
              <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                <Activity className="h-6 w-6 text-teal-400" />
              </div>
              <span className="font-bold text-2xl text-white tracking-tight">AarogyaOne</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              AarogyaOne is the centralized intelligence network for public healthcare operations. We transform reactive medical management into a proactive, AI-assisted ecosystem, ensuring no citizen is denied care due to resource mismanagement.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-white mb-6 tracking-wider text-xs uppercase text-teal-400">Public Services</h3>
            <ul className="space-y-3 text-sm text-slate-400 font-medium">
              <li><Link href="/citizen/search" className="hover:text-white transition-colors">Find Nearby Hospitals</Link></li>
              <li><Link href="/citizen/emergency" className="hover:text-white transition-colors">Emergency Services</Link></li>
              <li><Link href="/citizen/report" className="hover:text-white transition-colors">File a Grievance</Link></li>
              <li><Link href="/citizen/track" className="hover:text-white transition-colors">Track Complaint Status</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-6 tracking-wider text-xs uppercase text-teal-400">Security & Trust</h3>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-center gap-3">
                <div className="bg-slate-800 p-2 rounded-lg"><ShieldCheck className="h-4 w-4 text-teal-400" /></div> 
                <span className="font-medium">Government Grade RBAC</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-slate-800 p-2 rounded-lg"><HeartPulse className="h-4 w-4 text-blue-400" /></div> 
                <span className="font-medium">Citizen Privacy First</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-slate-800 p-2 rounded-lg"><Mic className="h-4 w-4 text-emerald-400" /></div> 
                <span className="font-medium">Voice Data Encrypted</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
          <p>© {new Date().getFullYear()} AarogyaOne National Healthcare Platform. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-slate-300 transition-colors">Accessibility Statement</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}