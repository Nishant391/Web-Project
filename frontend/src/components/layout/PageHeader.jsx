import React from 'react';

export function PageHeader({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 shadow-sm border border-brand-100">
            <Icon size={24} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}
