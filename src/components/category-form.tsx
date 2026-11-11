"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  useCreateCategoryMutation,
  useGetCategoryQuery,
  useUpdateCategoryMutation,
} from "@/store/api";

export function CategoryForm({
  id,
  onDone,
  compact,
}: {
  id?: string;
  onDone?: () => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: existing } = useGetCategoryQuery(id as string, { skip: !id });
  const [createCategory, createState] = useCreateCategoryMutation();
  const [updateCategory, updateState] = useUpdateCategoryMutation();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const category = existing?.data;
    if (!category) return;
    setName(category.name ?? "");
    setStatus(category.status === "inactive" ? "inactive" : "active");
    setPreview(category.image ?? null);
  }, [existing]);

  function onPick(files: FileList | null) {
    const next = files?.[0];
    if (!next) return;
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const body = new FormData();
    body.append("data", JSON.stringify({ name, status }));
    if (file) body.append("image", file);
    try {
      if (id) {
        await updateCategory({ id, body }).unwrap();
        onDone ? onDone() : router.push(`/categories/${id}`);
      } else {
        const result = await createCategory(body).unwrap();
        onDone ? onDone() : router.push(result.data?.id ? `/categories/${result.data.id}` : "/categories");
      }
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
    <form onSubmit={onSubmit} className={compact ? "space-y-5" : "space-y-6 rounded-2xl bg-white p-6"}>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold">
          Category Name <span className="text-danger">*</span>
        </span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Electronics, Footwear, Home & Kitchen"
          className="h-12 w-full rounded-full border border-line bg-input px-4 text-sm outline-none focus:border-brand"
          required
        />
      </label>
      <div>
        <p className="mb-2 text-sm font-semibold">Category Image / Thumbnail</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex min-h-[160px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-[#faf8f5] px-4 py-8 text-center text-sm text-muted"
        >
          {preview ? (
            <Image src={preview} alt="" width={120} height={120} className="size-[120px] rounded-2xl object-cover" />
          ) : (
            <>
              <span className="mb-2 text-2xl text-brand">+</span>
              Click to upload category icon/image or drag and drop
              <br />
              PNG, JPG or WebP (max. 800×800, 2MB)
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(event) => onPick(event.target.files)}
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold">Catalog Status & Visibility</p>
        <p className="mb-3 text-xs text-muted">
          When active, this category and its products appear in client catalogs and wholesale ordering portals.
        </p>
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="status" checked={status === "active"} onChange={() => setStatus("active")} />
            Active
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="status" checked={status === "inactive"} onChange={() => setStatus("inactive")} />
            Inactive
          </label>
        </div>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className={compact ? "flex justify-end gap-3" : ""}>
        {compact && onDone ? (
          <button type="button" onClick={onDone} className="rounded-full bg-white px-5 py-2.5 text-sm">
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className={
            compact
              ? "rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
              : "h-12 w-full rounded-full bg-brand text-sm font-semibold text-white disabled:opacity-70"
          }
        >
          {loading ? "Saving..." : id ? "Save Changes" : "Create Category"}
        </button>
      </div>
    </form>
  );
}
