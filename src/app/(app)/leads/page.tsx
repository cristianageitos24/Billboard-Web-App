"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { currentMonthYYYYMM, formatMonth } from "@/lib/format";
import { firstOfMonthBefore, toMonthYYYYMM } from "@/lib/dashboard/chart-range";
import { useMetricsTimeline } from "@/app/(app)/dashboard/hooks/useMetricsTimeline";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function LeadsPage() {
  const { user, loading: userLoading } = useUser();
  const [month, setMonth] = useState(currentMonthYYYYMM());
  const monthYYYYMM = toMonthYYYYMM(`${month}-01`);
  const from = firstOfMonthBefore(monthYYYYMM, 11);
  const to = `${monthYYYYMM}-01`;

  const { data, loading, error } = useMetricsTimeline(
    from,
    to,
    !!user && !userLoading
  );

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.orgSeries.map((p) => ({
      label: formatMonth(p.month),
      leads: p.totalLeads,
    }));
  }, [data]);

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
        <h1 className="text-xl font-bold text-neutral-900">Leads</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Monthly lead counts by billboard (rolling 12 months ending selected month).
        </p>
      </div>
      <div className="flex-1 p-6 max-w-6xl w-full mx-auto space-y-6">
        <label className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
          End month
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border border-neutral-300 px-2 py-1.5"
          />
        </label>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading && <p className="text-sm text-neutral-500">Loading…</p>}

        {!loading && data && data.boards.length === 0 && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center">
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">
              No billboards yet
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              Add billboards to track leads over time.
            </p>
            <Link
              href="/my-boards?add=1"
              className="inline-block py-2 px-4 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
            >
              Add billboard
            </Link>
          </div>
        )}

        {!loading && data && data.boards.length > 0 && (
          <>
            <section className="rounded-lg border border-neutral-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-neutral-800 mb-4">
                Total leads over time
              </h2>
              <div className="h-56 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} label={{ value: "Leads", angle: -90, position: "insideLeft", fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="leads" stroke="#171717" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
                Leads by board and month
              </h2>
              <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
                <table className="w-full text-sm border-collapse min-w-[32rem]">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="text-left py-2 px-3 font-semibold text-neutral-700">
                        Billboard
                      </th>
                      {data.months.map((m) => (
                        <th
                          key={m}
                          className="text-right py-2 px-2 font-semibold text-neutral-700 tabular-nums whitespace-nowrap"
                        >
                          {m.slice(0, 7)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.boards.map((b) => (
                      <tr key={b.orgBillboardId} className="border-b border-neutral-100">
                        <td className="py-2 px-3 font-medium text-neutral-900 max-w-[12rem]">
                          <span className="line-clamp-2">{b.name}</span>
                          <span className="block text-xs text-neutral-500">{b.displayId}</span>
                        </td>
                        {data.months.map((m) => (
                          <td
                            key={m}
                            className="text-right py-2 px-2 tabular-nums text-neutral-700"
                          >
                            {b.leadsByMonth[m] ?? 0}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <p className="text-xs text-neutral-500">
              Enter or edit metrics under{" "}
              <Link href="/my-boards" className="underline font-medium">
                Billboards
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </main>
  );
}
