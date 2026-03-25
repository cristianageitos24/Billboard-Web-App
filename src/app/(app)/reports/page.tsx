"use client";

import { useMemo, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { currentMonthYYYYMM } from "@/lib/format";
import { firstOfMonthBefore, toMonthYYYYMM } from "@/lib/dashboard/chart-range";
import { toast } from "sonner";

export default function ReportsPage() {
  const { user, loading: userLoading } = useUser();
  const [month, setMonth] = useState(currentMonthYYYYMM());
  const monthYYYYMM = toMonthYYYYMM(`${month}-01`);
  const from = firstOfMonthBefore(monthYYYYMM, 11);
  const to = `${monthYYYYMM}-01`;

  const rangeLabel = useMemo(
    () => `${from.slice(0, 7)} → ${to.slice(0, 7)}`,
    [from, to]
  );

  function download(url: string, filenameHint: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filenameHint;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function handleExportRange() {
    try {
      const res = await fetch(
        `/api/dashboard/export?from=${encodeURIComponent(from.slice(0, 7))}&to=${encodeURIComponent(to.slice(0, 7))}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      download(url, `billboard-roi-${from.slice(0, 7)}-to-${to.slice(0, 7)}.csv`);
      URL.revokeObjectURL(url);
      toast.success("Download started.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  }

  async function handleExportSingleMonth() {
    const m = monthYYYYMM;
    try {
      const res = await fetch(
        `/api/dashboard/export?from=${encodeURIComponent(m)}&to=${encodeURIComponent(m)}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      download(url, `billboard-roi-${m}.csv`);
      URL.revokeObjectURL(url);
      toast.success("Download started.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  }

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
        <h1 className="text-xl font-bold text-neutral-900">Reports</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Export ROI and performance data as CSV for your records or firm reporting.
        </p>
      </div>
      <div className="flex-1 p-6 max-w-2xl w-full mx-auto space-y-6">
        <section className="rounded-lg border border-neutral-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Date range
          </h2>
          <label className="flex flex-wrap items-center gap-2 text-sm text-neutral-700">
            End month (12-month window ends here)
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-md border border-neutral-300 px-2 py-1.5"
            />
          </label>
          <p className="text-sm text-neutral-600">
            Rolling export window: <strong>{rangeLabel}</strong>
          </p>
          <button
            type="button"
            onClick={handleExportRange}
            className="inline-flex rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Download CSV (12 months)
          </button>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Single month
          </h2>
          <p className="text-sm text-neutral-600">
            One file for <strong>{monthYYYYMM}</strong> only (all boards, one row per board).
          </p>
          <button
            type="button"
            onClick={handleExportSingleMonth}
            className="inline-flex rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
          >
            Download CSV (this month only)
          </button>
        </section>
      </div>
    </main>
  );
}
