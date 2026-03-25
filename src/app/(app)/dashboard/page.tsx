"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { currentMonthYYYYMM, formatMonth } from "@/lib/format";
import { firstOfMonthBefore, toMonthYYYYMM } from "@/lib/dashboard/chart-range";
import { useDashboardROI } from "./hooks/useDashboardROI";
import { useMetricsTimeline } from "./hooks/useMetricsTimeline";
import { MonthFilter } from "./components/MonthFilter";
import { RoiKpiStrip } from "./components/RoiKpiStrip";
import { BillboardRoiTable } from "./components/BillboardRoiTable";
import { DashboardCharts } from "./components/DashboardCharts";
import { DashboardEmptyState } from "./components/DashboardEmptyState";

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const [month, setMonth] = useState(currentMonthYYYYMM());
  const [chartRangeMonths, setChartRangeMonths] = useState<6 | 12>(6);
  const {
    data,
    loading,
    error,
    refetch,
    trends,
  } = useDashboardROI(month, !!user);

  const monthYYYYMM = toMonthYYYYMM(
    data?.period?.month ?? `${month}-01`
  );
  const timelineFrom = useMemo(() => {
    const m = toMonthYYYYMM(`${month}-01`);
    return firstOfMonthBefore(m, chartRangeMonths - 1);
  }, [month, chartRangeMonths]);
  const timelineTo = useMemo(() => {
    return `${toMonthYYYYMM(`${month}-01`)}-01`;
  }, [month]);

  const { data: timeline, loading: timelineLoading } = useMetricsTimeline(
    timelineFrom,
    timelineTo,
    !!user && !userLoading
  );

  const periodLabel = data?.period?.month
    ? formatMonth(data.period.month)
    : "—";
  const anyMetricsEntered =
    data?.boards.some((b) => b.hasMetrics) ||
    (data?.summary.totalRevenue ?? 0) > 0 ||
    (data?.summary.totalLeads ?? 0) > 0;

  if (userLoading || !user) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[40vh] p-6">
        <p className="text-sm text-neutral-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-0">
      <div className="border-b border-neutral-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4 max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Dashboard</h1>
            <p className="text-sm text-neutral-500 mt-0.5 max-w-xl">
              Billboard ROI at a glance: spend, leads, and return for your firm.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/my-boards?add=1"
              className="inline-flex items-center rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Add billboard
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-7xl w-full mx-auto">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <MonthFilter value={month} onChange={setMonth} loading={loading} />
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            Chart range
            <select
              value={chartRangeMonths}
              onChange={(e) =>
                setChartRangeMonths(Number(e.target.value) as 6 | 12)
              }
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            >
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
            </select>
          </label>
        </div>

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
          <div className="text-sm text-neutral-500">Loading dashboard…</div>
        )}

        {!loading && data && data.orgBoardCount === 0 && (
          <DashboardEmptyState periodLabel={periodLabel} reason="no_boards" />
        )}

        {!loading && data && data.orgBoardCount > 0 && (
          <>
            <p className="text-sm text-neutral-500 mb-6">
              Showing <strong>{periodLabel}</strong>. Compare boards below; open
              a row for detail.
            </p>

            {!anyMetricsEntered && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-6">
                No lead or revenue data for this month yet. Enter metrics in{" "}
                <Link href="/my-boards" className="font-medium underline">
                  Billboards
                </Link>{" "}
                to see full ROI.
              </div>
            )}

            <RoiKpiStrip summary={data.summary} trends={trends} />

            <div className="space-y-10 min-w-0">
              <BillboardRoiTable
                boards={data.boards}
                periodLabel={periodLabel}
                monthYYYYMM={monthYYYYMM}
                onRefresh={refetch}
              />
              {timelineLoading && (
                <p className="text-sm text-neutral-500">Loading charts…</p>
              )}
              {!timelineLoading && timeline && (
                <DashboardCharts
                  boards={data.boards}
                  orgSeries={timeline.orgSeries}
                  chartRangeLabel={`${formatMonth(timelineFrom)} – ${formatMonth(timelineTo)}`}
                />
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
