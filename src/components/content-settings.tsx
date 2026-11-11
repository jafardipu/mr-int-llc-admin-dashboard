"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { prettyDateTime } from "@/lib/format";
import { useGetContentsQuery, useUpdateContentsMutation } from "@/store/api";

export function ContentSettings({
  field,
  heading,
}: {
  field: "termsAndCondition" | "privacyPolicy";
  heading: string;
}) {
  const { data } = useGetContentsQuery(field);
  const [updateContents, { isLoading }] = useUpdateContentsMutation();
  const [value, setValue] = useState("");
  const contents = data?.data;

  useEffect(() => {
    if (!contents) return;
    setValue(contents[field] ?? "");
  }, [contents, field]);

  return (
    <div>
      <PageHeader title="Settings" description="Privacy Policy and Terms and Conditions" />
      <div className="mb-6 flex gap-6 border-b border-line-soft text-sm">
        <Link
          href="/settings/terms"
          className={`pb-3 ${field === "termsAndCondition" ? "border-b-2 border-ink font-semibold text-ink" : "text-muted"}`}
        >
          Terms and Conditions
        </Link>
        <Link
          href="/settings/privacy"
          className={`pb-3 ${field === "privacyPolicy" ? "border-b-2 border-ink font-semibold text-ink" : "text-muted"}`}
        >
          Privacy Policy
        </Link>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          updateContents({ [field]: value });
        }}
        className="space-y-5"
      >
        <div>
          <h2 className="text-xl font-bold text-ink">{heading}</h2>
          <p className="mt-1 text-sm text-muted">{prettyDateTime(new Date().toISOString())}</p>
        </div>
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={16}
          className="w-full rounded-2xl border border-line bg-white p-5 text-sm leading-7 outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="h-12 w-full rounded-full bg-brand text-sm font-semibold text-white disabled:opacity-70"
        >
          Save
        </button>
      </form>
    </div>
  );
}
