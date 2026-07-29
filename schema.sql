-- =============================================================================
-- DELIVERY MARKETPLACE — FULL SCHEMA
-- Run this file in your own Supabase project: Dashboard -> SQL Editor -> New query
-- Safe to re-run (idempotent where practical).
-- =============================================================================

create extension if not exists "pgcrypto";

-- =============================================================================
-- 1. ENUMS
-- =============================================================================
do $$ begin
  create type public.app_role as enum ('customer', 'provider', 'rider', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.provider_status as enum ('pending', 'under_review', 'verified', 'rejected', 'suspended', 'inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.account_type as enum ('individual', 'business');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.rider_status as enum ('active', 'inactive', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.doc_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_status as enum ('draft', 'open', 'quoted', 'assigned', 'in_transit', 'delivered', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.quote_status as enum ('pending', 'accepted', 'rejected', 'expired', 'withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.delivery_status as enum ('assigned', 'picked_up', 'in_transit', 'delivered', 'confirmed', 'failed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'processing', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payout_status as enum ('pending', 'processing', 'paid', 'failed', 'on_hold');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.dispute_status as enum ('open', 'under_review', 'resolved', 'rejected', 'escalated');
exception when duplicate_object then null; end $$;

-- =============================================================================
-- 2. SHARED HELPERS
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- 3. CORE TABLES
-- =============================================================================

-- ---------------------------------------------------------------- profiles --
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  account_type public.account_type not null default 'individual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- -------------------------------------------------------------- user_roles --
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
create index if not exists user_roles_user_id_idx on public.user_roles(user_id);

grant select, insert on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

-- SECURITY DEFINER role check — avoids recursive RLS lookups.
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

grant execute on function public.has_role(uuid, public.app_role) to authenticated, anon, service_role;

-- -------------------------------------------------------------- businesses --
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  registration_no text,
  phone text,
  email text,
  address text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists businesses_owner_id_idx on public.businesses(owner_id);

grant select, insert, update, delete on public.businesses to authenticated;
grant all on public.businesses to service_role;
alter table public.businesses enable row level security;

-- ------------------------------------------------------- delivery_providers --
create table if not exists public.delivery_providers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  company_name text not null,
  logo_url text,
  contact_person text,
  phone text,
  email text,
  office_address text,
  city text,
  description text,
  delivery_terms text,
  status public.provider_status not null default 'pending',
  rejection_reason text,
  bank_info jsonb,
  avg_rating numeric(3,2) not null default 0,
  completed_count integer not null default 0,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists delivery_providers_status_idx on public.delivery_providers(status);
create index if not exists delivery_providers_owner_idx on public.delivery_providers(owner_id);

grant select, insert, update on public.delivery_providers to authenticated;
grant all on public.delivery_providers to service_role;
alter table public.delivery_providers enable row level security;

-- ------------------------------------------ provider_verification_documents --
create table if not exists public.provider_verification_documents (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.delivery_providers(id) on delete cascade,
  doc_type text not null,
  file_path text not null,
  status public.doc_status not null default 'pending',
  reviewer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pvd_provider_idx on public.provider_verification_documents(provider_id);

grant select, insert, update, delete on public.provider_verification_documents to authenticated;
grant all on public.provider_verification_documents to service_role;
alter table public.provider_verification_documents enable row level security;

-- ---------------------------------------------------- provider_service_areas --
create table if not exists public.provider_service_areas (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.delivery_providers(id) on delete cascade,
  country text,
  city text not null,
  area text,
  created_at timestamptz not null default now()
);
create index if not exists psa_provider_idx on public.provider_service_areas(provider_id);

grant select, insert, update, delete on public.provider_service_areas to authenticated;
grant all on public.provider_service_areas to service_role;
alter table public.provider_service_areas enable row level security;

-- ---------------------------------------------------- provider_service_types --
create table if not exists public.provider_service_types (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.delivery_providers(id) on delete cascade,
  service_type text not null,
  base_price numeric(12,2),
  created_at timestamptz not null default now(),
  unique (provider_id, service_type)
);
create index if not exists pst_provider_idx on public.provider_service_types(provider_id);

grant select, insert, update, delete on public.provider_service_types to authenticated;
grant all on public.provider_service_types to service_role;
alter table public.provider_service_types enable row level security;

-- ------------------------------------------------------------------ riders --
create table if not exists public.riders (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.delivery_providers(id) on delete cascade,
  user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  photo_url text,
  id_document_path text,
  vehicle_type text,
  vehicle_plate text,
  status public.rider_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists riders_provider_idx on public.riders(provider_id);
create index if not exists riders_user_idx on public.riders(user_id);

grant select, insert, update, delete on public.riders to authenticated;
grant all on public.riders to service_role;
alter table public.riders enable row level security;

-- =============================================================================
-- 4. FUTURE WORKFLOW TABLES (structure only — workflows land in later iterations)
-- =============================================================================

create table if not exists public.delivery_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  pickup_address text not null,
  pickup_city text,
  pickup_contact text,
  pickup_phone text,
  dropoff_address text not null,
  dropoff_city text,
  dropoff_contact text,
  dropoff_phone text,
  package_description text,
  package_weight_kg numeric(10,2),
  service_type text,
  scheduled_for timestamptz,
  notes text,
  status public.request_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists dr_customer_idx on public.delivery_requests(customer_id);
create index if not exists dr_status_idx on public.delivery_requests(status);

create table if not exists public.delivery_quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.delivery_requests(id) on delete cascade,
  provider_id uuid not null references public.delivery_providers(id) on delete cascade,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  eta_minutes integer,
  message text,
  status public.quote_status not null default 'pending',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, provider_id)
);
create index if not exists dq_request_idx on public.delivery_quotes(request_id);
create index if not exists dq_provider_idx on public.delivery_quotes(provider_id);

create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.delivery_requests(id) on delete cascade,
  quote_id uuid references public.delivery_quotes(id) on delete set null,
  provider_id uuid not null references public.delivery_providers(id) on delete cascade,
  rider_id uuid references public.riders(id) on delete set null,
  customer_id uuid not null references auth.users(id) on delete cascade,
  status public.delivery_status not null default 'assigned',
  tracking_code text unique,
  proof_path text,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists deliveries_provider_idx on public.deliveries(provider_id);
create index if not exists deliveries_rider_idx on public.deliveries(rider_id);
create index if not exists deliveries_customer_idx on public.deliveries(customer_id);

create table if not exists public.delivery_status_history (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  status public.delivery_status not null,
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists dsh_delivery_idx on public.delivery_status_history(delivery_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid references public.deliveries(id) on delete set null,
  request_id uuid references public.delivery_requests(id) on delete set null,
  customer_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  provider_amount numeric(12,2),
  commission_amount numeric(12,2),
  status public.payment_status not null default 'pending',
  gateway text,
  gateway_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_customer_idx on public.payments(customer_id);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.delivery_providers(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  status public.payout_status not null default 'pending',
  reference text,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payouts_provider_idx on public.payouts(provider_id);

create table if not exists public.commission_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  percentage numeric(5,2) not null default 10,
  flat_fee numeric(12,2) not null default 0,
  service_type text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid references public.deliveries(id) on delete set null,
  raised_by uuid not null references auth.users(id) on delete cascade,
  against_provider_id uuid references public.delivery_providers(id) on delete set null,
  reason text not null,
  details text,
  status public.dispute_status not null default 'open',
  resolution text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists disputes_delivery_idx on public.disputes(delivery_id);

create table if not exists public.dispute_evidence (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.disputes(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists de_dispute_idx on public.dispute_evidence(dispute_id);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  rater_id uuid not null references auth.users(id) on delete cascade,
  provider_id uuid references public.delivery_providers(id) on delete cascade,
  score integer not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  unique (delivery_id, rater_id)
);
create index if not exists ratings_provider_idx on public.ratings(provider_id);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  rating_id uuid references public.ratings(id) on delete cascade,
  provider_id uuid references public.delivery_providers(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text,
  body text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reviews_provider_idx on public.reviews(provider_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, read_at);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_id);

-- Grants for future tables (RLS still governs row access)
grant select, insert, update, delete on
  public.delivery_requests, public.delivery_quotes, public.deliveries,
  public.delivery_status_history, public.payments, public.payouts,
  public.disputes, public.dispute_evidence, public.ratings,
  public.reviews, public.notifications
to authenticated;
grant select on public.commission_rules, public.audit_logs to authenticated;
grant all on
  public.delivery_requests, public.delivery_quotes, public.deliveries,
  public.delivery_status_history, public.payments, public.payouts,
  public.commission_rules, public.disputes, public.dispute_evidence,
  public.ratings, public.reviews, public.notifications, public.audit_logs
to service_role;

alter table public.delivery_requests       enable row level security;
alter table public.delivery_quotes         enable row level security;
alter table public.deliveries              enable row level security;
alter table public.delivery_status_history enable row level security;
alter table public.payments                enable row level security;
alter table public.payouts                 enable row level security;
alter table public.commission_rules        enable row level security;
alter table public.disputes                enable row level security;
alter table public.dispute_evidence        enable row level security;
alter table public.ratings                 enable row level security;
alter table public.reviews                 enable row level security;
alter table public.notifications           enable row level security;
alter table public.audit_logs              enable row level security;

-- =============================================================================
-- 5. TRIGGERS
-- =============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','businesses','delivery_providers','provider_verification_documents',
    'riders','delivery_requests','delivery_quotes','deliveries','payments','payouts',
    'commission_rules','disputes','reviews'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Auto-create profile + default customer role on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is the current user the owner of this provider company?
create or replace function public.owns_provider(_provider_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.delivery_providers
    where id = _provider_id and owner_id = auth.uid()
  );
$$;
grant execute on function public.owns_provider(uuid) to authenticated, service_role;

-- Helper: the provider company owned by the current user (null if none).
create or replace function public.my_provider_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.delivery_providers where owner_id = auth.uid() limit 1;
$$;
grant execute on function public.my_provider_id() to authenticated, service_role;

-- =============================================================================
-- 6. RLS POLICIES
-- =============================================================================

-- ---------------------------------------------------------------- profiles --
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  with check (id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- -------------------------------------------------------------- user_roles --
drop policy if exists "user_roles: read own" on public.user_roles;
create policy "user_roles: read own" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Self-service signup may only claim 'customer' or 'provider'.
-- 'admin' and 'rider' are never self-assignable from the client.
drop policy if exists "user_roles: self claim customer or provider" on public.user_roles;
create policy "user_roles: self claim customer or provider" on public.user_roles
  for insert to authenticated
  with check (
    (user_id = auth.uid() and role in ('customer', 'provider'))
    or public.has_role(auth.uid(), 'admin')
  );

drop policy if exists "user_roles: admin update" on public.user_roles;
create policy "user_roles: admin update" on public.user_roles
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "user_roles: admin delete" on public.user_roles;
create policy "user_roles: admin delete" on public.user_roles
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- -------------------------------------------------------------- businesses --
drop policy if exists "businesses: owner all" on public.businesses;
create policy "businesses: owner all" on public.businesses
  for all to authenticated
  using (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  with check (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------- delivery_providers --
-- Any signed-in user may browse VERIFIED providers only.
drop policy if exists "providers: public read verified" on public.delivery_providers;
create policy "providers: public read verified" on public.delivery_providers
  for select to authenticated
  using (status = 'verified' or owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "providers: owner insert" on public.delivery_providers;
create policy "providers: owner insert" on public.delivery_providers
  for insert to authenticated
  with check (owner_id = auth.uid() and status = 'pending');

drop policy if exists "providers: owner update" on public.delivery_providers;
create policy "providers: owner update" on public.delivery_providers
  for update to authenticated
  using (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  with check (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Owners must not self-verify: lock status transitions to admins.
create or replace function public.guard_provider_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and not public.has_role(auth.uid(), 'admin')
     and auth.uid() is not null then
    new.status := old.status;
    new.verified_at := old.verified_at;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_provider_status on public.delivery_providers;
create trigger guard_provider_status
  before update on public.delivery_providers
  for each row execute function public.guard_provider_status();

-- ------------------------------------------ provider_verification_documents --
drop policy if exists "pvd: provider owner all" on public.provider_verification_documents;
create policy "pvd: provider owner all" on public.provider_verification_documents
  for all to authenticated
  using (public.owns_provider(provider_id) or public.has_role(auth.uid(), 'admin'))
  with check (public.owns_provider(provider_id) or public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------- provider_service_areas --
drop policy if exists "psa: read" on public.provider_service_areas;
create policy "psa: read" on public.provider_service_areas
  for select to authenticated using (true);

drop policy if exists "psa: owner write" on public.provider_service_areas;
create policy "psa: owner write" on public.provider_service_areas
  for all to authenticated
  using (public.owns_provider(provider_id) or public.has_role(auth.uid(), 'admin'))
  with check (public.owns_provider(provider_id) or public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------- provider_service_types --
drop policy if exists "pst: read" on public.provider_service_types;
create policy "pst: read" on public.provider_service_types
  for select to authenticated using (true);

drop policy if exists "pst: owner write" on public.provider_service_types;
create policy "pst: owner write" on public.provider_service_types
  for all to authenticated
  using (public.owns_provider(provider_id) or public.has_role(auth.uid(), 'admin'))
  with check (public.owns_provider(provider_id) or public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------------------ riders --
drop policy if exists "riders: provider owner all" on public.riders;
create policy "riders: provider owner all" on public.riders
  for all to authenticated
  using (public.owns_provider(provider_id) or public.has_role(auth.uid(), 'admin'))
  with check (public.owns_provider(provider_id) or public.has_role(auth.uid(), 'admin'));

drop policy if exists "riders: read own" on public.riders;
create policy "riders: read own" on public.riders
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "riders: update own limited" on public.riders;
create policy "riders: update own limited" on public.riders
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------- delivery_requests --
drop policy if exists "requests: customer all" on public.delivery_requests;
create policy "requests: customer all" on public.delivery_requests
  for all to authenticated
  using (customer_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  with check (customer_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "requests: provider read open" on public.delivery_requests;
create policy "requests: provider read open" on public.delivery_requests
  for select to authenticated
  using (
    public.my_provider_id() is not null
    and (
      status in ('open', 'quoted')
      or exists (
        select 1 from public.deliveries d
        where d.request_id = delivery_requests.id
          and d.provider_id = public.my_provider_id()
      )
    )
  );

-- --------------------------------------------------------- delivery_quotes --
drop policy if exists "quotes: provider own" on public.delivery_quotes;
create policy "quotes: provider own" on public.delivery_quotes
  for all to authenticated
  using (public.owns_provider(provider_id) or public.has_role(auth.uid(), 'admin'))
  with check (public.owns_provider(provider_id) or public.has_role(auth.uid(), 'admin'));

drop policy if exists "quotes: customer read own request" on public.delivery_quotes;
create policy "quotes: customer read own request" on public.delivery_quotes
  for select to authenticated
  using (exists (
    select 1 from public.delivery_requests r
    where r.id = delivery_quotes.request_id and r.customer_id = auth.uid()
  ));

drop policy if exists "quotes: customer respond" on public.delivery_quotes;
create policy "quotes: customer respond" on public.delivery_quotes
  for update to authenticated
  using (exists (
    select 1 from public.delivery_requests r
    where r.id = delivery_quotes.request_id and r.customer_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.delivery_requests r
    where r.id = delivery_quotes.request_id and r.customer_id = auth.uid()
  ));

-- -------------------------------------------------------------- deliveries --
drop policy if exists "deliveries: participants read" on public.deliveries;
create policy "deliveries: participants read" on public.deliveries
  for select to authenticated
  using (
    customer_id = auth.uid()
    or public.owns_provider(provider_id)
    or rider_id in (select id from public.riders where user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );

drop policy if exists "deliveries: provider write" on public.deliveries;
create policy "deliveries: provider write" on public.deliveries
  for all to authenticated
  using (public.owns_provider(provider_id) or public.has_role(auth.uid(), 'admin'))
  with check (public.owns_provider(provider_id) or public.has_role(auth.uid(), 'admin'));

drop policy if exists "deliveries: rider update assigned" on public.deliveries;
create policy "deliveries: rider update assigned" on public.deliveries
  for update to authenticated
  using (rider_id in (select id from public.riders where user_id = auth.uid()))
  with check (rider_id in (select id from public.riders where user_id = auth.uid()));

drop policy if exists "deliveries: customer confirm" on public.deliveries;
create policy "deliveries: customer confirm" on public.deliveries
  for update to authenticated
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());

-- ----------------------------------------------- delivery_status_history --
drop policy if exists "dsh: participants read" on public.delivery_status_history;
create policy "dsh: participants read" on public.delivery_status_history
  for select to authenticated
  using (exists (
    select 1 from public.deliveries d
    where d.id = delivery_status_history.delivery_id
      and (
        d.customer_id = auth.uid()
        or public.owns_provider(d.provider_id)
        or d.rider_id in (select id from public.riders where user_id = auth.uid())
        or public.has_role(auth.uid(), 'admin')
      )
  ));

drop policy if exists "dsh: participants insert" on public.delivery_status_history;
create policy "dsh: participants insert" on public.delivery_status_history
  for insert to authenticated
  with check (changed_by = auth.uid() and exists (
    select 1 from public.deliveries d
    where d.id = delivery_status_history.delivery_id
      and (
        d.customer_id = auth.uid()
        or public.owns_provider(d.provider_id)
        or d.rider_id in (select id from public.riders where user_id = auth.uid())
      )
  ));

-- ---------------------------------------------------------------- payments --
drop policy if exists "payments: customer read own" on public.payments;
create policy "payments: customer read own" on public.payments
  for select to authenticated
  using (
    customer_id = auth.uid()
    or public.has_role(auth.uid(), 'admin')
    or exists (
      select 1 from public.deliveries d
      where d.id = payments.delivery_id and public.owns_provider(d.provider_id)
    )
  );

drop policy if exists "payments: customer insert own" on public.payments;
create policy "payments: customer insert own" on public.payments
  for insert to authenticated with check (customer_id = auth.uid());

drop policy if exists "payments: admin update" on public.payments;
create policy "payments: admin update" on public.payments
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ----------------------------------------------------------------- payouts --
-- Provider financials: readable by the owning provider and admins only.
drop policy if exists "payouts: provider read own" on public.payouts;
create policy "payouts: provider read own" on public.payouts
  for select to authenticated
  using (public.owns_provider(provider_id) or public.has_role(auth.uid(), 'admin'));

drop policy if exists "payouts: admin manage" on public.payouts;
create policy "payouts: admin manage" on public.payouts
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- -------------------------------------------------------- commission_rules --
drop policy if exists "commission: read active" on public.commission_rules;
create policy "commission: read active" on public.commission_rules
  for select to authenticated using (active or public.has_role(auth.uid(), 'admin'));

drop policy if exists "commission: admin manage" on public.commission_rules;
create policy "commission: admin manage" on public.commission_rules
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------- disputes --
drop policy if exists "disputes: participants read" on public.disputes;
create policy "disputes: participants read" on public.disputes
  for select to authenticated
  using (
    raised_by = auth.uid()
    or (against_provider_id is not null and public.owns_provider(against_provider_id))
    or public.has_role(auth.uid(), 'admin')
  );

drop policy if exists "disputes: raise own" on public.disputes;
create policy "disputes: raise own" on public.disputes
  for insert to authenticated with check (raised_by = auth.uid());

drop policy if exists "disputes: admin manage" on public.disputes;
create policy "disputes: admin manage" on public.disputes
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- -------------------------------------------------------- dispute_evidence --
drop policy if exists "evidence: participants read" on public.dispute_evidence;
create policy "evidence: participants read" on public.dispute_evidence
  for select to authenticated
  using (exists (
    select 1 from public.disputes d
    where d.id = dispute_evidence.dispute_id
      and (
        d.raised_by = auth.uid()
        or (d.against_provider_id is not null and public.owns_provider(d.against_provider_id))
        or public.has_role(auth.uid(), 'admin')
      )
  ));

drop policy if exists "evidence: upload own" on public.dispute_evidence;
create policy "evidence: upload own" on public.dispute_evidence
  for insert to authenticated with check (uploaded_by = auth.uid());

-- ----------------------------------------------------------------- ratings --
drop policy if exists "ratings: read all" on public.ratings;
create policy "ratings: read all" on public.ratings
  for select to authenticated using (true);

drop policy if exists "ratings: write own" on public.ratings;
create policy "ratings: write own" on public.ratings
  for insert to authenticated with check (rater_id = auth.uid());

drop policy if exists "ratings: update own" on public.ratings;
create policy "ratings: update own" on public.ratings
  for update to authenticated
  using (rater_id = auth.uid()) with check (rater_id = auth.uid());

-- ----------------------------------------------------------------- reviews --
drop policy if exists "reviews: read published" on public.reviews;
create policy "reviews: read published" on public.reviews
  for select to authenticated
  using (is_published or author_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "reviews: write own" on public.reviews;
create policy "reviews: write own" on public.reviews
  for all to authenticated
  using (author_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  with check (author_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- ----------------------------------------------------------- notifications --
drop policy if exists "notifications: own" on public.notifications;
create policy "notifications: own" on public.notifications
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "notifications: mark read" on public.notifications;
create policy "notifications: mark read" on public.notifications
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -------------------------------------------------------------- audit_logs --
drop policy if exists "audit: admin read" on public.audit_logs;
create policy "audit: admin read" on public.audit_logs
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- =============================================================================
-- 7. STORAGE BUCKETS
-- =============================================================================
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('provider-documents', 'provider-documents', false),
  ('rider-documents', 'rider-documents', false),
  ('delivery-proof', 'delivery-proof', false),
  ('dispute-evidence', 'dispute-evidence', false)
on conflict (id) do nothing;

-- Avatars: world-readable, users write only inside their own uid/ folder.
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars owner write" on storage.objects;
create policy "avatars owner write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars owner delete" on storage.objects;
create policy "avatars owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Private buckets: files live under <auth.uid()>/... ; owner + admin only.
-- Access from the app uses createSignedUrl(), never public URLs.
do $$
declare b text;
begin
  foreach b in array array['provider-documents','rider-documents','delivery-proof','dispute-evidence'] loop
    execute format('drop policy if exists %I on storage.objects', b || ' owner read');
    execute format($f$
      create policy %I on storage.objects
        for select to authenticated
        using (bucket_id = %L
               and ((storage.foldername(name))[1] = auth.uid()::text
                    or public.has_role(auth.uid(), 'admin')))
    $f$, b || ' owner read', b);

    execute format('drop policy if exists %I on storage.objects', b || ' owner insert');
    execute format($f$
      create policy %I on storage.objects
        for insert to authenticated
        with check (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text)
    $f$, b || ' owner insert', b);

    execute format('drop policy if exists %I on storage.objects', b || ' owner update');
    execute format($f$
      create policy %I on storage.objects
        for update to authenticated
        using (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text)
    $f$, b || ' owner update', b);

    execute format('drop policy if exists %I on storage.objects', b || ' owner delete');
    execute format($f$
      create policy %I on storage.objects
        for delete to authenticated
        using (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text)
    $f$, b || ' owner delete', b);
  end loop;
end $$;

-- =============================================================================
-- 8. SEED — default commission rule
-- =============================================================================
insert into public.commission_rules (name, percentage, flat_fee, active)
select 'Platform standard', 10, 0, true
where not exists (select 1 from public.commission_rules);

-- =============================================================================
-- 9. PROMOTE AN ADMIN (run manually, replace the email)
-- =============================================================================
-- insert into public.user_roles (user_id, role)
-- select id, 'admin' from auth.users where email = 'you@example.com'
-- on conflict (user_id, role) do nothing;
