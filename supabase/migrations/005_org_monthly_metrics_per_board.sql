-- Monthly metrics per claimed board (one row per org_billboard per month).
-- Existing org-level metrics are removed; table is altered to link to org_billboards.

-- Remove existing rows (no org_billboard_id to map to)
truncate table public.org_monthly_metrics;

-- Drop org-level unique so we can add per-board uniqueness
alter table public.org_monthly_metrics
  drop constraint if exists org_monthly_metrics_organization_id_month_key;

-- Link each metrics row to a claimed board (table is empty after truncate)
alter table public.org_monthly_metrics
  add column org_billboard_id uuid not null references public.org_billboards(id) on delete cascade;

-- One row per board per month
create unique index if not exists org_monthly_metrics_org_billboard_month_uniq
  on public.org_monthly_metrics (org_billboard_id, month);

create index if not exists org_monthly_metrics_org_billboard_id_idx
  on public.org_monthly_metrics(org_billboard_id);

-- Optional: enforce month as first-of-month to avoid timezone issues
alter table public.org_monthly_metrics
  drop constraint if exists chk_month_first_day;
alter table public.org_monthly_metrics
  add constraint chk_month_first_day check (date_trunc('month', month)::date = month);

-- Rename for clearer API: billboard_leads -> leads
alter table public.org_monthly_metrics
  rename column billboard_leads to leads;
