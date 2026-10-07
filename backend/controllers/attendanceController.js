const prisma = require('../config/prisma');

// GET /api/attendance - List attendance records with role authorization
async function getAllAttendance(req, res, next) {
  try {
    const userRole = req.user.role;
    const { memberId, date, status } = req.query;

    const where = {};

    if (userRole === 'MEMBER') {
      // Members are strictly restricted to their own attendance
      where.memberId = req.user.memberId;
    } else if (userRole === 'TRAINER') {
      // Trainers can only view attendance of their assigned roster
      where.member = { trainerId: req.user.trainerId };
      if (memberId) {
        where.memberId = parseInt(memberId, 10);
      }
    } else {
      // Admin can filter by any memberId
      if (memberId) {
        where.memberId = parseInt(memberId, 10);
      }
    }

    if (status) {
      where.status = status;
    }

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      where.checkInTime = { gte: startOfDay, lte: endOfDay };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            membership: { select: { name: true } },
          },
        },
      },
      orderBy: { checkInTime: 'desc' },
      take: 100,
    });

    res.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/attendance/stats - Analytics endpoint tailored to Member, Trainer, or Admin
async function getAttendanceStats(req, res, next) {
  try {
    const userRole = req.user.role;
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfToday = new Date(new Date().setHours(23, 59, 59, 999));

    // A. Member-specific Heatmap & Streak Stats
    if (userRole === 'MEMBER') {
      if (!req.user.memberId) {
        return res.status(404).json({ success: false, message: 'Member account not initialized' });
      }

      // Fetch all attendance for this member for the past 365 days
      const oneYearAgo = new Date();
      oneYearAgo.setDate(oneYearAgo.getDate() - 365);

      const records = await prisma.attendance.findMany({
        where: {
          memberId: req.user.memberId,
          checkInTime: { gte: oneYearAgo },
        },
        orderBy: { checkInTime: 'asc' },
      });

      // Aggregate into calendar days map: { "YYYY-MM-DD": count }
      const heatmapMap = {};
      const uniqueDaysSet = new Set();

      records.forEach((r) => {
        const dateKey = r.checkInTime.toISOString().split('T')[0];
        heatmapMap[dateKey] = (heatmapMap[dateKey] || 0) + 1;
        uniqueDaysSet.add(dateKey);
      });

      const totalVisits = records.length;

      // Calculate Visits this week
      const now = new Date();
      const currentDay = now.getDay(); // 0 is Sun
      const distanceToMonday = (currentDay + 6) % 7;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - distanceToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      const visitsThisWeek = records.filter((r) => new Date(r.checkInTime) >= startOfWeek).length;

      // Calculate Visits this month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const visitsThisMonth = records.filter((r) => new Date(r.checkInTime) >= startOfMonth).length;

      // Calculate Current Streak and Longest Streak
      const sortedDays = Array.from(uniqueDaysSet).sort();
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      // Check current streak backwards from today or yesterday
      const todayStr = now.toISOString().split('T')[0];
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let streakCursor = uniqueDaysSet.has(todayStr) ? new Date(now) : (uniqueDaysSet.has(yesterdayStr) ? new Date(yesterday) : null);
      if (streakCursor) {
        while (true) {
          const key = streakCursor.toISOString().split('T')[0];
          if (uniqueDaysSet.has(key)) {
            currentStreak++;
            streakCursor.setDate(streakCursor.getDate() - 1);
          } else {
            break;
          }
        }
      }

      // Calculate longest streak across sortedDays
      for (let i = 0; i < sortedDays.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prev = new Date(sortedDays[i - 1]);
          const curr = new Date(sortedDays[i]);
          const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      }

      // Attendance percentage over past 90 days (expected goal: ~4 sessions/wk = 50-60%)
      const percentage = Math.min(100, Math.round((uniqueDaysSet.size / 90) * 100 * 1.5));

      return res.json({
        success: true,
        data: {
          totalVisits,
          currentStreak,
          longestStreak: Math.max(longestStreak, currentStreak),
          visitsThisWeek,
          visitsThisMonth,
          attendancePercentage: percentage,
          heatmap: heatmapMap,
          recentSessions: records.slice(-10).reverse(),
        },
      });
    }

    // B. Trainer-specific Attendance Stats
    if (userRole === 'TRAINER') {
      const [todayRosterCheckIns, currentlyActive] = await Promise.all([
        prisma.attendance.count({
          where: {
            member: { trainerId: req.user.trainerId },
            checkInTime: { gte: startOfToday, lte: endOfToday },
          },
        }),
        prisma.attendance.count({
          where: {
            member: { trainerId: req.user.trainerId },
            checkInTime: { gte: startOfToday },
            checkOutTime: null,
          },
        }),
      ]);

      return res.json({
        success: true,
        data: {
          todayCheckIns: todayRosterCheckIns,
          currentlyInGym: currentlyActive,
          rosterScope: true,
        },
      });
    }

    // C. Admin Gym-wide Attendance Stats
    const [todayCount, currentlyInGym, totalLogs] = await Promise.all([
      prisma.attendance.count({
        where: { checkInTime: { gte: startOfToday, lte: endOfToday } },
      }),
      prisma.attendance.count({
        where: { checkInTime: { gte: startOfToday }, checkOutTime: null },
      }),
      prisma.attendance.count(),
    ]);

    res.json({
      success: true,
      data: {
        todayAttendance: todayCount,
        currentlyInGym,
        totalLogs,
      },
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/attendance/check-in - Member self check-in or Staff check-in
async function checkIn(req, res, next) {
  try {
    const userRole = req.user.role;
    let targetMemberId;

    if (userRole === 'MEMBER') {
      targetMemberId = req.user.memberId;
    } else {
      const { memberId } = req.body;
      if (!memberId) {
        return res.status(400).json({ success: false, message: 'memberId is required' });
      }
      targetMemberId = parseInt(memberId, 10);

      // Verify trainer assignment
      if (userRole === 'TRAINER') {
        const member = await prisma.member.findUnique({ where: { id: targetMemberId } });
        if (!member || member.trainerId !== req.user.trainerId) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: You can only check in members assigned to you.',
          });
        }
      }
    }

    // Check if member already checked in today without checking out
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const activeCheckIn = await prisma.attendance.findFirst({
      where: {
        memberId: targetMemberId,
        checkInTime: { gte: startOfToday },
        checkOutTime: null,
      },
    });

    if (activeCheckIn) {
      return res.status(400).json({
        success: false,
        message: 'Member already has an active checked-in session today.',
        data: activeCheckIn,
      });
    }

    const newAttendance = await prisma.attendance.create({
      data: {
        memberId: targetMemberId,
        checkInTime: new Date(),
        date: new Date(),
        status: 'PRESENT',
      },
      include: {
        member: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Check-in verified successfully. Have a great workout!',
      data: newAttendance,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/attendance/check-out - Close active attendance session
async function checkOut(req, res, next) {
  try {
    const userRole = req.user.role;
    let targetMemberId;

    if (userRole === 'MEMBER') {
      targetMemberId = req.user.memberId;
    } else {
      const { memberId } = req.body;
      if (!memberId) {
        return res.status(400).json({ success: false, message: 'memberId is required' });
      }
      targetMemberId = parseInt(memberId, 10);
    }

    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const activeSession = await prisma.attendance.findFirst({
      where: {
        memberId: targetMemberId,
        checkInTime: { gte: startOfToday },
        checkOutTime: null,
      },
      orderBy: { checkInTime: 'desc' },
    });

    if (!activeSession) {
      return res.status(404).json({
        success: false,
        message: 'No open check-in session found to check out.',
      });
    }

    const updated = await prisma.attendance.update({
      where: { id: activeSession.id },
      data: {
        checkOutTime: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Check-out completed. Workout session saved!',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllAttendance,
  getAttendanceStats,
  getTodayStats: getAttendanceStats,
  checkIn,
  checkOut,
};
