const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { requireClerkOnly } = require('../middleware/clerkAuth');

/**
 * Helper to create or update a user and their role-specific profile (ADMIN, TRAINER, MEMBER).
 */
async function syncUserRole({ clerkUserId, clerkEmail, clerkName, selectedRole, customName }) {
  const displayName =
    (customName || '').trim() || clerkName || clerkEmail?.split('@')[0] || 'Gym User';

  // Find user by clerkUserId or email
  let dbUser = await prisma.user.findFirst({
    where: { clerkUserId },
    include: { member: true, trainer: true },
  });

  if (!dbUser && clerkEmail) {
    dbUser = await prisma.user.findUnique({
      where: { email: clerkEmail },
      include: { member: true, trainer: true },
    });
  }

  if (dbUser) {
    // Update existing user role and name
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        role: selectedRole,
        clerkUserId: clerkUserId || dbUser.clerkUserId,
        name: displayName || dbUser.name,
      },
      include: { member: true, trainer: true },
    });
  } else {
    // Create new DB user with chosen role
    dbUser = await prisma.user.create({
      data: {
        clerkUserId,
        email: clerkEmail,
        name: displayName,
        role: selectedRole,
      },
      include: { member: true, trainer: true },
    });
  }

  // Ensure role-specific profile is initialized
  const targetEmail = clerkEmail || dbUser.email;

  if (selectedRole === 'MEMBER' && !dbUser.member) {
    let memberProfile = await prisma.member.findFirst({
      where: {
        OR: [
          { userId: dbUser.id },
          ...(targetEmail ? [{ email: targetEmail }] : []),
        ],
      },
    });

    if (memberProfile) {
      memberProfile = await prisma.member.update({
        where: { id: memberProfile.id },
        data: { userId: dbUser.id, clerkUserId: clerkUserId || dbUser.clerkUserId },
      });
    } else {
      const defaultTrainer = await prisma.trainer.findFirst({ where: { status: 'ACTIVE' } });
      const defaultMembership = await prisma.membership.findFirst({ where: { status: 'ACTIVE' } });
      memberProfile = await prisma.member.create({
        data: {
          userId: dbUser.id,
          clerkUserId: clerkUserId || dbUser.clerkUserId,
          name: displayName,
          email: targetEmail || `member_${dbUser.id}@pulseforge.gym`,
          status: 'ACTIVE',
          trainerId: defaultTrainer?.id || null,
          membershipId: defaultMembership?.id || null,
        },
      });
    }
    dbUser.member = memberProfile;
  } else if (selectedRole === 'TRAINER' && !dbUser.trainer) {
    let trainerProfile = await prisma.trainer.findFirst({
      where: {
        OR: [
          { userId: dbUser.id },
          ...(targetEmail ? [{ email: targetEmail }] : []),
        ],
      },
    });

    if (trainerProfile) {
      trainerProfile = await prisma.trainer.update({
        where: { id: trainerProfile.id },
        data: { userId: dbUser.id, clerkUserId: clerkUserId || dbUser.clerkUserId },
      });
    } else {
      trainerProfile = await prisma.trainer.create({
        data: {
          userId: dbUser.id,
          clerkUserId: clerkUserId || dbUser.clerkUserId,
          name: displayName,
          email: targetEmail || `trainer_${dbUser.id}@pulseforge.gym`,
          specialization: 'General Fitness & Strength',
          status: 'ACTIVE',
        },
      });
    }
    dbUser.trainer = trainerProfile;
  }

  return dbUser;
}

/**
 * GET /api/auth/me
 * Returns the signed-in user's DB profile + role.
 * If user does not exist in DB yet, returns needsRoleSetup: true.
 */
router.get('/me', requireClerkOnly, async (req, res) => {
  try {
    const { clerkUserId, clerkEmail, clerkName } = req.clerkInfo;

    // Try finding by clerkUserId first
    let dbUser = await prisma.user.findFirst({
      where: { clerkUserId },
      include: { member: true, trainer: true },
    });

    // Fallback: find by email
    if (!dbUser && clerkEmail) {
      dbUser = await prisma.user.findUnique({
        where: { email: clerkEmail },
        include: { member: true, trainer: true },
      });

      // Link real Clerk ID to existing record
      if (dbUser && dbUser.clerkUserId !== clerkUserId) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { clerkUserId },
          include: { member: true, trainer: true },
        });
      }
    }

    // New user — no DB record yet, needs role selection
    if (!dbUser) {
      return res.json({
        success: true,
        needsRoleSetup: true,
        data: null,
        clerkUser: {
          clerkUserId,
          email: clerkEmail,
          name: clerkName || clerkEmail?.split('@')[0] || 'New User',
        },
      });
    }

    return res.json({
      success: true,
      needsRoleSetup: false,
      data: {
        id: dbUser.id,
        clerkUserId: dbUser.clerkUserId,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        memberId: dbUser.member?.id || null,
        trainerId: dbUser.trainer?.id || null,
        member: dbUser.member,
        trainer: dbUser.trainer,
      },
    });
  } catch (error) {
    console.error('/api/auth/me error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/auth/setup-role
 * Allows setting or updating role: ADMIN | TRAINER | MEMBER
 * Body: { role: 'ADMIN' | 'TRAINER' | 'MEMBER', name?: string }
 */
router.post('/setup-role', requireClerkOnly, async (req, res) => {
  try {
    const { clerkUserId, clerkEmail, clerkName } = req.clerkInfo;
    const { role, name } = req.body;

    const allowedRoles = ['ADMIN', 'TRAINER', 'MEMBER'];
    const selectedRole = (role || '').toUpperCase();

    if (!allowedRoles.includes(selectedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Choose from ADMIN, TRAINER, or MEMBER.',
      });
    }

    const dbUser = await syncUserRole({
      clerkUserId,
      clerkEmail,
      clerkName,
      selectedRole,
      customName: name,
    });

    return res.status(200).json({
      success: true,
      message: `Role set to ${selectedRole} successfully.`,
      data: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        memberId: dbUser.member?.id || null,
        trainerId: dbUser.trainer?.id || null,
      },
    });
  } catch (error) {
    console.error('/api/auth/setup-role error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/auth/switch-role
 * Seamlessly switch role between ADMIN, TRAINER, or MEMBER at any time
 * Body: { role: 'ADMIN' | 'TRAINER' | 'MEMBER' }
 */
router.post('/switch-role', requireClerkOnly, async (req, res) => {
  try {
    const { clerkUserId, clerkEmail, clerkName } = req.clerkInfo;
    const { role } = req.body;

    const allowedRoles = ['ADMIN', 'TRAINER', 'MEMBER'];
    const targetRole = (role || '').toUpperCase();

    if (!allowedRoles.includes(targetRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Choose from ADMIN, TRAINER, or MEMBER.',
      });
    }

    const dbUser = await syncUserRole({
      clerkUserId,
      clerkEmail,
      clerkName,
      selectedRole: targetRole,
    });

    return res.json({
      success: true,
      message: `Switched role to ${targetRole} successfully.`,
      data: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        memberId: dbUser.member?.id || null,
        trainerId: dbUser.trainer?.id || null,
      },
    });
  } catch (error) {
    console.error('/api/auth/switch-role error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
