import React from 'react';
import { Loader2 } from 'lucide-react';

export function PageLoader({ message = "Verifying secure session..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-200" aria-label="Loading page" aria-live="polite">
      <Loader2 className="h-10 w-10 text-teal-500 animate-spin mb-4" />
      <h2 className="text-lg font-bold text-white tracking-tight">{message}</h2>
    </div>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm animate-pulse" aria-hidden="true">
      <div className="h-5 bg-slate-200 rounded-full w-1/3 mb-4"></div>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`h-4 bg-slate-100 rounded-full ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}></div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number, columns?: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm animate-pulse" aria-hidden="true">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-200 rounded-full flex-1"></div>
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex gap-4">
            {Array.from({ length: columns }).map((_, c) => (
              <div key={c} className={`h-4 bg-slate-100 rounded-full ${c === 0 ? 'w-1/2' : 'flex-1'}`}></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
