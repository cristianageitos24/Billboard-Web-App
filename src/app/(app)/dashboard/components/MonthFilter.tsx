"use client";

type MonthFilterProps = {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
};

export function MonthFilter({
  value,
  onChange,
  loading = false,
}: MonthFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <label
        htmlFor="dashboard-month"
        className="text-sm font-medium text-neutral-700"
      >
        Month
      </label>
      <input
        id="dashboard-month"
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />
      {loading && (
        <span className="text-sm text-neutral-500">Loading…</span>
      )}
    </div>
  );
}
