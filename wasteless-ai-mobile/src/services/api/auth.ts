import { API_ENDPOINTS } from '@/services/api/endpoints';
import { ApiError, apiRequest } from '@/services/api/client';
import type {
  AuthSession,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from '@/features/auth/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getResponseError(payload: unknown) {
  if (!isRecord(payload) || payload.success !== false) return null;

  return typeof payload.error === 'string' ? payload.error : 'Request failed.';
}

function isAuthUser(value: unknown): value is AuthUser {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.email === 'string' &&
    value.email.length > 0 &&
    typeof value.name === 'string' &&
    value.name.length > 0
  );
}

function parseAuthSessionResponse(payload: unknown): AuthSession {
  const responseError = getResponseError(payload);
  if (responseError) {
    throw new ApiError(responseError, 0);
  }

  if (!isRecord(payload) || payload.success !== true || !isRecord(payload.data)) {
    throw new ApiError('Invalid authentication response from server.', 0);
  }

  const { token, user } = payload.data;
  if (typeof token !== 'string' || token.length === 0 || !isAuthUser(user)) {
    throw new ApiError('Invalid authentication response from server.', 0);
  }

  return { token, user };
}

function parseCurrentUserResponse(payload: unknown): AuthUser {
  const responseError = getResponseError(payload);
  if (responseError) {
    throw new ApiError(responseError, 0);
  }

  if (!isRecord(payload) || payload.success !== true || !isRecord(payload.data)) {
    throw new ApiError('Invalid session response from server.', 0);
  }

  if (!isAuthUser(payload.data.user)) {
    throw new ApiError('Invalid session response from server.', 0);
  }

  return payload.data.user;
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.auth.login, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  return parseAuthSessionResponse(payload);
}

export async function register(credentials: RegisterCredentials): Promise<AuthSession> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.auth.register, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  return parseAuthSessionResponse(payload);
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  const payload = await apiRequest<unknown>(API_ENDPOINTS.auth.me, {
    authToken: token,
  });

  return parseCurrentUserResponse(payload);
}

export async function logout(token?: string | null): Promise<void> {
  await apiRequest<unknown>(API_ENDPOINTS.auth.logout, {
    authToken: token ?? undefined,
    method: 'POST',
  });
}
