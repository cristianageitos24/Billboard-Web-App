/**
 * Attribution / data source constants.
 *
 * Structural decision: we use a single constant for "current metrics source"
 * so the rest of the app (dashboard ROI, my-boards) can stay unaware of
 * where numbers come from. When we add CRM or referral integrations,
 * we'll add more sources and merge in getMetricsForMonth() (or equivalent).
 */

import type { MetricsSourceKind } from "./types";

/** Currently the only source of lead/case/revenue metrics. */
export const CURRENT_METRICS_SOURCE: MetricsSourceKind = "manual";

/**
 * Reserved integration provider IDs for future use.
 * Do not add SDKs or env vars until we implement one.
 */
export const PLACEHOLDER_INTEGRATION_PROVIDERS = [
  "hubspot",
  "salesforce",
  "referral",
] as const;

export type PlaceholderIntegrationProvider =
  (typeof PLACEHOLDER_INTEGRATION_PROVIDERS)[number];
