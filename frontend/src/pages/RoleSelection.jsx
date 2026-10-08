import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Dumbbell,
  ShieldCheck,
  UserCheck,
  User,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

const roles = [
  {
    id: 'ADMIN',
    icon: ShieldCheck,
    title: 'Admin',
    tagline: 'Owner / Manager',
    subtitle: 'Manage entire gym operations, staff & finances',
    color: 'indigo',
    gradient: 'from-indigo-600 to-purple-600',
    selectedBorder: 'border-indigo-400',
    selectedBg: 'bg-indigo-950/60',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
    perks: [
      'Full members & trainers roster',
      'Revenue, invoices & salaries',
      'Equipment & maintenance logs',
      'System-wide analytics & audit',
    ],
  },
  {
    id: 'TRAINER',
    icon: UserCheck,
    title: 'Trainer',
    tagline: 'Fitness Coach',
    subtitle: 'Train athletes, assign workouts & log progress',
    color: 'emerald',
    gradient: 'from-emerald-600 to-teal-600',
    selectedBorder: 'border-emerald-400',
    selectedBg: 'bg-emerald-950/60',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    perks: [
      'Dedicated assigned athletes',
      'Create & schedule workout splits',
      'Floor attendance tracking',
      'AI athletic & meal planner',
    ],
  },
  {
    id: 'MEMBER',
    icon: User,
    title: 'Member',
    tagline: 'Gym Athlete',
    subtitle: 'Train, track personal routines & use AI tools',
    color: 'blue',
    gradient: 'from-blue-600 to-cyan-600',
    selectedBorder: 'border-blue-400',
    selectedBg: 'bg-blue-950/60',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    perks: [
      'Personal workout programs',
      'Attendance & streak heatmap',
      'Membership status & receipts',
      'AI fitness coaching studio',
    ],
  },
];

export default function RoleSelection() {
  const navigate = useNavigate();
  const { role: currentRole, clerkUserInfo, syncUserFromBackend, user } = useAuth();
  const [selectedRole, setSelectedRole] = useState(currentRole || 'ADMIN');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const displayName = clerkUserInfo?.name || user?.name || 'Athlete';
  const displayEmail = clerkUserInfo?.email || user?.email || '';

  const handleConfirm = async () => {
    if (!selectedRole) return;
    setError('');
    setSubmitting(true);
    try {
      await authApi.setupRole({
        role: selectedRole,
        name: displayName,
      });
      // Re-sync auth context to get new role and DB profile
      await syncUserFromBackend();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4 py-12">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-brand-600 shadow-2xl mb-4 border border-white/20">
            <Dumbbell size={32} className="text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
            Select Your Workspace Role
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Signed in as <span className="text-brand-300 font-semibold">{displayName}</span>
            {displayEmail && <> (<span className="text-slate-300">{displayEmail}</span>)</>}.
            <br />
            Choose how you want to access the platform. You can change this anytime.
          </p>
        </div>

        {/* 3 Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r.id)}
                className={`relative text-left rounded-2xl border-2 p-6 transition-all duration-200 focus:outline-none flex flex-col justify-between
                  ${
                    isSelected
                      ? `${r.selectedBorder} ${r.selectedBg} shadow-2xl ring-2 ring-white/10 scale-[1.02]`
                      : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                  }`}
              >
                <div>
                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute top-4 right-4">
                      <div className="grid h-6 w-6 place-items-center rounded-full bg-brand-500 text-white shadow-md">
                        <CheckCircle2 size={16} />
                      </div>
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${r.gradient} shadow-lg mb-4 text-white`}
                  >
                    <Icon size={24} />
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-white">{r.title}</h2>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${r.badgeBg}`}>
                      {r.tagline}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs sm:text-sm mb-4 leading-relaxed">
                    {r.subtitle}
                  </p>

                  {/* Perks list */}
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Permissions & Access
                    </p>
                    <ul className="space-y-1.5">
                      {r.perks.map((perk, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="mt-0.5 text-brand-400 font-bold">•</span>
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 text-center">
                  <span
                    className={`text-xs font-semibold ${
                      isSelected ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {isSelected ? '✓ Selected' : 'Click to select'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Helpful Tip */}
        <div className="flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400 shrink-0" />
            <p className="text-xs text-indigo-200">
              <span className="font-semibold">Quick Switching:</span> You can switch between Admin, Trainer, and Member at any time from the top navigation bar.
            </p>
          </div>
          {currentRole && (
            <Link
              to="/dashboard"
              className="text-xs font-bold text-indigo-300 hover:text-white underline underline-offset-2 shrink-0 ml-3"
            >
              Skip to Dashboard →
            </Link>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 mb-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleConfirm}
          disabled={!selectedRole || submitting}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-4 px-6 text-base font-bold transition-all duration-200 shadow-xl
            ${
              selectedRole && !submitting
                ? 'bg-gradient-to-r from-indigo-500 via-brand-600 to-indigo-700 text-white hover:opacity-95 hover:scale-[1.01]'
                : 'bg-white/10 text-slate-500 cursor-not-allowed border border-white/10'
            }`}
        >
          {submitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Activating {selectedRole}...
            </>
          ) : (
            <>
              Enter Dashboard as {roles.find((r) => r.id === selectedRole)?.title || 'Selected Role'}
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
