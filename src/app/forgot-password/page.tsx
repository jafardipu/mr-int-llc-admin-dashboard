"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForgotPasswordMutation } from "@/store/api";

export default function ForgotPasswordPage() {
  const [forgotPassword, { isLoading, isSuccess }] = useForgotPasswordMutation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await forgotPassword({ email }).unwrap();
    } catch (err) {
      const message =
        err && typeof err === "object" && "data" in err
          ? ((err.data as { message?: string })?.message ?? "Request failed")
          : "Request failed";
      setError(message);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-6 py-10">
      <section className="w-full max-w-[560px] rounded-[28px] border border-line-soft bg-white p-16 shadow-[0_24px_59px_rgba(166,124,56,0.08)]">
        <h1 className="text-[33px] font-bold text-ink">Forgot password</h1>
        <p className="mt-2 text-muted">
          Enter your admin email and we will send a reset OTP.
        </p>
        <form className="mt-10 space-y-6" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.7px] text-label">
              Email Address
            </span>
            <div className="relative">
              <Image
                src="/images/icon-email.svg"
                alt=""
                width={19}
                height={19}
                className="absolute left-4 top-1/2 -translate-y-1/2"
              />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-[58px] w-full rounded-[14px] border border-line bg-input pl-12 pr-5 outline-none focus:border-brand"
              />
            </div>
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          {isSuccess ? (
            <p className="text-sm text-success">An OTP has been sent to your email.</p>
          ) : null}
          <button
            type="submit"
            disabled={isLoading}
            className="h-[52px] w-full rounded-[14px] bg-brand font-semibold text-white disabled:opacity-70"
          >
            {isLoading ? "Sending..." : "Send OTP"}
          </button>
        </form>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
