const prisma = require('../config/prisma');

// GET /api/members - Get members list (Admin sees all; Trainer sees only assigned members; Member forbidden)
async function getAllMembers(req, res, next) {
  try {
    const userRole = req.user.role;

    if (userRole === 'MEMBER') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Members cannot view the directory of gym members.',
      });
    }

    const { search, status, membershipId, trainerId } = req.query;
    const where = {};

    // If Trainer, enforce ownership strictly to assigned members
    if (userRole === 'TRAINER') {
      where.trainerId = req.user.trainerId;
    } else if (trainerId) {
      where.trainerId = parseInt(trainerId, 10);
    }

    if (status) {
      where.status = status;
    }

    if (membershipId) {
      where.membershipId = parseInt(membershipId, 10);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const members = await prisma.member.findMany({
      where,
      include: {
        trainer: {
          select: { id: true, name: true, specialization: true },
        },
        membership: {
          select: { id: true, name: true, price: true, durationInDays: true },
        },
        _count: {
          select: {
            attendances: true,
            payments: true,
            workouts: true,
          },
        },
      },
      orderBy: { id: 'desc' },
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

// GET /api/members/me - Get currently authenticated member's complete profile
async function getMyProfile(req, res, next) {
  try {
    if (!req.user.memberId) {
      return res.status(404).json({
        success: false,
        message: 'No associated member profile found for this account.',
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
        attendances: {
          orderBy: { checkInTime: 'desc' },
          take: 30,
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        workouts: {
          include: {
            exercises: true,
          },
        },
        workoutCompletions: {
          orderBy: { completedDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member profile not found in database.',
      });
    }

    res.json({
      success: true,
      data: member,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/members/:id - Get single member details (Protected against IDOR)
async function getMemberById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const userRole = req.user.role;

    // IDOR Protection: Member can only access their own record
    if (userRole === 'MEMBER' && req.user.memberId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view another member’s private details.',
      });
    }

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        trainer: true,
        membership: true,
        attendances: {
          orderBy: { checkInTime: 'desc' },
          take: 20,
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        workouts: {
          include: {
            exercises: true,
          },
        },
        workoutCompletions: {
          orderBy: { completedDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    // IDOR Protection: Trainer can only access members assigned to them
    if (userRole === 'TRAINER' && member.trainerId !== req.user.trainerId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: This member is not assigned to your coaching roster.',
      });
    }

    res.json({
      success: true,
      data: member,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/members - Create a new member (Admin or Trainer)
async function createMember(req, res, next) {
  try {
    const userRole = req.user.role;
    const {
      name,
      email,
      phone,
      dateOfBirth,
      gender,
      emergencyContact,
      address,
      trainerId,
      membershipId,
      status = 'ACTIVE',
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required fields',
      });
    }

    const existingMember = await prisma.member.findUnique({
      where: { email },
    });

    if (existingMember) {
      return res.status(409).json({
        success: false,
        message: 'A member with this email already exists',
      });
    }

    // If a trainer is creating, enforce assignment to themselves
    const assignedTrainerId =
      userRole === 'TRAINER' ? req.user.trainerId : (trainerId ? parseInt(trainerId, 10) : null);

    // Create user and member records
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: 'MEMBER',
        clerkUserId: `member_${Date.now()}`,
      },
    });

    const newMember = await prisma.member.create({
      data: {
        userId: user.id,
        clerkUserId: user.clerkUserId,
        name,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        emergencyContact,
        address,
        status,
        trainerId: assignedTrainerId,
        membershipId: membershipId ? parseInt(membershipId, 10) : null,
      },
      include: {
        trainer: true,
        membership: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Member registered successfully',
      data: newMember,
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/members/:id - Update member details
async function updateMember(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const userRole = req.user.role;

    // IDOR Protection: Member can only update their own record
    if (userRole === 'MEMBER' && req.user.memberId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot modify another member’s details.',
      });
    }

    const existingMember = await prisma.member.findUnique({ where: { id } });
    if (!existingMember) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    // IDOR Protection: Trainer can only update their assigned members
    if (userRole === 'TRAINER' && existingMember.trainerId !== req.user.trainerId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only update members assigned to you.',
      });
    }

    const {
      name,
      phone,
      dateOfBirth,
      gender,
      emergencyContact,
      address,
      status,
      trainerId,
      membershipId,
    } = req.body;

    const updateData = {};
    if (phone !== undefined) updateData.phone = phone;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
    if (address !== undefined) updateData.address = address;

    // Members cannot change their own administrative fields
    if (userRole === 'ADMIN' || userRole === 'TRAINER') {
      if (name) updateData.name = name;
      if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
      if (gender) updateData.gender = gender;
      if (status) updateData.status = status;
    }

    // Only Admin can reassign trainers or change membership tiers directly
    if (userRole === 'ADMIN') {
      if (trainerId !== undefined) updateData.trainerId = trainerId ? parseInt(trainerId, 10) : null;
      if (membershipId !== undefined) updateData.membershipId = membershipId ? parseInt(membershipId, 10) : null;
    }

    const updatedMember = await prisma.member.update({
      where: { id },
      data: updateData,
      include: {
        trainer: true,
        membership: true,
      },
    });

    res.json({
      success: true,
      message: 'Member updated successfully',
      data: updatedMember,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/members/:id - Admin only
async function deleteMember(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);

    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    await prisma.member.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Member removed from system successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllMembers,
  getMyProfile,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
};
