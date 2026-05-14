'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { UserResponse } from '@/types/api';
import { apiClient } from '@/lib/api/client';
import { authApi } from '@/lib/api/auth';

interface AuthContextType {
  user: UserResponse | null;  // The logged-in user, or null if not logged in
  token: string | null;       // The Google JWT token
  isLoading: boolean;         // Checking if the user is logged in...
  signIn: (token: string) => Promise<void>;  // Call this after Google sign-in succeeds
  signOut: () => void;                       // Log out
  updateUser: (user: UserResponse) => void;  // Update cached user after profile edit
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true - we check login on load

  useEffect(() => {
    // When the app loads, check if the user was already logged in from a previous session
    const savedToken = localStorage.getItem('auth_token');

    if (savedToken) {
      // tokenSave - verify it still works by fetching their profile
      setToken(savedToken);
      authApi.getCurrentUser()
        .then((userData: UserResponse) => setUser(userData))
        .catch(() => {
          // Token is expired or invalid - clear everything out
          apiClient.clearToken();
          setToken(null);
        })
        .finally(() => setIsLoading(false)); // Done loading either way
    } else {
      // No saved token - definitely not logged in
      setIsLoading(false);
    }
  }, []);
  const signIn = async (googleToken: string): Promise<void> => {
    apiClient.setToken(googleToken); // Save token to localStorage
    setToken(googleToken);           // Save token to React state

    // Now ask our backend "who is this token for?"
    const userData = await authApi.getCurrentUser();
    setUser(userData);
  };

  const signOut = (): void => {
    apiClient.clearToken();
    setUser(null);
    setToken(null);
  };

  // Lets pages update the cached user without a full re-auth
  // e.g. after PATCH /users/me, pass the response here to keep the header in sync
  const updateUser = (updatedUser: UserResponse): void => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}