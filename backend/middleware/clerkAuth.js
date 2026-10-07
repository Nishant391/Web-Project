const prisma = require('../config/prisma');

let getAuthSafe = null;
let clerkClient = null;
try {
  const clerk = require('@clerk/express');
  getAuthSafe = clerk.getAuth;
  clerkClient = clerk.clerkClient;
} catch (e) {
  getAuthSafe = null;
}

/**
 * Authentication Middleware
 * 1. Checks Clerk JWT / Session token
 * 2. Matches Clerk userId to PostgreSQL User model
 * 3. Fallback support for demo role headers in viva / development mode
 */
const requireAuth = async (req, res, next) => {
  try {
    // A. Check for demo / development role header (useful for quick viva demonstration)
    const demoRoleHeader = req.headers['x-user-role'];
    const demoEmailHeader = req.headers['x-user-email'];

    if (demoRoleHeader) {
      const targetRole = demoRoleHeader.toUpperCase();
      let dbUser = null;

      if (demoEmailHeader) {
        dbUser = await prisma.user.findUnique({
          where: { email: demoEmailHeader },
          include: { member: true, trainer: true },
        });
      }

      if (!dbUser) {
        if (targetRole === 'ADMIN') {
          dbUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
            include: { member: true, trainer: true },
          });
        } else if (targetRole === 'TRAINER') {
          dbUser = await prisma.user.findFirst({
            where: { role: 'TRAINER' },
            include: { member: true, trainer: true },
          });
        } else if (targetRole === 'MEMBER') {
          dbUser = await prisma.user.findFirst({
            where: { role: 'MEMBER' },
            include: { member: true, trainer: true },
          });
        }
      }

      if (dbUser) {
        req.user = {
          id: dbUser.id,
          clerkUserId: dbUser.clerkUserId,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          memberId: dbUser.member?.id || null,
          trainerId: dbUser.trainer?.id || null,
          member: dbUser.member,
          trainer: dbUser.trainer,
        };
        return next();
      }
    }

    // B. Check Clerk Authentication via @clerk/express
    let clerkUserId = null;
    let clerkEmail = null;
    let clerkName = null;

    if (req.auth && req.auth.userId) {
      clerkUserId = req.auth.userId;
      clerkEmail = req.auth.sessionClaims?.email || null;
    } else if (getAuthSafe) {
      try {
        const auth = getAuthSafe(req);
        if (auth && auth.userId) {
          clerkUserId = auth.userId;
          clerkEmail = auth.sessionClaims?.email || null;
        }
      } catch (err) {
        // Ignored if header not present
      }
    }

    if (clerkUserId) {
      // Find in database by clerkUserId
      let dbUser = await prisma.user.findUnique({
        where: { clerkUserId },
        include: { member: true, trainer: true },
      });

      // If not linked yet, check by email if available
      if (!dbUser && (clerkEmail || clerkClient)) {
        if (!clerkEmail && clerkClient) {
          try {
            const userDetails = await clerkClient.users.getUser(clerkUserId);
            clerkEmail = userDetails.emailAddresses?.[0]?.emailAddress;
            clerkName = `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim() || 'Gym Member';
          } catch (fetchErr) {
            console.warn('Could not fetch Clerk user profile:', fetchErr.message);
          }
        }

        if (clerkEmail) {
          const adminEmail = process.env.ADMIN_EMAIL || 'admin@pulseforge.gym';
          const isSingleAdmin = clerkEmail.toLowerCase() === adminEmail.toLowerCase();

          // Look for an existing DB user with this email (could be pre-created TRAINER or ADMIN)
          dbUser = await prisma.user.findUnique({
            where: { email: clerkEmail },
            include: { member: true, trainer: true },
          });

          if (dbUser) {
            // ─── EXISTING USER: Just link their Clerk ID, preserve existing role ───
            dbUser = await prisma.user.update({
              where: { id: dbUser.id },
              data: { clerkUserId },
              include: { member: true, trainer: true },
            });

            // If this is a TRAINER user but no trainer profile linked, auto-link by email
            if (dbUser.role === 'TRAINER' && !dbUser.trainer) {
              const trainerProfile = await prisma.trainer.findUnique({
                where: { email: clerkEmail },
              });
              if (trainerProfile && !trainerProfile.userId) {
                await prisma.trainer.update({
                  where: { id: trainerProfile.id },
                  data: { userId: dbUser.id, clerkUserId },
                });
                dbUser.trainer = { ...trainerProfile, userId: dbUser.id, clerkUserId };
              }
            }
          } else {
            // ─── NEW USER: Determine role by email ───
            // Only the configured ADMIN_EMAIL can get the ADMIN role.
            // Everyone else is a MEMBER. Trainers must be pre-created by Admin.
            const assignedRole = isSingleAdmin ? 'ADMIN' : 'MEMBER';
            const userName = clerkName || clerkEmail.split('@')[0];

            dbUser = await prisma.user.create({
              data: {
                clerkUserId,
                email: clerkEmail,
                name: userName,
                role: assignedRole,
              },
            });

            if (assignedRole === 'MEMBER') {
              const defaultTrainer = await prisma.trainer.findFirst({ where: { status: 'ACTIVE' } });
              const defaultMembership = await prisma.membership.findFirst({ where: { status: 'ACTIVE' } });

              const member = await prisma.member.create({
                data: {
                  userId: dbUser.id,
                  clerkUserId,
                  name: userName,
                  email: clerkEmail,
                  status: 'ACTIVE',
                  trainerId: defaultTrainer?.id || null,
                  membershipId: defaultMembership?.id || null,
                },
              });
              dbUser.member = member;
            }
          }
        }
      }

      if (dbUser) {
        req.user = {
          id: dbUser.id,
          clerkUserId: dbUser.clerkUserId,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          memberId: dbUser.member?.id || null,
          trainerId: dbUser.trainer?.id || null,
          member: dbUser.member,
          trainer: dbUser.trainer,
        };
        return next();
      }
    }

    // C. If completely unauthenticated: reject with 401 Unauthorized
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in with a valid session.',
    });
  } catch (error) {
    console.error('requireAuth Middleware Exception:', error);
    next(error);
  }
};

/**
 * Lightweight Clerk-only middleware.
 * Validates the Clerk JWT and extracts clerkUserId + email + name.
 * Does NOT require the user to exist in the PostgreSQL database yet.
 * Used for onboarding endpoints (/api/auth/me, /api/auth/setup-role).
 */
const requireClerkOnly = async (req, res, next) => {
  try {
    let clerkUserId = null;
    let clerkEmail = null;
    let clerkName = null;

    if (req.auth && req.auth.userId) {
      clerkUserId = req.auth.userId;
      clerkEmail = req.auth.sessionClaims?.email || null;
    } else if (getAuthSafe) {
      try {
        const auth = getAuthSafe(req);
        if (auth && auth.userId) {
          clerkUserId = auth.userId;
          clerkEmail = auth.sessionClaims?.email || null;
        }
      } catch (_) {}
    }

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.',
      });
    }

    // Fetch full name from Clerk if email not in JWT
    if (!clerkEmail && clerkClient) {
      try {
        const userDetails = await clerkClient.users.getUser(clerkUserId);
        clerkEmail = userDetails.emailAddresses?.[0]?.emailAddress || null;
        clerkName =
          `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim() || null;
      } catch (_) {}
    }

    req.clerkInfo = { clerkUserId, clerkEmail, clerkName };
    next();
  } catch (error) {
    console.error('requireClerkOnly Exception:', error);
    next(error);
  }
};

module.exports = {
  requireAuth,
  requireClerkOnly,
  requireRole,
};

/**
 * Role-Based Access Control Middleware
 * @param  {...string} allowedRoles - e.g. 'ADMIN', 'TRAINER', 'MEMBER'
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in to access this resource.',
      });
    }

    const userRole = (req.user.role || 'MEMBER').toUpperCase();
    const formattedAllowed = allowedRoles.map((r) => r.toUpperCase());

    if (!formattedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${formattedAllowed.join(', ')}] role. Current role: ${userRole}`,
      });
    }

    next();
  };
}
