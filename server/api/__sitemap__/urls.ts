import { serverSupabaseClient } from '#supabase/server'
import { defineSitemapEventHandler } from '#imports'
import type { SitemapUrlInput } from '#sitemap/types'

export default defineSitemapEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  const [catRes, cityRes, countyRes] = await Promise.all([
    supabase.from('categories').select('slug').order('sort_order', { ascending: true }),
    supabase.from('cities').select('slug').order('population', { ascending: false, nullsFirst: false }),
    supabase.from('counties').select('slug').order('name', { ascending: true })
  ])

  if (catRes.error || cityRes.error || countyRes.error) return []

  const categories = (catRes.data ?? []).map(r => r.slug as string)
  const cities = (cityRes.data ?? []).map(r => r.slug as string)
  const counties = (countyRes.data ?? []).map(r => r.slug as string)

  const urls: SitemapUrlInput[] = []

  for (const cat of categories) {
    urls.push({
      loc: `/${cat}`,
      changefreq: 'weekly',
      priority: 0.8
    })
    for (const county of counties) {
      urls.push({
        loc: `/${cat}/county/${county}`,
        changefreq: 'weekly',
        priority: 0.6
      })
    }
    for (const city of cities) {
      urls.push({
        loc: `/${cat}/${city}`,
        changefreq: 'weekly',
        priority: 0.6
      })
    }
  }

  return urls
})
