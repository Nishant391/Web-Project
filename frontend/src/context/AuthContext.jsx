import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { authApi, setClerkTokenGetter } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const [role, setRole] = useState(() => localStorage.getItem('pulseforge_active_role') || 'ADMIN');
  const [dbUser, setDbUser] = useState(null);
  const [needsRoleSetup, setNeedsRoleSetup] = useState(false);
  const [clerkUserInfo, setClerkUserInfo] = useState(null); // for role selection page
  const [loading, setLoading] = useState(true);

  // Inject Clerk's getToken into the axios interceptor as soon as it's available
  useEffect(() => {
    setClerkTokenGetter(isSignedIn ? getToken : null);
  }, [isSignedIn, getToken]);

  // Sync user role and profile from PostgreSQL backend on every auth state change
  const syncUserFromBackend = useCallback(async () => {
    if (!isSignedIn) {
      setRole('MEMBER');
      setDbUser(null);
      setNeedsRoleSetup(false);
      setClerkUserInfo(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await authApi.getMe();

      if (res.needsRoleSetup) {
        // Brand new user — show role selection screen
        setNeedsRoleSetup(true);
        setClerkUserInfo(res.clerkUser);
        setDbUser(null);
      } else if (res.success && res.data) {
        setNeedsRoleSetup(false);
        setClerkUserInfo(null);
        setDbUser(res.data);
        const savedRole = localStorage.getItem('pulseforge_active_role');
        const activeRole = savedRole || res.data.role || 'ADMIN';
        setRole(activeRole);
        localStorage.setItem('pulseforge_active_role', activeRole);
      }
    } catch (err) {
      console.warn('Backend profile sync failed:', err.message);
      if (clerkUser?.publicMetadata?.role) {
        setRole(String(clerkUser.publicMetadata.role).toUpperCase());
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, clerkUser]);

  useEffect(() => {
    if (isLoaded) {
      syncUserFromBackend();
    }
  }, [isLoaded, isSignedIn, syncUserFromBackend]);

  // Function to dynamically switch role at any time
  const switchRole = async (targetRole) => {
    try {
      setLoading(true);
      localStorage.setItem('pulseforge_active_role', targetRole);
      setRole(targetRole);

      const res = await authApi.switchRole(targetRole);
      if (res.success && res.data) {
        setRole(res.data.role);
        setDbUser((prev) => ({ ...prev, ...res.data }));
        localStorage.setItem('pulseforge_active_role', res.data.role);
        return res.data;
      }
    } catch (err) {
      console.error('Failed to switch role:', err);
      try {
        await syncUserFromBackend();
      } catch (_) {}
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const currentUser = {
    id: dbUser?.id || clerkUser?.id || null,
    name: dbUser?.name || clerkUser?.fullName || clerkUser?.firstName || 'User',
    email: dbUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || '',
    imageUrl: clerkUser?.imageUrl,
    role,
    memberId: dbUser?.memberId || null,
    trainerId: dbUser?.trainerId || null,
    member: dbUser?.member || null,
    trainer: dbUser?.trainer || null,
  };

  const effectiveClerkInfo = clerkUserInfo || {
    name: clerkUser?.fullName || clerkUser?.firstName || dbUser?.name || 'User',
    email: clerkUser?.primaryEmailAddress?.emailAddress || dbUser?.email || '',
  };

  const value = {
    role,
    user: currentUser,
    isAdmin: role === 'ADMIN',
    isTrainer: role === 'TRAINER',
    isMember: role === 'MEMBER',
    dbProfile: dbUser,
    needsRoleSetup,
    setNeedsRoleSetup,
    clerkUserInfo: effectiveClerkInfo,
    syncUserFromBackend,
    switchRole,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
