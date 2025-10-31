import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { User } from '@/types';
import {
  apiFetch,
  ApiError,
} from '@/lib/apiClient';
import {
  getStoredUser,
  storeUser,
  clearStoredUser,
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  StoredUser,
} from '@/lib/authStorage';

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

interface AuthResponseUser {
  id: string;
  email: string;
  name?: string | null;
  displayName?: string | null;
  createdAt?: string | null;
}

interface AuthResponse {
  user: AuthResponseUser;
  accessToken: string;
  refreshToken: string;
}

interface MeResponse {
  user: AuthResponseUser;
}

const toUser = (payload: AuthResponseUser | StoredUser): User => {
  const name =
    (typeof payload.name === 'string' && payload.name.trim().length > 0
      ? payload.name
      : typeof payload.displayName === 'string' && payload.displayName.trim().length > 0
        ? payload.displayName
        : null) ?? payload.email;

  return {
    id: payload.id,
    email: payload.email,
    name,
    createdAt: payload.createdAt ?? new Date().toISOString(),
  };
};

const persistUser = (payload: AuthResponseUser): User => {
  const nextUser = toUser(payload);
  storeUser({
    id: payload.id,
    email: payload.email,
    name: payload.name,
    displayName: payload.displayName,
    createdAt: payload.createdAt,
  });
  return nextUser;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const storedUser = getStoredUser();

  const [user, setUser] = useState<User | null>(() =>
    storedUser ? toUser(storedUser) : null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const hasToken = Boolean(getAccessToken() || getRefreshToken());
    return Boolean(storedUser && hasToken);
  });

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
      });

      const { user: payload, accessToken, refreshToken } = response;

      if (!accessToken || !refreshToken) {
        throw new Error('인증 토큰이 누락되었습니다.');
      }

      setTokens({ accessToken, refreshToken });
      const nextUser = persistUser(payload);
      setUser(nextUser);
      setIsAuthenticated(true);
      setIsLoading(false);
      return nextUser;
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '로그인에 실패했습니다.';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, []);

  const loginWithOAuth = useCallback((provider: 'google' | 'kakao' | 'naver') => {
    const errorMessage = `${provider.toUpperCase()} 로그인은 아직 지원되지 않습니다.`;
    setError(errorMessage);
    return Promise.reject<User>(new Error(errorMessage));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    clearTokens();
    clearStoredUser();
  }, []);

  const checkAuth = useCallback(async () => {
    const hasTokens = Boolean(getAccessToken() || getRefreshToken());
    if (!hasTokens) {
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch<MeResponse>('/auth/me');
      const nextUser = persistUser(response.user);
      setUser(nextUser);
      setIsAuthenticated(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearTokens();
        clearStoredUser();
        setIsAuthenticated(false);
        setUser(null);
      } else {
        const message =
          err instanceof Error ? err.message : '인증 상태 확인에 실패했습니다.';
        setError(message);
      }
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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
