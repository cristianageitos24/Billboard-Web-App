-- States -> cities -> billboards hierarchy. All 50 US states; cities belong to a state.

-- (A) States table and seed
create table if not exists public.states (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state_code char(2) not null unique,
  created_at timestamptz not null default now()
);

alter table public.states enable row level security;
create policy "States readable by all"
  on public.states for select to anon, authenticated using (true);

insert into public.states (name, state_code) values
  ('Alabama', 'AL'),
  ('Alaska', 'AK'),
  ('Arizona', 'AZ'),
  ('Arkansas', 'AR'),
  ('California', 'CA'),
  ('Colorado', 'CO'),
  ('Connecticut', 'CT'),
  ('Delaware', 'DE'),
  ('Florida', 'FL'),
  ('Georgia', 'GA'),
  ('Hawaii', 'HI'),
  ('Idaho', 'ID'),
  ('Illinois', 'IL'),
  ('Indiana', 'IN'),
  ('Iowa', 'IA'),
  ('Kansas', 'KS'),
  ('Kentucky', 'KY'),
  ('Louisiana', 'LA'),
  ('Maine', 'ME'),
  ('Maryland', 'MD'),
  ('Massachusetts', 'MA'),
  ('Michigan', 'MI'),
  ('Minnesota', 'MN'),
  ('Mississippi', 'MS'),
  ('Missouri', 'MO'),
  ('Montana', 'MT'),
  ('Nebraska', 'NE'),
  ('Nevada', 'NV'),
  ('New Hampshire', 'NH'),
  ('New Jersey', 'NJ'),
  ('New Mexico', 'NM'),
  ('New York', 'NY'),
  ('North Carolina', 'NC'),
  ('North Dakota', 'ND'),
  ('Ohio', 'OH'),
  ('Oklahoma', 'OK'),
  ('Oregon', 'OR'),
  ('Pennsylvania', 'PA'),
  ('Rhode Island', 'RI'),
  ('South Carolina', 'SC'),
  ('South Dakota', 'SD'),
  ('Tennessee', 'TN'),
  ('Texas', 'TX'),
  ('Utah', 'UT'),
  ('Vermont', 'VT'),
  ('Virginia', 'VA'),
  ('Washington', 'WA'),
  ('West Virginia', 'WV'),
  ('Wisconsin', 'WI'),
  ('Wyoming', 'WY')
on conflict (state_code) do nothing;

-- (B) Add state_id to cities, backfill Houston, then set not null
alter table public.cities
  add column if not exists state_id uuid references public.states(id) on delete restrict;

update public.cities
set state_id = (select id from public.states where state_code = 'TX' limit 1)
where state_code = 'TX' and state_id is null;

-- Ensure Houston (and any other existing cities) have state_id from their state_code
update public.cities c
set state_id = s.id
from public.states s
where c.state_code = s.state_code and c.state_id is null;

alter table public.cities
  alter column state_id set not null;

create index if not exists cities_state_id_idx on public.cities(state_id);
create unique index if not exists cities_state_id_name_key on public.cities(state_id, name);
