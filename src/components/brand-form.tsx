"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  useCreateBrandMutation,
  useGetBrandQuery,
  useUpdateBrandMutation,
} from "@/store/api";

export function BrandForm({
  id,
  onDone,
}: {
  id?: string;
  onDone?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: existing } = useGetBrandQuery(id as string, { skip: !id });
  const [createBrand, createState] = useCreateBrandMutation();
  const [updateBrand, updateState] = useUpdateBrandMutation();
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const brand = existing?.data;
    if (!brand) return;
    setName(brand.name ?? "");
    setPreview(brand.image ?? null);
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

    const payload: Record<string, unknown> = { name };
    if (!file && preview && !preview.startsWith("blob:")) {
      payload.image = preview;
    }

    const body = new FormData();
    body.append("data", JSON.stringify(payload));
    if (file) body.append("image", file);

    try {
      if (id) {
        await updateBrand({ id, body }).unwrap();
      } else {
        await createBrand(body).unwrap();
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
          Brand Name <span className="text-danger">*</span>
        </span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. MR Audio, Northline"
          className="h-12 w-full rounded-full border border-line bg-input px-4 text-sm outline-none focus:border-brand"
          required
        />
      </label>

      <div>
        <p className="mb-2 text-sm font-semibold">Brand Logo / Image</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex min-h-[160px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-[#faf8f5] px-4 py-8 text-center text-sm text-muted"
        >
          {preview ? (
            <Image
              src={preview}
              alt=""
              width={120}
              height={120}
              className="size-[120px] rounded-2xl object-cover"
              unoptimized
            />
          ) : (
            <>
              <span className="mb-2 text-2xl text-brand">+</span>
              Click to upload brand logo
              <br />
              PNG, JPG or WebP
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
          {loading ? "Saving..." : id ? "Update Brand" : "Create Brand"}
        </button>
      </div>
    </form>
  );
}
