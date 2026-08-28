/**
 * ==============================================================================
 * Global Authentication Context
 * ==============================================================================
 * Provides application-wide authentication state, user profile metadata,
 * modal triggers, and automatic detection of email verification callbacks.
 * ==============================================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';
import * as profileService from '../services/profileService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal UI State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'signup'

  // Verification Banner/Toast State
  const [verificationNotice, setVerificationNotice] = useState(null);

  /**
   * Fetches profile record for the given user ID
   */
  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { profile: userProfile } = await profileService.getProfile(userId);
    if (userProfile) {
      setProfile(userProfile);
    }
  }, []);

  /**
   * Checks for verification parameters in URL upon email link click
   */
  const checkEmailVerificationCallback = useCallback(() => {
    const hash = window.location.hash;
    const search = window.location.search;

    const isVerified = 
      hash.includes('verified=true') || 
      search.includes('verified=true') || 
      hash.includes('type=signup') ||
      hash.includes('type=recovery');

    if (isVerified) {
      setVerificationNotice({
        type: 'success',
        title: 'Email Verified Successfully!',
        message: 'Your account has been verified. You can now log in to continue.',
      });
      setAuthModalMode('login');
      setIsAuthModalOpen(true);

      // Clean the URL hash/query quietly
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  // Initialize Session on Mount
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { session: initialSession } = await authService.getSession();
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user || null);
          if (initialSession?.user) {
            await loadProfile(initialSession.user.id);
          }
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
      } finally {
        if (mounted) {
          setLoading(false);
          checkEmailVerificationCallback();
        }
      }
    }

    initAuth();

    // Subscribe to Auth State Changes
    const { data: authListener } = authService.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user || null);

      if (event === 'SIGNED_IN' && newSession?.user) {
        await loadProfile(newSession.user.id);
        setIsAuthModalOpen(false);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      } else if (event === 'USER_UPDATED' && newSession?.user) {
        await loadProfile(newSession.user.id);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [loadProfile, checkEmailVerificationCallback]);

  /**
   * Opens the Auth Modal in 'login' mode
   */
  const openLogin = useCallback(() => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  }, []);

  /**
   * Opens the Auth Modal in 'signup' mode
   */
  const openSignUp = useCallback(() => {
    setAuthModalMode('signup');
    setIsAuthModalOpen(true);
  }, []);

  /**
   * Closes the Auth Modal
   */
  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  /**
   * Log out helper
   */
  const handleSignOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  const value = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    isAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    openLogin,
    openSignUp,
    closeAuthModal,
    signOut: handleSignOut,
    verificationNotice,
    clearVerificationNotice: () => setVerificationNotice(null),
    refreshProfile: () => user && loadProfile(user.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
