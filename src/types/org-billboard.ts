/**
 * org_billboards row with optional joined billboard fields for list/detail views.
 */
export type OrgBillboardRow = {
  id: string;
  organization_id: string;
  billboard_id: string | null;
  custom_name: string | null;
  custom_address: string | null;
  custom_lat: number | null;
  custom_lng: number | null;
  monthly_cost: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

/** Billboard fields returned when joining org_billboards with billboards. */
export type OrgBillboardJoinedBillboard = {
  name: string | null;
  address: string | null;
  board_type: string;
  traffic_tier: string;
  price_tier: string;
};

/** Raw row from Supabase (billboards may be object or array). */
export type OrgBillboardWithBoardRaw = OrgBillboardRow & {
  billboards: OrgBillboardJoinedBillboard | OrgBillboardJoinedBillboard[] | null;
};

/** Normalized row: billboards is always a single object or null. */
export type OrgBillboardWithBoard = OrgBillboardRow & {
  billboards: OrgBillboardJoinedBillboard | null;
};

/**
 * Request body for claiming a board from inventory (POST /api/org-billboards).
 */
export type ClaimBoardBody = {
  billboard_id: string;
  monthly_cost?: number | null;
  notes?: string | null;
};

/**
 * Request body for adding a custom board not in inventory (POST /api/org-billboards).
 */
export type AddCustomBoardBody = {
  custom_name: string;
  custom_address?: string | null;
  custom_lat?: number | null;
  custom_lng?: number | null;
  monthly_cost?: number | null;
  notes?: string | null;
};

/**
 * Request body for updating an org billboard (PATCH /api/org-billboards/[id]).
 */
export type UpdateOrgBillboardBody = {
  monthly_cost?: number | null;
  notes?: string | null;
  is_active?: boolean;
  custom_name?: string | null;
  custom_address?: string | null;
  custom_lat?: number | null;
  custom_lng?: number | null;
};
