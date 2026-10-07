import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Trainers from './pages/Trainers';
import Memberships from './pages/Memberships';
import Attendance from './pages/Attendance';
import Payments from './pages/Payments';
import Workouts from './pages/Workouts';
import Equipment from './pages/Equipment';
import AIAssistant from './pages/AIAssistant';
import Profile from './pages/Profile';
import RoleSelection from './pages/RoleSelection';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

/**
 * Protects dashboard routes — requires Clerk sign-in.
 * If user is brand-new and needs role setup, redirect to /setup-role.
 */
function ProtectedRoute({ children }) {
  const { needsRoleSetup, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          <p className="text-sm text-slate-500 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SignedIn>
        {/* Redirect new users to role selection before accessing dashboard */}
        {needsRoleSetup ? <Navigate to="/setup-role" replace /> : children}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function AppRoutes() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<Home />} />

          {/* Role Selection — shown once after first Google/Clerk login */}
          <Route
            path="/setup-role"
            element={
              <>
                <SignedIn>
                  <RoleSelection />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          {/* Protected Dashboard Shell */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/trainers" element={<Trainers />} />
            <Route path="/memberships" element={<Memberships />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default function App() {
  if (!CLERK_KEY) {
    return <div className="p-10 text-center">Clerk Publishable Key is missing in .env</div>;
  }

  return (
    <ClerkProvider publishableKey={CLERK_KEY} fallbackRedirectUrl="/dashboard">
      <AppRoutes />
    </ClerkProvider>
  );
}
