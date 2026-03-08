/**
 * Shared formatters for currency, numbers, ratios, and dates.
 * Used by the dashboard and can be used by My Boards or other views.
 */

const EMPTY = "—";

function isNullishOrNaN(
  value: number | null | undefined
): value is null | undefined {
  if (value == null) return true;
  return typeof value === "number" && Number.isNaN(value);
}

/** USD currency, 2 decimals. Returns "—" for null/NaN. */
export function formatCurrency(
  value: number | null | undefined
): string {
  if (isNullishOrNaN(value)) return EMPTY;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Whole numbers with locale grouping. Returns "—" for null/NaN. */
export function formatInteger(
  value: number | null | undefined
): string {
  if (isNullishOrNaN(value)) return EMPTY;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Ratio with suffix, e.g. "2.50x". Returns "—" for null/NaN. */
export function formatRatio(
  value: number | null | undefined,
  suffix = "x"
): string {
  if (isNullishOrNaN(value)) return EMPTY;
  return `${value.toFixed(2)}${suffix}`;
}

/** Percent for trends, e.g. "+12.5%" or "-8.0%". Returns "—" for null/NaN. */
export function formatPercent(value: number | null | undefined): string {
  if (isNullishOrNaN(value)) return EMPTY;
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/** Current month in YYYY-MM. */
export function currentMonthYYYYMM(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Format month (YYYY-MM-DD or YYYY-MM) as "March 2025". */
export function formatMonth(month: string): string {
  const normalized = month.length === 7 ? `${month}-01` : month;
  const d = new Date(normalized + "T00:00:00");
  if (Number.isNaN(d.getTime())) return month;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Given YYYY-MM, return previous month YYYY-MM. */
export function previousMonth(month: string): string | null {
  const normalized = month.length === 7 ? `${month}-01` : month;
  const d = new Date(normalized + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
