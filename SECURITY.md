# Security and multi-tenant architecture

## Overview

- **Public data:** Billboard inventory, states, cities, and zipcodes are readable by anyone via RLS; API routes use the anon (publishable-key) client only — no service role.
- **Organization-scoped data:** Claimed boards (`org_billboards`), metrics (`org_monthly_metrics`), and dashboard data are private to each organization. Routes require an authenticated user and use the cookie-based Supabase client; RLS enforces `organization_id = current_org_id()`.
- **Bootstrap:** Creating organizations and profiles on first sign-in uses the service-role client only in `ensureProfile`, called from the auth callback and signup action.

## Client usage

| Client | Where | Purpose |
|--------|--------|--------|
| `createPublicSupabaseClient()` | `/api/billboards`, `/api/states`, `/api/cities`, `/api/zipcodes` | Public reads; anon key, no cookies; RLS applies. |
| `createClient()` (server) | All `/api/org-billboards/*`, `/api/dashboard/*` | Authenticated, cookie-based; RLS restricts to current user’s org. |
| `createServerSupabaseClient()` | `ensureProfile` only | Bootstrap org + profile when user has no profile yet; bypasses RLS by design. |

Do **not** use the service-role client in tenant-facing API routes.

## RLS

- **billboards, cities, states:** Read-only; anon + authenticated can SELECT (billboards: policy “Billboards readable by all”).
- **organizations:** SELECT/UPDATE/DELETE restricted to `id = current_org_id()`. Insert is **not** allowed for authenticated users; only the service role (e.g. in `ensureProfile`) can create organizations.
- **profiles:** All operations restricted to `id = auth.uid()`.
- **org_billboards, org_monthly_metrics:** All operations restricted to `organization_id = current_org_id()`.

`current_org_id()` is a SECURITY DEFINER function that returns `profiles.organization_id` for `auth.uid()`.

## Auth in API routes

- **Protected routes:** Call `getUserFromRequest(request)` and return 401 if null. Then use the server `createClient()` (cookies) so RLS sees the authenticated user and applies org scoping.
- **Public routes:** No auth check; use `createPublicSupabaseClient()` only for the four public GET endpoints above.

## Changes made (SaaS readiness)

1. **Migration `006_public_billboards_and_restrict_org_insert.sql`**
   - Added anon SELECT on `billboards` so the public map can use the anon client.
   - Dropped “Org insert” for authenticated so only the server (e.g. `ensureProfile`) can create organizations.

2. **New `createPublicSupabaseClient()`** in `src/lib/supabase/public.ts` for public, unauthenticated reads.

3. **Removed service role from API routes:** `billboards`, `states`, `cities`, and `zipcodes` now use `createPublicSupabaseClient()` instead of `createServerSupabaseClient()`.

4. **Documentation:** Comments in `admin.ts`, `ensure-profile.ts`, `api-auth.ts`, and the four public route files clarify when to use each client and how org-scoped access is enforced.
