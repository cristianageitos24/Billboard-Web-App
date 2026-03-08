"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  DashboardROIResponse,
  DashboardROISummary,
} from "@/types/dashboard-roi";
import { previousMonth, formatMonth } from "@/lib/format";

export type TrendItem = {
  direction: "up" | "down" | "neutral";
  /** e.g. "↑ 12%" or "↓ 8%" or "new" */
  label: string;
  /** Tooltip: "vs March 2025" */
  tooltip: string;
  pct: number | null;
};

export type DashboardTrends = {
  totalSpend: TrendItem | null;
  totalLeads: TrendItem | null;
  totalSignedCases: TrendItem | null;
  totalRevenue: TrendItem | null;
};

function computeTrend(
  current: number,
  previous: number | undefined,
  previousMonthLabel: string
): TrendItem | null {
  if (previous === undefined) return null;
  const prev = previous ?? 0;
  const delta = current - prev;
  if (prev === 0) {
    if (current === 0) return null;
    return {
      direction: "up",
      label: "new",
      tooltip: `vs ${previousMonthLabel}`,
      pct: null,
    };
  }
  const pct = (delta / prev) * 100;
  const direction: TrendItem["direction"] =
    pct > 0 ? "up" : pct < 0 ? "down" : "neutral";
  const sign = pct > 0 ? "↑ " : pct < 0 ? "↓ " : "";
  const label = pct === 0 ? "no change" : `${sign}${Math.abs(pct).toFixed(1)}%`;
  return {
    direction,
    label,
    tooltip: `vs ${previousMonthLabel}`,
    pct,
  };
}

function buildTrends(
  summary: DashboardROISummary,
  previousSummary: DashboardROISummary | null,
  previousMonthLabel: string
): DashboardTrends {
  if (!previousSummary) {
    return {
      totalSpend: null,
      totalLeads: null,
      totalSignedCases: null,
      totalRevenue: null,
    };
  }
  return {
    totalSpend: computeTrend(
      summary.totalSpend,
      previousSummary.totalSpend,
      previousMonthLabel
    ),
    totalLeads: computeTrend(
      summary.totalLeads,
      previousSummary.totalLeads,
      previousMonthLabel
    ),
    totalSignedCases: computeTrend(
      summary.totalSignedCases,
      previousSummary.totalSignedCases,
      previousMonthLabel
    ),
    totalRevenue: computeTrend(
      summary.totalRevenue,
      previousSummary.totalRevenue,
      previousMonthLabel
    ),
  };
}

export type UseDashboardROIResult = {
  data: DashboardROIResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  trends: DashboardTrends;
  previousMonthLabel: string | null;
};

export function useDashboardROI(
  month: string,
  enabled: boolean
): UseDashboardROIResult {
  const [data, setData] = useState<DashboardROIResponse | null>(null);
  const [previousData, setPreviousData] =
    useState<DashboardROIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchROI = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    const prevMonth = previousMonth(month);
    try {
      const [currentRes, previousRes] = await Promise.all([
        fetch(`/api/dashboard/roi?month=${encodeURIComponent(month)}`),
        prevMonth
          ? fetch(
              `/api/dashboard/roi?month=${encodeURIComponent(prevMonth)}`
            )
          : Promise.resolve(null),
      ]);
      if (!currentRes.ok) {
        const body = await currentRes.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed: ${currentRes.status}`);
      }
      const currentJson: DashboardROIResponse = await currentRes.json();
      setData(currentJson);
      if (previousRes?.ok) {
        const prevJson: DashboardROIResponse = await previousRes.json();
        setPreviousData(prevJson);
      } else {
        setPreviousData(null);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load dashboard"
      );
      setData(null);
      setPreviousData(null);
    } finally {
      setLoading(false);
    }
  }, [month, enabled]);

  useEffect(() => {
    fetchROI();
  }, [fetchROI]);

  const trends =
    data?.summary && previousData?.summary
      ? buildTrends(
          data.summary,
          previousData.summary,
          formatMonth(previousData.period.month)
        )
      : {
          totalSpend: null,
          totalLeads: null,
          totalSignedCases: null,
          totalRevenue: null,
        };

  const previousMonthLabel =
    previousData?.period?.month != null
      ? formatMonth(previousData.period.month)
      : null;

  return {
    data,
    loading,
    error,
    refetch: fetchROI,
    trends,
    previousMonthLabel,
  };
}
