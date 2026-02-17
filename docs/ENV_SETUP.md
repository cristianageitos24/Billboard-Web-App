# Where to get .env.local values (billboard Supabase project)

1. Open your **billboard** Supabase project in the [Dashboard](https://supabase.com/dashboard).
2. Go to **Project Settings** (gear) → **API**.
3. Copy into `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` (e.g. `https://abcdefgh.supabase.co`)
   - **Publishable key** or **anon public** key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **service_role** key (under “Project API keys”) → `SUPABASE_SECRET_KEY`  
     ⚠️ Never commit or expose the service_role key; it bypasses RLS.

`HOUSTON_CITY_ID` is already set to the Phase 1 seed UUID. If you used a different city id when seeding, replace it in `.env.local`.
