import type { PrepRecord, PrepStatus } from "./types";

export const PREP_STATUSES = ["under_review", "correction_required", "completed"] as const;

/** There is no `approved` status: approved requests have status `completed`. */
export const PREP_STATUS_LABELS: Record<PrepStatus, string> = {
  under_review: "Under review",
  correction_required: "Needs correction",
  completed: "Approved",
};

export const PREP_NOTE_MAX = 1000;

/** The list page's default tab: the review queue, longest waiting first. */
export const PREP_QUEUE_HREF = "/prep-requests?status=under_review";

export function isPrepStatus(value: unknown): value is PrepStatus {
  return PREP_STATUSES.includes(value as PrepStatus);
}

/** Under review with a note from the previous round means the customer resubmitted after a correction. */
export function isResubmitted(request: Pick<PrepRecord, "status" | "adminNote">) {
  return request.status === "under_review" && Boolean(request.adminNote);
}

/** Matches "New prep request" and "Prep request resubmitted". */
export function isPrepNotification(item: { message?: string | null }) {
  return /prep request/i.test(item.message ?? "");
}

export function prepRef(id: string) {
  return `PR-${id.slice(-5).toUpperCase()}`;
}

/** File name is the last path segment of the attachment URL. */
export function fileNameFromUrl(url: string) {
  const path = url.split(/[?#]/)[0];
  const segment = path.split("/").filter(Boolean).pop() ?? url;
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "svg"]);

export function fileExtension(url: string) {
  const name = fileNameFromUrl(url);
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export function isImageUrl(url: string) {
  return IMAGE_EXTENSIONS.has(fileExtension(url));
}
