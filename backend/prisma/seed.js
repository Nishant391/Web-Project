const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Smart Gym Management System with RBAC...');

  // 1. Clean existing records in referential integrity order
  await prisma.nutritionLog.deleteMany({});
  await prisma.workoutCompletion.deleteMany({});
  await prisma.workoutAssignment.deleteMany({});
  await prisma.workoutExercise.deleteMany({});
  await prisma.workout.deleteMany({});
  await prisma.trainerSalary.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.trainer.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.equipment.deleteMany({});

  console.log('Cleared existing database records.');

  // 2. Exactly ONE authorized Admin Account
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@pulseforge.gym';
  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'PulseForge Head Admin',
      role: 'ADMIN',
      clerkUserId: 'admin_pulseforge_clerk_master',
    },
  });
  console.log(`Created authorized Admin: ${adminUser.email} (Role: ADMIN)`);

  // 3. Seed Memberships
  const memberships = await Promise.all([
    prisma.membership.create({
      data: {
        name: 'Basic Starter',
        description: 'Standard access to gym floor and locker rooms during off-peak hours.',
        price: 1999,
        durationInDays: 30,
        features: 'Gym floor access, Locker facilities, Free initial assessment',
        status: 'ACTIVE',
      },
    }),
    prisma.membership.create({
      data: {
        name: 'Pro Strength & Cardio',
        description: 'Full 24/7 access to all equipment zones and weekend group classes.',
        price: 4999,
        durationInDays: 90,
        features: '24/7 Gym access, Group studio classes, Sauna access, Free guest pass monthly',
        status: 'ACTIVE',
      },
    }),
    prisma.membership.create({
      data: {
        name: 'Elite Annual Access',
        description: 'Comprehensive annual access with quarterly trainer evaluations and recovery suite.',
        price: 15999,
        durationInDays: 365,
        features: 'Unlimited all-zone access, 4 PT sessions/quarter, Steam & sauna, Nutrition plan, Priority locker',
        status: 'ACTIVE',
      },
    }),
    prisma.membership.create({
      data: {
        name: 'VIP Executive',
        description: 'Private locker, continuous dedicated trainer guidance, and recovery lounge.',
        price: 24999,
        durationInDays: 365,
        features: 'Dedicated personal trainer, Towel & laundry service, Recovery lounge, Protein shakes included',
        status: 'ACTIVE',
      },
    }),
  ]);
  console.log(`Created ${memberships.length} memberships.`);

  // 4. Seed Trainers (Users + Trainers)
  const trainerData = [
    {
      name: 'Marcus Vance',
      email: 'marcus.vance@pulseforge.gym',
      phone: '+91 98765 43210',
      specialization: 'Strength & Hypertrophy',
      experienceYears: 7,
      bio: 'CSCS certified trainer specializing in barbell mechanics, progressive overload, and athlete conditioning.',
      salaries: [
        { month: 'October 2026', amount: 45000, status: 'PENDING', paymentDate: null },
        { month: 'September 2026', amount: 45000, status: 'PAID', paymentDate: new Date('2026-09-30') },
        { month: 'August 2026', amount: 42000, status: 'PAID', paymentDate: new Date('2026-08-31') },
      ],
    },
    {
      name: 'Elena Rostova',
      email: 'elena.rostova@pulseforge.gym',
      phone: '+91 98765 43211',
      specialization: 'HIIT & Mobility',
      experienceYears: 5,
      bio: 'Former track athlete focusing on functional movement, metabolic conditioning, and joint resilience.',
      salaries: [
        { month: 'October 2026', amount: 40000, status: 'PENDING', paymentDate: null },
        { month: 'September 2026', amount: 40000, status: 'PAID', paymentDate: new Date('2026-09-30') },
        { month: 'August 2026', amount: 38000, status: 'PAID', paymentDate: new Date('2026-08-31') },
      ],
    },
    {
      name: 'Dev Sharma',
      email: 'dev.sharma@pulseforge.gym',
      phone: '+91 98765 43212',
      specialization: 'CrossFit & Olympic Lifting',
      experienceYears: 6,
      bio: 'CrossFit Level 2 Coach passionate about Olympic weightlifting precision and high-energy conditioning.',
      salaries: [
        { month: 'October 2026', amount: 42000, status: 'OVERDUE', paymentDate: null },
        { month: 'September 2026', amount: 42000, status: 'PAID', paymentDate: new Date('2026-09-29') },
      ],
    },
    {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@pulseforge.gym',
      phone: '+91 98765 43213',
      specialization: 'Body Composition & Nutrition',
      experienceYears: 4,
      bio: 'Certified Sports Nutritionist and physique coach dedicated to sustainable lifestyle transformations.',
      salaries: [
        { month: 'October 2026', amount: 38000, status: 'PAID', paymentDate: new Date('2026-10-01') },
        { month: 'September 2026', amount: 38000, status: 'PAID', paymentDate: new Date('2026-09-30') },
      ],
    },
  ];

  const trainers = [];
  for (const t of trainerData) {
    const user = await prisma.user.create({
      data: {
        email: t.email,
        name: t.name,
        role: 'TRAINER',
        clerkUserId: `clerk_trainer_${t.email.split('@')[0]}`,
      },
    });

    const trainer = await prisma.trainer.create({
      data: {
        userId: user.id,
        clerkUserId: user.clerkUserId,
        name: t.name,
        email: t.email,
        phone: t.phone,
        specialization: t.specialization,
        experienceYears: t.experienceYears,
        bio: t.bio,
        status: 'ACTIVE',
      },
    });

    // Seed salaries for this trainer
    for (const sal of t.salaries) {
      await prisma.trainerSalary.create({
        data: {
          trainerId: trainer.id,
          month: sal.month,
          amount: sal.amount,
          status: sal.status,
          paymentDate: sal.paymentDate,
          notes: `Monthly base stipend & client commission for ${sal.month}`,
        },
      });
    }

    trainers.push(trainer);
  }
  console.log(`Created ${trainers.length} trainers with salary records.`);

  // 5. Seed Members (Users + Members)
  const memberData = [
    {
      name: 'Alex Mercer',
      email: 'alex.mercer@gmail.com',
      phone: '+91 98111 22334',
      gender: 'Male',
      emergencyContact: '+91 98111 22335 (Father)',
      address: '42 Sector 14, Urban Estate',
      trainerIndex: 0, // Marcus Vance
      membershipIndex: 1, // Pro Strength & Cardio
      joinDate: new Date('2025-11-10'),
    },
    {
      name: 'Priya Patel',
      email: 'priya.patel@gmail.com',
      phone: '+91 98222 33445',
      gender: 'Female',
      emergencyContact: '+91 98222 33440 (Spouse)',
      address: 'Flat 304, Green Heights',
      trainerIndex: 1, // Elena Rostova
      membershipIndex: 2, // Elite Annual Access
      joinDate: new Date('2025-12-01'),
    },
    {
      name: 'Carlos Gomez',
      email: 'carlos.gomez@gmail.com',
      phone: '+91 98333 44556',
      gender: 'Male',
      emergencyContact: '+91 98333 44550 (Brother)',
      address: '12 Kensington Avenue',
      trainerIndex: 2, // Dev Sharma
      membershipIndex: 3, // VIP Executive
      joinDate: new Date('2026-01-15'),
    },
    {
      name: 'Maya Lin',
      email: 'maya.lin@gmail.com',
      phone: '+91 98444 55667',
      gender: 'Female',
      emergencyContact: '+91 98444 55660 (Mother)',
      address: '88 Lakeview Boulevard',
      trainerIndex: 3, // Sarah Jenkins
      membershipIndex: 0, // Basic Starter
      joinDate: new Date('2026-02-01'),
    },
    {
      name: 'David Kim',
      email: 'david.kim@gmail.com',
      phone: '+91 98555 66778',
      gender: 'Male',
      emergencyContact: '+91 98555 66770 (Sister)',
      address: '15 Downtown Cross',
      trainerIndex: 0, // Marcus Vance
      membershipIndex: 1, // Pro Strength & Cardio
      joinDate: new Date('2026-02-15'),
    },
    {
      name: 'Ananya Roy',
      email: 'ananya.roy@gmail.com',
      phone: '+91 98666 77889',
      gender: 'Female',
      emergencyContact: '+91 98666 77880 (Friend)',
      address: '77 Cyber Park Enclave',
      trainerIndex: 1, // Elena Rostova
      membershipIndex: 2, // Elite Annual
      joinDate: new Date('2026-03-01'),
    },
  ];

  const members = [];
  for (const m of memberData) {
    const user = await prisma.user.create({
      data: {
        email: m.email,
        name: m.name,
        role: 'MEMBER',
        clerkUserId: `clerk_member_${m.email.split('@')[0]}`,
      },
    });

    const member = await prisma.member.create({
      data: {
        userId: user.id,
        clerkUserId: user.clerkUserId,
        name: m.name,
        email: m.email,
        phone: m.phone,
        gender: m.gender,
        emergencyContact: m.emergencyContact,
        address: m.address,
        status: 'ACTIVE',
        trainerId: trainers[m.trainerIndex].id,
        membershipId: memberships[m.membershipIndex].id,
        joinDate: m.joinDate,
      },
    });
    members.push(member);
  }
  console.log(`Created ${members.length} members.`);

  // 6. Generate GitHub-style Heatmap Attendance for Members
  // For Alex Mercer and others: generate realistic check-in records over the last 120 days
  const now = new Date('2026-10-06T12:00:00Z');
  const attendanceRecords = [];

  for (let d = 120; d >= 0; d--) {
    const dayDate = new Date(now);
    dayDate.setDate(dayDate.getDate() - d);
    const dayOfWeek = dayDate.getDay(); // 0 is Sunday

    // Sunday gym is rest day for some, weekdays have high consistency
    if (dayOfWeek !== 0) {
      // Alex Mercer (Member 0): 85% attendance probability
      if (Math.random() < 0.85) {
        const checkIn = new Date(dayDate);
        checkIn.setHours(7 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 45), 0);
        const checkOut = new Date(checkIn);
        checkOut.setMinutes(checkIn.getMinutes() + 65 + Math.floor(Math.random() * 30));

        attendanceRecords.push({
          memberId: members[0].id,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          date: new Date(dayDate.setHours(0, 0, 0, 0)),
          status: 'PRESENT',
        });
      }

      // Priya Patel (Member 1): 70% attendance probability
      if (Math.random() < 0.7) {
        const checkIn = new Date(dayDate);
        checkIn.setHours(18, Math.floor(Math.random() * 40), 0);
        const checkOut = new Date(checkIn);
        checkOut.setMinutes(checkIn.getMinutes() + 55);

        attendanceRecords.push({
          memberId: members[1].id,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          date: new Date(dayDate.setHours(0, 0, 0, 0)),
          status: 'PRESENT',
        });
      }

      // Carlos Gomez (Member 2): 60% attendance probability
      if (Math.random() < 0.6) {
        const checkIn = new Date(dayDate);
        checkIn.setHours(8, Math.floor(Math.random() * 30), 0);
        const checkOut = new Date(checkIn);
        checkOut.setMinutes(checkIn.getMinutes() + 70);

        attendanceRecords.push({
          memberId: members[2].id,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          date: new Date(dayDate.setHours(0, 0, 0, 0)),
          status: 'PRESENT',
        });
      }
    }
  }

  await prisma.attendance.createMany({
    data: attendanceRecords,
  });
  console.log(`Created ${attendanceRecords.length} attendance records across the last 120 days.`);

  // 7. Seed Workouts and Workout Splits (PPL, Upper/Lower)
  // Workout 1: Assigned to Alex Mercer by Marcus Vance (Push Pull Legs Split)
  const alexWorkoutPPL = await prisma.workout.create({
    data: {
      title: 'PPL Hypertrophy Split (Push / Pull / Legs)',
      splitType: 'PUSH',
      description: 'Systematic 3-day split designed for lean muscular development and overhead pressing stability.',
      targetGoal: 'Hypertrophy & Strength',
      difficultyLevel: 'INTERMEDIATE',
      memberId: members[0].id,
      trainerId: trainers[0].id,
    },
  });

  const exercisesData = [
    {
      workoutId: alexWorkoutPPL.id,
      exerciseName: 'Barbell Flat Bench Press',
      sets: 4,
      reps: '8-10',
      weight: '75 kg',
      restSeconds: 90,
      dayOfWeek: 'Day 1 - Push',
      notes: 'Control the descent for 2 seconds. Drive evenly through feet.',
    },
    {
      workoutId: alexWorkoutPPL.id,
      exerciseName: 'Incline Dumbbell Press',
      sets: 3,
      reps: '10-12',
      weight: '26 kg / hand',
      restSeconds: 75,
      dayOfWeek: 'Day 1 - Push',
      notes: 'Set bench to 30 degrees. Focus on upper chest squeeze.',
    },
    {
      workoutId: alexWorkoutPPL.id,
      exerciseName: 'Overhead Barbell Military Press',
      sets: 3,
      reps: '8',
      weight: '45 kg',
      restSeconds: 90,
      dayOfWeek: 'Day 1 - Push',
      notes: 'Keep glutes and core fully braced. Avoid excessive lumbar arching.',
    },
    {
      workoutId: alexWorkoutPPL.id,
      exerciseName: 'Cable Triceps Rope Pushdown',
      sets: 3,
      reps: '12-15',
      weight: '25 kg',
      restSeconds: 60,
      dayOfWeek: 'Day 1 - Push',
      notes: 'Pin elbows to ribs and flare rope apart at bottom.',
    },
    {
      workoutId: alexWorkoutPPL.id,
      exerciseName: 'Deadlift (Conventional)',
      sets: 4,
      reps: '6-8',
      weight: '120 kg',
      restSeconds: 120,
      dayOfWeek: 'Day 2 - Pull',
      notes: 'Brace lats, push floor away, maintain neutral spinal column.',
    },
    {
      workoutId: alexWorkoutPPL.id,
      exerciseName: 'Lat Pulldown (Wide Grip)',
      sets: 3,
      reps: '10-12',
      weight: '60 kg',
      restSeconds: 75,
      dayOfWeek: 'Day 2 - Pull',
      notes: 'Pull towards upper clavicle. Retract scapulae consciously.',
    },
    {
      workoutId: alexWorkoutPPL.id,
      exerciseName: 'Chest-Supported Row',
      sets: 3,
      reps: '10-12',
      weight: '50 kg',
      restSeconds: 75,
      dayOfWeek: 'Day 2 - Pull',
      notes: 'Isolate rhomboids without swinging torso.',
    },
    {
      workoutId: alexWorkoutPPL.id,
      exerciseName: 'Incline Dumbbell Bicep Curl',
      sets: 3,
      reps: '12',
      weight: '14 kg / hand',
      restSeconds: 60,
      dayOfWeek: 'Day 2 - Pull',
      notes: 'Full bicep stretch at bottom position with supination.',
    },
    {
      workoutId: alexWorkoutPPL.id,
      exerciseName: 'Barbell Back Squat',
      sets: 4,
      reps: '8-10',
      weight: '90 kg',
      restSeconds: 120,
      dayOfWeek: 'Day 3 - Legs',
      notes: 'Descend to parallel, knees track in line with 2nd toe.',
    },
    {
      workoutId: alexWorkoutPPL.id,
      exerciseName: 'Romanian Deadlift (RDL)',
      sets: 3,
      reps: '10-12',
      weight: '70 kg',
      restSeconds: 90,
      dayOfWeek: 'Day 3 - Legs',
      notes: 'Hips back, feel hamstring stretch, maintain flat spine.',
    },
    {
      workoutId: alexWorkoutPPL.id,
      exerciseName: 'Standing Calf Raise',
      sets: 4,
      reps: '15',
      weight: '50 kg',
      restSeconds: 45,
      dayOfWeek: 'Day 3 - Legs',
      notes: 'Hold at peak for 1 second, full stretch at floor level.',
    },
  ];

  const createdExercises = [];
  for (const ex of exercisesData) {
    const createdEx = await prisma.workoutExercise.create({ data: ex });
    createdExercises.push(createdEx);
  }

  // Assign workout to Alex Mercer
  await prisma.workoutAssignment.create({
    data: {
      workoutId: alexWorkoutPPL.id,
      memberId: members[0].id,
      assignedByTrainerId: trainers[0].id,
      status: 'ACTIVE',
    },
  });

  // Add recent workout completions for Alex Mercer
  for (let i = 0; i < 4; i++) {
    await prisma.workoutCompletion.create({
      data: {
        workoutId: alexWorkoutPPL.id,
        exerciseId: createdExercises[i].id,
        memberId: members[0].id,
        durationMinutes: 50,
        completedDate: new Date(Date.now() - i * 86400000 * 2),
        notes: `Completed all target sets smoothly with solid form.`,
      },
    });
  }

  // Priya's Workout (Functional & HIIT by Elena)
  const priyaWorkout = await prisma.workout.create({
    data: {
      title: 'Athletic Conditioning & Core',
      splitType: 'FULL_BODY',
      description: 'Functional high-intensity routine designed for cardiovascular efficiency and mobility.',
      targetGoal: 'Endurance & Mobility',
      difficultyLevel: 'ADVANCED',
      memberId: members[1].id,
      trainerId: trainers[1].id,
    },
  });

  await prisma.workoutExercise.create({
    data: {
      workoutId: priyaWorkout.id,
      exerciseName: 'Kettlebell Swings',
      sets: 4,
      reps: '20',
      weight: '16 kg',
      restSeconds: 45,
      dayOfWeek: 'Day 1 - Conditioning',
      notes: 'Explosive hip snap, maintain active lats.',
    },
  });

  await prisma.workoutAssignment.create({
    data: {
      workoutId: priyaWorkout.id,
      memberId: members[1].id,
      assignedByTrainerId: trainers[1].id,
      status: 'ACTIVE',
    },
  });

  // 8. Seed Payments
  const paymentsData = [
    {
      memberId: members[0].id,
      membershipId: memberships[1].id,
      amount: 4999,
      paymentMethod: 'UPI / GPay',
      status: 'COMPLETED',
      invoiceNumber: 'INV-2026-001',
      paymentDate: new Date('2026-08-10'),
      notes: 'Quarterly Pro Membership Renewal',
    },
    {
      memberId: members[1].id,
      membershipId: memberships[2].id,
      amount: 15999,
      paymentMethod: 'Credit Card',
      status: 'COMPLETED',
      invoiceNumber: 'INV-2026-002',
      paymentDate: new Date('2026-09-01'),
      notes: 'Annual Elite Membership',
    },
    {
      memberId: members[2].id,
      membershipId: memberships[3].id,
      amount: 24999,
      paymentMethod: 'Net Banking',
      status: 'COMPLETED',
      invoiceNumber: 'INV-2026-003',
      paymentDate: new Date('2026-09-15'),
      notes: 'VIP Executive Annual Plan',
    },
    {
      memberId: members[3].id,
      membershipId: memberships[0].id,
      amount: 1999,
      paymentMethod: 'Cash',
      status: 'COMPLETED',
      invoiceNumber: 'INV-2026-004',
      paymentDate: new Date('2026-09-20'),
      notes: 'Monthly Starter Pass',
    },
    {
      memberId: members[4].id,
      membershipId: memberships[1].id,
      amount: 4999,
      paymentMethod: 'UPI',
      status: 'PENDING',
      invoiceNumber: 'INV-2026-005',
      paymentDate: new Date('2026-10-02'),
      notes: 'Pending Membership Renewal',
    },
  ];

  for (const p of paymentsData) {
    await prisma.payment.create({ data: p });
  }
  console.log(`Created ${paymentsData.length} payments.`);

  // 9. Seed Nutrition Logs for Member Alex Mercer
  const nutritionLogs = [
    {
      memberId: members[0].id,
      mealType: 'BREAKFAST',
      foodName: 'Rolled Oats with Whey Protein, Almond Milk & Chia Seeds',
      calories: 480,
      protein: 36,
      carbs: 58,
      fats: 11,
      date: new Date(),
    },
    {
      memberId: members[0].id,
      mealType: 'LUNCH',
      foodName: 'Grilled Herb Chicken Breast with Brown Basmati Rice & Steamed Broccoli',
      calories: 650,
      protein: 52,
      carbs: 68,
      fats: 14,
      date: new Date(),
    },
    {
      memberId: members[0].id,
      mealType: 'SNACK',
      foodName: 'Low-Fat Greek Yogurt with Mixed Berries & Raw Honey',
      calories: 220,
      protein: 18,
      carbs: 26,
      fats: 4,
      date: new Date(),
    },
    {
      memberId: members[0].id,
      mealType: 'DINNER',
      foodName: 'Baked Salmon Fillet with Quinoa Bowl & Roasted Asparagus',
      calories: 580,
      protein: 44,
      carbs: 45,
      fats: 19,
      date: new Date(),
    },
  ];

  for (const n of nutritionLogs) {
    await prisma.nutritionLog.create({ data: n });
  }
  console.log(`Created ${nutritionLogs.length} nutrition logs.`);

  // 10. Seed Equipment Fleet
  const equipmentFleet = [
    { name: 'Olympic Barbell & Bumper Plate Set (300kg)', category: 'Free Weights', quantity: 6, condition: 'EXCELLENT', status: 'AVAILABLE', location: 'Zone A - Heavy Lifting Platform', cost: 125000 },
    { name: 'Commercial Squat Power Rack with Safety Spotters', category: 'Strength Racks', quantity: 4, condition: 'EXCELLENT', status: 'AVAILABLE', location: 'Zone A - Platform 1-4', cost: 180000 },
    { name: 'Matrix Commercial Incline Treadmill T70', category: 'Cardio', quantity: 8, condition: 'GOOD', status: 'AVAILABLE', location: 'Zone B - Cardio Deck', cost: 420000 },
    { name: 'Concept2 Model D Indoor Rower', category: 'Cardio', quantity: 4, condition: 'EXCELLENT', status: 'AVAILABLE', location: 'Zone B - Row Zone', cost: 110000 },
    { name: 'Cable Dual Adjustable Pulley Functional Trainer', category: 'Cables', quantity: 2, condition: 'NEEDS_SERVICE', status: 'UNDER_MAINTENANCE', location: 'Zone C - Functional Core', cost: 240000 },
    { name: 'Leg Press 45-Degree Heavy Duty Station', category: 'Machine Strength', quantity: 2, condition: 'EXCELLENT', status: 'AVAILABLE', location: 'Zone A - Leg Bay', cost: 160000 },
    { name: 'Dumbbell Rack Pairs (2.5kg to 50kg Hex Set)', category: 'Free Weights', quantity: 2, condition: 'EXCELLENT', status: 'AVAILABLE', location: 'Zone A - Dumbbell Row', cost: 95000 },
  ];

  for (const eq of equipmentFleet) {
    await prisma.equipment.create({ data: eq });
  }
  console.log(`Created ${equipmentFleet.length} gym equipment assets.`);

  console.log('\n--- PulseForge Gym RBAC Database Seeding Completed Successfully ---');
  console.log('1. Admin: admin@pulseforge.gym (Single authorized admin)');
  console.log('2. Trainers: marcus.vance@pulseforge.gym, elena.rostova@pulseforge.gym, dev.sharma@pulseforge.gym, sarah.jenkins@pulseforge.gym');
  console.log('3. Members: alex.mercer@gmail.com, priya.patel@gmail.com, carlos.gomez@gmail.com, etc.');
}

main()
  .catch((e) => {
    console.error('Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
