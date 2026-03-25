"use client";

import type { DashboardROISummary } from "@/types/dashboard-roi";
import type { DashboardTrends } from "../hooks/useDashboardROI";
import {
  formatCurrency,
  formatInteger,
  formatRatio,
} from "@/lib/format";
import { SummaryCard } from "./SummaryCard";

const DIV_ZERO_SUB: Record<string, string> = {
  costPerLead: "Add leads to see cost per lead",
  roiMultiple: "Add spend to see ROI",
};

type RoiKpiStripProps = {
  summary: DashboardROISummary;
  trends: DashboardTrends;
};

const ITEMS: {
  key: keyof DashboardTrends;
  label: string;
  getValue: (s: DashboardROISummary) => string;
  subWhenNull?: string;
  subDefault?: string;
}[] = [
  {
    key: "totalSpend",
    label: "Total spend",
    getValue: (s) => formatCurrency(s.totalSpend),
    subDefault: "Active boards × monthly cost",
  },
  {
    key: "totalLeads",
    label: "Total leads",
    getValue: (s) => formatInteger(s.totalLeads),
  },
  {
    key: "costPerLead",
    label: "Cost per lead",
    getValue: (s) =>
      s.costPerLead != null ? formatCurrency(s.costPerLead) : "—",
    subWhenNull: DIV_ZERO_SUB.costPerLead,
  },
  {
    key: "roiMultiple",
    label: "ROI multiple",
    getValue: (s) =>
      s.roiMultiple != null ? formatRatio(s.roiMultiple) : "—",
    subWhenNull: DIV_ZERO_SUB.roiMultiple,
    subDefault: "Revenue ÷ spend",
  },
];

export function RoiKpiStrip({ summary, trends }: RoiKpiStripProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {ITEMS.map((item) => {
        const value = item.getValue(summary);
        const isNull = value === "—";
        const sub =
          isNull && item.subWhenNull
            ? item.subWhenNull
            : item.subDefault;
        const trend = trends[item.key] ?? null;
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
