/** YYYY-MM from YYYY-MM-DD first-of-month */
export function toMonthYYYYMM(monthDate: string): string {
  const m = monthDate.match(/^(\d{4}-\d{2})/);
  return m ? m[1]! : monthDate.slice(0, 7);
}

/** First-of-month YYYY-MM-DD, `monthsBack` months before `monthYYYYMM` (YYYY-MM). */
export function firstOfMonthBefore(monthYYYYMM: string, monthsBack: number): string {
  const [y, mo] = monthYYYYMM.split("-").map(Number);
  const d = new Date(Date.UTC(y!, (mo ?? 1) - 1, 1));
  d.setUTCMonth(d.getUTCMonth() - monthsBack);
  const yy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}-01`;
}
