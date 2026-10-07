import React, { useState, useMemo } from 'react';
import {
  CalendarCheck2,
  TrendingUp,
  Award,
  Clock,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export function AttendanceHeatmap({
  heatmapData = {},
  stats = {},
  title = 'Gym Attendance & Activity Heatmap',
  subtitle = 'Continuous check-in record verified via PostgreSQL database',
}) {
  const [hoveredDay, setHoveredDay] = useState(null);

  const {
    totalVisits = 0,
    currentStreak = 0,
    longestStreak = 0,
    visitsThisWeek = 0,
    visitsThisMonth = 0,
    attendancePercentage = 0,
  } = stats;

  // Build 26 weeks (6 months) of calendar cells
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const resultWeeks = [];
    const months = [];
    let lastMonth = -1;

    // 26 weeks back = 182 days
    const totalDays = 26 * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + 1);

    // Align start date to Sunday or Monday
    const startDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    let currentWeek = [];
    const tempDate = new Date(startDate);

    while (tempDate <= today || currentWeek.length > 0) {
      const dateStr = tempDate.toISOString().split('T')[0];
      const count = heatmapData[dateStr] || 0;
      const dayOfWeek = tempDate.getDay();
      const currentMonth = tempDate.getMonth();

      if (currentWeek.length === 0 && currentMonth !== lastMonth) {
        months.push({
          index: resultWeeks.length,
          name: tempDate.toLocaleString('default', { month: 'short' }),
        });
        lastMonth = currentMonth;
      }

      currentWeek.push({
        date: new Date(tempDate),
        dateStr,
        count,
        dayOfWeek,
        isFuture: tempDate > today,
      });

      if (currentWeek.length === 7) {
        resultWeeks.push(currentWeek);
        currentWeek = [];
      }

      tempDate.setDate(tempDate.getDate() + 1);
      if (resultWeeks.length >= 28 && currentWeek.length === 0) break;
    }

    return { weeks: resultWeeks, monthLabels: months };
  }, [heatmapData]);

  // Color intensity calculator
  const getCellColor = (day) => {
    if (day.isFuture) return 'bg-slate-50 border-slate-100 opacity-40';
    if (!day.count) return 'bg-slate-100 border-slate-200/60 hover:border-slate-400';
    if (day.count === 1) return 'bg-emerald-400 border-emerald-500 hover:brightness-110';
    return 'bg-emerald-600 border-emerald-700 hover:brightness-110';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck2 size={20} className="text-emerald-600" />
            <h3 className="text-lg font-bold text-ink">{title}</h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Less active</span>
          <span className="h-3 w-3 rounded-xs border border-slate-200 bg-slate-100" />
          <span className="h-3 w-3 rounded-xs border border-emerald-500 bg-emerald-400" />
          <span className="h-3 w-3 rounded-xs border border-emerald-700 bg-emerald-600" />
          <span>More active</span>
        </div>
      </div>

      {/* Metric Cards Ribbon */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
            <CalendarCheck2 size={14} className="text-emerald-600" /> Total Visits
          </div>
          <p className="mt-1 text-xl font-extrabold text-ink">{totalVisits}</p>
          <p className="text-[10px] text-slate-400">All-time check-ins</p>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-3">
          <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-bold">
            <TrendingUp size={14} className="text-emerald-600" /> Current Streak
          </div>
          <p className="mt-1 text-xl font-extrabold text-emerald-700">{currentStreak} Days</p>
          <p className="text-[10px] text-emerald-600/80">Active sequence</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
            <Award size={14} className="text-amber-500" /> Longest Streak
          </div>
          <p className="mt-1 text-xl font-extrabold text-ink">{longestStreak} Days</p>
          <p className="text-[10px] text-slate-400">Personal record</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
            <Clock size={14} className="text-blue-500" /> This Week
          </div>
          <p className="mt-1 text-xl font-extrabold text-ink">{visitsThisWeek} Visits</p>
          <p className="text-[10px] text-slate-400">Mon - Sun count</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
            <Calendar size={14} className="text-indigo-500" /> This Month
          </div>
          <p className="mt-1 text-xl font-extrabold text-ink">{visitsThisMonth} Visits</p>
          <p className="text-[10px] text-slate-400">Current calendar</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
            <CheckCircle2 size={14} className="text-teal-600" /> Consistency
          </div>
          <p className="mt-1 text-xl font-extrabold text-teal-700">{attendancePercentage}%</p>
          <p className="text-[10px] text-slate-400">90-day target rate</p>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="relative overflow-x-auto pb-2">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex pl-8 text-[11px] font-semibold text-slate-400 mb-1.5">
            {weeks.map((_, wIdx) => {
              const matchedMonth = monthLabels.find((m) => m.index === wIdx);
              return (
                <div key={wIdx} className="w-3.5 mr-1 text-left">
                  {matchedMonth ? matchedMonth.name : ''}
                </div>
              );
            })}
          </div>

          <div className="flex gap-1.5">
            {/* Day labels (Mon, Wed, Fri) */}
            <div className="flex flex-col justify-between text-[9px] font-bold text-slate-400 pr-1 select-none">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Matrix of Columns (Weeks) */}
            <div className="flex gap-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((day) => (
                    <div
                      key={day.dateStr}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`h-3 w-3 rounded-xs border transition cursor-pointer ${getCellColor(day)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hover Tooltip Box */}
        <div className="mt-3 min-h-[24px] text-xs">
          {hoveredDay ? (
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-900 px-3 py-1 text-white shadow-md">
              <span className="font-semibold text-emerald-400">
                {hoveredDay.count > 0
                  ? `${hoveredDay.count} Workout Session${hoveredDay.count > 1 ? 's' : ''}`
                  : 'No attendance recorded'}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-200">
                {hoveredDay.date.toLocaleDateString(undefined, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Hover over any square to view date and session information.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
