-- Add Google Place ID for deduping listings imported via the
-- scripts/scrape-google-businesses.ts importer. Nullable so existing
-- rows remain valid; partial unique index enforces one row per place id
-- while allowing any number of NULLs.

alter table public.businesses
  add column if not exists google_place_id text;

create unique index if not exists businesses_google_place_id_key
  on public.businesses (google_place_id)
  where google_place_id is not null;
