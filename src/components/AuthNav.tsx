"use client";

import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { signOutAndRedirect } from "@/app/actions/auth";

export default function AuthNav() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <nav className="flex items-center justify-end gap-2 h-10 px-4 text-sm text-neutral-500">
        …
      </nav>
    );
  }

  if (user) {
    return (
      <nav className="flex items-center justify-end gap-3 h-10 px-4 text-sm">
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
    );
  }

  return (
    <nav className="flex items-center justify-end gap-3 h-10 px-4 text-sm">
      <Link href="/login" className="text-foreground/80 hover:text-foreground underline">
        Log in
      </Link>
      <Link href="/signup" className="text-foreground/80 hover:text-foreground underline">
        Sign up
      </Link>
    </nav>
  );
}
