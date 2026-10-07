import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { authApi, setClerkTokenGetter } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const [role, setRole] = useState('MEMBER');
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
        setRole(res.data.role || 'MEMBER');
      }
    } catch (err) {
      console.warn('Backend profile sync failed:', err.message);
      // Fallback: read role from Clerk public metadata if set
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

  const value = {
    role,
    user: currentUser,
    isAdmin: role === 'ADMIN',
    isTrainer: role === 'TRAINER',
    isMember: role === 'MEMBER',
    dbProfile: dbUser,
    needsRoleSetup,
    clerkUserInfo,
    syncUserFromBackend,
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
