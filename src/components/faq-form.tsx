"use client";

import { useRef, useState } from "react";
import { toast } from "@/components/toast";
import { apiErrorMessage, apiErrorStatus, apiFieldErrors } from "@/lib/api-error";
import type { FaqRecord } from "@/lib/types";
import { useCreateFaqMutation, useUpdateFaqMutation } from "@/store/api";

type Field = "question" | "answer";

/**
 * Add/edit form, shown in a Modal. In edit mode it's prefilled from the table row (no extra
 * fetch). On failure it stays open with the error; the list refetches on its own because every
 * FAQ mutation invalidates the "Faqs" tag.
 */
export function FaqForm({ faq, onDone }: { faq?: FaqRecord; onDone?: () => void }) {
  const questionRef = useRef<HTMLInputElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const [createFaq, createState] = useCreateFaqMutation();
  const [updateFaq, updateState] = useUpdateFaqMutation();
  const [question, setQuestion] = useState(faq?.question ?? "");
  const [answer, setAnswer] = useState(faq?.answer ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Partial<Record<Field, string>>>({});
  const [error, setError] = useState("");

  const clientErrors: Partial<Record<Field, string>> = {
    ...(question.trim() ? {} : { question: "Write the question" }),
    ...(answer.trim() ? {} : { answer: "Write the answer" }),
  };
  const errorFor = (field: Field) => (submitted ? clientErrors[field] : undefined) ?? serverErrors[field];

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setError("");
    if (clientErrors.question) return questionRef.current?.focus();
    if (clientErrors.answer) return answerRef.current?.focus();

    const body = { question: question.trim(), answer: answer.trim() };
    try {
      const result = faq ? await updateFaq({ id: faq.id, body }).unwrap() : await createFaq(body).unwrap();
      toast.success(result.message || (faq ? "FAQ updated." : "FAQ added."));
      onDone?.();
    } catch (err) {
      const fields = apiFieldErrors(err);
      const mapped = { question: fields.question, answer: fields.answer };
      if (mapped.question || mapped.answer) {
        setServerErrors(mapped);
      } else if (faq && apiErrorStatus(err) === 404) {
        setError("This FAQ no longer exists. Another admin may have deleted it, so the list has been refreshed.");
      } else {
        setError(apiErrorMessage(err, "Could not save the FAQ. Please try again."));
      }
    }
  }

  const loading = createState.isLoading || updateState.isLoading;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold">
          Question <span className="text-danger">*</span>
        </span>
        <input
          ref={questionRef}
          value={question}
          onChange={(event) => {
            setQuestion(event.target.value);
            setServerErrors((current) => ({ ...current, question: undefined }));
          }}
          placeholder="e.g. How does wholesale pricing work?"
          aria-invalid={errorFor("question") ? true : undefined}
          aria-describedby={errorFor("question") ? "faq-question-error" : undefined}
          className={`h-12 w-full rounded-full border bg-input px-4 text-sm outline-none ${
            errorFor("question") ? "border-danger focus:border-danger" : "border-line focus:border-brand"
          }`}
        />
        <ErrorText id="faq-question-error" message={errorFor("question")} />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold">
          Answer <span className="text-danger">*</span>
        </span>
        <textarea
          ref={answerRef}
          value={answer}
          onChange={(event) => {
            setAnswer(event.target.value);
            setServerErrors((current) => ({ ...current, answer: undefined }));
          }}
          placeholder="Write a clear answer for customers..."
          rows={6}
          aria-invalid={errorFor("answer") ? true : undefined}
          aria-describedby={errorFor("answer") ? "faq-answer-error" : "faq-answer-hint"}
          className={`w-full rounded-2xl border bg-input px-4 py-3 text-sm outline-none ${
            errorFor("answer") ? "border-danger focus:border-danger" : "border-line focus:border-brand"
          }`}
        />
        {errorFor("answer") ? (
          <ErrorText id="faq-answer-error" message={errorFor("answer")} />
        ) : (
          <span id="faq-answer-hint" className="mt-1.5 block px-1 text-xs text-muted">
            Plain text. Line breaks are kept.
          </span>
        )}
      </label>

      {error ? (
        <p role="alert" className="rounded-2xl bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onDone}
          className="h-11 rounded-full border border-line bg-white px-5 text-sm font-semibold text-slate"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="h-11 rounded-full bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Saving..." : faq ? "Update FAQ" : "Add FAQ"}
        </button>
      </div>
    </form>
  );
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className="mt-1.5 block px-1 text-xs font-medium text-danger">
      {message}
    </span>
  );
}
