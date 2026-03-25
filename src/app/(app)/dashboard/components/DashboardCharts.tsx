"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardROIBoardRow } from "@/types/dashboard-roi";
import type { DashboardOrgMonthPoint } from "@/types/dashboard-timeline";
import { formatMonth } from "@/lib/format";

type DashboardChartsProps = {
  boards: DashboardROIBoardRow[];
  orgSeries: DashboardOrgMonthPoint[];
  chartRangeLabel: string;
};

function formatShortMonth(iso: string): string {
  try {
    return formatMonth(iso);
  } catch {
    return iso.slice(0, 7);
  }
}

export function DashboardCharts({
  boards,
  orgSeries,
  chartRangeLabel,
}: DashboardChartsProps) {
  const lineData = useMemo(
    () =>
      orgSeries.map((p) => ({
        label: formatShortMonth(p.month),
        roi: p.roiMultiple != null ? Number(p.roiMultiple.toFixed(3)) : null,
      })),
    [orgSeries]
  );

  const barData = useMemo(
    () =>
      [...boards]
        .sort((a, b) => (b.roiMultiple ?? -1) - (a.roiMultiple ?? -1))
        .slice(0, 12)
        .map((b) => ({
          name:
            b.name.length > 18 ? `${b.name.slice(0, 16)}…` : b.name,
          roi: b.roiMultiple != null ? Number(b.roiMultiple.toFixed(3)) : 0,
        })),
    [boards]
  );

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-neutral-800 mb-1">
          ROI over time
        </h3>
        <p className="text-xs text-neutral-500 mb-4">{chartRangeLabel}</p>
        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                label={{ value: "Month", position: "insideBottom", offset: -4, fontSize: 11 }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                label={{ value: "ROI (revenue ÷ spend)", angle: -90, position: "insideLeft", fontSize: 11 }}
              />
              <Tooltip
                formatter={(value) => [
                  value != null && value !== ""
                    ? Number(value).toFixed(3)
                    : "—",
                  "ROI",
                ]}
              />
              <Line
                type="monotone"
                dataKey="roi"
                stroke="#171717"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="ROI"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-neutral-800 mb-1">
          ROI by billboard
        </h3>
        <p className="text-xs text-neutral-500 mb-4">Selected month (top 12 by ROI)</p>
        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis type="number" tick={{ fontSize: 11 }} label={{ value: "ROI", position: "insideBottom", offset: -4, fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 10 }}
                label={{ value: "Billboard", angle: -90, position: "insideLeft", fontSize: 11 }}
              />
              <Tooltip
                formatter={(v) => [
                  v != null && v !== "" ? Number(v).toFixed(3) : "—",
                  "ROI",
                ]}
              />
              <Bar dataKey="roi" fill="#262626" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
