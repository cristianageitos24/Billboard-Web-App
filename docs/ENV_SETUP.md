# Where to get .env.local values (billboard Supabase project)

1. Open your **billboard** Supabase project in the [Dashboard](https://supabase.com/dashboard).
2. Go to **Project Settings** (gear) → **API** (or **API Keys**).
3. Copy into `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` (e.g. `https://abcdefgh.supabase.co`)
   - **Publishable key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  
     The app uses only the publishable key for client-side Supabase (auth, browser and server auth client). Do not use the legacy anon key.
   - **Secret key** (recommended) or **service_role** key → `SUPABASE_SECRET_KEY`  
     ⚠️ Never commit or expose this key; it bypasses RLS. Use only in server code.

`HOUSTON_CITY_ID` is already set to the Phase 1 seed UUID. If you used a different city id when seeding, replace it in `.env.local`.
