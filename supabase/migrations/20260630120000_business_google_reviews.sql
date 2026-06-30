-- Cache the Google rating + review count for each imported listing so the
-- directory can show social proof without calling the Places API on render.
-- Populated by scripts/backfill-google-reviews.ts. Nullable so rows without a
-- google_place_id (manual submissions) stay valid.

alter table public.businesses
  add column if not exists google_rating numeric(2, 1),
  add column if not exists google_rating_count integer,
  add column if not exists google_reviews_synced_at timestamptz;

alter table public.businesses
  add constraint businesses_google_rating_range check (
    google_rating is null or (google_rating >= 0 and google_rating <= 5)
  ),
  add constraint businesses_google_rating_count_nonneg check (
    google_rating_count is null or google_rating_count >= 0
  );
