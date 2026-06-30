/**
 * Sets each listing's service area to every city in the listing's county,
 * derived from the city named in its address, and turns off serves_statewide.
 * Re-runnable and idempotent.
 *
 * Usage:
 *   npm run backfill:service-areas
 *   npm run backfill:service-areas -- --dry-run
 *
 * Required env (same as scrape:google):
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

import { createClient } from '@supabase/supabase-js'

// Address city names that aren't their own row in public.cities (CDPs /
// unincorporated areas) mapped straight to the county slug they belong to.
const CITY_TO_COUNTY_ALIAS: Record<string, string> = {
  'carol city': 'miami-dade',
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    console.error(`Missing required env var: ${name}`)
    process.exit(1)
  }
  return v
}

/** Best-effort extraction of the city name from a US-formatted address. */
function parseCityCandidate(address: string): string | null {
  const segs = address.split(',').map((s) => s.trim()).filter(Boolean)
  const flIdx = segs.findIndex((s) => /\bFL\b/i.test(s))
  const idx = flIdx > 0 ? flIdx - 1 : segs.length - 1
  return segs[idx]?.toLowerCase() ?? null
}

function arraysEqualAsSets(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sa = new Set(a)
  return b.every((x) => sa.has(x))
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  const supabaseUrl = requireEnv('SUPABASE_URL')
  const supabaseKey = requireEnv('SUPABASE_SERVICE_KEY')

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: cities, error: cityErr } = await supabase
    .from('cities')
    .select('slug, name, county_slug')
  if (cityErr) throw cityErr

  // county_slug -> [city slugs]
  const slugsByCounty = new Map<string, string[]>()
  // city name (lowercased) -> county_slug
  const countyByCityName = new Map<string, string>()
  for (const c of cities ?? []) {
    const county = c.county_slug as string
    if (!slugsByCounty.has(county)) slugsByCounty.set(county, [])
    slugsByCounty.get(county)!.push(c.slug as string)
    countyByCityName.set((c.name as string).toLowerCase(), county)
  }

  // Longest-first so multi-word names ("North Miami") win over substrings.
  const cityNames = [...countyByCityName.keys()].sort((a, b) => b.length - a.length)

  function countyForAddress(address: string): string | null {
    const cand = parseCityCandidate(address)
    if (!cand) return null
    if (CITY_TO_COUNTY_ALIAS[cand]) return CITY_TO_COUNTY_ALIAS[cand]
    if (countyByCityName.has(cand)) return countyByCityName.get(cand)!
    const suffix = cityNames.find((n) => cand === n || cand.endsWith(' ' + n))
    return suffix ? countyByCityName.get(suffix)! : null
  }

  const { data: biz, error: bizErr } = await supabase
    .from('businesses')
    .select('id, name, address, service_areas, serves_statewide')
  if (bizErr) throw bizErr

  console.log(`Loaded ${biz?.length ?? 0} listings${dryRun ? ' (dry-run)' : ''}\n`)

  let updated = 0
  let unchanged = 0
  let failed = 0
  const unmatched: string[] = []

  for (const b of biz ?? []) {
    const county = countyForAddress(b.address as string)
    if (!county) {
      unmatched.push(`${b.name} — ${b.address}`)
      continue
    }

    const areas = slugsByCounty.get(county) ?? []
    const current = (b.service_areas as string[]) ?? []
    const alreadyCorrect =
      b.serves_statewide === false && arraysEqualAsSets(current, areas)
    if (alreadyCorrect) {
      unchanged++
      continue
    }

    console.log(`  → ${b.name} [${county}] ${areas.length} cities`)

    if (!dryRun) {
      const { error: updErr } = await supabase
        .from('businesses')
        .update({ service_areas: areas, serves_statewide: false })
        .eq('id', b.id)
      if (updErr) {
        console.warn(`    update failed: ${updErr.message}`)
        failed++
        continue
      }
    }
    updated++
  }

  if (unmatched.length) {
    console.log(`\nUnmatched (left unchanged):`)
    unmatched.forEach((u) => console.log(`  ∅ ${u}`))
  }

  console.log(
    `\nTotals: updated=${updated} unchanged=${unchanged} unmatched=${unmatched.length} failed=${failed}${dryRun ? ' (dry-run — nothing written)' : ''}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
