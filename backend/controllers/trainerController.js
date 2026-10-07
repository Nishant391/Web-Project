const prisma = require('../config/prisma');

// GET /api/trainers - Get trainers list
async function getAllTrainers(req, res, next) {
  try {
    const userRole = req.user.role;
    const { search, specialization, status } = req.query;

    const where = {};
    if (status) where.status = status;
    if (specialization) where.specialization = { contains: specialization, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (userRole === 'ADMIN') {
      const trainers = await prisma.trainer.findMany({
        where,
        include: {
          _count: {
            select: {
              members: true,
              workouts: true,
              salaries: true,
            },
          },
        },
        orderBy: { id: 'desc' },
      });

      return res.json({
        success: true,
        count: trainers.length,
        data: trainers,
      });
    }

    // Members and Trainers see public profile cards (No sensitive payroll/salary data)
    const publicTrainers = await prisma.trainer.findMany({
      where: { ...where, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        specialization: true,
        experienceYears: true,
        bio: true,
        phone: true,
        email: true,
      },
      orderBy: { id: 'asc' },
    });

    res.json({
      success: true,
      count: publicTrainers.length,
      data: publicTrainers,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/trainers/me - Get currently authenticated trainer's full profile
async function getMyTrainerProfile(req, res, next) {
  try {
    if (!req.user.trainerId) {
      return res.status(404).json({
        success: false,
        message: 'No associated trainer profile found for this account.',
      });
    }

    const trainer = await prisma.trainer.findUnique({
      where: { id: req.user.trainerId },
      include: {
        members: {
          include: {
            membership: { select: { name: true, status: true } },
            _count: { select: { attendances: true, workouts: true } },
          },
        },
        salaries: {
          orderBy: { createdAt: 'desc' },
        },
        workouts: {
          include: {
            exercises: true,
            member: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer record not found in database.',
      });
    }

    res.json({
      success: true,
      data: trainer,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/trainers/my-members - Get only members assigned to this trainer
async function getMyAssignedMembers(req, res, next) {
  try {
    if (!req.user.trainerId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only verified coaches can access assigned rosters.',
      });
    }

    const members = await prisma.member.findMany({
      where: { trainerId: req.user.trainerId },
      include: {
        membership: true,
        attendances: {
          orderBy: { checkInTime: 'desc' },
          take: 5,
        },
        workouts: {
          include: {
            exercises: true,
          },
        },
        _count: {
          select: {
            attendances: true,
            workoutCompletions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/trainers/:id - Get single trainer (Protected against IDOR)
async function getTrainerById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const userRole = req.user.role;

    if (userRole === 'TRAINER' && req.user.trainerId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Coaches cannot view confidential files of other trainers.',
      });
    }

    const trainer = await prisma.trainer.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            membership: { select: { name: true } },
          },
        },
        salaries: userRole === 'ADMIN' || (userRole === 'TRAINER' && req.user.trainerId === id),
        workouts: {
          include: {
            exercises: true,
            member: { select: { name: true } },
          },
        },
      },
    });

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found',
      });
    }

    res.json({
      success: true,
      data: trainer,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/trainers - Admin only
async function createTrainer(req, res, next) {
  try {
    const { name, email, phone, specialization, experienceYears = 1, bio, status = 'ACTIVE' } = req.body;

    if (!name || !email || !specialization) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and specialization are required fields',
      });
    }

    const existingTrainer = await prisma.trainer.findUnique({
      where: { email },
    });

    if (existingTrainer) {
      return res.status(409).json({
        success: false,
        message: 'A trainer with this email already exists',
      });
    }

    // Create user and trainer records
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: 'TRAINER',
        clerkUserId: `trainer_${Date.now()}`,
      },
    });

    const newTrainer = await prisma.trainer.create({
      data: {
        userId: user.id,
        clerkUserId: user.clerkUserId,
        name,
        email,
        phone,
        specialization,
        experienceYears: parseInt(experienceYears, 10) || 1,
        bio,
        status,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Trainer onboarded successfully',
      data: newTrainer,
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/trainers/:id - Update trainer details
async function updateTrainer(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const userRole = req.user.role;

    if (userRole === 'TRAINER' && req.user.trainerId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot modify another trainer’s credentials.',
      });
    }

    const { name, phone, specialization, experienceYears, bio, status } = req.body;
    const updateData = {};

    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;

    // Only Admin can modify specialization, status, or name
    if (userRole === 'ADMIN') {
      if (name) updateData.name = name;
      if (specialization) updateData.specialization = specialization;
      if (experienceYears) updateData.experienceYears = parseInt(experienceYears, 10);
      if (status) updateData.status = status;
    }

    const updatedTrainer = await prisma.trainer.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Trainer profile updated successfully',
      data: updatedTrainer,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/trainers/:id - Admin only
async function deleteTrainer(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);

    const trainer = await prisma.trainer.findUnique({ where: { id } });
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found',
      });
    }

    await prisma.trainer.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Trainer removed from organization successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllTrainers,
  getMyTrainerProfile,
  getMyAssignedMembers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  deleteTrainer,
};
