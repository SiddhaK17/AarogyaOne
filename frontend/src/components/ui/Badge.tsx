import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'healthy' | 'warning' | 'critical' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
}: BadgeProps) {
  const variants: Record<string, string> = {
    healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/60',
    critical: 'bg-rose-50 text-rose-700 border-rose-200/60',
    info: 'bg-blue-50 text-blue-700 border-blue-200/60',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200/60',
  };

  const dotColors: Record<string, string> = {
    healthy: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-rose-500',
    info: 'bg-blue-500',
    neutral: 'bg-slate-400',
  };

  const sizes: Record<string, string> = {
    sm: 'px-2.5 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border ${variants[variant]} ${sizes[size]}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} ${
            variant === 'critical' ? 'animate-pulse' : ''
          }`}
        />
      )}
      {children}
    </span>
  );
}
