import type { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { UnknownAction } from "@reduxjs/toolkit";
import { toast } from "@/components/toast";
import { getRefreshToken, getToken, setLogoutReason, tokenExpiresAt } from "@/lib/auth";
import { logout, tokenRefreshed } from "./authSlice";

/**
 * Access-token refresh for every API call (GET, POST, PATCH, DELETE). `baseQuery` runs each request
 * through here:
 *
 * 1. Before a protected request: if the access token expires within 24 hours, refresh it first.
 * 2. After a 401 that means "token expired / missing": refresh once and retry the request once.
 * 3. If there's no refresh token, or the refresh endpoint answers with any error: log out and send the
 *    admin to /login. A network error is NOT a logout: the tokens are kept.
 *
 * Only one refresh runs at a time, in this tab and across tabs (Web Locks). Every request that
 * needs one waits for that same refresh. Tokens live in localStorage (see lib/auth.ts), which a
 * Next.js server-side proxy/middleware can't read, so this runs in the browser.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

type Dispatch = (action: UnknownAction) => unknown;

/** Refresh ahead of time when the access token has less than this left. */
const REFRESH_AHEAD_MS = 24 * 60 * 60 * 1000;
const SESSION_EXPIRED = "Your session has expired, please log in again.";
export const NO_PERMISSION = "You don't have permission for this.";

/** The auth flow's own endpoints never trigger a refresh. */
export function skipsRefresh(url: string) {
  const path = url.split("?")[0].replace(/^\/+/, "");
  return /^auth\/(refresh-token|login|register|forgot-password|reset-password)\b/.test(path) || /^otp\//.test(path);
}

export type AuthVerdict =
  | { kind: "none" }
  /** Token expired, invalid or missing: refresh, then retry once. */
  | { kind: "refresh" }
  /** The session can't continue: log out with this message. */
  | { kind: "logout"; message: string }
  /** Logged in, but this role may not do that: don't refresh, don't log out. */
  | { kind: "forbidden" };

/** Reads the backend's auth errors. Messages are compared exactly (they're case-sensitive). */
export function classifyAuthError(error: FetchBaseQueryError): AuthVerdict {
  const message = (error.data as { message?: unknown } | undefined)?.message;
  if (error.status === 401) {
    switch (message) {
      case "You are not authorized": // capital Y, no "!": role not allowed
        return { kind: "forbidden" };
      case "your account is blocked":
        return { kind: "logout", message: "Your account has been blocked. Please contact the store owner." };
      case "your account is deleted":
        return { kind: "logout", message: "This account has been deleted." };
      case "your account is not verified":
        return { kind: "logout", message: "This account isn't verified yet. Verify your email, then log in." };
      case "unauthorized": // access token expired or invalid
      case "you are not authorized!": // no token sent
      default:
        return { kind: "refresh" };
    }
  }
  // Only the auth check uses this exact lowercase text; other endpoints say "User not found".
  if (error.status === 404 && message === "user not found") {
    return { kind: "logout", message: "This account no longer exists." };
  }
  return { kind: "none" };
}

type RefreshOutcome = { ok: true; token: string } | { ok: false; offline: boolean };

let inFlight: Promise<RefreshOutcome> | null = null;

/**
 * Gets a new access token. Callers that arrive while a refresh is running share it, so a burst
 * of failing requests causes exactly one call to /auth/refresh-token.
 */
export function refreshAccessToken(staleToken: string | null): Promise<RefreshOutcome> {
  inFlight ??= withTabLock(() => requestNewToken(staleToken)).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Serializes refreshes across tabs; falls back to no lock where Web Locks isn't available. */
function withTabLock<T>(run: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  // The lock's promise adopts the callback's promise, so it resolves to T (the DOM typing says Promise<Promise<T>>).
  return locks ? (locks.request("mr-admin-token-refresh", run) as unknown as Promise<T>) : run();
}

async function requestNewToken(staleToken: string | null): Promise<RefreshOutcome> {
  // Another tab may have refreshed while this one waited for the lock: reuse its token.
  const current = getToken();
  if (current && current !== staleToken && !expiresSoon(current)) return { ok: true, token: current };

  const refreshToken = getRefreshToken();
  if (!refreshToken) return { ok: false, offline: false };

  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Always send the body (without it the backend fails with a 500).
      body: JSON.stringify({ refreshToken }),
      // The backend reads a refreshToken cookie before the body; a stale cookie must not win.
      credentials: "omit",
      cache: "no-store",
    });
  } catch {
    return { ok: false, offline: true };
  }

  const body = (await response.json().catch(() => null)) as
    | { success?: boolean; data?: { accessToken?: unknown } }
    | null;
  const token = body?.data?.accessToken;
  // Any error answer (500 "jwt expired", 403 deleted, 404 not found...) means the session is over.
  if (!response.ok || body?.success === false || typeof token !== "string" || !token) {
    return { ok: false, offline: false };
  }
  return { ok: true, token };
}

function expiresSoon(token: string) {
  const expiresAt = tokenExpiresAt(token);
  return expiresAt !== null && expiresAt - Date.now() < REFRESH_AHEAD_MS;
}

/**
 * Proactive refresh, before protected requests and on app start. If the token can't be read it's
 * left alone and the 401 path handles it.
 */
export async function ensureFreshToken(dispatch: Dispatch, token: string | null) {
  if (!token || !getRefreshToken() || !expiresSoon(token)) return;
  const outcome = await refreshAccessToken(token);
  if (outcome.ok) dispatch(tokenRefreshed(outcome.token));
  else if (!outcome.offline) endSession(dispatch);
}

/**
 * Logs out (clears both tokens and the user; the store also drops all cached API data) and leaves
 * the reason for the login page. AuthGuard then redirects to /login. When several requests fail
 * together, only the first one does anything: after it the tokens are already gone.
 */
export function endSession(dispatch: Dispatch, message = SESSION_EXPIRED) {
  if (!getToken() && !getRefreshToken()) return;
  setLogoutReason(message);
  dispatch(logout());
}

let lastPermissionToast = 0;

/** Rewrites a role-not-allowed error so pages show a clear message, and toasts it (at most every 3 s). */
export function permissionDenied(error: FetchBaseQueryError): FetchBaseQueryError {
  if (Date.now() - lastPermissionToast > 3000) {
    lastPermissionToast = Date.now();
    toast.error(NO_PERMISSION);
  }
  const data = error.data && typeof error.data === "object" ? error.data : {};
  return { ...error, data: { ...data, message: NO_PERMISSION } } as FetchBaseQueryError;
}
