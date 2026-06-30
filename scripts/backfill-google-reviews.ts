/**
 * Pulls the Google rating and review count for every business with a
 * google_place_id and caches them on the row (google_rating,
 * google_rating_count, google_reviews_synced_at). Re-run any time to refresh.
 *
 * Usage:
 *   npm run backfill:reviews
 *   npm run backfill:reviews -- --dry-run
 *
 * Required env (same as scrape:google):
 *   GOOGLE_PLACES_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

import { createClient } from '@supabase/supabase-js'

const FIELD_MASK = ['id', 'rating', 'userRatingCount'].join(',')

interface PlaceDetails {
  id: string
  rating?: number
  userRatingCount?: number
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    console.error(`Missing required env var: ${name}`)
    process.exit(1)
  }
  return v
}

async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<PlaceDetails | null> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    console.warn(`  ${placeId} — Places API ${res.status}: ${body.slice(0, 120)}`)
    return null
  }
  return (await res.json()) as PlaceDetails
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  const apiKey = requireEnv('GOOGLE_PLACES_API_KEY')
  const supabaseUrl = requireEnv('SUPABASE_URL')
  const supabaseKey = requireEnv('SUPABASE_SERVICE_KEY')

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: rows, error: rowsErr } = await supabase
    .from('businesses')
    .select('id, name, google_place_id, google_rating, google_rating_count')
    .not('google_place_id', 'is', null)
  if (rowsErr) throw rowsErr

  console.log(`Found ${rows?.length ?? 0} rows with a google_place_id${dryRun ? ' (dry-run)' : ''}\n`)

  let updated = 0
  let unchanged = 0
  let noRating = 0
  let failed = 0

  for (const row of rows ?? []) {
    const placeId = row.google_place_id as string
    const details = await fetchPlaceDetails(placeId, apiKey)
    if (!details) {
      failed++
      continue
    }

    const rating = details.rating ?? null
    const ratingCount = details.userRatingCount ?? null

    if (rating === null && ratingCount === null) {
      noRating++
      console.log(`  ∅ ${row.name} (no Google reviews)`)
    } else {
      console.log(`  → ${row.name} — ${rating ?? '—'}★ (${ratingCount ?? 0} reviews)`)
    }

    const sameRating = (row.google_rating ?? null) === rating
    const sameCount = (row.google_rating_count ?? null) === ratingCount
    if (sameRating && sameCount) {
      unchanged++
      continue
    }

    if (!dryRun) {
      const { error: updErr } = await supabase
        .from('businesses')
        .update({
          google_rating: rating,
          google_rating_count: ratingCount,
          google_reviews_synced_at: new Date().toISOString(),
        })
        .eq('id', row.id)
      if (updErr) {
        console.warn(`    update failed: ${updErr.message}`)
        failed++
        continue
      }
    }
    updated++
  }

  console.log(
    `\nTotals: updated=${updated} unchanged=${unchanged} no-rating=${noRating} failed=${failed}${dryRun ? ' (dry-run — nothing written)' : ''}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
