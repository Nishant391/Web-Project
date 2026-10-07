import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Dumbbell,
  ShieldCheck,
  UserCheck,
  User,
  Menu,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { UserButton, SignInButton, SignedIn, SignedOut } from '@clerk/clerk-react';

export function Navbar() {
  const { role, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isDashboard =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/members') ||
    location.pathname.startsWith('/trainers') ||
    location.pathname.startsWith('/salaries') ||
    location.pathname.startsWith('/memberships') ||
    location.pathname.startsWith('/attendance') ||
    location.pathname.startsWith('/payments') ||
    location.pathname.startsWith('/workouts') ||
    location.pathname.startsWith('/equipment') ||
    location.pathname.startsWith('/ai-assistant') ||
    location.pathname.startsWith('/profile');

  const getRoleConfig = (r) => {
    switch (r) {
      case 'ADMIN':
        return {
          icon: ShieldCheck,
          label: 'Admin',
          badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        };
      case 'TRAINER':
        return {
          icon: UserCheck,
          label: 'Trainer',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
      default:
        return {
          icon: User,
          label: 'Member',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        };
    }
  };

  const currentRoleConfig = getRoleConfig(role);
  const RoleIcon = currentRoleConfig.icon;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="section-shell flex h-16 items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight text-ink">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
            <Dumbbell size={20} />
          </span>
          <div className="flex flex-col">
            <span className="text-lg leading-tight font-extrabold tracking-tight">PulseForge</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-brand-600">
              Smart Gym Ops
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links (landing page only) */}
        {!isDashboard && (
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-brand-600 transition">Features</a>
            <a href="#platform" className="hover:text-brand-600 transition">RBAC Matrix</a>
            <a href="#insights" className="hover:text-brand-600 transition">Architecture</a>
          </nav>
        )}

        {/* Right-side controls */}
        <div className="flex items-center gap-3">

          {/* Read-only role badge (only shown when signed in) */}
          <SignedIn>
            <div
              className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold shadow-sm ${currentRoleConfig.badgeClass}`}
              title={`You are signed in as ${currentRoleConfig.label}`}
            >
              <RoleIcon size={14} className="shrink-0" />
              <span>{currentRoleConfig.label}</span>
            </div>
          </SignedIn>

          {!isDashboard ? (
            <Link to="/dashboard">
              <Button size="sm">
                Enter Dashboard <ArrowRight size={15} />
              </Button>
            </Link>
          ) : (
            <Link to="/ai-assistant">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex border-brand-200 text-brand-700 bg-brand-50/50"
              >
                <Sparkles size={14} className="text-brand-600" /> AI Suite
              </Button>
            </Link>
          )}

          {/* Clerk user avatar / sign-in button */}
          <SignedIn>
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="hidden sm:block text-xs font-bold text-ink hover:text-brand-600 mr-2"
              >
                {user?.name || 'My Account'}
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm" variant="outline">Sign In</Button>
            </SignInButton>
          </SignedOut>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white p-4 md:hidden">
          <div className="flex flex-col gap-2">
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Operations Dashboard <ArrowRight size={16} />
            </Link>
            <Link
              to="/ai-assistant"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-brand-700 bg-brand-50"
            >
              AI Wellness Suite <Sparkles size={16} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
