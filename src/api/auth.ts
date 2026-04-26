import { apiFetch } from '@/lib/api';

export type AuthUser = {
  id: string;
  email: string;
  username?: string | null;
  displayName?: string | null;
  role: string;
  status: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getMeRequest(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me', {
    method: 'GET',
  });
}

export function logoutAllRequest(): Promise<null> {
  return apiFetch<null>('/auth/logout-all', {
    method: 'POST',
  });
}