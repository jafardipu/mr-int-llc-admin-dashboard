import type { AdminUser } from "./types";

const TOKEN_KEY = "mr_admin_token";
const REFRESH_KEY = "mr_admin_refresh";
const USER_KEY = "mr_admin_user";

export const ADMIN_ROLES = ["admin", "supper_admin"] as const;

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function isAdminRole(role?: string | null) {
  return role === "admin" || role === "supper_admin";
}

export function setSession(payload: {
  accessToken: string;
  refreshToken?: string;
  user: AdminUser;
}) {
  localStorage.setItem(TOKEN_KEY, payload.accessToken);
  if (payload.refreshToken) {
    localStorage.setItem(REFRESH_KEY, payload.refreshToken);
  }
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}
