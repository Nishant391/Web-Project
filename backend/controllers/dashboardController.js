const prisma = require('../config/prisma');

// GET /api/dashboard/stats - Tailored metrics matching the user's role (Admin / Trainer / Member)
async function getDashboardStats(req, res, next) {
  try {
    const userRole = req.user.role;
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfToday = new Date(new Date().setHours(23, 59, 59, 999));

    // ==========================================
    // 1. MEMBER PERSONALIZED DASHBOARD
    // ==========================================
    if (userRole === 'MEMBER') {
      if (!req.user.memberId) {
        return res.status(404).json({
          success: false,
          message: 'Member account not initialized in database.',
        });
      }

      const member = await prisma.member.findUnique({
        where: { id: req.user.memberId },
        include: {
          trainer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              specialization: true,
              bio: true,
            },
          },
          membership: true,
          workouts: {
            include: {
              exercises: {
                orderBy: { id: 'asc' },
              },
            },
            take: 2,
          },
          workoutCompletions: {
            include: { exercise: true },
            orderBy: { completedDate: 'desc' },
            take: 8,
          },
          payments: {
            orderBy: { paymentDate: 'desc' },
            take: 5,
          },
        },
      });

      // Fetch 365-day attendance records for GitHub-style heatmap & streaks
      const oneYearAgo = new Date();
      oneYearAgo.setDate(oneYearAgo.getDate() - 365);

      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          memberId: req.user.memberId,
          checkInTime: { gte: oneYearAgo },
        },
        orderBy: { checkInTime: 'asc' },
      });

      const heatmapMap = {};
      const uniqueDaysSet = new Set();
      attendanceRecords.forEach((r) => {
        const dateKey = r.checkInTime.toISOString().split('T')[0];
        heatmapMap[dateKey] = (heatmapMap[dateKey] || 0) + 1;
        uniqueDaysSet.add(dateKey);
      });

      // Streak calculation
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let currentStreak = 0;
      let streakCursor = uniqueDaysSet.has(todayStr)
        ? new Date(now)
        : uniqueDaysSet.has(yesterdayStr)
        ? new Date(yesterday)
        : null;

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

      const sortedDays = Array.from(uniqueDaysSet).sort();
      let longestStreak = 0;
      let tempStreak = 0;
      for (let i = 0; i < sortedDays.length; i++) {
        if (i === 0) tempStreak = 1;
        else {
          const prev = new Date(sortedDays[i - 1]);
          const curr = new Date(sortedDays[i]);
          const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
          if (diff === 1) tempStreak++;
          else tempStreak = 1;
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      }

      // Visits this week & month
      const currentDay = now.getDay();
      const distToMon = (currentDay + 6) % 7;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - distToMon);
      startOfWeek.setHours(0, 0, 0, 0);
      const visitsThisWeek = attendanceRecords.filter((r) => new Date(r.checkInTime) >= startOfWeek).length;

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const visitsThisMonth = attendanceRecords.filter((r) => new Date(r.checkInTime) >= startOfMonth).length;

      // Nutrition logs for today
      const todayNutrition = await prisma.nutritionLog.findMany({
        where: {
          memberId: req.user.memberId,
          date: { gte: startOfToday, lte: endOfToday },
        },
      });

      const totalCaloriesToday = todayNutrition.reduce((sum, n) => sum + n.calories, 0);

      // Check if user is checked in right now
      const activeSession = await prisma.attendance.findFirst({
        where: {
          memberId: req.user.memberId,
          checkInTime: { gte: startOfToday },
          checkOutTime: null,
        },
      });

      return res.json({
        success: true,
        role: 'MEMBER',
        data: {
          member,
          activeSession: !!activeSession,
          attendanceStats: {
            totalVisits: attendanceRecords.length,
            currentStreak,
            longestStreak: Math.max(longestStreak, currentStreak),
            visitsThisWeek,
            visitsThisMonth,
            attendancePercentage: Math.min(100, Math.round((uniqueDaysSet.size / 90) * 100 * 1.5)),
            heatmap: heatmapMap,
          },
          todaysNutrition: {
            totalCalories: totalCaloriesToday,
            items: todayNutrition,
          },
        },
      });
    }

    // ==========================================
    // 2. TRAINER DASHBOARD
    // ==========================================
    if (userRole === 'TRAINER') {
      if (!req.user.trainerId) {
        return res.status(404).json({
          success: false,
          message: 'Trainer account not linked to a coaching profile.',
        });
      }

      const trainer = await prisma.trainer.findUnique({
        where: { id: req.user.trainerId },
      });

      const [assignedMembers, todayCheckIns, myWorkouts] = await Promise.all([
        prisma.member.findMany({
          where: { trainerId: req.user.trainerId },
          include: {
            membership: { select: { name: true, status: true } },
            _count: { select: { attendances: true, workouts: true } },
          },
          orderBy: { name: 'asc' },
        }),
        prisma.attendance.count({
          where: {
            member: { trainerId: req.user.trainerId },
            checkInTime: { gte: startOfToday, lte: endOfToday },
          },
        }),
        prisma.workout.findMany({
          where: { trainerId: req.user.trainerId },
          include: {
            member: { select: { id: true, name: true } },
            exercises: true,
          },
          orderBy: { id: 'desc' },
        }),
      ]);

      const activeMembersCount = assignedMembers.filter((m) => m.status === 'ACTIVE').length;

      return res.json({
        success: true,
        role: 'TRAINER',
        data: {
          trainer,
          summary: {
            totalAssigned: assignedMembers.length,
            activeAssigned: activeMembersCount,
            todayCheckIns,
            totalRoutinesAuthored: myWorkouts.length,
          },
          assignedMembers,
          workouts: myWorkouts,
        },
      });
    }

    // ==========================================
    // 3. ADMIN GYM-WIDE DASHBOARD
    // ==========================================
    const [
      totalMembers,
      activeMembers,
      totalTrainers,
      todayAttendance,
      currentlyInGym,
      revenueCompleted,
      revenuePending,
      equipmentMaintenance,
      recentPayments,
      recentAttendance,
      memberships,
    ] = await Promise.all([
      prisma.member.count(),
      prisma.member.count({ where: { status: 'ACTIVE' } }),
      prisma.trainer.count({ where: { status: 'ACTIVE' } }),
      prisma.attendance.count({
        where: {
          checkInTime: { gte: startOfToday, lte: endOfToday },
        },
      }),
      prisma.attendance.count({
        where: {
          checkInTime: { gte: startOfToday },
          checkOutTime: null,
        },
      }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.equipment.count({
        where: {
          OR: [
            { condition: 'NEEDS_SERVICE' },
            { condition: 'OUT_OF_ORDER' },
            { status: 'UNDER_MAINTENANCE' },
          ],
        },
      }),
      prisma.payment.findMany({
        take: 6,
        orderBy: { paymentDate: 'desc' },
        include: {
          member: { select: { id: true, name: true, email: true } },
          membership: { select: { name: true } },
        },
      }),
      prisma.attendance.findMany({
        take: 6,
        orderBy: { checkInTime: 'desc' },
        include: {
          member: { select: { id: true, name: true } },
        },
      }),
      prisma.membership.findMany({
        include: {
          _count: { select: { members: true } },
        },
      }),
    ]);

    const membershipDistribution = memberships.map((m) => ({
      name: m.name,
      members: m._count.members,
      price: m.price,
    }));

    const monthlyRevenueData = [
      { month: 'May', revenue: 32000, checkIns: 410 },
      { month: 'Jun', revenue: 41500, checkIns: 490 },
      { month: 'Jul', revenue: 48900, checkIns: 560 },
      { month: 'Aug', revenue: 53400, checkIns: 620 },
      { month: 'Sep', revenue: 59200, checkIns: 690 },
      { month: 'Oct', revenue: 64500, checkIns: 740 },
    ];

    const attendanceTrendData = [
      { day: 'Mon', checkIns: 52 },
      { day: 'Tue', checkIns: 64 },
      { day: 'Wed', checkIns: 58 },
      { day: 'Thu', checkIns: 61 },
      { day: 'Fri', checkIns: 54 },
      { day: 'Sat', checkIns: 46 },
      { day: 'Sun', checkIns: 32 },
    ];

    res.json({
      success: true,
      role: 'ADMIN',
      data: {
        summary: {
          totalMembers,
          activeMembers,
          inactiveMembers: totalMembers - activeMembers,
          totalTrainers,
          todayAttendance,
          currentlyInGym,
          totalRevenue: revenueCompleted._sum.amount || 0,
          pendingRevenue: revenuePending._sum.amount || 0,
          pendingPaymentsCount: revenuePending._count.id || 0,
          equipmentMaintenanceCount: equipmentMaintenance,
        },
        membershipDistribution,
        monthlyRevenueData,
        attendanceTrendData,
        recentPayments,
        recentAttendance,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats,
};
