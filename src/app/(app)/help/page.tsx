"use client";

import Link from "next/link";
import { useUser } from "@/hooks/useUser";

export default function HelpPage() {
  const { user, loading: userLoading } = useUser();

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
        <h1 className="text-xl font-bold text-neutral-900">Help</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Quick answers for law firms tracking billboard ROI.
        </p>
      </div>
      <div className="flex-1 p-6 max-w-2xl w-full mx-auto space-y-8 text-sm text-neutral-700">
        <section>
          <h2 className="font-semibold text-neutral-900 mb-2">What is ROI multiple?</h2>
          <p>
            We calculate <strong>revenue ÷ spend</strong> for a period. Spend is
            the sum of monthly costs for boards marked active. Revenue comes from
            the metrics you enter per board each month.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-neutral-900 mb-2">Where do I enter leads?</h2>
          <p>
            Open{" "}
            <Link href="/my-boards" className="text-neutral-900 underline font-medium">
              Billboards
            </Link>
            , choose a board, and use <strong>Metrics</strong> to add monthly
            leads, signed cases, and revenue.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-neutral-900 mb-2">How do I add a board?</h2>
          <p>
            From{" "}
            <Link href="/inventory" className="text-neutral-900 underline font-medium">
              Inventory
            </Link>{" "}
            you can claim a location, or under Billboards use{" "}
            <strong>Add custom board</strong> for placements not in the map.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-neutral-900 mb-2">Exports</h2>
          <p>
            Use{" "}
            <Link href="/reports" className="text-neutral-900 underline font-medium">
              Reports
            </Link>{" "}
            to download CSV files for your own analysis or to share with finance.
          </p>
        </section>
      </div>
    </main>
  );
}
