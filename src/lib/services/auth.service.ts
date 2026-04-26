export type SessionUser = {
  id: string;
  email: string;
  username?: string | null;
  displayName?: string | null;
  role: string;
  status: string;
};

export type SessionData = {
  token: string;
  refreshToken?: string;
  user?: SessionUser | null;
};

const SESSION_KEY = 'gacha_planner_session';

export function getSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export function setSession(session: SessionData): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}