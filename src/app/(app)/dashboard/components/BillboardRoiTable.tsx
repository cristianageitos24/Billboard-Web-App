"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DashboardROIBoardRow } from "@/types/dashboard-roi";
import {
  formatCurrency,
  formatInteger,
  formatRatio,
} from "@/lib/format";
import { toast } from "sonner";

const EMPTY = "—";

type SortKey = "roi" | "spend" | "leads";
type ActiveFilter = "all" | "active" | "inactive";

type BillboardRoiTableProps = {
  boards: DashboardROIBoardRow[];
  periodLabel: string;
  monthYYYYMM: string;
  onRefresh: () => Promise<void>;
};

function cellTitle(nullReason: string) {
  return { title: nullReason };
}

export function BillboardRoiTable({
  boards,
  periodLabel,
  monthYYYYMM,
  onRefresh,
}: BillboardRoiTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState<string>("all");
  const [roiMin, setRoiMin] = useState("");
  const [roiMax, setRoiMax] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("roi");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);

  const cities = useMemo(() => {
    const s = new Set<string>();
    for (const b of boards) {
      if (b.city) s.add(b.city);
    }
    return Array.from(s).sort();
  }, [boards]);

  const filtered = useMemo(() => {
    let rows = boards.filter((b) => {
      if (activeFilter === "active" && !b.isActive) return false;
      if (activeFilter === "inactive" && b.isActive) return false;
      if (city !== "all" && b.city !== city) return false;
      const q = search.trim().toLowerCase();
      if (q) {
        const hay = `${b.name} ${b.location} ${b.displayId}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const roi = b.roiMultiple;
      if (roiMin !== "") {
        const n = Number(roiMin);
        if (!Number.isNaN(n) && (roi == null || roi < n)) return false;
      }
      if (roiMax !== "") {
        const n = Number(roiMax);
        if (!Number.isNaN(n) && (roi == null || roi > n)) return false;
      }
      return true;
    });

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "roi") {
        const ar = a.roiMultiple ?? -Infinity;
        const br = b.roiMultiple ?? -Infinity;
        cmp = ar - br;
      } else if (sortKey === "spend") {
        cmp = a.spend - b.spend;
      } else {
        cmp = a.leads - b.leads;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [
    boards,
    search,
    city,
    roiMin,
    roiMax,
    activeFilter,
    sortKey,
    sortDir,
  ]);

  const allFilteredSelected =
    filtered.length > 0 &&
    filtered.every((b) => selected.has(b.orgBillboardId));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((b) => b.orgBillboardId)));
    }
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkDeactivate() {
    if (selected.size === 0) return;
    setBulkWorking(true);
    try {
      const ids = [...selected];
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/org-billboards/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_active: false }),
          })
        )
      );
      const failed = results.filter((r) => !r.ok);
      if (failed.length) {
        toast.error(`${failed.length} board(s) could not be updated.`);
      } else {
        toast.success("Marked boards inactive.");
      }
      setSelected(new Set());
      await onRefresh();
    } catch {
      toast.error("Bulk update failed.");
    } finally {
      setBulkWorking(false);
    }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Billboard performance ({periodLabel})
          </h2>
          <p className="text-sm text-neutral-500 mt-1 max-w-2xl">
            Spend applies to active boards. ROI = revenue ÷ spend for the month.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <label className="flex flex-col gap-0.5 text-xs text-neutral-600">
          Search
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, location, ID"
            className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm w-48 min-w-[8rem]"
          />
        </label>
        <label className="flex flex-col gap-0.5 text-xs text-neutral-600">
          City
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          >
            <option value="all">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-0.5 text-xs text-neutral-600">
          ROI min
          <input
            type="number"
            step="any"
            value={roiMin}
            onChange={(e) => setRoiMin(e.target.value)}
            className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm w-24"
          />
        </label>
        <label className="flex flex-col gap-0.5 text-xs text-neutral-600">
          ROI max
          <input
            type="number"
            step="any"
            value={roiMax}
            onChange={(e) => setRoiMax(e.target.value)}
            className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm w-24"
          />
        </label>
        <div className="flex flex-col gap-0.5 text-xs text-neutral-600">
          <span>Status</span>
          <div className="flex rounded-md border border-neutral-300 overflow-hidden">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={`px-2.5 py-1.5 text-xs font-medium ${
                  activeFilter === f
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {f === "all" ? "All" : f === "active" ? "Active" : "Inactive"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-3 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm">
          <span className="text-neutral-600">{selected.size} selected</span>
          <button
            type="button"
            disabled={bulkWorking}
            onClick={bulkDeactivate}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {bulkWorking ? "…" : "Mark inactive"}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="text-left py-3 px-2 w-10">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all rows"
                />
              </th>
              <th className="text-left py-3 px-3 font-semibold text-neutral-700">
                Board / ID
              </th>
              <th className="text-left py-3 px-3 font-semibold text-neutral-700">
                Location
              </th>
              <th className="text-right py-3 px-3 font-semibold text-neutral-700 tabular-nums">
                <button
                  type="button"
                  className="font-semibold hover:underline"
                  onClick={() => toggleSort("spend")}
                >
                  Monthly spend{sortIndicator("spend")}
                </button>
              </th>
              <th className="text-right py-3 px-3 font-semibold text-neutral-700 tabular-nums">
                <button
                  type="button"
                  className="font-semibold hover:underline"
                  onClick={() => toggleSort("leads")}
                >
                  Leads{sortIndicator("leads")}
                </button>
              </th>
              <th className="text-right py-3 px-3 font-semibold text-neutral-700 tabular-nums">
                Cases signed
              </th>
              <th className="text-right py-3 px-3 font-semibold text-neutral-700 tabular-nums">
                Revenue
              </th>
              <th className="text-right py-3 px-3 font-semibold text-neutral-700 tabular-nums">
                <button
                  type="button"
                  className="font-semibold hover:underline"
                  onClick={() => toggleSort("roi")}
                >
                  ROI{sortIndicator("roi")}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.orgBillboardId}
                className="border-b border-neutral-100 hover:bg-neutral-50/50 cursor-pointer"
                onClick={() =>
                  router.push(
                    `/billboards/${row.orgBillboardId}?month=${encodeURIComponent(monthYYYYMM)}`
                  )
                }
              >
                <td
                  className="py-3 px-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(row.orgBillboardId)}
                    onChange={() => toggleRow(row.orgBillboardId)}
                    aria-label={`Select ${row.name}`}
                  />
                </td>
                <td className="py-3 px-3 font-medium text-neutral-900">
                  <span className="block">{row.name}</span>
                  <span className="text-xs font-normal text-neutral-500">
                    {row.displayId}
                    {!row.isActive && (
                      <span className="ml-2 text-amber-700">Inactive</span>
                    )}
                  </span>
                </td>
                <td className="py-3 px-3 text-neutral-700 max-w-[14rem]">
                  <span className="line-clamp-2">{row.location}</span>
                  {row.city && (
                    <span className="block text-xs text-neutral-500">
                      {row.city}
                    </span>
                  )}
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
      {filtered.length === 0 && (
        <p className="text-sm text-neutral-500 mt-3">No rows match filters.</p>
      )}
    </section>
  );
}
