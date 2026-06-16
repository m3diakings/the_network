/**
 * Re-fetches Google Places generativeSummary / editorialSummary for every
 * business with a google_place_id and rewrites the bio. Only touches rows
 * whose current bio matches the original scraper's "imported from public
 * business profiles" template, so any manually-edited bio is left alone.
 *
 * Usage:
 *   npm run backfill:bios
 *   npm run backfill:bios -- --dry-run
 *
 * Required env (same as scrape:google):
 *   GOOGLE_PLACES_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

import { createClient } from '@supabase/supabase-js'

const TEMPLATE_MARKER = 'imported from public business profiles'

const FIELD_MASK = ['id', 'editorialSummary', 'generativeSummary'].join(',')

interface PlaceDetails {
  id: string
  editorialSummary?: { text?: string }
  generativeSummary?: { overview?: { text?: string } }
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

function categoryLabelFromSlug(slug: string | null): string {
  if (!slug) return 'trade'
  if (slug === 'hvac') return 'HVAC'
  return slug
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  const apiKey = requireEnv('GOOGLE_PLACES_API_KEY')
  const supabaseUrl = requireEnv('SUPABASE_URL')
  const supabaseKey = requireEnv('SUPABASE_SERVICE_KEY')

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('id, slug')
  if (catErr) throw catErr
  const slugByCategoryId = new Map((categories ?? []).map((c) => [c.id as string, c.slug as string]))

  const { data: rows, error: rowsErr } = await supabase
    .from('businesses')
    .select('id, name, bio, google_place_id, category_id')
    .not('google_place_id', 'is', null)
    .ilike('bio', `%${TEMPLATE_MARKER}%`)
  if (rowsErr) throw rowsErr

  console.log(
    `Found ${rows?.length ?? 0} rows with template bio${dryRun ? ' (dry-run)' : ''}\n`,
  )

  let generative = 0
  let editorial = 0
  let fallback = 0
  let updated = 0
  let unchanged = 0
  let failed = 0

  for (const row of rows ?? []) {
    const placeId = row.google_place_id as string
    const details = await fetchPlaceDetails(placeId, apiKey)
    if (!details) {
      failed++
      continue
    }

    const gen = details.generativeSummary?.overview?.text?.trim()
    const ed = details.editorialSummary?.text?.trim()
    const label = categoryLabelFromSlug(slugByCategoryId.get(row.category_id as string) ?? null)
    const fallbackBio = `${row.name} is a Florida ${label} contractor.`

    let nextBio: string
    let source: 'generative' | 'editorial' | 'fallback'
    if (gen) {
      nextBio = gen
      source = 'generative'
      generative++
    } else if (ed) {
      nextBio = ed
      source = 'editorial'
      editorial++
    } else {
      nextBio = fallbackBio
      source = 'fallback'
      fallback++
    }

    if (nextBio === row.bio) {
      unchanged++
      console.log(`  = ${row.name} [${source}] (no change)`)
      continue
    }

    console.log(`  → ${row.name} [${source}] ${nextBio.slice(0, 80)}${nextBio.length > 80 ? '…' : ''}`)

    if (!dryRun) {
      const { error: updErr } = await supabase
        .from('businesses')
        .update({ bio: nextBio })
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
    `\nTotals: updated=${updated} unchanged=${unchanged} failed=${failed} | sources: generative=${generative} editorial=${editorial} fallback=${fallback}${dryRun ? ' (dry-run — nothing written)' : ''}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
