# PulseForge: Smart AI-Powered Gym Management System

A modern, production-grade, full-stack **Smart Gym Operations & AI Wellness Platform** developed as an MCA-level project. Built using the modern MERN-style architecture but modernized with **PostgreSQL & Prisma ORM** instead of MongoDB & Mongoose, paired with **Clerk Authentication** and **Groq Cloud AI**.

---

## 1. Project Overview

PulseForge delivers an end-to-end gym operations ecosystem featuring role-based workflows for **Admins, Trainers, and Members**. It streamlines member enrollment, coach assignments, recurring membership tier billing, turnstile attendance tracking, progressive workout design, equipment maintenance tracking, and real-time financial dashboards.

Additionally, PulseForge integrates an AI coaching and operations suite powered strictly through a secure backend service connected to the **Groq API (Llama 3.3 70B)** for:
- **AI Workout Generator**: Creates personalized multi-day training splits.
- **AI Meal Planner**: Structures calorie-targeted macronutrient distributions and daily meal ideas.
- **AI Fitness Assistant**: Conversational engine answering exercise mechanics, recovery protocols, and retention strategies.

> **Wellness Disclaimer**: All AI-generated advice provides general fitness and wellness educational guidance only and does not constitute medical advice or clinical diagnosis.

---

## 2. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend UI** | React 19, Vite, Tailwind CSS, shadcn/ui styling conventions, Framer Motion |
| **Icons & Charts** | Lucide React (clean SVG icons, **zero emojis**), Recharts |
| **Routing & HTTP** | React Router v7, Axios (centralized `api.js` with role injection) |
| **Authentication** | Clerk Auth (`@clerk/express` + `@clerk/clerk-react`) |
| **Backend API** | Node.js, Express.js (Clean MVC Architecture) |
| **Database** | PostgreSQL (Neon Cloud / Local) |
| **ORM** | Prisma ORM 6.4 (Schema modeling, migrations, client generation, relational queries) |
| **Artificial Intelligence** | Groq Cloud SDK (`groq-sdk`, Llama 3.3 70B Versatile) |

---

## 3. Core Role Capabilities

### Administrator (Admin)
- **Executive Dashboard**: Live revenue metrics, floor occupancy, membership retention health, and Recharts financial area and weekly check-in bar charts.
- **Member Directory**: Complete CRUD operations, multi-parameter search, status filtering, trainer assignment, and membership linking.
- **Trainer Management**: Register coaches, assign athletes, track specializations and experience.
- **Membership Tiers**: Configure subscription packages, prices, duration terms, and amenity features.
- **Turnstile Attendance**: Live turnstile check-in terminal and floor occupancy counters.
- **Invoicing & Payments**: Process membership dues across UPI, Cards, Net Banking, and Cash; automatic tax receipt generation.
- **Equipment Fleet**: Track condition status (`EXCELLENT`, `GOOD`, `NEEDS_SERVICE`, `OUT_OF_ORDER`), floor locations, and maintenance inspection schedules.
- **AI Wellness Suite**: Full access to workout generators, meal planners, and conversational engine.

### Fitness Coach (Trainer)
- **Assigned Athletes**: View and monitor members assigned to your coaching roster.
- **Workout Routine Designer**: Build structured exercise splits with customized sets, reps, weight targets, rest periods, and biomechanical cues.
- **Floor Attendance**: Monitor check-in activity and verify workout consistency.
- **AI Assistant**: Consult Groq AI for specialized periodization schedules.

### Gym Member (Athlete)
- **Personal Dashboard**: Track active membership tier, duration countdown, and assigned personal trainer.
- **Assigned Workouts**: Access personalized routines programmed by trainers.
- **Turnstile History**: View personal check-in logs and training frequency.
- **Billing Receipts**: View payment invoices and transaction dates.
- **AI Wellness Studio**: Generate wellness routines and wholesome meal ideas.

---

## 4. Project Folder Structure

```text
smart-gym-management/
├── backend/
│   ├── config/
│   │   └── prisma.js             # Singleton Prisma Client instance
│   ├── controllers/              # Business logic controllers
│   │   ├── aiController.js       # AI endpoints controller
│   │   ├── attendanceController.js
│   │   ├── dashboardController.js# KPI aggregations & Recharts data
│   │   ├── equipmentController.js
│   │   ├── memberController.js   # Full Member CRUD
│   │   ├── membershipController.js
│   │   ├── paymentController.js
│   │   ├── trainerController.js
│   │   └── workoutController.js
│   ├── middleware/
│   │   ├── clerkAuth.js          # Clerk auth & demo viva role switcher
│   │   └── errorMiddleware.js    # Centralized Express error handler
│   ├── prisma/
│   │   ├── schema.prisma         # Central relational PostgreSQL schema
│   │   └── seed.js               # Database seed script
│   ├── routes/                   # Modular REST routes
│   │   ├── aiRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── equipmentRoutes.js
│   │   ├── memberRoutes.js
│   │   ├── membershipRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── trainerRoutes.js
│   │   └── workoutRoutes.js
│   ├── services/
│   │   └── groqService.js        # Groq Cloud API service with fallback
│   ├── .env                      # Local backend environment variables
│   ├── .env.example              # Template environment variables
│   ├── package.json
│   └── server.js                 # Main Express server entrypoint
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Reusable UI components
│   │   │   │   ├── Badge.jsx     # Status badges (zero emojis)
│   │   │   │   ├── ConfirmDialog.jsx
│   │   │   │   ├── EmptyState.jsx
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   ├── Modal.jsx     # Framer Motion accessible dialog
│   │   │   │   └── StatCard.jsx  # Metric cards with Lucide icons
│   │   │   ├── layout/
│   │   │   │   ├── DashboardLayout.jsx
│   │   │   │   ├── Navbar.jsx    # Top bar with Role Switcher
│   │   │   │   ├── PageHeader.jsx
│   │   │   │   └── Sidebar.jsx   # Role-aware navigation
│   │   │   └── ui/
│   │   │       └── Button.jsx    # Variants: default, outline, danger, ghost
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Role state management (Admin/Trainer/Member)
│   │   ├── pages/
│   │   │   ├── AIAssistant.jsx   # Workout Gen, Meal Planner, Chat
│   │   │   ├── Attendance.jsx    # Check-in terminal & floor count
│   │   │   ├── Dashboard.jsx     # Recharts visual analytics & KPIs
│   │   │   ├── Equipment.jsx     # Fleet & maintenance logs
│   │   │   ├── Home.jsx          # Public landing presentation
│   │   │   ├── Members.jsx       # Member directory table & modals
│   │   │   ├── Memberships.jsx   # Pricing tier packages
│   │   │   ├── Payments.jsx      # Invoices & collection receipts
│   │   │   ├── Profile.jsx       # Account & MCA technical blueprint
│   │   │   ├── Trainers.jsx      # Coach roster & assigned athletes
│   │   │   └── Workouts.jsx      # Multi-exercise routine builder
│   │   ├── services/
│   │   │   └── api.js            # Centralized Axios client
│   │   ├── App.jsx               # React Router routes
│   │   ├── index.css             # Plus Jakarta Sans & Tailwind tokens
│   │   └── main.jsx
│   ├── .env                      # Local frontend environment variables
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

---

## 5. Relational Database Schema (Prisma)

The application uses PostgreSQL with relational integrity:
- **`Member`**: Primary table holding athlete identity, linked via foreign keys to `Trainer` (`trainerId`) and `Membership` (`membershipId`).
- **`Trainer`**: Certified coaches with specializations and assigned members.
- **`Membership`**: Subscription plans with duration, pricing, and feature sets.
- **`Attendance`**: Floor check-in and checkout timestamps linked to `Member` via cascade delete.
- **`Payment`**: Financial transaction records with unique invoice numbers (`INV-YYYY-XXXX`).
- **`Workout`**: Program routine belonging to a member and trainer.
- **`WorkoutExercise`**: Individual exercise rows within a workout (sets, reps, target weights, rest intervals, technique cues).
- **`Equipment`**: Fitness machinery, category, physical condition, and service cycle dates.

---

## 6. Installation & Quickstart

### Prerequisites
- Node.js (v18+ or v20+)
- PostgreSQL database (or free [Neon Cloud Postgres](https://neon.tech))
- Clerk account ([clerk.com](https://clerk.com))
- Groq Cloud API key ([console.groq.com](https://console.groq.com))

---

### Step 1: Clone Repository & Install Dependencies

```bash
# Clone repository
git clone https://github.com/your-username/smart-gym-management.git
cd smart-gym-management

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2: Environment Variables Setup

#### Backend `.env` (`backend/.env`)
```env
PORT=5000
DATABASE_URL="postgresql://username:password@ep-host.region.neon.tech/neondb?sslmode=require"
CLERK_SECRET_KEY="sk_test_your_clerk_secret_key"
GROQ_API_KEY="gsk_your_groq_api_key_here"
CLIENT_URL="http://localhost:5173"
```

#### Frontend `.env` (`frontend/.env`)
```env
VITE_API_URL="http://localhost:5000/api"
VITE_CLERK_PUBLISHABLE_KEY="pk_test_your_clerk_publishable_key"
```

---

### Step 3: Database Migration & Realistic Seeding

Run the following commands inside the `backend` folder:

```bash
cd backend

# Sync Prisma Schema with PostgreSQL database
npx prisma db push

# Generate fresh Prisma Client
npx prisma generate

# Populate database with realistic demo members, trainers, plans, equipment, and workouts
node prisma/seed.js
```

---

### Step 4: Run Application Locally

Open two terminal windows:

#### Terminal 1: Start Express Backend
```bash
cd backend
npm start
# Output: PulseForge Backend running on http://localhost:5000
```

#### Terminal 2: Start Vite Frontend
```bash
cd frontend
npm run dev
# Output: Local: http://localhost:5173/
```

Navigate to `http://localhost:5173` in your web browser.

---

## 7. REST API Overview

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | System health & DB connection check | Public |
| `GET` | `/api/dashboard/stats` | KPIs, charts, and activity feeds | Authenticated |
| `GET` | `/api/members` | List members with search & status filters | Authenticated |
| `POST` | `/api/members` | Enroll a new member | Admin, Trainer |
| `PUT` | `/api/members/:id` | Update member profile | Admin, Trainer |
| `DELETE` | `/api/members/:id` | Delete member account | Admin |
| `GET` | `/api/trainers` | List all certified trainers | Authenticated |
| `POST` | `/api/trainers` | Register a new trainer | Admin |
| `GET` | `/api/memberships` | List all membership tiers | Authenticated |
| `POST` | `/api/memberships` | Create a membership plan | Admin |
| `GET` | `/api/attendance` | Attendance check-in history | Authenticated |
| `POST` | `/api/attendance/check-in` | Record member turnstile check-in | Authenticated |
| `POST` | `/api/attendance/check-out` | Record checkout timestamp | Authenticated |
| `GET` | `/api/payments` | List payment invoices & status | Authenticated |
| `POST` | `/api/payments` | Record new transaction receipt | Admin, Trainer |
| `GET` | `/api/workouts` | List workout routines with exercises | Authenticated |
| `POST` | `/api/workouts` | Create workout routine | Admin, Trainer |
| `GET` | `/api/equipment` | List equipment fleet & condition | Authenticated |
| `POST` | `/api/equipment` | Register equipment asset | Admin |
| `POST` | `/api/ai/workout` | Generate AI workout routine (Groq) | Authenticated |
| `POST` | `/api/ai/meal-plan` | Generate AI meal plan (Groq) | Authenticated |
| `POST` | `/api/ai/assistant` | Conversational fitness Q&A (Groq) | Authenticated |

---

## 8. Presentation & Viva Questions Guide

1. **Why use PostgreSQL and Prisma instead of MongoDB and Mongoose?**
   - Gym management is inherently relational: a member belongs to a trainer, purchases a specific membership, logs attendance records, and has invoice payments. PostgreSQL enforces foreign key referential integrity and prevents orphaned records. Prisma provides type-safe queries and automatic migrations.

2. **How is the AI kept secure?**
   - The Groq API key is strictly stored in backend environment variables and is **never** sent to the client browser. Frontend requests route to `/api/ai/...`, which executes through `groqService.js` on the server.

3. **How does the role switcher work during the viva?**
   - The navigation bar includes a 1-click Role Selector (`ADMIN`, `TRAINER`, `MEMBER`). When clicked, it updates `AuthContext` and automatically injects the corresponding role header via the centralized Axios client (`api.js`), allowing the examiner to see live permission restrictions instantaneously.

---

## 9. License

This project is licensed under the MIT License for educational and academic presentation purposes.
