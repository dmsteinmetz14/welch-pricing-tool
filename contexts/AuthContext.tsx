'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
  type Auth,
  type User
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebaseClient';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  allowedEmails: string[];
  canAccessRestricted: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);

  const allowedEmails = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_ALLOWED_GOOGLE_EMAILS || '';
    return raw
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      const instance = getFirebaseAuth();
      setAuthInstance(instance);
      void setPersistence(instance, browserLocalPersistence).catch((persistenceError) => {
        console.error('Failed to set auth persistence', persistenceError);
      });
      unsubscribe = onAuthStateChanged(
        instance,
        (nextUser) => {
          setUser(nextUser);
          setLoading(false);
        },
        (listenerError) => {
          console.error('Auth listener error', listenerError);
          setError(listenerError instanceof Error ? listenerError.message : 'Unable to verify authentication');
          setLoading(false);
        }
      );
    } catch (initializationError) {
      console.error('Failed to initialize Firebase auth', initializationError);
      setError(initializationError instanceof Error ? initializationError.message : 'Authentication is not configured correctly');
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const canAccessRestricted =
    !!user &&
    (allowedEmails.length === 0 || (user.email ? allowedEmails.includes(user.email.toLowerCase()) : false));

  const handleGoogleSignIn = useCallback(async () => {
    if (!authInstance) {
      const unavailableMessage = error || 'Authentication is not available. Verify your Firebase configuration.';
      setError(unavailableMessage);
      throw new Error(unavailableMessage);
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      setError(null);
      await signInWithPopup(authInstance, provider);
    } catch (signInError) {
      console.error('Google sign-in failed', signInError);
      const message =
        signInError instanceof Error ? signInError.message : 'Unable to sign in with Google at the moment.';
      setError(message);
      throw signInError;
    }
  }, [authInstance, error]);

  const handleSignOut = useCallback(async () => {
    if (!authInstance) {
      return;
    }
    try {
      await signOut(authInstance);
    } catch (signOutError) {
      console.error('Sign out failed', signOutError);
    }
  }, [authInstance]);

  const value: AuthContextValue = {
    user,
    loading,
    error,
    allowedEmails,
    canAccessRestricted,
    signInWithGoogle: handleGoogleSignIn,
    signOut: handleSignOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
