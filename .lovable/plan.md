## Why the notice still shows

The SQL and Google provider are done on the Supabase side, but this app has no idea which project to connect to: `src/lib/supabase/client.ts` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, and both are currently empty (the browser console logs the warning on every load). Nothing about the schema or OAuth config changes that — the values have to exist in the app.

## What I'll do

1. Create a committed `.env` at the project root with your two values:
   - `VITE_SUPABASE_URL=https://eivigjofvdpqszomsdfy.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=<your anon key>`
   (The anon key is a publishable key designed for browser use — safe to ship. The service_role key never goes near this app.)
2. Add `.env.example` documenting both variables for anyone cloning the repo.
3. Restart the dev server so Vite picks up the new variables.
4. Verify in the running preview that:
   - the "Supabase is not connected yet" notice is gone on `/auth`,
   - the client warning no longer appears in the console,
   - an anonymous read against the project succeeds (confirms URL + key are valid).

## Then on your side (2 minutes)

In Supabase → **Authentication → URL Configuration**, make sure these are set, otherwise sign-up emails and Google sign-in will bounce:
- **Site URL**: `https://id-preview--29b44d93-8975-4cc1-abb9-465ed142b82e.lovable.app`
- **Redirect URLs**: the same preview URL, plus `http://localhost:8080` and your published domain once you publish.

After that, create an account in the app and I'll confirm a row lands in `profiles` and `user_roles`. To make yourself admin, run section 9 of `schema.sql` with your email.

## Technical notes

- `isSupabaseConfigured` falls back to placeholders when the vars are missing, which is exactly the state you're seeing; it flips to `true` once `.env` exists.
- `_authenticated/route.tsx` currently redirects to `/auth` when unconfigured — that also resolves itself once the client is live.
- Auth uses PKCE with `detectSessionInUrl`, which is why the redirect URL list above matters for Google.
