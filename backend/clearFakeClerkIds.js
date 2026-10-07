/**
 * clearFakeClerkIds.js
 * Uses a single raw SQL UPDATE to clear all placeholder Clerk IDs in one DB round-trip.
 * Run: node -r dotenv/config clearFakeClerkIds.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing placeholder Clerk IDs...');

  // Single bulk UPDATE — replaces fake seeds with email-based fallback keys
  const result = await prisma.$executeRaw`
    UPDATE "User"
    SET "clerkUserId" = CONCAT('unlinked_', "email")
    WHERE "clerkUserId" IN (
      'admin_pulseforge_clerk_master',
      'clerk_trainer_marcus.vance',
      'clerk_trainer_elena.rostova',
      'clerk_trainer_dev.sharma',
      'clerk_trainer_sarah.jenkins',
      'clerk_member_alex.mercer',
      'clerk_member_priya.patel',
      'clerk_member_carlos.gomez',
      'clerk_member_maya.lin',
      'clerk_member_david.kim',
      'clerk_member_ananya.roy'
    )
  `;

  console.log(`Updated ${result} user record(s).`);

  // Also clear fake clerkUserIds from Trainer table
  const trainerResult = await prisma.$executeRaw`
    UPDATE "Trainer"
    SET "clerkUserId" = NULL
    WHERE "clerkUserId" IN (
      'clerk_trainer_marcus.vance',
      'clerk_trainer_elena.rostova',
      'clerk_trainer_dev.sharma',
      'clerk_trainer_sarah.jenkins'
    )
  `;

  console.log(`Updated ${trainerResult} trainer record(s).`);
  console.log('\nDone! Real Clerk sign-ins will now link by email.');
  console.log('  Admin:   admin@pulseforge.gym');
  console.log('  Trainer: marcus.vance@pulseforge.gym (or any trainer email)');
  console.log('  Member:  any new email, or alex.mercer@gmail.com');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
