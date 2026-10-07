import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export default function Forbidden() {
  const { role } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-soft">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
          <ShieldAlert size={30} />
        </div>
        <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-800">
          HTTP 403 Forbidden
        </span>
        <h2 className="mt-3 text-xl font-bold text-ink">Access Restricted</h2>
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          Your current security role (<strong>{role}</strong>) does not have authorization to view this administrative resource. Role boundaries are strictly enforced on both client and database boundaries.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link to="/dashboard">
            <Button size="sm" className="text-xs">
              <LayoutDashboard size={14} /> Return to My Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
