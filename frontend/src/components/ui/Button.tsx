import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants: Record<string, string> = {
    primary:
      'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 focus:ring-slate-900',
    secondary:
      'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20 focus:ring-teal-600',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/20 focus:ring-rose-600',
    ghost:
      'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400',
    outline:
      'bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 focus:ring-slate-400',
  };

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-sm',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
