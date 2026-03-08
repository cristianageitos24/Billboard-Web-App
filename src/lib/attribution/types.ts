/**
 * Attribution and data-source types.
 *
 * Used to keep ROI and metrics logic source-agnostic so we can add
 * CRM sync, referral sources, or other integrations later without
 * scattering conditionals across the app.
 */

/** Where a metric value came from. Today only "manual"; later e.g. "crm_sync", "referral". */
export type MetricsSourceKind = "manual" | "crm_sync" | "referral" | "other";

/** One row of board-level metrics (same shape whether from org_monthly_metrics or future leads table). */
export type BoardMetricsRow = {
  orgBillboardId: string;
  leads: number;
  signedCases: number;
  revenue: number;
  /** Optional: which source contributed this row (for future blended views). */
  source?: MetricsSourceKind;
};

/**
 * Aggregated metrics for a month, before spend is applied.
 * Returned by getMetricsForMonth(); later this can merge manual + integration data.
 */
export type MonthMetricsPayload = {
  byBoard: Map<string, { leads: number; signedCases: number; revenue: number }>;
  source: MetricsSourceKind;
};
