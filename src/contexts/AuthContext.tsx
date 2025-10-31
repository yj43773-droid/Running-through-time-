import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithOAuth: (provider: 'google' | 'kakao' | 'naver') => Promise<User>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 초기 로딩 상태
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 초기 마운트 시 localStorage에서 사용자 정보 확인
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (err) {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Placeholder - for development, allow any email/password
      const mockUser: User = {
        id: 'user1',
        email: email || 'test@example.com',
        name: '사용자',
        createdAt: new Date().toISOString(),
      };
      setUser(mockUser);
      setIsAuthenticated(true);
      // Save to localStorage for persistence
      localStorage.setItem('user', JSON.stringify(mockUser));
      setIsLoading(false);
      return mockUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to login';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, []);

  const loginWithOAuth = useCallback(async (provider: 'google' | 'kakao' | 'naver') => {
    setIsLoading(true);
    setError(null);
    try {
      // Placeholder - for development
      const mockUser: User = {
        id: 'user1',
        email: `${provider}@example.com`,
        name: `${provider} 사용자`,
        createdAt: new Date().toISOString(),
      };
      setUser(mockUser);
      setIsAuthenticated(true);
      // Save to localStorage for persistence
      localStorage.setItem('user', JSON.stringify(mockUser));
      setIsLoading(false);
      return mockUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to login with OAuth';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    localStorage.removeItem('user');
  }, []);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      // Placeholder - check localStorage or token
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    loginWithOAuth,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

