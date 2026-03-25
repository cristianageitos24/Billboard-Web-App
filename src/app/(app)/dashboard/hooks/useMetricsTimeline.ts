"use client";

import { useCallback, useEffect, useState } from "react";
import type { DashboardMetricsTimelineResponse } from "@/types/dashboard-timeline";

export function useMetricsTimeline(
  from: string | null,
  to: string | null,
  enabled: boolean
) {
  const [data, setData] = useState<DashboardMetricsTimelineResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    if (!enabled || !from || !to) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/dashboard/metrics-timeline?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? `Request failed: ${res.status}`);
      }
      setData(body as DashboardMetricsTimelineResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load timeline");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [from, to, enabled]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return { data, loading, error, refetch: fetchTimeline };
}
