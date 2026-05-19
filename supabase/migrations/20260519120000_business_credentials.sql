-- Extend businesses with structured credential fields.
-- All columns nullable so existing rows remain valid; submission flow will
-- collect license_number as required going forward, others are optional.

alter table public.businesses
  add column if not exists license_number text,
  add column if not exists license_state text default 'FL',
  add column if not exists license_expires_at date,
  add column if not exists insurance_carrier text,
  add column if not exists insurance_expires_at date,
  add column if not exists emergency_available boolean not null default false,
  add column if not exists years_in_business int;

alter table public.businesses
  add constraint businesses_years_in_business_check
  check (years_in_business is null or years_in_business between 0 and 200);

create index if not exists businesses_license_expires_at_idx
  on public.businesses (license_expires_at)
  where license_expires_at is not null;

create index if not exists businesses_insurance_expires_at_idx
  on public.businesses (insurance_expires_at)
  where insurance_expires_at is not null;
