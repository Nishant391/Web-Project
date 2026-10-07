import React from 'react';
import {
  User,
  ShieldCheck,
  Mail,
  Award,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/ui/Button';

export default function Profile() {
  const { role, user, isAdmin, isTrainer, isMember } = useAuth();

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
        subtitle="Manage authentication identity, active system privileges, and viva demonstration settings"
        icon={User}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-brand-600 text-3xl font-extrabold text-white shadow-soft">
              {user.name.charAt(0)}
            </div>
            <h3 className="mt-4 text-xl font-bold text-ink">{user.name}</h3>
            <p className="text-xs text-slate-500 font-medium">{user.title}</p>
            <div className="mt-3">
              <Badge variant={role}>{role} Privilege Level</Badge>
            </div>

            <div className="mt-6 w-full border-t border-slate-100 pt-4 text-left text-xs space-y-2">
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Email:</span>
                <span className="font-semibold text-ink">{user.email}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Auth Engine:</span>
                <span className="font-semibold text-slate-700">Clerk Auth Provider</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Database Role:</span>
                <span className="font-semibold text-slate-700">{role}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Privileges & System Specs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-6">
          <div>
            <h4 className="text-base font-bold text-ink">Active System Permissions ({role})</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Based on the current role, the following capabilities are permitted in the application:
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
