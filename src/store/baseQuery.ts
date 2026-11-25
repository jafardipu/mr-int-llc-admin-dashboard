import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { ApiEnvelope } from "@/lib/types";
import {
  API_URL,
  classifyAuthError,
  endSession,
  ensureFreshToken,
  permissionDenied,
  refreshAccessToken,
  skipsRefresh,
} from "./authProxy";
import { tokenRefreshed } from "./authSlice";
import { mockFallback } from "./mockFallback";

export { API_URL };

export type Envelope<T> = {
  data: T;
  meta?: ApiEnvelope<T>["meta"];
  message?: string;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth?: { token?: string | null } }).auth
      ?.token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

const tokenOf = (state: unknown) => (state as { auth?: { token?: string | null } }).auth?.token ?? null;

/**
 * Sends the request with the current access token and handles auth errors (see authProxy.ts):
 * refreshes ahead of expiry, and on a token 401 refreshes once and retries once, so GETs and
 * mutations alike survive an expired token. A refresh that fails logs the admin out.
 */
const requestWithRefresh: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const url = typeof args === "string" ? args : args.url;
  if (skipsRefresh(url)) return rawBaseQuery(args, api, extraOptions);

  await ensureFreshToken(api.dispatch, tokenOf(api.getState()));
  const result = await rawBaseQuery(args, api, extraOptions);
  if (!result.error) return result;

  const verdict = classifyAuthError(result.error);
  if (verdict.kind === "forbidden") return { ...result, error: permissionDenied(result.error) };
  if (verdict.kind === "logout") {
    endSession(api.dispatch, verdict.message);
    return result;
  }
  if (verdict.kind !== "refresh") return result;

  const outcome = await refreshAccessToken(tokenOf(api.getState()));
  if (!outcome.ok) {
    if (outcome.offline) {
      // No answer from the server: keep the tokens and report it as a connection problem.
      return { error: { status: "FETCH_ERROR", error: "Could not reach the server." } };
    }
    endSession(api.dispatch);
    return result;
  }

  api.dispatch(tokenRefreshed(outcome.token));
  // Retried exactly once. A 401 now means the session is really over: never loop.
  const retried = await rawBaseQuery(args, api, extraOptions);
  if (retried.error) {
    const retryVerdict = classifyAuthError(retried.error);
    if (retryVerdict.kind === "forbidden") return { ...retried, error: permissionDenied(retried.error) };
    if (retryVerdict.kind === "logout") endSession(api.dispatch, retryVerdict.message);
    if (retryVerdict.kind === "refresh") endSession(api.dispatch);
  }
  return retried;
};

export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await requestWithRefresh(args, api, extraOptions);

  const allowMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

  if (result.error) {
    if (allowMocks) {
      const fallback = mockFallback(args);
      if (fallback) return { data: fallback };
    }
    return result;
  }

  const body = result.data as ApiEnvelope<unknown>;
  if (!body?.success) {
    if (allowMocks) {
      const fallback = mockFallback(args);
      if (fallback) return { data: fallback };
    }
    return {
      error: {
        status: 400,
        data: body,
      },
    };
  }

  return {
    data: {
      data: body.data,
      meta: body.meta,
      message: body.message,
    } satisfies Envelope<unknown>,
  };
};

export function asList<T>(payload: unknown): { items: T[]; total: number } {
  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length };
  }

  if (payload && typeof payload === "object") {
    const value = payload as { data?: T[]; meta?: { total?: number } };
    if (Array.isArray(value.data)) {
      return { items: value.data, total: value.meta?.total ?? value.data.length };
    }
  }

  return { items: [], total: 0 };
}
