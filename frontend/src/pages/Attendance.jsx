import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Clock,
  UserCheck,
  Search,
  CheckCircle2,
  LogOut,
  Calendar,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { attendanceApi, memberApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/ui/Button';
import { LiveClock } from '../components/common/LiveClock';

export default function Attendance() {
  const { isMember } = useAuth();
  const [logs, setLogs] = useState([]);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({ todayCheckIns: 0, currentlyInGym: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [checkInSubmitting, setCheckInSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const [logsRes, statsRes, membersRes] = await Promise.all([
        attendanceApi.getAll(),
        attendanceApi.getStats(),
        memberApi.getAll({ status: 'ACTIVE' }),
      ]);

      if (logsRes.success) setLogs(logsRes.data);
      if (statsRes.success) setStats(statsRes.data);
      if (membersRes.success) {
        setMembers(membersRes.data);
        if (membersRes.data.length > 0 && !selectedMemberId) {
          setSelectedMemberId(membersRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    try {
      setCheckInSubmitting(true);
      setFeedbackMsg({ type: '', text: '' });
      const res = await attendanceApi.checkIn({ memberId: selectedMemberId });
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: res.message || 'Check-in recorded successfully' });
        fetchAttendanceData();
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Check-in failed' });
    } finally {
      setCheckInSubmitting(false);
    }
  };

  const handleCheckOut = async (attendanceId) => {
    try {
      const res = await attendanceApi.checkOut({ attendanceId });
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: 'Member checked out successfully' });
        fetchAttendanceData();
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Checkout failed' });
    }
  };

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    return (
      log.member?.name?.toLowerCase().includes(q) ||
      log.member?.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Tracking & Turnstile"
        subtitle="Record daily check-ins, monitor active gym floor occupancy, and log checkout timestamps"
        icon={CalendarCheck2}
      >
        <LiveClock />
      </PageHeader>

      {/* Floor Occupancy KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Floor Occupancy"
          value={stats.currentlyInGym}
          subtitle="Athletes currently training"
          icon={Activity}
          trend="Live Floor Count"
          trendType="positive"
        />

        <StatCard
          title="Today's Total Check-Ins"
          value={stats.todayCheckIns}
          subtitle="Total turnstile validations today"
          icon={CalendarCheck2}
          trend="+12% vs yesterday"
          trendType="positive"
        />

        <StatCard
          title="Active Member Base"
          value={members.length}
          subtitle="Eligible for badge check-in"
          icon={UserCheck}
        />
      </div>

      {/* Fast Check-In Terminal Card */}
      {!isMember && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
                <CheckCircle2 size={18} />
              </span>
              <div>
                <h3 className="text-base font-bold text-ink">Turnstile Check-In Terminal</h3>
                <p className="text-xs text-slate-500">Fast check-in for enrolled members</p>
              </div>
            </div>
            <LiveClock variant="terminal" className="w-full sm:w-auto" />
          </div>

          {feedbackMsg.text && (
            <div
              className={`mb-4 rounded-xl p-3 text-xs font-semibold ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {feedbackMsg.text}
            </div>
          )}

          <form onSubmit={handleCheckIn} className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email}) - {m.membership?.name || 'Standard'}
                </option>
              ))}
            </select>

            <Button type="submit" disabled={checkInSubmitting}>
              {checkInSubmitting ? 'Verifying...' : 'Validate & Check-In'}
            </Button>
          </form>
        </div>
      )}

      {/* Attendance Logs Table */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search attendance by member name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading attendance history..." />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            title="No attendance entries found"
            description="Use the check-in terminal above to record member arrivals."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Member</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Check-In Time</th>
                    <th className="px-5 py-4">Check-Out Time</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => {
                    const checkInDate = new Date(log.checkInTime);
                    const checkOutDate = log.checkOutTime ? new Date(log.checkOutTime) : null;

                    return (
                      <tr key={log.id} className="transition hover:bg-slate-50/60">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700">
                              {log.member?.name?.charAt(0) || 'M'}
                            </div>
                            <div>
                              <p className="font-bold text-ink">{log.member?.name}</p>
                              <p className="text-xs text-slate-400">{log.member?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {checkInDate.toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-4 text-slate-700 font-medium">
                          {checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {checkOutDate ? (
                            checkOutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          ) : (
                            <span className="text-xs font-semibold text-emerald-600">Active on floor</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={log.status}>{log.status}</Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {!checkOutDate && (
                            <button
                              onClick={() => handleCheckOut(log.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-rose-600 transition"
                            >
                              <LogOut size={13} /> Check Out
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
