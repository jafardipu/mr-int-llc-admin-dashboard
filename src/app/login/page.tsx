"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAdminRole } from "@/lib/auth";
import { useLoginMutation } from "@/store/api";
import { setCredentials } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hydrated && token && isAdminRole(user?.role)) {
      router.replace("/");
    }
  }, [hydrated, router, token, user?.role]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await login({ email, password }).unwrap();
      const payload = result.data;
      if (!isAdminRole(payload.user.role)) {
        setError("Only admin accounts can access this portal.");
        return;
      }
      dispatch(
        setCredentials({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          user: payload.user,
        }),
      );
      router.replace("/");
    } catch (err) {
      const message =
        err && typeof err === "object" && "data" in err
          ? ((err.data as { message?: string })?.message ?? "Login failed")
          : "Login failed";
      setError(message);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-6 py-10">
      <div className="grid w-full max-w-[1276px] items-center gap-10 lg:grid-cols-2">
        <section className="rounded-[28px] border border-line-soft bg-white p-[76px] shadow-[0_24px_59px_rgba(166,124,56,0.08)]">
          <h1 className="text-[33px] font-bold tracking-tight text-ink">Admin Login</h1>
          <p className="mt-2 text-[16px] text-muted">
            Welcome back! Please sign in to your account.
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
                  className="h-[58px] w-full rounded-[14px] border border-line bg-input pl-12 pr-5 text-[16px] text-[#292522] outline-none focus:border-brand"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.7px] text-label">
                Password
              </span>
              <div className="relative">
                <Image
                  src="/images/icon-lock.svg"
                  alt=""
                  width={19}
                  height={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="h-[58px] w-full rounded-[14px] border border-line bg-input px-12 text-[16px] text-[#292522] outline-none focus:border-brand"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  aria-label="Toggle password visibility"
                >
                  <Image src="/images/icon-eye.svg" alt="" width={19} height={19} />
                </button>
              </div>
            </label>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-[#5c544a]">
                <span className="relative flex size-[21px] items-center justify-center rounded-[5px] bg-brand">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="absolute inset-0 opacity-0"
                  />
                  {remember ? (
                    <Image src="/images/icon-check.svg" alt="" width={19} height={19} />
                  ) : null}
                </span>
                Remember me
              </label>
              <Link href="/forgot-password" className="text-sm font-medium text-brand">
                Forgot password?
              </Link>
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <button
              type="submit"
              disabled={isLoading}
              className="h-[52px] w-full rounded-[14px] bg-brand text-[16px] font-semibold tracking-wide text-white shadow-[0_5px_7px_rgba(0,0,0,0.1)] disabled:opacity-70"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p className="mt-8 text-[13px] text-[#ab9f90]">
            Secure Admin Portal © 2024 MR International LLC. All rights reserved.
          </p>
        </section>
        <div className="flex items-center justify-center">
          <Image
            src="/images/logo.png"
            alt="MR International LLC"
            width={388}
            height={275}
            className="h-auto w-full max-w-[388px] object-contain"
            priority
          />
        </div>
      </div>
    </main>
  );
}
