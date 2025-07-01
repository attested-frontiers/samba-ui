'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<User | null>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkUserContract = async (user: User): Promise<string | null> => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/contract/wrapper', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.wrapperContract) {
          return data.wrapperContract;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error checking user contract:', error);
      return null;
    }
  };

  const createWrapperContract = async (user: User): Promise<string | null> => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/contract/wrapper', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Wrapper contract created:', data.wrapperContract);
        return data.wrapperContract;
      } else {
        const errorData = await response.json();
        console.error('Failed to create wrapper contract:', errorData);
        return null;
      }
    } catch (error) {
      console.error('Error creating wrapper contract:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (): Promise<User | null> => {
    try {
      setLoading(true);
      setError(null);
      const user = await signInWithGoogle();
      // Check if user has a contract address
      if (user) {
        const wrapperContract = await checkUserContract(user);
        console.log('Wrapper contract:', wrapperContract);
        if (!wrapperContract) {
          await createWrapperContract(user);
        }
      }

      return user;
    } catch (error: any) {
      console.error('Sign in failed:', error);

      // Handle different error types
      let errorMessage = 'Failed to sign in';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign in was cancelled';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Only one popup request is allowed at one time';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await signOutUser();
    } catch (error: any) {
      console.error('Sign out failed:', error);
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
