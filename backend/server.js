require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize Clerk Express middleware when keys are present
const CLERK_SECRET = process.env.CLERK_SECRET_KEY || '';
const CLERK_PUB = process.env.CLERK_PUBLISHABLE_KEY || '';
const hasValidClerkKeys =
  CLERK_SECRET &&
  CLERK_PUB &&
  !CLERK_SECRET.includes('placeholder') &&
  !CLERK_PUB.includes('placeholder') &&
  CLERK_PUB.startsWith('pk_');

if (hasValidClerkKeys) {
  try {
    const { clerkMiddleware } = require('@clerk/express');
    app.use(clerkMiddleware());
    console.log('Clerk authentication middleware initialized.');
  } catch (clerkErr) {
    console.warn('Clerk middleware skipped:', clerkErr.message);
  }
} else {
  console.log('Running in Demo Auth Mode (role-based header authentication).');
}

// System Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'PulseForge Smart Gym Management API',
    database: 'PostgreSQL via Prisma ORM (Neon Serverless)',
    authMode: hasValidClerkKeys ? 'Clerk JWT + PostgreSQL RBAC' : 'Demo Role Headers',
    version: '2.0.0',
  });
});

// Mount modular REST API routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

// Catch 404 & Centralized Error Handler
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`PulseForge Backend running on http://localhost:${PORT}`);
  console.log(`Database: Neon PostgreSQL via Prisma ORM`);
  console.log(`RBAC: Admin, Trainer, Member`);
  console.log(`AI: Groq API (Llama 3.3 70B)`);
});
