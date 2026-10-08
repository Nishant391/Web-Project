import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge } from '../components/common/Badge';

export default function Profile() {
  const { role, user, switchRole } = useAuth();
  const [switching, setSwitching] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleRoleChange = async (targetRole) => {
    if (targetRole === role || switching) return;
    try {
      setSwitching(true);
      setSuccessMsg('');
      await switchRole(targetRole);
      setSuccessMsg(`Role switched to ${targetRole} successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(`Error switching role: ${err.message}`);
    } finally {
      setSwitching(false);
    }
  };

  const permissions = {
    ADMIN: [
      'Full CRUD access to Member directory & enrollment',
      'Manage trainer registrations and assigned athlete rosters',
      'Configure membership subscription tiers & pricing packages',
      'Real-time attendance turnstile tracking and log audits',
      'Payment transaction recording and official tax invoices',
      'Full access to workout programming and exercise libraries',
      'Equipment fleet condition inspection & maintenance logging',
      'Executive analytics dashboards with financial charts',
      'Full Groq AI coaching & workout suite access',
    ],
    TRAINER: [
      'View dedicated assigned member athletes',
      'Create, customize, and assign progressive workout routines',
      'Log and monitor member attendance on gym floor',
      'Consult Groq AI for specialized athletic routines & meal architectures',
      'View equipment availability and report maintenance needs',
    ],
    MEMBER: [
      'View active membership plan privileges and expiration timeline',
      'Access personal assigned coach details and specialization',
      'Check personal check-in records and training frequency',
      'View personal billing receipts and invoice numbers',
      'Access assigned personalized workout schedules',
      'Generate personalized general wellness workouts via Groq AI',
    ],
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Profile & Role Control"
        subtitle="Manage authentication identity, active system privileges, and role permissions"
        icon={User}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-brand-600 text-3xl font-extrabold text-white shadow-soft">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <h3 className="mt-4 text-xl font-bold text-ink">{user?.name || 'Gym User'}</h3>
            <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
            <div className="mt-3">
              <Badge variant={role}>{role} Privilege Level</Badge>
            </div>

            <div className="mt-6 w-full border-t border-slate-100 pt-4 text-left text-xs space-y-2">
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Email:</span>
                <span className="font-semibold text-ink truncate max-w-[180px]">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Auth Engine:</span>
                <span className="font-semibold text-slate-700">Clerk Provider</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Active Role:</span>
                <span className="font-semibold text-brand-600">{role}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/setup-role"
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Open Full Role Selection Screen <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Privileges & Role Switcher */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-6">
          {/* Role Switcher Toolbar */}
          <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                  <Sparkles size={16} className="text-brand-600" />
                  Quick Role Switcher
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a role below to immediately test the platform from that perspective:
                </p>
              </div>
              {switching && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-600">
                  <Loader2 size={14} className="animate-spin" />
                  Switching...
                </div>
              )}
            </div>

            {successMsg && (
              <div className="mb-3 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                <Check size={14} /> {successMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Admin Button */}
              <button
                type="button"
                onClick={() => handleRoleChange('ADMIN')}
                disabled={switching}
                className={`flex flex-col items-start rounded-xl border-2 p-3.5 transition-all text-left ${
                  role === 'ADMIN'
                    ? 'border-indigo-500 bg-indigo-50/80 shadow-sm ring-1 ring-indigo-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-100 text-indigo-700">
                    <ShieldCheck size={18} />
                  </span>
                  {role === 'ADMIN' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-900 mt-1">Admin</p>
                <p className="text-[11px] text-slate-500">Full operations & management</p>
              </button>

              {/* Trainer Button */}
              <button
                type="button"
                onClick={() => handleRoleChange('TRAINER')}
                disabled={switching}
                className={`flex flex-col items-start rounded-xl border-2 p-3.5 transition-all text-left ${
                  role === 'TRAINER'
                    ? 'border-emerald-500 bg-emerald-50/80 shadow-sm ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                    <UserCheck size={18} />
                  </span>
                  {role === 'TRAINER' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-900 mt-1">Trainer</p>
                <p className="text-[11px] text-slate-500">Athletes & workouts coach</p>
              </button>

              {/* Member Button */}
              <button
                type="button"
                onClick={() => handleRoleChange('MEMBER')}
                disabled={switching}
                className={`flex flex-col items-start rounded-xl border-2 p-3.5 transition-all text-left ${
                  role === 'MEMBER'
                    ? 'border-blue-500 bg-blue-50/80 shadow-sm ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-blue-700">
                    <User size={18} />
                  </span>
                  {role === 'MEMBER' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-900 mt-1">Member</p>
                <p className="text-[11px] text-slate-500">Personal workouts & logs</p>
              </button>
            </div>
          </div>

          {/* System Permissions list */}
          <div>
            <h4 className="text-base font-bold text-ink">Active System Permissions ({role})</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Based on the currently selected role, the following capabilities are permitted in the application:
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(permissions[role] || []).map((perm, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs text-slate-700"
                >
                  <CheckCircle2 size={16} className="text-brand-600 shrink-0 mt-0.5" />
                  <span>{perm}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
