import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  ShieldCheck,
  UserCheck,
  User,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Check,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { UserButton, SignInButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { LiveClock } from '../common/LiveClock';

export function Navbar() {
  const { role, user, switchRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const roleMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target)) {
        setRoleMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200',
        };
      case 'TRAINER':
        return {
          icon: UserCheck,
          label: 'Trainer',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200',
        };
      default:
        return {
          icon: User,
          label: 'Member',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
        };
    }
  };

  const currentRoleConfig = getRoleConfig(role);
  const RoleIcon = currentRoleConfig.icon;

  const handleRoleSelect = async (targetRole) => {
    if (targetRole === role || switching) {
      setRoleMenuOpen(false);
      return;
    }
    try {
      setSwitching(true);
      await switchRole(targetRole);
      setRoleMenuOpen(false);
    } catch (err) {
      alert(`Could not switch role: ${err.message}`);
    } finally {
      setSwitching(false);
    }
  };

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
          {/* Live Ongoing Real-Time Clock */}
          <LiveClock />

          {/* Interactive Role Switcher Dropdown (when signed in) */}
          <SignedIn>
            <div className="relative" ref={roleMenuRef}>
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                disabled={switching}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all cursor-pointer ${currentRoleConfig.badgeClass}`}
                title="Click to switch your active role (Admin / Trainer / Member)"
              >
                {switching ? (
                  <Loader2 size={14} className="animate-spin text-slate-600" />
                ) : (
                  <RoleIcon size={14} className="shrink-0" />
                )}
                <span>Role: {currentRoleConfig.label}</span>
                <ChevronDown size={12} className={`transition-transform ${roleMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Switch Active Role
                    </p>
                    <p className="text-xs text-slate-600 font-medium truncate">
                      {user?.email || 'Logged in user'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    {/* Admin */}
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('ADMIN')}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                        role === 'ADMIN'
                          ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-indigo-600" />
                        Admin (Full Control)
                      </span>
                      {role === 'ADMIN' && <Check size={14} className="text-indigo-600" />}
                    </button>

                    {/* Trainer */}
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('TRAINER')}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                        role === 'TRAINER'
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <UserCheck size={16} className="text-emerald-600" />
                        Trainer (Coach)
                      </span>
                      {role === 'TRAINER' && <Check size={14} className="text-emerald-600" />}
                    </button>

                    {/* Member */}
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('MEMBER')}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                        role === 'MEMBER'
                          ? 'bg-blue-50 text-blue-900 border border-blue-200'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <User size={16} className="text-blue-600" />
                        Member (Athlete)
                      </span>
                      {role === 'MEMBER' && <Check size={14} className="text-blue-600" />}
                    </button>
                  </div>

                  <div className="border-t border-slate-100 mt-1.5 pt-1.5">
                    <Link
                      to="/setup-role"
                      onClick={() => setRoleMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-brand-700 hover:bg-brand-50 transition w-full"
                    >
                      Full Role Selection Screen →
                    </Link>
                  </div>
                </div>
              )}
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
              to="/setup-role"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50"
            >
              Change Role (Admin / Trainer / Member) <ShieldCheck size={16} />
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
