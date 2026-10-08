import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

export function LiveClock({ variant = 'compact', className = '' }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Update every second for real ongoing time
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = now.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (variant === 'banner') {
    return (
      <div
        className={`inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-md text-white shadow-inner ${className}`}
      >
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300">
            Live Ops
          </span>
        </div>
        <div className="h-4 w-px bg-white/20" />
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Calendar size={13} className="text-slate-300" />
          <span>{formattedDate}</span>
        </div>
        <div className="h-4 w-px bg-white/20" />
        <div className="flex items-center gap-1.5 font-mono text-sm font-bold tracking-tight text-white">
          <Clock size={14} className="text-emerald-400" />
          <span>{formattedTime}</span>
        </div>
      </div>
    );
  }

  if (variant === 'terminal') {
    return (
      <div
        className={`flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2 text-emerald-900 ${className}`}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Ongoing Turnstile Clock
          </span>
        </div>
        <div className="flex items-center gap-2.5 font-mono text-xs font-bold text-emerald-950">
          <span>{formattedDate}</span>
          <span className="text-emerald-400">•</span>
          <span className="text-emerald-700 font-extrabold">{formattedTime}</span>
        </div>
      </div>
    );
  }

  // Default compact navbar view
  return (
    <div
      className={`hidden md:flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-700 shadow-2xs backdrop-blur-xs ${className}`}
      title="Current live ongoing gym system time"
    >
      <div className="flex items-center gap-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live</span>
      </div>
      <span className="text-slate-300">|</span>
      <span className="font-medium text-slate-600">{formattedDate}</span>
      <span className="text-slate-300">•</span>
      <span className="font-mono font-bold text-ink">{formattedTime}</span>
    </div>
  );
}
export default LiveClock;
