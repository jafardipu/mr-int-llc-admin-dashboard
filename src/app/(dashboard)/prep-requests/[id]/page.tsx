"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PrepAttachments } from "@/components/prep-attachments";
import { PrepReviewDialog, type PrepReviewMode } from "@/components/prep-review-dialog";
import { PrepStatusBadge } from "@/components/prep-status-badge";
import { BackLink, TypeChip } from "@/components/ui";
import { apiErrorMessage, apiErrorStatus, isValidationError } from "@/lib/api-error";
import { mediaUrl, prettyDateTime } from "@/lib/format";
import { prepRef } from "@/lib/prep";
import type { PrepRecord } from "@/lib/types";
import { useGetPrepRequestQuery, useUpdatePrepStatusMutation } from "@/store/api";

type Notice = { tone: "success" | "error"; text: string };

const back = <BackLink href="/prep-requests">Back to Prep Requests</BackLink>;

export default function PrepRequestDetailsPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useGetPrepRequestQuery(params.id);
  const [updateStatus, { isLoading: submitting }] = useUpdatePrepStatusMutation();
  const [dialog, setDialog] = useState<PrepReviewMode | null>(null);
  const [dialogError, setDialogError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const request = data?.data;

  function openDialog(mode: PrepReviewMode) {
    setDialogError("");
    setDialog(mode);
  }

  async function review(note: string) {
    if (!request || !dialog || submitting) return;
    const status = dialog === "approve" ? "completed" : "correction_required";
    setDialogError("");
    setNotice(null);
    try {
      // The API cache is updated from the response (see updatePrepStatus in store/api.ts).
      const result = await updateStatus({
        id: request.id,
        status,
        ...(note ? { adminNote: note } : {}),
      }).unwrap();
      setDialog(null);
      setNotice({
        tone: "success",
        text: result.message || (status === "completed" ? "Request approved." : "Correction requested."),
      });
    } catch (err) {
      const code = apiErrorStatus(err);
      // 409/404 and non-validation 400s mean the request changed under us (already approved,
      // waiting for resubmission, reviewed by another admin). The detail refetches automatically.
      if (code === 409 || code === 404 || (code === 400 && !isValidationError(err))) {
        setDialog(null);
        setNotice({
          tone: "error",
          text:
            code === 409
              ? "Another admin reviewed this request in the meantime. The latest version is shown below."
              : apiErrorMessage(err),
        });
      } else {
        setDialogError(apiErrorMessage(err, "Could not save the review. Please try again."));
      }
    }
  }

  if (!request) {
    const notFound = apiErrorStatus(error) === 404;
    return (
      <div>
        <PageHeader title="Prep Request" back={back} />
        <section className="rounded-2xl bg-white px-6 py-10 text-center text-sm text-muted">
          {isLoading ? (
            "Loading request…"
          ) : notFound ? (
            "This prep request was not found."
          ) : (
            <>
              <span className="text-danger">
                {apiErrorMessage(error, "Could not load this prep request.")}
              </span>{" "}
              <button type="button" onClick={() => refetch()} className="font-semibold text-brand">
                Try again
              </button>
            </>
          )}
        </section>
      </div>
    );
  }

  const files = request.attachments ?? [];

  return (
    <div>
      <PageHeader
        title={`Prep Request ${prepRef(request.id)}`}
        back={back}
        description={<PrepStatusBadge request={request} />}
      />

      {notice ? (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className={`mb-5 flex items-start justify-between gap-4 rounded-2xl px-5 py-4 text-sm ${
            notice.tone === "success" ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
          }`}
        >
          <span className="font-medium">{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="text-lg leading-none">
            ×
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mb-5 rounded-2xl bg-warning-bg px-5 py-3 text-sm text-warning">
          Could not refresh this request. Showing the last loaded version.{" "}
          <button type="button" onClick={() => refetch()} className="font-semibold underline">
            Try again
          </button>
        </p>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-ink">
            Attachments <span className="font-medium text-muted">({files.length})</span>
          </h2>
          <PrepAttachments attachments={files} />
        </section>

        <div className="space-y-6">
          <ReviewPanel request={request} submitting={submitting} onAction={openDialog} />
          <CustomerCard user={request.user} />
          <section className="rounded-2xl bg-white p-6">
            <h2 className="mb-4 font-bold text-ink">Request</h2>
            <dl className="space-y-3 text-sm">
              <Row label="Submitted" value={prettyDateTime(request.createdAt)} />
              <Row label="Last updated" value={prettyDateTime(request.updatedAt)} />
              <Row label="Files" value={String(files.length)} />
            </dl>
          </section>
        </div>
      </div>

      {dialog ? (
        <PrepReviewDialog
          key={dialog}
          mode={dialog}
          submitting={submitting}
          error={dialogError}
          onClose={() => setDialog(null)}
          onSubmit={review}
        />
      ) : null}
    </div>
  );
}

function ReviewPanel({
  request,
  submitting,
  onAction,
}: {
  request: PrepRecord;
  submitting: boolean;
  onAction: (mode: PrepReviewMode) => void;
}) {
  return (
    <section className="rounded-2xl bg-white p-6">
      <h2 className="mb-4 font-bold text-ink">Review</h2>

      {request.status === "under_review" ? (
        <>
          {request.adminNote ? (
            <div className="mb-4 rounded-xl bg-warning-bg px-4 py-3 text-sm">
              <p className="font-semibold text-warning">Resubmitted after a correction</p>
              <p className="mt-1 text-slate">
                <span className="font-medium">Your previous note:</span>{" "}
                <span className="whitespace-pre-wrap">{request.adminNote}</span>
              </p>
              <p className="mt-1 text-xs text-muted">Check that the new files address it.</p>
            </div>
          ) : (
            <p className="mb-4 text-sm text-muted">
              Check the attached files, then approve them or ask the customer for a correction.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => onAction("approve")}
              className="h-11 flex-1 rounded-full bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => onAction("correction")}
              className="h-11 flex-1 rounded-full border border-line bg-white px-5 text-sm font-semibold text-slate hover:border-brand hover:text-brand disabled:opacity-60"
            >
              Request correction
            </button>
          </div>
        </>
      ) : request.status === "correction_required" ? (
        <>
          <p className="text-sm font-semibold text-ink">Waiting for the customer to resubmit</p>
          <NoteBlock label="Note sent to the customer" note={request.adminNote} empty="No note was sent." />
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-success">Approved</p>
          <p className="mt-1 text-xs text-muted">This request is closed and can&apos;t be changed.</p>
          {request.adminNote ? <NoteBlock label="Note sent with the approval" note={request.adminNote} /> : null}
        </>
      )}
    </section>
  );
}

function NoteBlock({ label, note, empty }: { label: string; note?: string | null; empty?: string }) {
  return (
    <div className="mt-3 rounded-xl bg-input px-4 py-3 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-slate">{note || empty}</p>
    </div>
  );
}

function CustomerCard({ user }: { user: PrepRecord["user"] }) {
  return (
    <section className="rounded-2xl bg-white p-6">
      <h2 className="mb-4 font-bold text-ink">Customer</h2>
      <div className="flex items-center gap-3">
        <Image
          src={mediaUrl(user?.profile, "/images/avatar-profile.png")}
          alt=""
          width={48}
          height={48}
          unoptimized
          className="size-12 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{user?.name || "Unnamed customer"}</p>
          <div className="mt-1">
            <TypeChip value={user?.role} />
          </div>
        </div>
      </div>
      <dl className="mt-5 space-y-3 text-sm">
        <Row
          label="Email"
          value={
            user?.email ? (
              <a href={`mailto:${user.email}`} className="hover:text-brand">
                {user.email}
              </a>
            ) : (
              "—"
            )
          }
        />
        <Row label="Phone" value={user?.phoneNumber || "—"} />
      </dl>
      {user?.id ? (
        <Link href={`/customers/${user.id}`} className="mt-5 inline-block text-sm font-semibold text-brand">
          View customer profile
        </Link>
      ) : null}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
