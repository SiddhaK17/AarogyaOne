import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export default function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
}: CardProps) {
  const paddings: Record<string, string> = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm ${
        hover ? 'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300' : ''
      } ${paddings[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
