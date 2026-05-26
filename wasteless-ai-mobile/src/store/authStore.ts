import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';

import { getApiErrorMessage } from '@/services/api/client';
import { unregisterDeviceForPushNotifications } from '@/features/notifications/deviceNotifications';
import {
  getCurrentUser as getCurrentUserRequest,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '@/services/api/auth';
import {
  clearStoredAuthToken,
  getStoredAuthToken,
  setStoredAuthToken,
} from '@/services/auth/tokenStorage';
import type {
  AuthFormResult,
  AuthSession,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from '@/features/auth/types';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  error: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  clearError: () => void;
  login: (credentials: LoginCredentials) => Promise<AuthFormResult>;
  register: (credentials: RegisterCredentials) => Promise<AuthFormResult>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearSession = useCallback(async () => {
    await clearStoredAuthToken();
    setToken(null);
    setUser(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const saveSession = useCallback(async (session: AuthSession) => {
    await setStoredAuthToken(session.token);
    setToken(session.token);
    setUser(session.user);
  }, []);

  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const storedToken = await getStoredAuthToken();
    if (!storedToken) {
      setToken(null);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await getCurrentUserRequest(storedToken);
      setToken(storedToken);
      setUser(currentUser);
    } catch {
      await clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const authenticate = useCallback(
    async (
      request: () => Promise<AuthSession>,
      fallbackMessage: string,
    ): Promise<AuthFormResult> => {
      setIsSubmitting(true);
      setError(null);

      try {
        const session = await request();
        await saveSession(session);
        return { success: true };
      } catch (requestError) {
        const message = getApiErrorMessage(requestError, fallbackMessage);
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsSubmitting(false);
      }
    },
    [saveSession],
  );

  const login = useCallback(
    (credentials: LoginCredentials) =>
      authenticate(() => loginRequest(credentials), 'Unable to sign you in.'),
    [authenticate],
  );

  const register = useCallback(
    (credentials: RegisterCredentials) =>
      authenticate(() => registerRequest(credentials), 'Unable to create your account.'),
    [authenticate],
  );

  const logout = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (token) {
        await unregisterDeviceForPushNotifications(token).catch(() => undefined);
      }
      await logoutRequest(token);
    } catch {
      // Local session cleanup is still required when the network request fails.
    } finally {
      await clearSession();
      setIsSubmitting(false);
    }
  }, [clearSession, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      error,
      isAuthenticated: Boolean(user && token),
      isLoading,
      isSubmitting,
      clearError,
      login,
      register,
      logout,
      restoreSession,
    }),
    [clearError, error, isLoading, isSubmitting, login, logout, register, restoreSession, token, user],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
