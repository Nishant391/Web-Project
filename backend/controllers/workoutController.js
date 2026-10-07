const prisma = require('../config/prisma');

// GET /api/workouts - List workouts with role-based isolation
async function getAllWorkouts(req, res, next) {
  try {
    const userRole = req.user.role;
    const { difficultyLevel, splitType } = req.query;

    const where = {};
    if (difficultyLevel) where.difficultyLevel = difficultyLevel;
    if (splitType) where.splitType = splitType;

    // Strict Role Filtering
    if (userRole === 'MEMBER') {
      where.memberId = req.user.memberId;
    } else if (userRole === 'TRAINER') {
      where.OR = [
        { trainerId: req.user.trainerId },
        { member: { trainerId: req.user.trainerId } },
      ];
    }

    const workouts = await prisma.workout.findMany({
      where,
      include: {
        member: { select: { id: true, name: true, email: true } },
        trainer: { select: { id: true, name: true, specialization: true } },
        exercises: {
          orderBy: { id: 'asc' },
        },
        completions: {
          orderBy: { completedDate: 'desc' },
          take: 5,
        },
      },
      orderBy: { id: 'desc' },
    });

    res.json({
      success: true,
      count: workouts.length,
      data: workouts,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/workouts/:id - Get single workout (IDOR Protected)
async function getWorkoutById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const userRole = req.user.role;

    const workout = await prisma.workout.findUnique({
      where: { id },
      include: {
        member: true,
        trainer: true,
        exercises: {
          orderBy: { id: 'asc' },
        },
        completions: {
          orderBy: { completedDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout routine not found',
      });
    }

    // Role Ownership check
    if (userRole === 'MEMBER' && workout.memberId !== req.user.memberId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot inspect another member’s customized workout plan.',
      });
    }

    if (
      userRole === 'TRAINER' &&
      workout.trainerId !== req.user.trainerId &&
      workout.member?.trainerId !== req.user.trainerId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view this workout regimen.',
      });
    }

    res.json({
      success: true,
      data: workout,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/workouts - Create workout split routine with exercise schedule
async function createWorkout(req, res, next) {
  try {
    const userRole = req.user.role;
    const {
      title,
      splitType = 'CUSTOM',
      description,
      targetGoal,
      difficultyLevel = 'INTERMEDIATE',
      memberId,
      trainerId,
      exercises = [],
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Workout title is required',
      });
    }

    let assignedTrainerId = trainerId ? parseInt(trainerId, 10) : null;
    let targetMemberId = memberId ? parseInt(memberId, 10) : null;

    if (userRole === 'TRAINER') {
      assignedTrainerId = req.user.trainerId;

      // If assigning to a member, verify the member belongs to this trainer
      if (targetMemberId) {
        const assignedMember = await prisma.member.findUnique({
          where: { id: targetMemberId },
        });
        if (!assignedMember || assignedMember.trainerId !== req.user.trainerId) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: You can only assign workout splits to members on your coaching roster.',
          });
        }
      }
    }

    const newWorkout = await prisma.workout.create({
      data: {
        title,
        splitType,
        description,
        targetGoal,
        difficultyLevel,
        memberId: targetMemberId,
        trainerId: assignedTrainerId,
        exercises: {
          create: exercises.map((ex) => ({
            exerciseName: ex.exerciseName,
            sets: parseInt(ex.sets, 10) || 3,
            reps: ex.reps ? String(ex.reps) : '10-12',
            weight: ex.weight || null,
            restSeconds: parseInt(ex.restSeconds, 10) || 60,
            dayOfWeek: ex.dayOfWeek || 'Day 1',
            notes: ex.notes || null,
          })),
        },
      },
      include: {
        exercises: true,
        member: { select: { id: true, name: true } },
        trainer: { select: { id: true, name: true } },
      },
    });

    // If assigned to a member, register active WorkoutAssignment
    if (targetMemberId) {
      await prisma.workoutAssignment.create({
        data: {
          workoutId: newWorkout.id,
          memberId: targetMemberId,
          assignedByTrainerId: assignedTrainerId,
          status: 'ACTIVE',
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Workout split plan generated and assigned successfully',
      data: newWorkout,
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/workouts/:id - Update workout plan
async function updateWorkout(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const userRole = req.user.role;

    const existingWorkout = await prisma.workout.findUnique({ where: { id } });
    if (!existingWorkout) {
      return res.status(404).json({ success: false, message: 'Workout not found' });
    }

    if (userRole === 'TRAINER' && existingWorkout.trainerId !== req.user.trainerId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only modify routines you authored.',
      });
    }

    const { title, splitType, description, targetGoal, difficultyLevel } = req.body;

    const updated = await prisma.workout.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(splitType && { splitType }),
        ...(description !== undefined && { description }),
        ...(targetGoal !== undefined && { targetGoal }),
        ...(difficultyLevel && { difficultyLevel }),
      },
      include: { exercises: true },
    });

    res.json({
      success: true,
      message: 'Workout updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/workouts/:id
async function deleteWorkout(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const userRole = req.user.role;

    const workout = await prisma.workout.findUnique({ where: { id } });
    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found' });
    }

    if (userRole === 'TRAINER' && workout.trainerId !== req.user.trainerId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only remove your own workout routines.',
      });
    }

    await prisma.workout.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Workout plan deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/workouts/completions - Mark exercise or workout session completed
async function logWorkoutCompletion(req, res, next) {
  try {
    const userRole = req.user.role;
    let targetMemberId;

    if (userRole === 'MEMBER') {
      targetMemberId = req.user.memberId;
    } else {
      targetMemberId = req.body.memberId ? parseInt(req.body.memberId, 10) : null;
    }

    if (!targetMemberId) {
      return res.status(400).json({ success: false, message: 'Valid memberId is required' });
    }

    const { workoutId, exerciseId, durationMinutes = 45, notes = 'Completed cleanly' } = req.body;

    const completion = await prisma.workoutCompletion.create({
      data: {
        memberId: targetMemberId,
        workoutId: workoutId ? parseInt(workoutId, 10) : null,
        exerciseId: exerciseId ? parseInt(exerciseId, 10) : null,
        durationMinutes: parseInt(durationMinutes, 10) || 45,
        notes,
        completedDate: new Date(),
        status: 'COMPLETED',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Exercise marked as completed in training journal!',
      data: completion,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/workouts/completions - Retrieve completions
async function getWorkoutCompletions(req, res, next) {
  try {
    const userRole = req.user.role;
    const where = {};

    if (userRole === 'MEMBER') {
      where.memberId = req.user.memberId;
    } else if (userRole === 'TRAINER') {
      where.member = { trainerId: req.user.trainerId };
    }

    const completions = await prisma.workoutCompletion.findMany({
      where,
      include: {
        exercise: true,
        workout: { select: { title: true, splitType: true } },
        member: { select: { id: true, name: true } },
      },
      orderBy: { completedDate: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      count: completions.length,
      data: completions,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  logWorkoutCompletion,
  getWorkoutCompletions,
};
