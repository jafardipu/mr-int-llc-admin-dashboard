"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAdminRole } from "@/lib/auth";
import { useAppSelector } from "@/store/hooks";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!token || !isAdminRole(user?.role)) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [hydrated, router, token, user?.role]);

  if (!ready) return <div className="min-h-screen bg-[#f7f7f7]" />;
  return children;
}
