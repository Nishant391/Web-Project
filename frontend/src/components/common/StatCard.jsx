import React from 'react';
import { motion } from 'framer-motion';

export function StatCard({
  title,
  value,
  subtitle,
  description,
  icon: Icon,
  trend,
  trendType = 'positive', // 'positive' | 'negative' | 'neutral'
  badge,
  className = '',
}) {
  const effectiveSubtitle = subtitle || description;

  // Handle both trend as object { value: 12, isPositive: true } or trend as string
  let trendText = null;
  let isPositive = trendType === 'positive';

  if (trend && typeof trend === 'object') {
    isPositive = trend.isPositive !== false;
    trendText = `${isPositive ? '+' : '-'}${trend.value}%`;
  } else if (typeof trend === 'string' || typeof trend === 'number') {
    trendText = String(trend);
  }

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        {Icon && (
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Icon size={20} />
          </span>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {value !== undefined && value !== null ? value : 0}
        </h3>
        {badge && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {badge}
          </span>
        )}
      </div>

      {(trendText || effectiveSubtitle) && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {trendText && (
            <span
              className={`font-semibold ${
                isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trendText}
            </span>
          )}
          {effectiveSubtitle && <span className="text-slate-500">{effectiveSubtitle}</span>}
        </div>
      )}
    </motion.div>
  );
}
