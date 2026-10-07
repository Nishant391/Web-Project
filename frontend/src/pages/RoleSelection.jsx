import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, ShieldCheck, UserCheck, User, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

const roles = [
  {
    id: 'MEMBER',
    icon: User,
    title: 'Member',
    subtitle: 'I want to train & track my fitness',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    selectedBorder: 'border-blue-500',
    selectedBg: 'bg-blue-50',
    badgeBg: 'bg-blue-100 text-blue-700',
    perks: [
      'Personal workout schedule',
      'Attendance & progress tracking',
      'AI fitness & nutrition plans',
      'View membership & payments',
    ],
  },
  {
    id: 'TRAINER',
    icon: UserCheck,
    title: 'Trainer',
    subtitle: 'I coach athletes & manage programs',
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    selectedBorder: 'border-emerald-500',
    selectedBg: 'bg-emerald-50',
    badgeBg: 'bg-emerald-100 text-emerald-700',
    perks: [
      'Manage assigned member athletes',
      'Create & assign workout programs',
      'Monitor member attendance',
      'AI-powered training assistance',
    ],
  },
];

export default function RoleSelection() {
  const navigate = useNavigate();
  const { clerkUserInfo, syncUserFromBackend } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const displayName = clerkUserInfo?.name || 'there';

  const handleConfirm = async () => {
    if (!selectedRole) return;
    setError('');
    setSubmitting(true);
    try {
      await authApi.setupRole({
        role: selectedRole,
        name: clerkUserInfo?.name || '',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-brand-600 shadow-2xl mb-4">
            <Dumbbell size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            Welcome to PulseForge{displayName !== 'there' ? `, ${displayName.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-slate-400 text-base">
            You signed in with <span className="text-slate-300 font-medium">{clerkUserInfo?.email}</span>
            <br />
            How will you be using PulseForge?
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`relative text-left rounded-2xl border-2 p-6 transition-all duration-200 focus:outline-none
                  ${isSelected
                    ? `${r.selectedBorder} bg-white/10 shadow-xl ring-2 ring-white/10 scale-[1.02]`
                    : 'border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20 hover:scale-[1.01]'
                  }`}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 size={22} className="text-white" />
                  </div>
                )}

                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${r.gradient} shadow-lg mb-4`}>
                  <Icon size={22} className="text-white" />
                </div>

                <h2 className="text-xl font-bold text-white mb-1">{r.title}</h2>
                <p className="text-slate-400 text-sm mb-4">{r.subtitle}</p>

                {/* Perks list */}
                <ul className="space-y-1.5">
                  {r.perks.map((perk, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="mt-0.5 text-slate-500">•</span>
                      {perk}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Admin note */}
        <div className="flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 mb-6">
          <ShieldCheck size={16} className="text-indigo-400 shrink-0" />
          <p className="text-xs text-indigo-300">
            <span className="font-semibold">Admin access</span> is pre-configured and not available through registration.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 mb-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={!selectedRole || submitting}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-4 px-6 text-base font-bold transition-all duration-200
            ${selectedRole && !submitting
              ? 'bg-gradient-to-r from-indigo-500 to-brand-600 text-white hover:from-indigo-400 hover:to-brand-500 shadow-xl hover:shadow-indigo-500/25 hover:scale-[1.01]'
              : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/10'
            }`}
        >
          {submitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Setting up your profile...
            </>
          ) : (
            <>
              Continue as {selectedRole ? roles.find(r => r.id === selectedRole)?.title : '...'}
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
