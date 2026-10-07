import React from 'react';
import { FolderSearch } from 'lucide-react';
import { Button } from '../ui/Button';

export function EmptyState({
  icon: Icon = FolderSearch,
  title = 'No records found',
  description = 'Try adjusting your search filters or add a new entry to get started.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white/50 ${className}`}
    >
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500 mb-4">
        <Icon size={24} />
      </div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
