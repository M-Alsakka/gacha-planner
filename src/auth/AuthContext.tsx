import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getMeRequest,
  loginRequest,
  logoutAllRequest,
  type AuthUser,
} from '@/api/auth';
import {
  clearSession,
  getSession,
  setSession,
} from '@/lib/services/auth.service';
import { ApiError } from '@/lib/api';

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const existingSession = getSession();

  const [user, setUser] = useState<AuthUser | null>(existingSession?.user ?? null);
  const [accessToken, setAccessToken] = useState<string | null>(
    existingSession?.token ?? null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    clearSession();
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const me = await getMeRequest();
      const session = getSession();

      setUser(me);

      if (session?.token) {
        setSession({
          ...session,
          user: me,
        });
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAuth();
        return;
      }
      throw error;
    }
  }, [clearAuth]);

  useEffect(() => {
    const run = async () => {
      try {
        const session = getSession();

        if (!session?.token) {
          clearAuth();
          return;
        }

        const me = await getMeRequest();
        setUser(me);
        setAccessToken(session.token);

        setSession({
          ...session,
          user: me,
        });
      } catch {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [clearAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest({ email, password });

    setSession({
      token: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });

    setAccessToken(result.accessToken);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutAllRequest();
    } catch {
      // still clear local session
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!user && !!accessToken,
      isLoading,
      login,
      logout,
      refreshMe,
    }),
    [user, accessToken, isLoading, login, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}