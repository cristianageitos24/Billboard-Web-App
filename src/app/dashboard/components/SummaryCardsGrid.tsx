"use client";

import type { DashboardROISummary } from "@/types/dashboard-roi";
import type { DashboardTrends } from "../hooks/useDashboardROI";
import {
  formatCurrency,
  formatInteger,
  formatRatio,
} from "@/lib/format";
import { SummaryCard } from "./SummaryCard";

/** Sub copy when value is null (division-by-zero). */
export const DIV_ZERO_SUB: Record<string, string> = {
  costPerLead: "Add leads to see cost per lead",
  costPerSignedCase: "Add signed cases to see cost per case",
  roiMultiple: "Add spend to see ROI",
};

type TrendKey = keyof DashboardTrends;

type SummaryCardConfigItem = {
  key: string;
  label: string;
  getValue: (summary: DashboardROISummary) => string;
  /** Sub when value is null (e.g. division-by-zero). */
  subWhenNull?: string;
  /** Sub when value is present (e.g. "Revenue ÷ spend"). */
  subDefault?: string;
  trendKey?: TrendKey | null;
};

export const SUMMARY_CARD_CONFIG: SummaryCardConfigItem[] = [
  {
    key: "totalSpend",
    label: "Total spend",
    getValue: (s) => formatCurrency(s.totalSpend),
    subDefault: "Active boards × monthly cost",
    trendKey: "totalSpend",
  },
  {
    key: "totalLeads",
    label: "Total leads",
    getValue: (s) => formatInteger(s.totalLeads),
    trendKey: "totalLeads",
  },
  {
    key: "totalSignedCases",
    label: "Total signed cases",
    getValue: (s) => formatInteger(s.totalSignedCases),
    trendKey: "totalSignedCases",
  },
  {
    key: "totalRevenue",
    label: "Total revenue",
    getValue: (s) => formatCurrency(s.totalRevenue),
    trendKey: "totalRevenue",
  },
  {
    key: "costPerLead",
    label: "Cost per lead",
    getValue: (s) =>
      s.costPerLead != null ? formatCurrency(s.costPerLead) : "—",
    subWhenNull: DIV_ZERO_SUB.costPerLead,
    trendKey: null,
  },
  {
    key: "costPerSignedCase",
    label: "Cost per signed case",
    getValue: (s) =>
      s.costPerSignedCase != null
        ? formatCurrency(s.costPerSignedCase)
        : "—",
    subWhenNull: DIV_ZERO_SUB.costPerSignedCase,
    trendKey: null,
  },
  {
    key: "roiMultiple",
    label: "ROI multiple",
    getValue: (s) =>
      s.roiMultiple != null ? formatRatio(s.roiMultiple) : "—",
    subWhenNull: DIV_ZERO_SUB.roiMultiple,
    subDefault: "Revenue ÷ spend",
    trendKey: null,
  },
];

type SummaryCardsGridProps = {
  summary: DashboardROISummary;
  trends: DashboardTrends;
};

export function SummaryCardsGrid({ summary, trends }: SummaryCardsGridProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
      {SUMMARY_CARD_CONFIG.map((item) => {
        const value = item.getValue(summary);
        const isNull = value === "—";
        const sub = isNull && item.subWhenNull
          ? item.subWhenNull
          : item.subDefault;
        const trend =
          item.trendKey != null ? trends[item.trendKey] ?? null : null;
        return (
          <SummaryCard
            key={item.key}
            label={item.label}
            value={value}
            sub={sub}
            trend={trend}
          />
        );
      })}
    </section>
  );
}
