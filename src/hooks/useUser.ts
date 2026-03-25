"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface UseUserResult {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Shared auth hook: uses getUser() for initial load and onAuthStateChange for updates.
 * Use in any client component that needs the current user.
 */
export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data: { user: u }, error: err }) => {
        setUser(u ?? null);
        setError(err ?? null);
      })
      .finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setError(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { user, loading, error };
}
