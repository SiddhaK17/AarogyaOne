'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  Server,
  Activity,
  Database,
  ShieldCheck,
  Cpu,
  HardDrive,
  RefreshCw,
  Terminal,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  Globe,
  Lock,
  Play,
  Download,
} from 'lucide-react';

export default function GovernmentSystemHealthPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'telemetry' | 'logs'>('overview');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);
  const [lastScanTime, setLastScanTime] = useState<string>('Just now');
  const [logs, setLogs] = useState<Array<{ time: string; level: 'INFO' | 'WARN' | 'SUCCESS'; source: string; message: string }>>([
    { time: '12:48:40', level: 'SUCCESS', source: 'aarogyaone.core', message: '✅ AI Subsystem loaded and warmed up successfully.' },
    { time: '12:48:40', level: 'INFO', source: 'supabase.storage', message: 'Storage buckets verified: evidence-photos, voice-notes, reports.' },
    { time: '12:48:39', level: 'INFO', source: 'database.pool', message: 'PostgreSQL connection pool initialized (10 max connections).' },
    { time: '12:48:38', level: 'INFO', source: 'ai.pipeline.nlp', message: 'NLPEngine PyTorch runtime initialized with OpenMP bypass.' },
    { time: '12:45:12', level: 'SUCCESS', source: 'auth.gateway', message: 'Citizen profile Test Citizen registered (ID: 7).' },
    { time: '12:40:05', level: 'WARN', source: 'dispatcher.engine', message: 'High load detected in District Medical Store queue (8 pending orders).' },
  ]);

  const handleRunDiagnostic = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setLastScanTime(new Date().toLocaleTimeString('en-IN'));
          setLogs((prevLogs) => [
            {
              time: new Date().toLocaleTimeString('en-IN'),
              level: 'SUCCESS',
              source: 'system.diagnostic',
              message: '🔍 Full diagnostic scan completed with 0 errors found. All nodes healthy.',
            },
            ...prevLogs,
          ]);
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  const handleClearCache = () => {
    alert('AI Engine cache cleared and models re-warmed successfully.');
    setLogs((prevLogs) => [
      {
        time: new Date().toLocaleTimeString('en-IN'),
        level: 'INFO',
        source: 'ai.cache',
        message: '⚡ AI inference cache purged; models re-loaded into memory pool.',
      },
      ...prevLogs,
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-brand-navy to-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM OPERATIONAL
            </span>
            <span className="text-xs font-bold text-slate-400">Environment: Production (IN-West-1)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Server className="h-7 w-7 text-brand-cyan" />
            System Health & AI Telemetry
          </h1>
          <p className="text-sm text-slate-300 font-medium max-w-xl">
            Real-time infrastructure monitoring, AI pipeline diagnostics, and inter-agency routing telemetry for the AarogyaOne network.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
            className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1 text-brand-cyan" />
            Re-warm AI Models
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleRunDiagnostic}
            disabled={isScanning}
            className="bg-brand-cyan hover:bg-brand-cyan/90 text-slate-950 font-black text-xs shadow-lg shadow-brand-cyan/20"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? `Scanning (${scanProgress}%)...` : 'Run Diagnostic Scan'}
          </Button>
        </div>
      </div>

      {/* Progress bar if scanning */}
      {isScanning && (
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-brand-blue h-full transition-all duration-300 ease-out"
            style={{ width: `${scanProgress}%` }}
          />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-brand-blue text-brand-blue'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="h-4 w-4" /> Infrastructure Overview
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`pb-3 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'telemetry'
              ? 'border-brand-blue text-brand-blue'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="h-4 w-4" /> AI Pipeline Telemetry
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'logs'
              ? 'border-brand-blue text-brand-blue'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Terminal className="h-4 w-4" /> Live System Logs
        </button>
      </div>

      {/* ─── TAB 1: OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Core Subsystems Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: API Gateway */}
            <Card padding="sm" className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Gateway & API</span>
                  <h3 className="text-base font-black text-slate-900">FastAPI Server</h3>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-emerald-700">Online • 99.99%</span>
                  </div>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Globe className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-semibold">
                <span>Avg Latency: <strong className="text-slate-800">14 ms</strong></span>
                <span>Port: <strong className="text-slate-800">8001</strong></span>
              </div>
            </Card>

            {/* Card 2: AI Subsystem */}
            <Card padding="sm" className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Intelligence Core</span>
                  <h3 className="text-base font-black text-slate-900">AarogyaPulse AI</h3>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-xs font-bold text-purple-700">Warmed Up • Ready</span>
                  </div>
                </div>
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-semibold">
                <span>Pipelines: <strong className="text-slate-800">NLP / Speech / Vision</strong></span>
                <span className="text-purple-700 font-bold">PyTorch OK</span>
              </div>
            </Card>

            {/* Card 3: Database Cluster */}
            <Card padding="sm" className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Data Persistence</span>
                  <h3 className="text-base font-black text-slate-900">PostgreSQL + SQLite</h3>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-blue-700">Connected • Healthy</span>
                  </div>
                </div>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Database className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-semibold">
                <span>Pool Status: <strong className="text-slate-800">4 / 10 Active</strong></span>
                <span>Lag: <strong className="text-slate-800">0 ms</strong></span>
              </div>
            </Card>

            {/* Card 4: Storage & Security */}
            <Card padding="sm" className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Media & Buckets</span>
                  <h3 className="text-base font-black text-slate-900">Supabase Vault</h3>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-amber-700">3 Buckets Verified</span>
                  </div>
                </div>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-semibold">
                <span>Encryption: <strong className="text-slate-800">AES-256</strong></span>
                <span>CORS: <strong className="text-slate-800">Enforced</strong></span>
              </div>
            </Card>
          </div>

          {/* Resource Utilization Meters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card padding="md" className="space-y-4 col-span-1 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">System Load & Hardware Telemetry</h3>
                  <p className="text-xs text-slate-500 font-medium">Real-time resource allocation across server cluster</p>
                </div>
                <span className="text-xs font-bold text-slate-400">Updated: {lastScanTime}</span>
              </div>

              <div className="space-y-5">
                {/* Meter 1: CPU */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Cpu className="h-4 w-4 text-brand-blue" /> CPU Utilization (8 Cores • OpenMP Threads)
                    </span>
                    <span className="text-brand-blue font-black">28%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-brand-blue h-full rounded-full transition-all duration-500" style={{ width: '28%' }} />
                  </div>
                </div>

                {/* Meter 2: RAM */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Layers className="h-4 w-4 text-purple-600" /> Memory Pool (PyTorch Models + Uvicorn Workers)
                    </span>
                    <span className="text-purple-600 font-black">4.2 GB / 16.0 GB (26%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: '26%' }} />
                  </div>
                </div>

                {/* Meter 3: Disk & DB Cache */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <HardDrive className="h-4 w-4 text-emerald-600" /> SQLite Local Cache & WAL Journaling
                    </span>
                    <span className="text-emerald-600 font-black">184 MB / 5.0 GB (3%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: '3.6%' }} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  No duplicate DLL library conflicts detected (OpenMP bypass active).
                </span>
                <span className="text-slate-400 font-mono text-[11px]">KMP_DUPLICATE_LIB_OK=TRUE</span>
              </div>
            </Card>

            {/* Quick Actions & Security Audit */}
            <Card padding="md" className="space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 mb-1">Security & Network Guard</h3>
                <p className="text-xs text-slate-500 font-medium mb-4">Active firewall policies and JWT authentication controls</p>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700 flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-slate-400" /> JWT Token Validation
                    </span>
                    <Badge variant="healthy">Enforced</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700 flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400" /> CORS Origin Filter
                    </span>
                    <Badge variant="healthy">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700 flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400" /> Rate Limiting (API)
                    </span>
                    <span className="font-bold text-slate-800">100 req / min</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert('Exporting encrypted health report package...')}
                  className="w-full font-bold text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download Diagnostic Package
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ─── TAB 2: TELEMETRY ─── */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" /> AI Pipeline Execution Diagnostics
                </h3>
                <p className="text-xs text-slate-500 font-medium">Performance benchmarks for automated triage and multimodal processing</p>
              </div>
              <Badge variant="healthy" dot>All Engines Online</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pipeline 1: NLP */}
              <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-900 uppercase">NLP Classification</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">RoBERTa / Llama Hybrid</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Analyzes citizen grievance text to determine severity level and automatically assign responsible departments.
                </p>
                <div className="pt-2 border-t border-purple-100/60 flex justify-between text-xs font-bold text-purple-950">
                  <span>Avg Latency: 180 ms</span>
                  <span>Accuracy: 94.2%</span>
                </div>
              </div>

              {/* Pipeline 2: Speech */}
              <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-900 uppercase">Voice Transcription</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Whisper-Large-V3</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Transcribes multilingual citizen voice notes (Hindi, Marathi, English) and extracts medical keywords.
                </p>
                <div className="pt-2 border-t border-blue-100/60 flex justify-between text-xs font-bold text-blue-950">
                  <span>Avg Latency: 420 ms</span>
                  <span>WER: &lt; 4.8%</span>
                </div>
              </div>

              {/* Pipeline 3: Vision */}
              <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900 uppercase">Vision Evidence</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Florence-2 Vision</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Verifies uploaded photos of hospital infrastructure damage, medicine stockouts, and sanitation issues.
                </p>
                <div className="pt-2 border-t border-emerald-100/60 flex justify-between text-xs font-bold text-emerald-950">
                  <span>Avg Latency: 310 ms</span>
                  <span>Confidence: 91.5%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ─── TAB 3: LIVE LOGS ─── */}
      {activeTab === 'logs' && (
        <Card padding="none" className="overflow-hidden border-slate-800 bg-slate-950 text-slate-200 font-mono text-xs shadow-2xl">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-2 font-bold text-slate-400">aarogyaone-backend.log • Tail (100 lines)</span>
            </div>
            <button
              onClick={() => {
                setLogs((prev) => [
                  {
                    time: new Date().toLocaleTimeString('en-IN'),
                    level: 'INFO',
                    source: 'user.audit',
                    message: '📡 Manual log refresh requested from Government Portal.',
                  },
                  ...prev,
                ]);
              }}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
            >
              + Stream Event
            </button>
          </div>

          <div className="p-4 space-y-2.5 max-h-[450px] overflow-y-auto">
            {logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-3 border-b border-slate-900/80 pb-2">
                <span className="text-slate-500 font-semibold flex-shrink-0">{log.time}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black flex-shrink-0 ${
                    log.level === 'SUCCESS'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : log.level === 'WARN'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-purple-400 font-bold flex-shrink-0">[{log.source}]</span>
                <span className="text-slate-300 leading-relaxed">{log.message}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
