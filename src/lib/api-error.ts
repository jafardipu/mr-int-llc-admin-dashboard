import type { ApiErrorBody } from "./types";

function bodyOf(error: unknown): Partial<ApiErrorBody> | null {
  if (!error || typeof error !== "object" || !("data" in error)) return null;
  const data = (error as { data?: unknown }).data;
  return data && typeof data === "object" ? (data as Partial<ApiErrorBody>) : null;
}

/** HTTP status of an RTK Query error, or the RTK error code (e.g. "FETCH_ERROR"). */
export function apiErrorStatus(error: unknown): number | string | undefined {
  if (!error || typeof error !== "object" || !("status" in error)) return undefined;
  return (error as { status?: number | string }).status;
}

export function isValidationError(error: unknown) {
  return bodyOf(error)?.message === "Validation Error";
}

/**
 * User-facing message for a failed API call. For "Validation Error" the backend puts the useful
 * text in `errorSources[0].message`; otherwise the top-level `message` is used.
 */
export function apiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  const status = apiErrorStatus(error);
  if (status === "FETCH_ERROR" || status === "TIMEOUT_ERROR") {
    return "Could not reach the server. Check your connection and try again.";
  }

  const body = bodyOf(error);
  if (body?.message === "Validation Error" && body.errorSources?.[0]?.message) {
    return body.errorSources[0].message;
  }
  return body?.message || fallback;
}
