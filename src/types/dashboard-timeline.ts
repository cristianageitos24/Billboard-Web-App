/**
 * GET /api/dashboard/metrics-timeline — org performance over a date range.
 */

export type DashboardOrgMonthPoint = {
  month: string;
  totalSpend: number;
  totalLeads: number;
  totalSignedCases: number;
  totalRevenue: number;
  roiMultiple: number | null;
};

export type DashboardTimelineBoard = {
  orgBillboardId: string;
  displayId: string;
  name: string;
  location: string;
  city: string | null;
  isActive: boolean;
  monthlyCost: number;
  leadsByMonth: Record<string, number>;
  signedCasesByMonth: Record<string, number>;
  revenueByMonth: Record<string, number>;
};

export type DashboardMetricsTimelineResponse = {
  from: string;
  to: string;
  months: string[];
  orgSeries: DashboardOrgMonthPoint[];
  boards: DashboardTimelineBoard[];
};
