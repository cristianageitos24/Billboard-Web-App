/**
 * Dashboard ROI API response types.
 * Used by GET /api/dashboard/roi for summary and per-board breakdown.
 */

export type DashboardROISummary = {
  totalSpend: number;
  totalLeads: number;
  totalSignedCases: number;
  totalRevenue: number;
  /** null when totalLeads === 0 */
  costPerLead: number | null;
  /** null when totalSignedCases === 0 */
  costPerSignedCase: number | null;
  /** null when totalSpend === 0 */
  roiMultiple: number | null;
};

export type DashboardROIBoardRow = {
  orgBillboardId: string;
  /** Short stable token for tables (first 8 hex chars of UUID). */
  displayId: string;
  name: string;
  /** Address line for display (custom or inventory). */
  location: string;
  /** City from inventory join when available. */
  city: string | null;
  isActive: boolean;
  /** True when a metrics row exists for this month (not defaulted zeros). */
  hasMetrics: boolean;
  monthlyCost: number;
  spend: number;
  leads: number;
  signedCases: number;
  revenue: number;
  costPerLead: number | null;
  costPerSignedCase: number | null;
  roiMultiple: number | null;
};

export type DashboardROIPeriod = {
  type: 'month';
  month: string;
};

export type DashboardROIResponse = {
  period: DashboardROIPeriod;
  summary: DashboardROISummary;
  /** Total org billboards (active + inactive); for empty states. */
  orgBoardCount: number;
  boards: DashboardROIBoardRow[];
};
