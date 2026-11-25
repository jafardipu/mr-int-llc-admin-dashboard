"use client";

import { AuthGuard } from "./auth-guard";
import { Sidebar } from "./sidebar";
import { Toaster } from "./toast";
import { Topbar } from "./topbar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#f7f7f7]">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Topbar />
          <main className="px-8 pb-10">{children}</main>
        </div>
      </div>
      <Toaster />
    </AuthGuard>
  );
}
