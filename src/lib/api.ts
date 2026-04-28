import { getSession } from '@/lib/services/auth.service';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const s = getSession();

  const headers = new Headers(init.headers);
  headers.set('Accept', headers.get('Accept') ?? 'application/json');

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (s?.token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${s.token}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    throw new ApiError('Unauthorized', 401);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || res.statusText, res.status);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null as T;
  }

  return (await res.json()) as T;
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        return (
          (typeof obj.message === 'string' && obj.message) ||
          (typeof obj.error === 'string' && obj.error) ||
          error.message
        );
      }
    } catch {
      return error.message;
    }
  }

  return error instanceof Error ? error.message : 'Failed to load active session';
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}
