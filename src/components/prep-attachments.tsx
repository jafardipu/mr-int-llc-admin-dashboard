"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { mediaUrl } from "@/lib/format";
import { fileExtension, fileNameFromUrl, isImageUrl } from "@/lib/prep";

const linkButton =
  "inline-flex h-9 items-center rounded-full border border-line bg-white px-4 text-xs font-semibold text-slate hover:border-brand hover:text-brand";

/** Read-only viewer: image previews (click to enlarge) and open/download links for documents. */
export function PrepAttachments({ attachments }: { attachments: string[] }) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const images = attachments.filter(isImageUrl);
  const documents = attachments.filter((url) => !isImageUrl(url));

  if (attachments.length === 0) {
    return <p className="text-sm text-muted">No files attached.</p>;
  }

  return (
    <div className="space-y-5">
      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((url, index) => {
            const name = fileNameFromUrl(url);
            return (
              <li key={`${index}-${url}`}>
                <button
                  type="button"
                  onClick={() => setPreviewIndex(index)}
                  aria-label={`Enlarge ${name}`}
                  className="group block w-full text-left"
                >
                  <span className="relative block aspect-square overflow-hidden rounded-xl border border-line-soft bg-input">
                    <Image
                      src={mediaUrl(url, url)}
                      alt={name}
                      fill
                      unoptimized
                      sizes="240px"
                      className="object-cover transition group-hover:scale-105"
                    />
                  </span>
                  <span className="mt-1.5 block truncate text-xs text-muted" title={name}>
                    {name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {documents.length > 0 ? (
        <ul className="divide-y divide-line-soft overflow-hidden rounded-xl border border-line-soft">
          {documents.map((url, index) => {
            const name = fileNameFromUrl(url);
            const href = mediaUrl(url, url);
            return (
              <li key={`${index}-${url}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-page text-[10px] font-bold uppercase text-brand-dark">
                  {fileExtension(url) || "file"}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink" title={name}>
                  {name}
                </span>
                <div className="flex gap-2">
                  <a href={href} target="_blank" rel="noopener noreferrer" className={linkButton}>
                    Open
                  </a>
                  <a href={href} download={name} className={linkButton}>
                    Download
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {previewIndex !== null && images[previewIndex] ? (
        <Lightbox
          images={images}
          index={previewIndex}
          onIndex={setPreviewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      ) : null}
    </div>
  );
}

function Lightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: string[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const url = images[index];
  const name = fileNameFromUrl(url);
  const multiple = images.length > 1;
  const prev = () => onIndex((index - 1 + images.length) % images.length);
  const next = () => onIndex((index + 1) % images.length);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (multiple && event.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
      if (multiple && event.key === "ArrowRight") onIndex((index + 1) % images.length);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [images.length, index, multiple, onClose, onIndex]);

  const control =
    "rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={name}
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/85 p-6"
    >
      <div className="relative h-[78vh] w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
        <Image src={mediaUrl(url, url)} alt={name} fill unoptimized sizes="100vw" className="object-contain" />
      </div>
      <div
        className="flex max-w-full flex-wrap items-center justify-center gap-3"
        onClick={(event) => event.stopPropagation()}
      >
        {multiple ? (
          <button type="button" onClick={prev} className={control} aria-label="Previous image">
            ←
          </button>
        ) : null}
        <span className="max-w-[50vw] truncate text-sm text-white/80" title={name}>
          {name}
          {multiple ? ` (${index + 1} of ${images.length})` : ""}
        </span>
        {multiple ? (
          <button type="button" onClick={next} className={control} aria-label="Next image">
            →
          </button>
        ) : null}
        <a href={mediaUrl(url, url)} target="_blank" rel="noopener noreferrer" className={control}>
          Open original
        </a>
        <button type="button" onClick={onClose} className={control}>
          Close
        </button>
      </div>
    </div>
  );
}
