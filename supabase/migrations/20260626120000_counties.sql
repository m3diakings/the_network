-- County directory + per-city county linkage.
-- Builds on 20260521120000_cities_and_service_areas.sql.

-- ---------------------------------------------------------------------------
-- counties table (mirrors cities: slug / name / region + landing-page content)
-- ---------------------------------------------------------------------------
create table if not exists public.counties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  region text not null,
  is_featured boolean not null default false,
  intro_html text,
  created_at timestamptz not null default now()
);

comment on table public.counties is 'Florida counties used for county/category landing pages that aggregate listings across all cities in the county.';

create index if not exists counties_region_idx on public.counties (region);
create index if not exists counties_featured_idx on public.counties (is_featured) where is_featured = true;

alter table public.counties enable row level security;

create policy "Counties are viewable by everyone"
  on public.counties for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Seed counties from existing city data.
-- cities.county is free text and a few CDPs straddle two counties
-- ("Sarasota/Manatee", "Osceola/Polk", ...). We take the primary (first)
-- county as the canonical one, slugify it, and inherit the region.
-- ---------------------------------------------------------------------------
insert into public.counties (slug, name, region)
select distinct
  trim(both '-' from lower(regexp_replace(replace(split_part(county, '/', 1), '.', ''), '[^a-zA-Z0-9]+', '-', 'g'))) as slug,
  trim(split_part(county, '/', 1)) as name,
  region
from public.cities
on conflict (slug) do nothing;

-- Feature the major metro counties (most homeowner search volume).
update public.counties
set is_featured = true
where slug in (
  'miami-dade', 'broward', 'palm-beach', 'hillsborough', 'pinellas',
  'orange', 'duval', 'lee', 'polk', 'brevard', 'volusia', 'seminole'
);

-- ---------------------------------------------------------------------------
-- cities: link each city to its primary county
-- ---------------------------------------------------------------------------
alter table public.cities
  add column if not exists county_slug text;

update public.cities
set county_slug = trim(both '-' from lower(regexp_replace(replace(split_part(county, '/', 1), '.', ''), '[^a-zA-Z0-9]+', '-', 'g')))
where county_slug is null;

alter table public.cities
  alter column county_slug set not null;

alter table public.cities
  add constraint cities_county_slug_fkey
  foreign key (county_slug) references public.counties (slug)
  on update cascade;

create index if not exists cities_county_slug_idx on public.cities (county_slug);
