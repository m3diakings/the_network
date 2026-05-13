-- The Network — directory + submissions
-- Run via Supabase CLI (`supabase db push`) or SQL Editor in dashboard.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Categories (homepage carousel + listing classification)
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon_key text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.categories is 'Trade categories (Plumbing, Electrical, etc.).';

-- ---------------------------------------------------------------------------
-- Businesses / listings (directory + onboarding pipeline)
-- ---------------------------------------------------------------------------
create type public.business_status as enum (
  'draft',
  'pending_review',
  'published',
  'rejected',
  'archived'
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,

  name text not null,
  phone text not null,
  website_url text not null,
  bio text not null,
  address text not null,

  -- Supabase Storage object paths (bucket + path), e.g. "uuid/logo.webp"
  logo_path text,
  license_document_path text,
  insurance_document_path text,

  status public.business_status not null default 'pending_review',
  verified boolean not null default false,
  featured boolean not null default false,
  featured_order int,

  submitter_email text,
  owner_user_id uuid references auth.users (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint businesses_website_url_format check (
    website_url ~* '^https?://'
  ),
  constraint businesses_featured_order_positive check (
    featured_order is null or featured_order >= 0
  )
);

comment on table public.businesses is 'Directory listings; pending_review from public form until staff publishes.';

create index businesses_category_id_idx on public.businesses (category_id);
create index businesses_status_idx on public.businesses (status);
create index businesses_featured_idx on public.businesses (featured, featured_order)
  where featured = true;
create index businesses_created_at_idx on public.businesses (created_at desc);

-- ---------------------------------------------------------------------------
-- Profiles (optional auth; admin gate for future dashboard)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'App profile; is_admin for moderation UI.';

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth: create profile row on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.businesses enable row level security;
alter table public.profiles enable row level security;

-- Categories: readable by everyone; writes only via service role / dashboard (no policy = deny for non-bypass)
create policy "Categories are viewable by everyone"
  on public.categories for select
  to anon, authenticated
  using (true);

-- Published businesses: public read
create policy "Published businesses are viewable by everyone"
  on public.businesses for select
  to anon, authenticated
  using (status = 'published');

-- Owners can read their own rows in any status
create policy "Owners can view own businesses"
  on public.businesses for select
  to authenticated
  using (owner_user_id = auth.uid());

-- Public submission: anyone can insert a pending_review listing (no auth)
create policy "Anyone can submit a business for review"
  on public.businesses for insert
  to anon, authenticated
  with check (
    status = 'pending_review'
    and verified = false
    and featured = false
    and featured_order is null
    and (owner_user_id is null or owner_user_id = auth.uid())
  );

-- Owners can update own pending or rejected (e.g. fix and resubmit)
create policy "Owners can update own draft or pending or rejected"
  on public.businesses for update
  to authenticated
  using (owner_user_id = auth.uid() and status in ('draft', 'pending_review', 'rejected'))
  with check (owner_user_id = auth.uid() and status in ('draft', 'pending_review', 'rejected'));

-- Admins: full access
create policy "Admins can select all businesses"
  on public.businesses for select
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "Admins can update any business"
  on public.businesses for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "Admins can delete businesses"
  on public.businesses for delete
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Profiles
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Seed categories (matches app/pages/index.vue carousel)
-- ---------------------------------------------------------------------------
insert into public.categories (slug, name, description, icon_key, sort_order) values
  ('plumbing', 'Plumbing', 'Repairs, leak detection, and water heater services.', 'i-lucide-wrench', 1),
  ('electrical', 'Electrical', 'Panel upgrades, rewiring, and EV charger installs.', 'i-lucide-zap', 2),
  ('hvac', 'HVAC', 'Cooling, heating, and indoor air quality solutions.', 'i-lucide-fan', 3),
  ('roofing', 'Roofing', 'Inspections, storm repair, and full replacements.', 'i-lucide-house', 4);
