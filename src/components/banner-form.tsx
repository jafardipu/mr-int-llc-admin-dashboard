"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  useCreateBannerMutation,
  useGetBannerQuery,
  useUpdateBannerMutation,
} from "@/store/api";

export function BannerForm({
  id,
  onDone,
}: {
  id?: string;
  onDone?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: existing } = useGetBannerQuery(id as string, { skip: !id });
  const [createBanner, createState] = useCreateBannerMutation();
  const [updateBanner, updateState] = useUpdateBannerMutation();
  const [link, setLink] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const banner = existing?.data;
    if (!banner) return;
    setLink(banner.link ?? "");
    setIsActive(banner.isActive !== false);
    setPreview(banner.image ?? null);
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
    if (!id && !file) {
      setError("Carousel image is required");
      return;
    }

    const payload: Record<string, unknown> = {
      isActive,
      link: link.trim() || null,
    };

    const body = new FormData();
    body.append("data", JSON.stringify(payload));
    if (file) body.append("image", file);

    try {
      if (id) {
        await updateBanner({ id, body }).unwrap();
      } else {
        await createBanner(body).unwrap();
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
      <div>
        <p className="mb-2 text-sm font-semibold">
          Banner Image {!id ? <span className="text-danger">*</span> : null}
        </p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex min-h-[180px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-[#faf8f5] px-4 py-8 text-center text-sm text-muted"
        >
          {preview ? (
            <Image
              src={preview}
              alt=""
              width={420}
              height={160}
              className="h-40 w-full rounded-xl object-cover"
              unoptimized
            />
          ) : (
            <>
              <span className="mb-2 text-2xl text-brand">+</span>
              Click to upload banner image
              <br />
              Recommended 1400×500 · PNG, JPG or WebP
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

      <label className="block">
        <span className="mb-2 block text-sm font-semibold">Link URL</span>
        <input
          value={link}
          onChange={(event) => setLink(event.target.value)}
          placeholder="https://products/..."
          className="h-12 w-full rounded-full border border-line bg-input px-4 text-sm outline-none focus:border-brand"
        />
      </label>

      <div>
        <p className="mb-2 text-sm font-semibold">Status</p>
        <div className="flex h-12 items-center gap-5 rounded-full border border-line bg-input px-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={isActive}
              onChange={() => setIsActive(true)}
            />
            Active
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={!isActive}
              onChange={() => setIsActive(false)}
            />
            Hidden
          </label>
        </div>
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
          {loading ? "Saving..." : id ? "Update Banner" : "Add Banner"}
        </button>
      </div>
    </form>
  );
}
