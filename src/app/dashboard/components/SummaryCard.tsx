"use client";

import type { TrendItem } from "../hooks/useDashboardROI";

type SummaryCardProps = {
  label: string;
  value: string;
  sub?: string;
  trend?: TrendItem | null;
};

const trendStyles = {
  up: "text-green-700",
  down: "text-amber-700",
  neutral: "text-neutral-500",
};

export function SummaryCard({
  label,
  value,
  sub,
  trend,
}: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">
        {value}
      </p>
      {trend != null && (
        <p
          className={`mt-0.5 text-xs font-medium tabular-nums ${trendStyles[trend.direction]}`}
          title={trend.tooltip}
        >
          {trend.label}
        </p>
      )}
      {sub != null && (
        <p className="mt-0.5 text-xs text-neutral-500">{sub}</p>
      )}
    </div>
  );
}
