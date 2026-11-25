import type { AdminUser } from "./types";

// Never log these tokens or put them in URLs. The refresh token lasts a year and the server
// can't revoke it, so logout must always clear both.
export const TOKEN_KEY = "mr_admin_token";
export const REFRESH_KEY = "mr_admin_refresh";
export const USER_KEY = "mr_admin_user";
const LOGOUT_REASON_KEY = "mr_admin_logout_reason";

export const ADMIN_ROLES = ["admin", "supper_admin"] as const;

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

/** After a refresh: only the access token changes. The refresh token is not rotated. */
export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
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
  // Omitted when only the user changes (profile update); the stored refresh token is kept.
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

/**
 * Expiry of a JWT as epoch ms, read from its payload. There's no signature check: that's the
 * server's job. Returns null when the token can't be read.
 */
export function tokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const { exp } = JSON.parse(atob(base64)) as { exp?: unknown };
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/** Why the admin was logged out, shown once on the login page (the Toaster lives in the dashboard). */
export function setLogoutReason(message: string) {
  try {
    sessionStorage.setItem(LOGOUT_REASON_KEY, message);
  } catch {
    // Storage blocked: the login page just shows no reason.
  }
}

export function takeLogoutReason() {
  try {
    const message = sessionStorage.getItem(LOGOUT_REASON_KEY);
    sessionStorage.removeItem(LOGOUT_REASON_KEY);
    return message;
  } catch {
    return null;
  }
}
