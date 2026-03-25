/**
 * Inclusive first-of-month list from `from` to `to` (YYYY-MM-DD).
 */
export function eachFirstOfMonth(from: string, to: string): string[] {
  const out: string[] = [];
  const start = new Date(from + "T12:00:00Z");
  const end = new Date(to + "T12:00:00Z");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return out;
  }
  const d = new Date(start);
  while (d <= end) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    out.push(`${y}-${m}-01`);
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
}
