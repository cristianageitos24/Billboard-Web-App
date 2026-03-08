"use client";

import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { signOutAndRedirect } from "@/app/actions/auth";

export default function AuthNav() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <header className="flex items-center justify-between gap-4 h-10 px-4 text-sm text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
        <span className="font-semibold text-neutral-700">MarketTrace</span>
        <nav className="flex items-center gap-2">…</nav>
      </header>
    );
  }

  if (user) {
    return (
      <header className="flex items-center justify-between gap-4 h-10 px-4 text-sm border-b border-neutral-200 dark:border-neutral-800">
        <Link href="/dashboard" className="font-semibold text-neutral-900 hover:text-neutral-700 shrink-0">
          MarketTrace
        </Link>
        <nav className="flex items-center justify-end gap-3 flex-wrap">
        <Link href="/dashboard" className="text-foreground/80 hover:text-foreground underline">
          Dashboard
        </Link>
        <Link href="/my-boards" className="text-foreground/80 hover:text-foreground underline">
          My Boards
        </Link>
        <Link href="/inventory" className="text-foreground/80 hover:text-foreground underline">
          Inventory
        </Link>
        <Link href="/settings" className="text-foreground/80 hover:text-foreground underline">
          Settings
        </Link>
        <span className="text-foreground/80 truncate max-w-[180px]" title={user.email ?? undefined}>
          {user.email}
        </span>
        <form action={signOutAndRedirect}>
          <button
            type="submit"
            className="text-foreground/70 hover:text-foreground underline"
          >
            Log out
          </button>
        </form>
        </nav>
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between gap-4 h-10 px-4 text-sm border-b border-neutral-200 dark:border-neutral-800">
      <span className="font-semibold text-neutral-700">MarketTrace</span>
      <nav className="flex items-center justify-end gap-3">
      <Link href="/login" className="text-foreground/80 hover:text-foreground underline">
        Log in
      </Link>
      <Link href="/signup" className="text-foreground/80 hover:text-foreground underline">
        Sign up
      </Link>
      </nav>
    </header>
  );
}
