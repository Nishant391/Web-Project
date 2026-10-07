import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ text = 'Loading data...', size = 24, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-slate-500 ${className}`}>
      <Loader2 size={size} className="animate-spin text-brand-600 mb-2" />
      {text && <p className="text-xs font-medium tracking-wide uppercase">{text}</p>}
    </div>
  );
}
