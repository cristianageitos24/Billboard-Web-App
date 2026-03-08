"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { currentMonthYYYYMM, formatMonth } from "@/lib/format";
import { useDashboardROI } from "./hooks/useDashboardROI";
import { MonthFilter } from "./components/MonthFilter";
import { SummaryCardsGrid } from "./components/SummaryCardsGrid";
import { BoardBreakdownTable } from "./components/BoardBreakdownTable";
import { DashboardEmptyState } from "./components/DashboardEmptyState";
import { hasNoMetricsForMonth } from "./utils";

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const [month, setMonth] = useState(currentMonthYYYYMM());
  const {
    data,
    loading,
    error,
    refetch,
    trends,
  } = useDashboardROI(month, !!user);

  useEffect(() => {
    if (userLoading || user) return;
    window.location.href = `/login?next=${encodeURIComponent("/dashboard")}`;
  }, [userLoading, user]);

  const periodLabel = data?.period?.month
    ? formatMonth(data.period.month)
    : "—";
  const noMetricsAtAll = data != null && hasNoMetricsForMonth(data);
  const hasBoards = (data?.boards?.length ?? 0) > 0;

  if (userLoading || !user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-sm text-neutral-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="border-b border-neutral-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm text-neutral-600 hover:text-neutral-900 underline"
            >
              ← Back to map
            </Link>
            <h1 className="text-xl font-bold text-neutral-900 mt-1">
              ROI Dashboard
            </h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              See whether billboard marketing is working. Totals use your
              organization&apos;s claimed boards and monthly metrics.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-6xl w-full mx-auto">
        <MonthFilter value={month} onChange={setMonth} loading={loading} />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-800" role="alert">
              {error}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 py-2 px-3 rounded-md bg-red-100 text-red-800 text-sm font-medium hover:bg-red-200"
            >
              Try again
            </button>
          </div>
        )}

        {loading && !data && (
          <div className="text-sm text-neutral-500">
            Loading dashboard…
          </div>
        )}

        {!loading && data && noMetricsAtAll && (
          <DashboardEmptyState
            periodLabel={periodLabel}
            reason="no_metrics"
          />
        )}

        {!loading && data && !noMetricsAtAll && (
          <>
            <p className="text-sm text-neutral-500 mb-4">
              Showing data for <strong>{periodLabel}</strong>. Spend = sum of
              monthly cost for active boards. Leads, cases, and revenue from
              metrics entered in My Boards.
            </p>

            <SummaryCardsGrid summary={data.summary} trends={trends} />

            {hasBoards ? (
              <BoardBreakdownTable
                boards={data.boards}
                periodLabel={periodLabel}
              />
            ) : (
              <DashboardEmptyState
                periodLabel={periodLabel}
                reason="no_boards"
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
