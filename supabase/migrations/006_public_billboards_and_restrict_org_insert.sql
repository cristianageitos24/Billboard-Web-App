-- Security & SaaS readiness: public billboard inventory + restrict org creation
-- (1) Allow anonymous read on billboards so public map can use anon client (no service role).
-- (2) Remove "Org insert" for authenticated so only server-side bootstrap (e.g. ensureProfile with service role) can create organizations.

-- Billboards: add anon SELECT so public API routes can use publishable-key client
create policy "Billboards readable by all"
  on public.billboards for select to anon, authenticated using (true);

-- Organizations: only service role should create orgs (bootstrap in ensureProfile)
drop policy if exists "Org insert" on public.organizations;
