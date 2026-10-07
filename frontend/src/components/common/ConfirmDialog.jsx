import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '../ui/Button';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed with this action? This operation cannot be undone.',
  confirmText = 'Confirm Delete',
  isLoading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
          <AlertTriangle size={22} />
        </div>
        <div>
          <p className="text-sm leading-relaxed text-slate-600">{description}</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
        <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 transition"
        >
          {isLoading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
