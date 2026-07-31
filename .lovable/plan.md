# GOSwift — Current State & What Remains

## Done

### Foundation
- External Supabase project wired via `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- Full marketplace schema created in `schema.sql` and confirmed running in the user's project: profiles, roles, providers, riders, requests, quotes, deliveries, payments, payouts, disputes, documents, service areas, ratings, notifications.
- Supabase Auth setup with role-based profiles, triggers, RLS policies, storage buckets (avatars, documents, evidence).

### Auth & Routing
- 4-role auth (customer, provider, rider, admin) with email/password and Google OAuth.
- Authenticated route guard that redirects to `/auth` with a `?redirect=` parameter.
- `?redirect` is preserved across sign-in, sign-up, Google OAuth, and forgot-password/reset-password flows.
- Role guard bounces users who try to access a page meant for another role back to their own home.
- Splash `/` auto-redirects signed-in users to their role home.
- New `/reset-password` route for password reset links.

### Mobile-First UI
- Rebranded as **GOSwift**.
- Mobile-first design system with violet/lavender palette, safe-area padding, tap-scale, no-scrollbar, pull-to-refresh.
- Splash screen built from real Lucide vector icons (no generated images).
- Motion system: `gs-rise`, `gs-pop`, `gs-float`, `gs-drift`, `gs-ring`.
- Customer phone UI: search bar, quick action tiles, current shipment empty state, profile nudge, bottom tab bar with floating action button.
- Provider/rider/admin dashboards still use the desktop `DashboardShell` and are mostly stubbed.

### Components
- `MobileAppShell`, `PullToRefresh`, `RoleGuard`, `SupabaseSetupNotice`, `DashboardShell`, `SiteHeader`, `SiteFooter`.

## What Remains

The app is functional through sign-up and login, but the core delivery workflow is not yet wired. The next priorities are:

### 1. New delivery request (customer)
- Build a form/cards to capture pickup, destination, contacts, package details, weight, fragile flag, instructions.
- Save the request to `delivery_requests` and matching provider service areas.

### 2. Quote marketplace
- Customer sees a list of verified providers for their route with ratings, completed count, estimated response time, service types.
- Select a provider → send the lead to `delivery_quotes` with `pending` status.
- Provider dashboard sees incoming leads and can quote price + ETA + assign rider.
- Customer receives the quote, can accept or reject.

### 3. Payment and escrow architecture
- Create a payment record when the customer accepts a quote.
- Payment intent/status flow (pending → processing → paid → held → released).
- Commission configuration table and provider payout calculation.
- Admin commission/fee settings panel.
- Build as a real integration-ready payment layer (no fake success logic).

### 4. Rider assignment and delivery tracking
- After payment, rider is assigned, status becomes "Ready for Pickup".
- Rider phone UI: assigned deliveries, status updates (picked up, in transit, delivered), proof-of-delivery (photo, signature, notes, timestamp).
- Customer sees live status timeline and rider info only after payment.

### 5. Completion, confirmation, and payout
- Customer confirms delivery.
- Payment released to provider minus commission and fees.
- Payout record created and status tracked.
- Customer/provider rating and dispute flows.

### 6. Provider onboarding and admin verification
- Provider profile setup with company details, service areas, service types, bank info, verification documents upload.
- Admin panel to review documents, approve/reject providers, manage commissions and disputes.
- Provider status drives whether they appear in customer searches.

### 7. Notifications and polish
- Real-time push/in-app notifications for new leads, quotes, status changes, payments.
- Full PWA/homescreen support, mobile install prompts, and offline state.
- Convert remaining desktop dashboards to mobile shell where appropriate.

### 8. Testing and production readiness
- End-to-end tests for the full customer → provider → rider → admin flow.
- Production environment variables and Supabase redirect URLs.
- Remove any placeholder data and harden RLS/edge cases.

## Recommended Next Step

Start with the **New delivery request form** for customers, because it unlocks the rest of the workflow (quotes, provider matching, payments, tracking).