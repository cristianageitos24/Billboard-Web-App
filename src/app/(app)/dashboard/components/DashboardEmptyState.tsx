"use client";

import Link from "next/link";

export type DashboardEmptyStateReason = "no_metrics" | "no_boards";

type DashboardEmptyStateProps = {
  periodLabel: string;
  reason: DashboardEmptyStateReason;
};

const COPY: Record<
  DashboardEmptyStateReason,
  { heading: string; body: string }
> = {
  no_metrics: {
    heading: "No data for this month",
    body: "Add monthly metrics under Billboards to see ROI and performance here.",
  },
  no_boards: {
    heading: "No billboards added yet",
    body: "Claim boards from inventory or add a custom location to start tracking spend and ROI.",
  },
};

export function DashboardEmptyState({
  periodLabel,
  reason,
}: DashboardEmptyStateProps) {
  const { heading, body } = COPY[reason];
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center">
      <h2 className="text-lg font-semibold text-neutral-900 mb-2">
        {reason === "no_metrics" ? `No data for ${periodLabel}` : heading}
      </h2>
      <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6">{body}</p>
      <Link
        href={reason === "no_boards" ? "/my-boards?add=1" : "/my-boards"}
        className="inline-block py-2 px-4 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
      >
        {reason === "no_boards" ? "Add billboard" : "Go to Billboards"}
      </Link>
    </div>
  );
}
