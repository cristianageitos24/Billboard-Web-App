"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { signOutAndRedirect } from "@/app/actions/auth";
import { Toaster } from "sonner";
import { AppSidebar } from "./AppSidebar";

const STORAGE_KEY = "billboard-app-sidebar-collapsed";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { user, loading } = useUser();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "1") {
        startTransition(() => setCollapsed(true));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapse = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-6">
        <p className="text-sm text-neutral-500 mb-4">Sign in to continue.</p>
        <Link
          href="/login"
          className="text-sm font-medium text-neutral-900 underline"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <AppSidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-end gap-3 border-b border-neutral-200 bg-white px-4 text-sm">
          <span
            className="mr-auto truncate text-neutral-600 max-w-[50%] sm:max-w-none"
            title={user.email ?? undefined}
          >
            {user.email}
          </span>
          <form action={signOutAndRedirect}>
            <button
              type="submit"
              className="text-neutral-600 hover:text-neutral-900 underline"
            >
              Log out
            </button>
          </form>
        </header>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
