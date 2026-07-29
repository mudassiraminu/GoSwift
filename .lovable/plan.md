
# Foundation Build on Your Own Supabase (BYO)

You'll create your own Supabase project; I'll build the app to point at it via env vars. Nothing uses Lovable Cloud.

## What you do (one-time setup)

1. Create a project at supabase.com → copy **Project URL** and **anon public key** from Settings → API.
2. Enable **Google** provider in Auth → Providers (paste your Google OAuth client ID/secret; add `https://<project-ref>.supabase.co/auth/v1/callback` to Google Cloud authorized redirects).
3. Run the `schema.sql` file I generate in SQL Editor.
4. Add redirect URLs in Auth → URL Configuration: your preview URL + `http://localhost:8080`.
5. Paste the URL and anon key into the secure form I'll open (stored as `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

## What I build

### 1. Supabase client
- `src/integrations/supabase/client.ts` — browser client using `import.meta.env.VITE_SUPABASE_*`. Session persistence + auto refresh + `detectSessionInUrl` for OAuth.
- `src/integrations/supabase/types.ts` — hand-authored Database types matching the schema (you can regenerate later via CLI).
- No service-role usage anywhere in client code. No Lovable Cloud, no `client.server.ts`, no server functions this pass.

### 2. Database schema (single `schema.sql` in project root, delivered for you to run)

**Enums:** `app_role` (customer/provider/rider/admin), `provider_status` (pending/under_review/verified/rejected/suspended/inactive), `account_type` (individual/business).

**Tables** (all with FKs, timestamps, indexes, RLS enabled, appropriate `GRANT`s to authenticated/service_role):

- `profiles` (id PK → auth.users, full_name, phone, avatar_url, account_type, timestamps)
- `user_roles` (user_id, role, unique(user_id, role))
- `businesses` (owner_id → auth.users, name, address, registration_no, phone)
- `delivery_providers` (owner_id, company_name, logo_url, contact_person, phone, email, office_address, description, delivery_terms, status default 'pending', bank_info jsonb, avg_rating, completed_count)
- `provider_verification_documents` (provider_id, doc_type, file_path, status)
- `provider_service_areas` (provider_id, city, area)
- `provider_service_types` (provider_id, service_type)
- `riders` (provider_id, user_id nullable, full_name, phone, photo_url, id_document_path, vehicle_type, vehicle_plate, status)

**Placeholder tables** (structure only, RLS enabled with admin-only default, expanded in later iterations): `delivery_requests`, `delivery_quotes`, `deliveries`, `delivery_status_history`, `payments`, `payouts`, `commission_rules`, `disputes`, `dispute_evidence`, `ratings`, `reviews`, `notifications`, `audit_logs`.

**Functions & triggers:**
- `public.has_role(_user_id uuid, _role app_role) returns boolean` — SECURITY DEFINER, stable, `search_path = public`.
- `public.handle_new_user()` — trigger on `auth.users` insert: creates `profiles` row and assigns default `customer` role.
- `updated_at` trigger helper.

**RLS policies (per your spec):**
- profiles: own read/update; admins read all
- user_roles: authenticated read own; admins manage; **no self-insert of admin/provider role** — inserts restricted to service_role/admins/self-inserting `customer` only via a WITH CHECK
- businesses: owner CRUD; admins read
- delivery_providers: owner CRUD own; public SELECT only WHERE `status = 'verified'` TO authenticated (limited safe columns via a view later); admins full
- provider_verification_documents / service_areas / service_types: owner (provider) CRUD; admins read
- riders: provider owner CRUD; rider reads own row (matched by `user_id = auth.uid()`); admins read
- All placeholder tables: RLS enabled, default policy locked to admin/service_role until workflows land

### 3. Storage buckets (created via `schema.sql` using storage SQL API)
- `avatars` — public
- `provider-documents` — private, owner + admin read via RLS on `storage.objects`
- `rider-documents` — private
- `delivery-proof` — private
- `dispute-evidence` — private
Signed URLs used for private buckets.

### 4. Auth
- `/auth` route: sign-in / sign-up tabs; role picker on signup limited to **Customer** or **Delivery Company**. Provider signup creates the `delivery_providers` row with status `pending`.
- Google OAuth via `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback' } })`.
- `/auth/callback` public route that awaits session then redirects by role.
- `/reset-password` public route (recovery flow).
- Root `onAuthStateChange` in `__root.tsx` (filtered to SIGNED_IN/SIGNED_OUT/USER_UPDATED) → `router.invalidate()`.
- Sign-out hygiene: cancel queries → clear cache → signOut → `navigate('/auth', replace: true)`.

### 5. Routes

Public:
- `/` — marketing homepage (Navy Trust palette): hero, how-it-works, why-choose-us, trust/safety, provider CTA, footer
- `/auth`, `/auth/callback`, `/reset-password`
- `/for-providers` — provider marketing

Protected under `src/routes/_authenticated/`:
- `/dashboard` — customer (nav stubs: Find Delivery, My Deliveries, Quotes, Payments, Notifications)
- `/provider` — provider (nav stubs: New Leads, Quotes, Active, Completed, Riders, Earnings, Payouts, Reviews, Company Profile)
- `/rider` — rider (Assigned, Status)
- `/admin` — admin (Users, Providers, Riders, Deliveries, Disputes, Verification, Settings, Audit Logs)
- `/profile` — shared

`_authenticated/route.tsx`: `ssr: false`, checks `supabase.auth.getUser()`, redirects to `/auth`. Each role-specific route additionally checks role via `user_roles` query and shows "not authorized" state if wrong role.

### 6. Design system
Update `src/styles.css` tokens to Navy Trust (oklch conversions of `#0f1b3d`, `#1e3a5f`, `#3b6fa0`, `#e8edf3`, green success). Inter + Space Grotesk fonts loaded via `<link>` in `__root.tsx`. Mobile-first responsive shell with top nav + mobile drawer, role-aware links.

## Deliverables at the end
- `schema.sql` at project root you paste into SQL Editor
- `.env.example` documenting the two required VITE_ vars
- Summary of buckets, policies, and manual dashboard steps still required (Google OAuth setup, redirect URLs)

## Explicitly NOT in this pass
Delivery request creation, quote flow, payments, rider assignment, disputes, ratings, notifications logic, admin verification actions, audit-log writes, edge functions. Schema is ready for all of it.
