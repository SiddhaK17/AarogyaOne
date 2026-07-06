'use client';

import React, { useState } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  FileText,
  Download,
  Pill,
  BedDouble,
  Users,
  BarChart3,
  AlertTriangle,
  MessageSquare,
  Activity,
  BrainCircuit,
  Calendar,
  Clock,
  TrendingUp,
  Loader2,
  X,
} from 'lucide-react';
import { hospitalApi } from '@/lib/api';

/* ─── Mock Data ─── */
const reportTypes = [
  { name: 'Daily Operations', icon: Activity, description: 'Complete daily operational summary', bg: 'bg-teal-50', color: 'text-teal-600', lastGenerated: 'Today, 6:00 PM' },
  { name: 'Medicine Consumption', icon: Pill, description: 'Detailed medicine usage and depletion report', bg: 'bg-blue-50', color: 'text-blue-600', lastGenerated: 'Today, 5:30 PM' },
  { name: 'Bed Utilization', icon: BedDouble, description: 'Bed occupancy rates and patient flow analysis', bg: 'bg-indigo-50', color: 'text-indigo-600', lastGenerated: 'Yesterday' },
  { name: 'Staff Attendance', icon: Users, description: 'Workforce attendance trends and shift coverage', bg: 'bg-violet-50', color: 'text-violet-600', lastGenerated: 'Today, 6:00 PM' },
  { name: 'Resource Usage', icon: BarChart3, description: 'Consumables, oxygen, blood unit utilization', bg: 'bg-emerald-50', color: 'text-emerald-600', lastGenerated: '2 days ago' },
  { name: 'Infrastructure Issues', icon: AlertTriangle, description: 'Open issues, resolution times, and trends', bg: 'bg-amber-50', color: 'text-amber-600', lastGenerated: 'Yesterday' },
  { name: 'Citizen Feedback', icon: MessageSquare, description: 'Citizen complaints and satisfaction metrics', bg: 'bg-pink-50', color: 'text-pink-600', lastGenerated: '3 days ago' },
  { name: 'Hospital Performance', icon: TrendingUp, description: 'AI Health Score breakdown and improvement areas', bg: 'bg-sky-50', color: 'text-sky-600', lastGenerated: 'Today, 6:00 PM' },
];

const executiveBriefs = [
  { name: 'Hospital Summary', description: 'One-page overview of all operations', period: 'Daily' },
  { name: 'District Summary', description: 'Comparative analysis across district facilities', period: 'Weekly' },
  { name: 'Weekly Executive Brief', description: 'Key metrics, risks, and recommendations', period: 'Weekly' },
  { name: 'Monthly Health Report', description: 'Comprehensive monthly performance review', period: 'Monthly' },
];

const recentReports = [
  { name: 'Daily Operations Report - June 30', type: 'Daily Operations', format: 'PDF', size: '2.4 MB', generated: 'Today, 6:00 PM', status: 'Ready' },
  { name: 'Medicine Consumption - Week 26', type: 'Medicine Consumption', format: 'PDF', size: '1.8 MB', generated: 'Today, 5:30 PM', status: 'Ready' },
  { name: 'Monthly Performance - May 2026', type: 'Hospital Performance', format: 'PDF', size: '4.2 MB', generated: 'Jun 1, 2026', status: 'Ready' },
  { name: 'Bed Utilization - June 29', type: 'Bed Utilization', format: 'CSV', size: '340 KB', generated: 'Yesterday', status: 'Ready' },
  { name: 'Executive Brief - Week 25', type: 'Executive Brief', format: 'PDF', size: '1.1 MB', generated: 'Jun 23, 2026', status: 'Ready' },
];

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [generatedBrief, setGeneratedBrief] = useState<any>(null);

  const handleGenerateBrief = async (briefType: string) => {
    setLoadingReport(true);
    try {
      const data = await hospitalApi.getReport() as any;
      setReportData(data);
      // Construct an executive brief dynamically
      let text = `Executive Brief: ${briefType}\nGenerated: ${new Date(data.generated_at).toLocaleString('en-IN')}\n\n`;
      text += `Hospital: ${data.hospital_name} (Score: ${data.health_score.toFixed(1)}/100)\n`;
      text += `Total Beds: ${data.total_beds}\n`;
      text += `Open Infrastructure Issues: ${data.open_issues}\n\n`;
      text += `Beds Summary:\n`;
      (data.beds_summary || []).forEach((b: any) => {
        text += `- ${b.category}: ${b.occupied} / ${b.total} occupied\n`;
      });
      text += `\nInventory Alerts:\n`;
      (data.inventory_summary || []).filter((i: any) => i.ai_prediction === 'Critical Shortage').forEach((i: any) => {
        text += `- ${i.item}: Only ${i.quantity} ${i.unit} remaining\n`;
      });

      setGeneratedBrief({ title: briefType, content: text });
    } catch (err) {
      console.error(err);
      alert('Failed to generate report from server.');
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="space-y-8">
      {generatedBrief && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                {generatedBrief.title}
              </h2>
              <button onClick={() => setGeneratedBrief(null)} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-medium font-mono bg-slate-50 p-4 rounded-xl border border-slate-100">{generatedBrief.content}</pre>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setGeneratedBrief(null)}>Close</Button>
              <Button variant="primary"><Download className="h-4 w-4" /> Download PDF</Button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Auto-generated operational reports and AI executive briefs</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm"><Calendar className="h-4 w-4" /> Custom Range</Button>
          <Button variant="primary" size="sm"><FileText className="h-4 w-4" /> Generate Report</Button>
        </div>
      </div>

      {/* ─── Report Types Grid ─── */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.name} padding="md" hover className="cursor-pointer group">
                <div className={`p-2.5 rounded-xl ${report.bg} w-fit mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`h-5 w-5 ${report.color}`} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{report.name}</h3>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-3">{report.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" /> {report.lastGenerated}
                  </span>
                  <Button variant="ghost" size="sm" className="!px-2 !py-1 text-[10px]">
                    <Download className="h-3 w-3" /> PDF
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ─── Executive Brief Generator ─── */}
      <Card padding="md" className="border-teal-200/30 bg-gradient-to-r from-teal-50/30 via-white to-blue-50/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600">
            <BrainCircuit className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Executive Brief Generator</h3>
            <p className="text-[10px] text-slate-500 font-medium">AI-generated structured documents for meetings and reviews</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {executiveBriefs.map((brief) => (
            <div
              key={brief.name}
              onClick={() => handleGenerateBrief(brief.name)}
              className="bg-white/80 rounded-xl border border-slate-100 p-4 hover:shadow-md hover:border-teal-200 transition-all cursor-pointer group"
            >
              <h4 className="text-xs font-bold text-slate-900 mb-1">{brief.name}</h4>
              <p className="text-[10px] text-slate-500 font-medium mb-3">{brief.description}</p>
              <div className="flex items-center justify-between">
                <Badge variant="neutral" size="sm">{brief.period}</Badge>
                <span className="text-[9px] font-bold text-teal-600 group-hover:underline">
                  {loadingReport ? 'Generating...' : 'Generate →'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ─── Recent Reports Table ─── */}
      <Card padding="none">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Recent Reports</h3>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Previously generated and ready for download</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Report</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Type</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Format</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Size</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Generated</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentReports.map((report, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-bold text-slate-900">{report.name}</p>
                  </td>
                  <td className="px-5 py-3.5"><Badge variant="neutral" size="sm">{report.type}</Badge></td>
                  <td className="px-5 py-3.5"><Badge variant={report.format === 'PDF' ? 'info' : 'healthy'} size="sm">{report.format}</Badge></td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">{report.size}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">{report.generated}</td>
                  <td className="px-5 py-3.5">
                    <Button variant="ghost" size="sm" className="!px-2 !py-1">
                      <Download className="h-3.5 w-3.5" /> Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
