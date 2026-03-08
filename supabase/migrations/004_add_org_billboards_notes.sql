-- Optional notes for claimed boards (e.g. vendor contact, renewal date).
alter table public.org_billboards
  add column if not exists notes text;
