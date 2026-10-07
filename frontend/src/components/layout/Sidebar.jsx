import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UsersRound,
  UserCheck,
  CreditCard,
  CalendarCheck2,
  Receipt,
  Dumbbell,
  Activity,
  BrainCircuit,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Sidebar() {
  const { role, user } = useAuth();

  // Role-Aware Navigation Arrays
  const adminNav = [
    { to: '/dashboard', label: 'Overview & Analytics', icon: LayoutDashboard },
    { to: '/members', label: 'Members Directory', icon: UsersRound },
    { to: '/trainers', label: 'Coaches & Staff', icon: UserCheck },
    { to: '/memberships', label: 'Membership Plans', icon: CreditCard },
    { to: '/attendance', label: 'Gym Attendance Log', icon: CalendarCheck2 },
    { to: '/payments', label: 'Payments & Revenue', icon: Receipt },
    { to: '/workouts', label: 'Workout Library', icon: Dumbbell },
    { to: '/equipment', label: 'Equipment Fleet', icon: Activity },
    { to: '/ai-assistant', label: 'AI Wellness Engine', icon: BrainCircuit, badge: 'Groq' },
    { to: '/profile', label: 'Admin Account', icon: User },
  ];

  const trainerNav = [
    { to: '/dashboard', label: 'Trainer Dashboard', icon: LayoutDashboard },
    { to: '/members', label: 'My Members Roster', icon: UsersRound },
    { to: '/attendance', label: 'Roster Attendance', icon: CalendarCheck2 },
    { to: '/workouts', label: 'Workout Splits & Plans', icon: Dumbbell },
    { to: '/ai-assistant', label: 'AI Workout Planner', icon: BrainCircuit, badge: 'Groq' },
    { to: '/profile', label: 'Coach Profile', icon: User },
  ];

  const memberNav = [
    { to: '/dashboard', label: 'My Fitness Hub', icon: LayoutDashboard },
    { to: '/workouts', label: 'My Workout Split', icon: Dumbbell },
    { to: '/attendance', label: 'Attendance Heatmap', icon: CalendarCheck2 },
    { to: '/ai-assistant', label: 'AI Fitness & Meals', icon: BrainCircuit, badge: 'Groq' },
    { to: '/memberships', label: 'My Membership Plan', icon: CreditCard },
    { to: '/payments', label: 'My Receipts & Invoices', icon: Receipt },
    { to: '/profile', label: 'My Profile', icon: User },
  ];

  let currentNav = memberNav;
  if (role === 'ADMIN') currentNav = adminNav;
  else if (role === 'TRAINER') currentNav = trainerNav;

  const roleLabel = role === 'ADMIN' ? 'Head Administrator' : role === 'TRAINER' ? 'Certified Coach' : 'Gym Member';
  const roleBadgeColor =
    role === 'ADMIN'
      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
      : role === 'TRAINER'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
      : 'bg-blue-50 border-blue-200 text-blue-700';

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div>
        {/* Role identification card */}
        <div className={`mb-4 rounded-2xl border p-3.5 ${roleBadgeColor}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Access Scope</span>
            <span className="flex h-2 w-2 rounded-full bg-current animate-pulse" />
          </div>
          <p className="mt-1 text-sm font-bold text-ink">{role} Portal</p>
          <p className="text-xs text-slate-500 font-medium">{roleLabel}</p>
        </div>

        {/* Navigation items list */}
        <nav className="space-y-1">
          {currentNav.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 border border-brand-200/80 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon size={17} className="shrink-0" />
                <span>{label}</span>
              </div>
              {badge && (
                <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer system info */}
      <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-600">PulseForge Gym Ops</p>
        <p>PostgreSQL • Neon • Groq AI</p>
      </div>
    </aside>
  );
}
