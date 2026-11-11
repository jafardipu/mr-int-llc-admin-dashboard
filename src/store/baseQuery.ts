import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { ApiEnvelope } from "@/lib/types";
import { logout } from "./authSlice";
import { mockFallback } from "./mockFallback";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

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

export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  const allowMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

  if (result.error) {
    if (result.error.status === 401) {
      api.dispatch(logout());
    }
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
