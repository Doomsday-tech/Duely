import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../api/types';
import { api, tokenStorage } from '../api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  useDemoAccount: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const token = tokenStorage.get();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        setUser(res.user);
      } catch (err) {
        console.warn('Session verification failed, logging out:', err);
        tokenStorage.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    tokenStorage.set(res.token);
    setUser(res.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await api.register({ email, password, name });
    tokenStorage.set(res.token);
    setUser(res.user);
  };

  const useDemoAccount = async () => {
    await login('demo@duely.local', 'Password123!');
  };

  const logout = () => {
    api.logout().catch(() => {});
    tokenStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        useDemoAccount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
