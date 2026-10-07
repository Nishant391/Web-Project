import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UsersRound,
  UserCheck,
  CreditCard,
  CalendarCheck2,
  Receipt,
  Activity,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Plus,
  Clock,
  CheckCircle2,
  Dumbbell,
  ShieldCheck,
  User,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dashboardApi, attendanceApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { AttendanceHeatmap } from '../components/common/AttendanceHeatmap';
import { WorkoutSplitTracker } from '../components/common/WorkoutSplitTracker';
import { AIFitnessHub } from '../components/common/AIFitnessHub';

export default function Dashboard() {
  const { role, user, isAdmin, isTrainer, isMember } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInNotice, setCheckInNotice] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, [role]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardApi.getStats();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
      setError(err.message || 'Unable to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberCheckIn = async () => {
    try {
      setCheckingIn(true);
      const res = await attendanceApi.checkIn({});
      if (res.success) {
        setCheckInNotice('Check-in confirmed for today! Session recorded.');
        fetchDashboardStats();
      }
    } catch (err) {
      setCheckInNotice(err.message);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleMemberCheckOut = async () => {
    try {
      setCheckingIn(true);
      const res = await attendanceApi.checkOut({});
      if (res.success) {
        setCheckInNotice('Check-out completed! Great workout today.');
        fetchDashboardStats();
      }
    } catch (err) {
      setCheckInNotice(err.message);
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving live gym analytics and personalized profile..." />;
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-center">
        <p className="text-sm font-semibold text-rose-700">Backend connection notice</p>
        <p className="mt-1 text-xs text-rose-600">{error || 'Could not load dashboard statistics.'}</p>
        <div className="mt-4">
          <Button size="sm" onClick={fetchDashboardStats}>
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  // ========================================================
  // 1. MEMBER PERSONALIZED DASHBOARD VIEW
  // ========================================================
  if (role === 'MEMBER') {
    const member = data.member;
    const attendanceStats = data.attendanceStats || {};
    const workouts = member?.workouts || [];
    const completions = member?.workoutCompletions || [];
    const trainer = member?.trainer;
    const membership = member?.membership;
    const activeSession = data.activeSession;

    return (
      <div className="space-y-8">
        {/* Member Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-soft sm:p-8">
          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                  Member Portal • Verified Athlete
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Welcome back, {member?.name || user?.name}
              </h1>
              <p className="mt-1 text-xs text-slate-300">
                Active Tier: <strong className="text-white">{membership?.name || 'Standard Pass'}</strong> • Assigned Coach: <strong className="text-white">{trainer?.name || 'Gym Floor Staff'}</strong>
              </p>
            </div>

            {/* Attendance Check-in action button */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {activeSession ? (
                <Button
                  size="sm"
                  onClick={handleMemberCheckOut}
                  disabled={checkingIn}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs w-full sm:w-auto"
                >
                  <Clock size={14} /> End Workout Session (Check Out)
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleMemberCheckIn}
                  disabled={checkingIn}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs w-full sm:w-auto"
                >
                  <CalendarCheck2 size={14} /> Check In Today
                </Button>
              )}
            </div>
          </div>

          {checkInNotice && (
            <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-950/50 p-2.5 text-xs text-emerald-200">
              {checkInNotice}
            </div>
          )}
        </div>

        {/* Member Profile Cards: Assigned Coach & Membership Tier */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Assigned Coach Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Personal Training Guidance
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Dedicated Coach
              </span>
            </div>

            {trainer ? (
              <div>
                <h3 className="text-lg font-bold text-ink">{trainer.name}</h3>
                <p className="text-xs font-semibold text-brand-600">{trainer.specialization}</p>
                {trainer.bio && (
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">{trainer.bio}</p>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
                  <span>Email: {trainer.email}</span>
                  {trainer.phone && <span>• Phone: {trainer.phone}</span>}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No trainer currently assigned.</p>
            )}
          </div>

          {/* Active Membership Details Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Membership Subscription
              </span>
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                {member?.status}
              </span>
            </div>

            {membership ? (
              <div>
                <h3 className="text-lg font-bold text-ink">{membership.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{membership.description}</p>
                <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-ink">
                  <span>Price: ₹{membership.price.toLocaleString()}</span>
                  <span>•</span>
                  <span>Duration: {membership.durationInDays} Days</span>
                </div>
                {membership.features && (
                  <p className="mt-2 text-[11px] text-slate-500">
                    <strong>Included:</strong> {membership.features}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No active membership plan recorded.</p>
            )}
          </div>
        </div>

        {/* 1. GitHub-style Attendance Heatmap & Streak Tracker */}
        <AttendanceHeatmap
          heatmapData={attendanceStats.heatmap || {}}
          stats={attendanceStats}
          title="Personal Attendance & Workout Activity"
          subtitle="Real-time check-in intensity and streaks from PostgreSQL"
        />

        {/* 2. Workout Split Feature with Interactive Completion Tracker */}
        <WorkoutSplitTracker
          workouts={workouts}
          completions={completions}
          onCompletionLogged={fetchDashboardStats}
          memberView={true}
        />

        {/* 3. AI Fitness & Wellness Suite */}
        <AIFitnessHub
          memberGoal={workouts[0]?.targetGoal || 'Strength & Hypertrophy'}
          initialFitnessLevel={workouts[0]?.difficultyLevel || 'Intermediate'}
        />

        {/* Recent Payment Invoices */}
        {member?.payments && member.payments.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
            <h3 className="text-base font-bold text-ink">Recent Payment Receipts</h3>
            <div className="divide-y divide-slate-100">
              {member.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 text-xs">
                  <div>
                    <span className="font-bold text-ink">{p.invoiceNumber}</span>
                    <span className="text-slate-400 ml-2">
                      ({new Date(p.paymentDate).toLocaleDateString()})
                    </span>
                    <p className="text-[11px] text-slate-500">{p.notes || p.paymentMethod}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-ink">₹{p.amount.toLocaleString()}</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========================================================
  // 2. TRAINER DASHBOARD VIEW
  // ========================================================
  if (role === 'TRAINER') {
    const trainer = data.trainer;
    const summary = data.summary || {};
    const assignedMembers = data.assignedMembers || [];
    const workouts = data.workouts || [];

    return (
      <div className="space-y-8">
        {/* Trainer Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 text-white shadow-soft sm:p-8">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              Coach Operations Hub
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Coach {trainer?.name || user?.name}
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            Specialization: <strong className="text-white">{trainer?.specialization}</strong> • Experience: <strong className="text-white">{trainer?.experienceYears} Years</strong>
          </p>
        </div>

        {/* Trainer Metrics Ribbon */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard
            title="Assigned Roster"
            value={summary.totalAssigned || 0}
            icon={UsersRound}
            description="Active coaching athletes"
          />
          <StatCard
            title="Active Members"
            value={summary.activeAssigned || 0}
            icon={CheckCircle2}
            description="Up-to-date memberships"
          />
          <StatCard
            title="Today's Check-Ins"
            value={summary.todayCheckIns || 0}
            icon={CalendarCheck2}
            description="Athletes in gym today"
          />
          <StatCard
            title="Authored Routines"
            value={summary.totalRoutinesAuthored || 0}
            icon={Dumbbell}
            description="Custom split programs"
          />
        </div>

        {/* My Members Roster Section */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-ink">My Members Roster</h3>
              <p className="text-xs text-slate-500">
                Athletes assigned exclusively to your coaching roster.
              </p>
            </div>
            <Link to="/members">
              <Button size="sm" variant="outline" className="text-xs">
                View Full Roster <ArrowRight size={13} />
              </Button>
            </Link>
          </div>

          {assignedMembers.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No members currently assigned.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                    <th className="py-2.5 px-3">Athlete</th>
                    <th className="py-2.5 px-3">Membership Tier</th>
                    <th className="py-2.5 px-3">Total Check-Ins</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignedMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-2.5 px-3 font-bold text-ink">
                        <div>
                          <p>{m.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">{m.email}</p>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {m.membership?.name || 'Standard Pass'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-ink">
                        {m._count?.attendances || 0} Sessions
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Workout Splits Creator & Manager */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-ink">Assigned Workout Routines</h3>
              <p className="text-xs text-slate-500">
                Training splits created for your assigned athletes.
              </p>
            </div>
            <Link to="/workouts">
              <Button size="sm" className="text-xs">
                <Plus size={14} /> Create Workout Split
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {workouts.map((w) => (
              <div key={w.id} className="rounded-2xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                    {w.splitType || 'CUSTOM'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {w.exercises?.length || 0} Exercises
                  </span>
                </div>
                <h4 className="text-sm font-bold text-ink">{w.title}</h4>
                <p className="text-xs text-slate-500">
                  Target Member: <strong>{w.member?.name || 'Unassigned Template'}</strong>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // 3. ADMIN GYM-WIDE DASHBOARD VIEW
  // ========================================================
  const {
    summary,
    monthlyRevenueData,
    attendanceTrendData,
    recentAttendance,
    recentPayments,
    recentTrainerSalaries,
  } = data;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-6 text-white shadow-soft sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-300">
                Head Administration Console
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back, {user?.name || 'Admin'}
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Full system authority over members, coaches, subscriptions, and AI routines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/members">
              <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white text-xs">
                <Plus size={14} /> Register Member
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Gym Members"
          value={summary.totalMembers}
          icon={UsersRound}
          trend={{ value: 12, isPositive: true }}
          description={`${summary.activeMembers} active subscriptions`}
        />
        <StatCard
          title="Verified Coaches"
          value={summary.totalTrainers}
          icon={UserCheck}
          trend={{ value: 5, isPositive: true }}
          description="Certified strength staff"
        />
        <StatCard
          title="Today's Attendance"
          value={summary.todayAttendance}
          icon={CalendarCheck2}
          trend={{ value: 8, isPositive: true }}
          description={`${summary.currentlyInGym} athletes currently active`}
        />
        <StatCard
          title="Collected Revenue"
          value={`₹${(summary.totalRevenue || 0).toLocaleString()}`}
          icon={Receipt}
          trend={{ value: 18, isPositive: true }}
          description={`₹${(summary.pendingRevenue || 0).toLocaleString()} pending`}
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Revenue Chart */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-ink">Revenue Trajectory</h3>
              <p className="text-xs text-slate-500">Gross membership fee collections</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              FY 2026
            </span>
          </div>

          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Attendance Heat Curve */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-ink">Weekly Footfall Heat</h3>
              <p className="text-xs text-slate-500">Check-in frequency by day</p>
            </div>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
              Peak Hours
            </span>
          </div>

          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(value) => [`${value} Check-ins`, 'Attendance']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="checkIns" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Payments & Attendance Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Member Payments */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-ink">Recent Fee Receipts</h3>
            <Link to="/payments" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5 text-xs">
                <div>
                  <p className="font-bold text-ink">{p.member?.name}</p>
                  <p className="text-[10px] text-slate-400">{p.membership?.name} • {p.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-ink">₹{p.amount.toLocaleString()}</p>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      p.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Gym Attendance Log */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-ink">Live Check-In Activity</h3>
            <Link to="/attendance" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View Attendance
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {(recentAttendance || []).map((att) => (
              <div key={att.id} className="flex items-center justify-between py-2.5 text-xs">
                <div>
                  <p className="font-bold text-ink">{att.member?.name || 'Gym Member'}</p>
                  <p className="text-[10px] text-slate-400">
                    Checked in: {new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      att.checkOutTime ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {att.checkOutTime ? 'Checked Out' : 'Active Inside'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
