/**
 * One row of org_monthly_metrics: performance for a claimed board in a given month.
 */
export type OrgMonthlyMetric = {
  id: string;
  organization_id: string;
  org_billboard_id: string;
  month: string; // YYYY-MM-DD (first of month)
  leads: number | null;
  signed_cases: number | null;
  revenue: number | null;
  created_at: string;
};

/** Body for creating a metric (POST). Month as YYYY-MM or YYYY-MM-DD; stored as first-of-month. */
export type CreateMonthlyMetricBody = {
  month: string;
  leads?: number | null;
  signed_cases?: number | null;
  revenue?: number | null;
};

/** Body for updating a metric (PATCH). All optional. */
export type UpdateMonthlyMetricBody = {
  month?: string;
  leads?: number | null;
  signed_cases?: number | null;
  revenue?: number | null;
};
