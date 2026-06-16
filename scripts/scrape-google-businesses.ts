/**
 * Seed the businesses directory with Google Business Profile data.
 *
 * Runs the Google Places API (New) text search once per trade category,
 * maps each result onto the existing public.businesses schema, and
 * inserts rows with status='pending_review' so they appear in the
 * /admin/listings moderation queue.
 *
 * Usage:
 *   npm run scrape:google
 *   npm run scrape:google -- --dry-run
 *
 * Required env:
 *   GOOGLE_PLACES_API_KEY  Google Cloud key with "Places API (New)" enabled
 *   SUPABASE_URL           Project URL
 *   SUPABASE_SERVICE_KEY   Service role key (bypasses RLS — server-only)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type CategoryQuery = { slug: string; query: string }

const LOGO_BUCKET = 'business-logos'
const LOGO_MAX_HEIGHT_PX = 800

const CATEGORIES: CategoryQuery[] = [
  { slug: 'plumbing', query: 'plumbers in Florida' },
  { slug: 'electrical', query: 'electricians in Florida' },
  { slug: 'hvac', query: 'HVAC contractors in Florida' },
  { slug: 'roofing', query: 'roofing contractors in Florida' },
]

const PAGE_SIZE = 20

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.editorialSummary',
  'places.rating',
  'places.userRatingCount',
  'places.types',
  'places.photos',
].join(',')

interface PlacePhoto {
  name: string
  widthPx?: number
  heightPx?: number
}

interface PlaceResult {
  id: string
  displayName?: { text?: string }
  formattedAddress?: string
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  websiteUri?: string
  editorialSummary?: { text?: string }
  rating?: number
  userRatingCount?: number
  types?: string[]
  photos?: PlacePhoto[]
}

interface BusinessRow {
  category_id: string
  name: string
  phone: string
  website_url: string
  bio: string
  address: string
  status: 'pending_review'
  verified: false
  service_areas: string[]
  google_place_id: string
  logo_path: string | null
}

type SkipReason = 'no-website' | 'no-phone' | 'no-name' | 'no-address' | 'duplicate'

interface CategoryStats {
  fetched: number
  inserted: number
  withLogo: number
  logoFailed: number
  skipped: Record<SkipReason, number>
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    console.error(`Missing required env var: ${name}`)
    process.exit(1)
  }
  return v
}

function normalizeWebsite(url: string | undefined): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!/^https?:\/\//i.test(trimmed)) return null
  return trimmed
}

function extFromContentType(contentType: string | null): string | null {
  if (!contentType) return null
  const ct = contentType.toLowerCase().split(';')[0].trim()
  if (ct === 'image/jpeg' || ct === 'image/jpg') return 'jpg'
  if (ct === 'image/png') return 'png'
  if (ct === 'image/webp') return 'webp'
  return null
}

async function fetchAndUploadLogo(
  place: PlaceResult,
  supabase: SupabaseClient,
  apiKey: string,
): Promise<string | null> {
  const photo = place.photos?.[0]
  if (!photo?.name) return null

  const url = `https://places.googleapis.com/v1/${photo.name}/media?key=${apiKey}&maxHeightPx=${LOGO_MAX_HEIGHT_PX}`
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) {
    console.warn(`  photo fetch failed (${res.status}) for ${place.id}`)
    return null
  }

  const contentType = res.headers.get('content-type')
  const ext = extFromContentType(contentType)
  if (!ext) {
    console.warn(`  unsupported photo content-type "${contentType}" for ${place.id}`)
    return null
  }

  const bytes = new Uint8Array(await res.arrayBuffer())
  const path = `google/${place.id}/logo.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, bytes, {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      upsert: true,
    })
  if (uploadErr) {
    console.warn(`  logo upload failed for ${place.id}: ${uploadErr.message}`)
    return null
  }

  return path
}

async function searchPlaces(query: string, apiKey: string): Promise<PlaceResult[]> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      pageSize: PAGE_SIZE,
      languageCode: 'en',
      regionCode: 'US',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Places API error ${res.status}: ${body}`)
  }

  const json = (await res.json()) as { places?: PlaceResult[] }
  return json.places ?? []
}

function mapToBusinessRow(
  place: PlaceResult,
  categoryId: string,
  categorySlug: string,
): { row: BusinessRow } | { skip: SkipReason } {
  const name = place.displayName?.text?.trim()
  if (!name) return { skip: 'no-name' }

  const phone = place.nationalPhoneNumber || place.internationalPhoneNumber
  if (!phone) return { skip: 'no-phone' }

  const website = normalizeWebsite(place.websiteUri)
  if (!website) return { skip: 'no-website' }

  const address = place.formattedAddress?.trim()
  if (!address) return { skip: 'no-address' }

  const bio =
    place.editorialSummary?.text?.trim() ||
    `${name} is a ${categorySlug} service serving Florida. Listing imported from public business profiles; details pending owner verification.`

  return {
    row: {
      category_id: categoryId,
      name,
      phone,
      website_url: website,
      bio,
      address,
      status: 'pending_review',
      verified: false,
      service_areas: [],
      google_place_id: place.id,
      logo_path: null,
    },
  }
}

function emptyStats(): CategoryStats {
  return {
    fetched: 0,
    inserted: 0,
    withLogo: 0,
    logoFailed: 0,
    skipped: { 'no-website': 0, 'no-phone': 0, 'no-name': 0, 'no-address': 0, duplicate: 0 },
  }
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
  const categoryIdBySlug = new Map(categories!.map((c) => [c.slug, c.id as string]))

  for (const { slug } of CATEGORIES) {
    if (!categoryIdBySlug.has(slug)) {
      console.error(`Category slug "${slug}" not found in public.categories — aborting.`)
      process.exit(1)
    }
  }

  const { data: existing, error: existingErr } = await supabase
    .from('businesses')
    .select('google_place_id')
    .not('google_place_id', 'is', null)
  if (existingErr) throw existingErr
  const existingPlaceIds = new Set((existing ?? []).map((r) => r.google_place_id as string))

  console.log(
    `Loaded ${categoryIdBySlug.size} categories, ${existingPlaceIds.size} existing place ids${dryRun ? ' (dry-run)' : ''}\n`,
  )

  const overall: Record<string, CategoryStats> = {}

  for (const { slug, query } of CATEGORIES) {
    const stats = emptyStats()
    overall[slug] = stats
    const categoryId = categoryIdBySlug.get(slug)!

    console.log(`→ ${slug}: "${query}"`)
    const places = await searchPlaces(query, apiKey)
    stats.fetched = places.length

    const toInsert: BusinessRow[] = []
    for (const place of places) {
      if (existingPlaceIds.has(place.id)) {
        stats.skipped.duplicate++
        continue
      }
      const mapped = mapToBusinessRow(place, categoryId, slug)
      if ('skip' in mapped) {
        stats.skipped[mapped.skip]++
        continue
      }

      if (!dryRun) {
        const logoPath = await fetchAndUploadLogo(place, supabase, apiKey)
        if (logoPath) {
          mapped.row.logo_path = logoPath
          stats.withLogo++
        } else if (place.photos?.length) {
          stats.logoFailed++
        }
      } else if (place.photos?.length) {
        stats.withLogo++
      }

      toInsert.push(mapped.row)
      existingPlaceIds.add(place.id)
    }

    if (dryRun) {
      console.log(`  would insert ${toInsert.length} rows`)
      for (const row of toInsert) {
        console.log(`    - ${row.name} | ${row.phone} | ${row.website_url}`)
      }
      stats.inserted = toInsert.length
    } else if (toInsert.length > 0) {
      const { data: inserted, error: insertErr } = await supabase
        .from('businesses')
        .insert(toInsert)
        .select('id, name')
      if (insertErr) {
        console.error(`  insert failed for ${slug}:`, insertErr.message)
        throw insertErr
      }
      stats.inserted = inserted?.length ?? 0
    }

    const sk = stats.skipped
    console.log(
      `  fetched=${stats.fetched} inserted=${stats.inserted} logos=${stats.withLogo} logo-failed=${stats.logoFailed} dup=${sk.duplicate} no-website=${sk['no-website']} no-phone=${sk['no-phone']} no-name=${sk['no-name']} no-address=${sk['no-address']}\n`,
    )
  }

  const totals = Object.values(overall).reduce(
    (acc, s) => ({
      fetched: acc.fetched + s.fetched,
      inserted: acc.inserted + s.inserted,
      withLogo: acc.withLogo + s.withLogo,
      logoFailed: acc.logoFailed + s.logoFailed,
      duplicate: acc.duplicate + s.skipped.duplicate,
      noWebsite: acc.noWebsite + s.skipped['no-website'],
      noPhone: acc.noPhone + s.skipped['no-phone'],
    }),
    { fetched: 0, inserted: 0, withLogo: 0, logoFailed: 0, duplicate: 0, noWebsite: 0, noPhone: 0 },
  )
  console.log(
    `Totals: fetched=${totals.fetched} inserted=${totals.inserted} logos=${totals.withLogo} logo-failed=${totals.logoFailed} dup=${totals.duplicate} no-website=${totals.noWebsite} no-phone=${totals.noPhone}${dryRun ? ' (dry-run — nothing written)' : ''}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
