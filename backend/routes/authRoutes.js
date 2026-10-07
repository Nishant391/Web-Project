const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { requireAuth, requireClerkOnly } = require('../middleware/clerkAuth');

/**
 * GET /api/auth/me
 * Returns the signed-in user's DB profile + role.
 * If the user is new (not in DB yet), returns needsRoleSetup: true
 * so the frontend can show the role selection screen.
 */
router.get('/me', requireClerkOnly, async (req, res) => {
  try {
    const { clerkUserId, clerkEmail, clerkName } = req.clerkInfo;

    // Try finding by clerkUserId first
    let dbUser = await prisma.user.findFirst({
      where: { clerkUserId },
      include: { member: true, trainer: true },
    });

    // Fallback: find by email (handles first login after fake ID was cleared)
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
 * Called once after Google/Clerk login when a user is new.
 * Body: { role: 'MEMBER' | 'TRAINER', name: string }
 *
 * Rules:
 *  - ADMIN cannot be selected here (single admin is pre-configured via ADMIN_EMAIL)
 *  - If the user already exists, returns their existing profile
 */
router.post('/setup-role', requireClerkOnly, async (req, res) => {
  try {
    const { clerkUserId, clerkEmail, clerkName } = req.clerkInfo;
    const { role, name } = req.body;

    // Validate role — admin cannot be self-assigned
    const allowedRoles = ['MEMBER', 'TRAINER'];
    const selectedRole = (role || '').toUpperCase();
    if (!allowedRoles.includes(selectedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. You can only join as MEMBER or TRAINER.',
      });
    }

    const displayName = (name || '').trim() || clerkName || clerkEmail?.split('@')[0] || 'User';

    // Check if user already exists (avoid duplicates)
    let dbUser = await prisma.user.findFirst({ where: { clerkUserId }, include: { member: true, trainer: true } });
    if (!dbUser && clerkEmail) {
      dbUser = await prisma.user.findUnique({ where: { email: clerkEmail }, include: { member: true, trainer: true } });
    }

    if (dbUser) {
      // Already registered — just return existing profile
      return res.json({
        success: true,
        message: 'Profile already exists.',
        data: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          memberId: dbUser.member?.id || null,
          trainerId: dbUser.trainer?.id || null,
        },
      });
    }

    // Check admin email guard
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@pulseforge.gym';
    if (clerkEmail?.toLowerCase() === adminEmail.toLowerCase()) {
      // Admin signing up for the first time — auto-assign ADMIN
      const adminUser = await prisma.user.create({
        data: { clerkUserId, email: clerkEmail, name: displayName, role: 'ADMIN' },
      });
      return res.json({ success: true, data: { ...adminUser, memberId: null, trainerId: null } });
    }

    // Create new DB user with chosen role
    const newUser = await prisma.user.create({
      data: { clerkUserId, email: clerkEmail, name: displayName, role: selectedRole },
    });

    let memberId = null;
    let trainerId = null;

    if (selectedRole === 'MEMBER') {
      const defaultTrainer = await prisma.trainer.findFirst({ where: { status: 'ACTIVE' } });
      const defaultMembership = await prisma.membership.findFirst({ where: { status: 'ACTIVE' } });
      const member = await prisma.member.create({
        data: {
          userId: newUser.id,
          clerkUserId,
          name: displayName,
          email: clerkEmail,
          status: 'ACTIVE',
          trainerId: defaultTrainer?.id || null,
          membershipId: defaultMembership?.id || null,
        },
      });
      memberId = member.id;
    } else if (selectedRole === 'TRAINER') {
      // Check if there's an existing unlinked Trainer profile with this email
      let trainerProfile = await prisma.trainer.findUnique({ where: { email: clerkEmail } });
      if (trainerProfile) {
        trainerProfile = await prisma.trainer.update({
          where: { id: trainerProfile.id },
          data: { userId: newUser.id, clerkUserId },
        });
      } else {
        // Create a new trainer profile
        trainerProfile = await prisma.trainer.create({
          data: {
            userId: newUser.id,
            clerkUserId,
            name: displayName,
            email: clerkEmail,
            specialization: 'General Fitness',
            status: 'ACTIVE',
          },
        });
      }
      trainerId = trainerProfile.id;
    }

    return res.status(201).json({
      success: true,
      message: `Welcome to PulseForge! You are now registered as a ${selectedRole}.`,
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        memberId,
        trainerId,
      },
    });
  } catch (error) {
    console.error('/api/auth/setup-role error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
