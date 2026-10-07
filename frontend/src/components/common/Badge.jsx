import React from 'react';

const STATUS_STYLES = {
  // Green states
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  excellent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  present: 'bg-emerald-50 text-emerald-700 border-emerald-200',

  // Amber states
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  needs_service: 'bg-amber-50 text-amber-700 border-amber-200',
  under_maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
  good: 'bg-blue-50 text-blue-700 border-blue-200',
  intermediate: 'bg-blue-50 text-blue-700 border-blue-200',

  // Red states
  inactive: 'bg-rose-50 text-rose-700 border-rose-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  out_of_order: 'bg-rose-50 text-rose-700 border-rose-200',
  advanced: 'bg-purple-50 text-purple-700 border-purple-200',
  beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',

  // Default
  default: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function Badge({ children, variant, className = '' }) {
  const key = (variant || children || '').toString().toLowerCase().replace(/\s+/g, '_');
  const style = STATUS_STYLES[key] || STATUS_STYLES.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide uppercase ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}
