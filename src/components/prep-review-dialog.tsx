"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import { PREP_NOTE_MAX } from "@/lib/prep";

export type PrepReviewMode = "approve" | "correction";

const copy = {
  approve: {
    title: "Approve this request?",
    description: "The customer's files will be marked as approved.",
    label: "Note to customer (optional)",
    placeholder: "Anything the customer should know",
    submit: "Approve request",
    submitting: "Approving…",
  },
  correction: {
    title: "Request a correction",
    description: "The customer will be asked to upload a corrected set of files.",
    label: "What should the customer fix?",
    placeholder: "e.g. The packing list is missing quantities for SKU A-102. Please upload an updated PDF.",
    submit: "Send correction request",
    submitting: "Sending…",
  },
} as const;

/** Mount with a `key` per opening so the note starts empty each time. */
export function PrepReviewDialog({
  mode,
  submitting,
  error,
  onClose,
  onSubmit,
}: {
  mode: PrepReviewMode;
  submitting: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const text = copy[mode];

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    onSubmit(note.trim());
  }

  return (
    <Modal
      open
      title={text.title}
      description={text.description}
      onClose={() => {
        if (!submitting) onClose();
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "approve" ? (
          <p className="rounded-xl bg-warning-bg px-4 py-3 text-sm font-medium text-warning">
            Approval is final. The request can&apos;t be reopened or changed afterwards.
          </p>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-ink">{text.label}</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={PREP_NOTE_MAX}
            rows={mode === "correction" ? 5 : 3}
            autoFocus={mode === "correction"}
            placeholder={text.placeholder}
            disabled={submitting}
            className="w-full resize-y rounded-xl border border-line bg-input px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-brand disabled:opacity-60"
          />
          <span className="mt-1 flex justify-between gap-3 text-xs text-muted">
            <span>
              {mode === "correction"
                ? "Optional, but recommended. The customer sees this note, so say exactly what to fix."
                : "Sending a note replaces any earlier correction note."}
            </span>
            <span className="shrink-0">
              {note.length}/{PREP_NOTE_MAX}
            </span>
          </span>
        </label>

        {error ? (
          <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-11 rounded-full border border-line bg-white px-5 text-sm font-semibold text-slate disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="h-11 rounded-full bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? text.submitting : text.submit}
          </button>
        </div>
      </form>
    </Modal>
  );
}
