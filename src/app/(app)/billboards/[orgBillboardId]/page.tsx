"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import {
  formatCurrency,
  formatInteger,
  formatMonth,
  formatRatio,
} from "@/lib/format";
import { firstOfMonthBefore, toMonthYYYYMM } from "@/lib/dashboard/chart-range";
import { useMetricsTimeline } from "@/app/(app)/dashboard/hooks/useMetricsTimeline";

function BillboardDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = typeof params.orgBillboardId === "string" ? params.orgBillboardId : "";
  const monthParam = searchParams.get("month");
  const { user, loading: userLoading } = useUser();

  const [endMonth, setEndMonth] = useState(() => {
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) return monthParam;
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const monthYYYYMM = toMonthYYYYMM(`${endMonth}-01`);
  const from = firstOfMonthBefore(monthYYYYMM, 11);
  const to = `${monthYYYYMM}-01`;

  const { data, loading, error } = useMetricsTimeline(
    from,
    to,
    !!user && !userLoading && !!id
  );

  const board = useMemo(
    () => data?.boards.find((b) => b.orgBillboardId === id),
    [data, id]
  );

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
        <div className="flex flex-wrap items-center gap-4 max-w-4xl mx-auto w-full">
          <Link
            href="/dashboard"
            className="text-sm text-neutral-600 hover:text-neutral-900 underline"
          >
            ← Dashboard
          </Link>
        </div>
        <h1 className="text-xl font-bold text-neutral-900 mt-2">
          {board?.name ?? "Billboard"}
        </h1>
        {board && (
          <p className="text-sm text-neutral-500 mt-0.5">
            {board.location}
            {board.city ? ` · ${board.city}` : ""} · {board.displayId}
          </p>
        )}
      </div>

      <div className="flex-1 p-6 max-w-4xl w-full mx-auto space-y-6">
        <label className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
          End month (12-month window)
          <input
            type="month"
            value={endMonth}
            onChange={(e) => setEndMonth(e.target.value)}
            className="rounded-md border border-neutral-300 px-2 py-1.5"
          />
        </label>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading && <p className="text-sm text-neutral-500">Loading…</p>}

        {!loading && !board && data && (
          <p className="text-sm text-neutral-600">
            Board not found or not in your organization.
          </p>
        )}

        {!loading && board && (
          <>
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-neutral-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Monthly cost
                </p>
                <p className="text-xl font-semibold tabular-nums mt-1">
                  {formatCurrency(board.monthlyCost)}
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Status
                </p>
                <p className="text-xl font-semibold mt-1">
                  {board.isActive ? "Active" : "Inactive"}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
                Monthly performance
              </h2>
              <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="text-left py-2 px-3 font-semibold text-neutral-700">
                        Month
                      </th>
                      <th className="text-right py-2 px-3 font-semibold text-neutral-700">
                        Leads
                      </th>
                      <th className="text-right py-2 px-3 font-semibold text-neutral-700">
                        Cases
                      </th>
                      <th className="text-right py-2 px-3 font-semibold text-neutral-700">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data!.months.map((m) => {
                      const leads = board.leadsByMonth[m] ?? 0;
                      const cases = board.signedCasesByMonth[m] ?? 0;
                      const rev = board.revenueByMonth[m] ?? 0;
                      const spend = board.isActive ? board.monthlyCost : 0;
                      const roi = spend > 0 ? rev / spend : null;
                      return (
                        <tr key={m} className="border-b border-neutral-100">
                          <td className="py-2 px-3">{formatMonth(m)}</td>
                          <td className="text-right py-2 px-3 tabular-nums">
                            {formatInteger(leads)}
                          </td>
                          <td className="text-right py-2 px-3 tabular-nums">
                            {formatInteger(cases)}
                          </td>
                          <td className="text-right py-2 px-3 tabular-nums">
                            {formatCurrency(rev)}
                            {roi != null && (
                              <span className="block text-xs text-neutral-500">
                                ROI {formatRatio(roi)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <Link
              href="/my-boards"
              className="inline-block text-sm font-medium text-neutral-900 underline"
            >
              Edit board or metrics in Billboards
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function BillboardDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <p className="text-sm text-neutral-500">Loading…</p>
        </main>
      }
    >
      <BillboardDetailContent />
    </Suspense>
  );
}
