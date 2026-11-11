"use client";

import { useEffect, useState } from "react";
import { asList, useCreateFaqMutation, useGetCategoriesQuery, useGetFaqQuery, useUpdateFaqMutation } from "@/store/api";
import type { CategoryRecord } from "@/lib/types";

export function FaqForm({
  id,
  onDone,
}: {
  id?: string;
  onDone?: () => void;
}) {
  const { data: existing } = useGetFaqQuery(id as string, { skip: !id });
  const { data: categoriesRes } = useGetCategoriesQuery({ page: 1, limit: 100 });
  const categories = asList<CategoryRecord>(categoriesRes?.data).items;
  const [createFaq, createState] = useCreateFaqMutation();
  const [updateFaq, updateState] = useUpdateFaqMutation();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const faq = existing?.data;
    if (!faq) return;
    setQuestion(faq.question ?? "");
    setAnswer(faq.answer ?? "");
    setCategoryId(faq.categoryId ?? "");
  }, [existing]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const payload = {
      question: question.trim(),
      answer: answer.trim(),
      categoryId: categoryId || undefined,
    };
    try {
      if (id) {
        await updateFaq({
          id,
          body: {
            question: payload.question,
            answer: payload.answer,
            categoryId: categoryId ? categoryId : null,
          },
        }).unwrap();
      } else {
        await createFaq(payload).unwrap();
      }
      onDone?.();
    } catch (err) {
      const message =
        err && typeof err === "object" && "data" in err
          ? ((err.data as { message?: string })?.message ?? "Save failed")
          : "Save failed";
      setError(message);
    }
  }

  const loading = createState.isLoading || updateState.isLoading;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold">
          Question <span className="text-danger">*</span>
        </span>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="e.g. How does wholesale pricing work?"
          className="h-12 w-full rounded-full border border-line bg-input px-4 text-sm outline-none focus:border-brand"
          required
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold">
          Answer <span className="text-danger">*</span>
        </span>
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Write a clear answer for customers..."
          rows={5}
          className="w-full rounded-2xl border border-line bg-input px-4 py-3 text-sm outline-none focus:border-brand"
          required
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold">Category (optional)</span>
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="h-12 w-full rounded-full border border-line bg-input px-4 text-sm outline-none focus:border-brand"
        >
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

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
          {loading ? "Saving..." : id ? "Update FAQ" : "Create FAQ"}
        </button>
      </div>
    </form>
  );
}
