"use client";

import type { DashboardROIBoardRow } from "@/types/dashboard-roi";
import {
  formatCurrency,
  formatInteger,
  formatRatio,
} from "@/lib/format";

const EMPTY = "—";

type BoardBreakdownTableProps = {
  boards: DashboardROIBoardRow[];
  periodLabel: string;
};

function cellTitle(nullReason: string) {
  return { title: nullReason };
}

export function BoardBreakdownTable({
  boards,
  periodLabel,
}: BoardBreakdownTableProps) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
        Board performance ({periodLabel})
      </h2>
      <p className="text-sm text-neutral-500 mb-3">
        Only boards with metrics entered for this month are listed. Monthly cost
        is from the board&apos;s current setting; spend counts only if the
        board is active.
      </p>
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="text-left py-3 px-4 font-semibold text-neutral-700">
                Board
              </th>
              <th className="text-right py-3 px-3 font-semibold text-neutral-700 tabular-nums">
                Monthly cost
              </th>
              <th className="text-right py-3 px-3 font-semibold text-neutral-700 tabular-nums">
                Leads
              </th>
              <th className="text-right py-3 px-3 font-semibold text-neutral-700 tabular-nums">
                Signed cases
              </th>
              <th className="text-right py-3 px-3 font-semibold text-neutral-700 tabular-nums">
                Revenue
              </th>
              <th className="text-right py-3 px-3 font-semibold text-neutral-700 tabular-nums">
                Cost per lead
              </th>
              <th className="text-right py-3 px-3 font-semibold text-neutral-700 tabular-nums">
                Cost per case
              </th>
              <th className="text-right py-3 px-3 font-semibold text-neutral-700 tabular-nums">
                ROI
              </th>
            </tr>
          </thead>
          <tbody>
            {boards.map((row) => (
              <tr
                key={row.orgBillboardId}
                className="border-b border-neutral-100 hover:bg-neutral-50/50"
              >
                <td className="py-3 px-4 font-medium text-neutral-900">
                  {row.name}
                </td>
                <td className="text-right py-3 px-3 tabular-nums text-neutral-700">
                  {formatCurrency(row.monthlyCost)}
                </td>
                <td className="text-right py-3 px-3 tabular-nums text-neutral-700">
                  {formatInteger(row.leads)}
                </td>
                <td className="text-right py-3 px-3 tabular-nums text-neutral-700">
                  {formatInteger(row.signedCases)}
                </td>
                <td className="text-right py-3 px-3 tabular-nums font-medium text-neutral-900">
                  {formatCurrency(row.revenue)}
                </td>
                <td
                  className="text-right py-3 px-3 tabular-nums text-neutral-700"
                  {...(row.costPerLead == null
                    ? cellTitle("No leads this month")
                    : {})}
                >
                  {row.costPerLead != null
                    ? formatCurrency(row.costPerLead)
                    : EMPTY}
                </td>
                <td
                  className="text-right py-3 px-3 tabular-nums text-neutral-700"
                  {...(row.costPerSignedCase == null
                    ? cellTitle("No signed cases this month")
                    : {})}
                >
                  {row.costPerSignedCase != null
                    ? formatCurrency(row.costPerSignedCase)
                    : EMPTY}
                </td>
                <td
                  className="text-right py-3 px-3 tabular-nums font-medium text-neutral-900"
                  {...(row.roiMultiple == null
                    ? cellTitle("No spend this month")
                    : {})}
                >
                  {row.roiMultiple != null
                    ? formatRatio(row.roiMultiple)
                    : EMPTY}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
