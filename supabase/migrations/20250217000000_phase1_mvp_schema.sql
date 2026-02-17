-- Phase 1 MVP: cities, billboards (map-ready), organizations, profiles, org_billboards (claiming + user-added), org_monthly_metrics (leads/signed/revenue)
-- Run in billboard Supabase project. Houston-only for MVP.

-- (A) Schema

-- Cities (Houston and future cities)
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state_code char(2) not null,
  created_at timestamptz not null default now()
);

-- Billboard inventory: MVP map filters and display
create table if not exists public.billboards (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete restrict,
  name text,
  vendor text,
  address text,
  latitude double precision not null,
  longitude double precision not null,
  board_type text not null check (board_type in ('static', 'digital')),
  traffic_tier text not null check (traffic_tier in ('low', 'medium', 'high', 'prime')),
  price_tier text not null check (price_tier in ('$', '$$', '$$$', '$$$$')),
  image_url text,
  source text,
  traffic integer,
  price_cents integer,
  created_at timestamptz not null default now()
);

create index if not exists billboards_city_id_idx on public.billboards(city_id);
create index if not exists billboards_board_type_idx on public.billboards(board_type);
create index if not exists billboards_traffic_tier_idx on public.billboards(traffic_tier);
create index if not exists billboards_price_tier_idx on public.billboards(price_tier);

-- Organizations (multi-tenant firms)
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Profiles: auth.users -> organization
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists profiles_organization_id_idx on public.profiles(organization_id);

-- Claimed boards + user-added (billboard_id null = user-added)
create table if not exists public.org_billboards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  billboard_id uuid references public.billboards(id) on delete cascade,
  custom_name text,
  custom_address text,
  custom_lat double precision,
  custom_lng double precision,
  monthly_cost numeric,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists org_billboards_org_billboard_uniq
  on public.org_billboards (organization_id, billboard_id)
  where billboard_id is not null;
create index if not exists org_billboards_org_id_idx on public.org_billboards(organization_id);

-- Org monthly metrics: MVP = billboard_leads, signed_cases, revenue
create table if not exists public.org_monthly_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  month date not null,
  billboard_leads integer,
  signed_cases integer,
  revenue numeric,
  impressions integer,
  spend_cents integer,
  created_at timestamptz not null default now(),
  unique(organization_id, month)
);

create index if not exists org_monthly_metrics_org_id_idx on public.org_monthly_metrics(organization_id);

-- (B) Helper and RLS

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid() limit 1;
$$;

alter table public.cities enable row level security;
create policy "Cities readable by all"
  on public.cities for select to anon, authenticated using (true);

alter table public.billboards enable row level security;
create policy "Billboards readable by authenticated"
  on public.billboards for select to authenticated using (true);

alter table public.organizations enable row level security;
create policy "Org select" on public.organizations for select to authenticated
  using (id = (select public.current_org_id()));
create policy "Org insert" on public.organizations for insert to authenticated
  with check (true);
create policy "Org update" on public.organizations for update to authenticated
  using (id = (select public.current_org_id())) with check (id = (select public.current_org_id()));
create policy "Org delete" on public.organizations for delete to authenticated
  using (id = (select public.current_org_id()));

alter table public.profiles enable row level security;
create policy "Profile select" on public.profiles for select to authenticated
  using (id = auth.uid());
create policy "Profile insert" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "Profile update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "Profile delete" on public.profiles for delete to authenticated
  using (id = auth.uid());

alter table public.org_billboards enable row level security;
create policy "Org billboards select" on public.org_billboards for select to authenticated
  using (organization_id = (select public.current_org_id()));
create policy "Org billboards insert" on public.org_billboards for insert to authenticated
  with check (organization_id = (select public.current_org_id()));
create policy "Org billboards update" on public.org_billboards for update to authenticated
  using (organization_id = (select public.current_org_id())) with check (organization_id = (select public.current_org_id()));
create policy "Org billboards delete" on public.org_billboards for delete to authenticated
  using (organization_id = (select public.current_org_id()));

alter table public.org_monthly_metrics enable row level security;
create policy "Org metrics select" on public.org_monthly_metrics for select to authenticated
  using (organization_id = (select public.current_org_id()));
create policy "Org metrics insert" on public.org_monthly_metrics for insert to authenticated
  with check (organization_id = (select public.current_org_id()));
create policy "Org metrics update" on public.org_monthly_metrics for update to authenticated
  using (organization_id = (select public.current_org_id())) with check (organization_id = (select public.current_org_id()));
create policy "Org metrics delete" on public.org_monthly_metrics for delete to authenticated
  using (organization_id = (select public.current_org_id()));

-- (C) Seed Houston and sample billboards

insert into public.cities (id, name, state_code)
values ('00000000-0000-0000-0000-000000000001'::uuid, 'Houston', 'TX')
on conflict (id) do nothing;

-- Sample billboards (run once; omit if already seeded)
insert into public.billboards (city_id, name, vendor, address, latitude, longitude, board_type, traffic_tier, price_tier, image_url, source)
values
  ('00000000-0000-0000-0000-000000000001'::uuid, 'I-10 Digital', 'Lamar', 'I-10 at Main', 29.7604, -95.3698, 'digital', 'high', '$$$', null, 'seed'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Downtown Bulletin', 'Clear Channel', 'Downtown Houston', 29.7610, -95.3700, 'static', 'prime', '$$$$', null, 'seed'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Westheimer Poster', 'Outfront', 'Westheimer Rd', 29.7598, -95.3695, 'static', 'medium', '$$', null, 'seed');
