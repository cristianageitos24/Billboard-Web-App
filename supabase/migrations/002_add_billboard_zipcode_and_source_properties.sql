-- Add zipcode and full GeoJSON source_properties to billboards (for board details + future use).

alter table public.billboards
  add column if not exists zipcode text,
  add column if not exists source_properties jsonb;
