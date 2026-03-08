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
  name: string;
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
  boards: DashboardROIBoardRow[];
};
