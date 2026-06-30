<script setup lang="ts">
definePageMeta({
  key: route => route.fullPath
})

type BusinessRow = {
  id: string
  name: string
  phone: string
  website_url: string
  bio: string
  address: string
  logo_path: string | null
  license_number: string | null
  serves_statewide: boolean
  service_areas: string[]
  featured: boolean
  featured_order: number | null
  created_at: string
  google_rating: number | null
  google_rating_count: number | null
}

type CategoryRow = {
  id: string
  slug: string
  name: string
  description: string | null
  icon_key: string | null
}

type CountyRow = {
  id: string
  slug: string
  name: string
  region: string
  intro_html: string | null
}

type CityRow = {
  slug: string
  name: string
  population: number | null
}

const SLUG_RE = /^[a-z0-9-]+$/

const route = useRoute()
const supabase = useSupabaseClient()

const categorySlug = computed(() => String(route.params.category ?? ''))
const countySlug = computed(() => String(route.params.county ?? ''))

if (!SLUG_RE.test(categorySlug.value) || !SLUG_RE.test(countySlug.value)) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { data: ctx } = await useAsyncData(
  `cat-county-${categorySlug.value}-${countySlug.value}`,
  async () => {
    const [catRes, countyRes] = await Promise.all([
      supabase
        .from('categories')
        .select('id, slug, name, description, icon_key')
        .eq('slug', categorySlug.value)
        .maybeSingle(),
      supabase
        .from('counties')
        .select('id, slug, name, region, intro_html')
        .eq('slug', countySlug.value)
        .maybeSingle()
    ])
    if (catRes.error) throw catRes.error
    if (countyRes.error) throw countyRes.error
    return {
      category: catRes.data as CategoryRow | null,
      county: countyRes.data as CountyRow | null
    }
  }
)

const category = computed(() => ctx.value?.category ?? null)
const county = computed(() => ctx.value?.county ?? null)

if (!category.value || !county.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { data: cities } = await useAsyncData(
  `cat-county-cities-${categorySlug.value}-${countySlug.value}`,
  async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('slug, name, population')
      .eq('county_slug', county.value!.slug)
      .order('population', { ascending: false, nullsFirst: false })
      .order('name', { ascending: true })
    if (error) throw error
    return (data ?? []) as CityRow[]
  }
)

const citySlugs = computed(() => (cities.value ?? []).map(c => c.slug))

const { data: businessRows } = await useAsyncData(
  `cat-county-listings-${categorySlug.value}-${countySlug.value}`,
  async () => {
    const slugs = citySlugs.value
    const orFilter = slugs.length
      ? `serves_statewide.eq.true,service_areas.ov.{${slugs.join(',')}}`
      : 'serves_statewide.eq.true'
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, phone, website_url, bio, address, logo_path, license_number, serves_statewide, service_areas, featured, featured_order, created_at, google_rating, google_rating_count')
      .eq('status', 'published')
      .eq('category_id', category.value!.id)
      .or(orFilter)
      .order('featured', { ascending: false })
      .order('featured_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as BusinessRow[]
  }
)

const { data: siblingCategories } = await useAsyncData(
  `cat-county-siblings-${categorySlug.value}-${countySlug.value}`,
  async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('slug, name, icon_key')
      .neq('slug', categorySlug.value)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return (data ?? []) as Array<Pick<CategoryRow, 'slug' | 'name' | 'icon_key'>>
  }
)

function logoUrl(path: string | null) {
  if (!path) return 'https://placehold.co/88x88/64748b/ffffff?text=Logo'
  const { data } = supabase.storage.from('business-logos').getPublicUrl(path)
  return data.publicUrl
}

function phoneHref(phone: string) {
  return `tel:${phone.replace(/\D/g, '')}`
}

const headline = computed(() => `${county.value!.name} County ${category.value!.name}`)
const titleTag = computed(() =>
  `${county.value!.name} County ${category.value!.name} — Verified & Licensed Contractors, FL`
)
const descriptionTag = computed(() =>
  `Browse verified, licensed ${category.value!.name.toLowerCase()} contractors serving ${county.value!.name} County, FL. Tap-to-call listings — no lead forms, always free for homeowners.`
)

useSeoMeta({
  title: titleTag,
  description: descriptionTag,
  ogTitle: titleTag,
  ogDescription: descriptionTag,
  ogImage: '/images/whyus.png',
  twitterCard: 'summary_large_image',
  twitterTitle: titleTag,
  twitterDescription: descriptionTag,
  twitterImage: '/images/whyus.png'
})

const businessCount = computed(() => (businessRows.value ?? []).length)

const siteOrigin = useRequestURL().origin

const canonicalUrl = computed(() =>
  `${siteOrigin}/${categorySlug.value}/county/${countySlug.value}`
)

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }]
})

const jsonLd = computed(() => {
  const rows = businessRows.value ?? []
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${headline.value} in ${county.value!.name} County, FL`,
    numberOfItems: rows.length,
    itemListElement: rows.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'LocalBusiness',
        name: b.name,
        telephone: b.phone,
        url: b.website_url,
        address: {
          '@type': 'PostalAddress',
          streetAddress: b.address,
          addressRegion: 'FL',
          addressCountry: 'US'
        },
        areaServed: b.serves_statewide ? 'Florida' : `${county.value!.name} County`
      }
    }))
  }
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteOrigin}/` },
      { '@type': 'ListItem', position: 2, name: category.value!.name, item: `${siteOrigin}/${categorySlug.value}` },
      { '@type': 'ListItem', position: 3, name: `${county.value!.name} County`, item: canonicalUrl.value }
    ]
  }
  return [itemList, breadcrumbs]
})

useHead({
  script: computed(() => jsonLd.value.map(obj => ({
    type: 'application/ld+json',
    innerHTML: JSON.stringify(obj)
  })))
})
</script>

<template>
  <UPage class="min-h-dvh bg-default">
    <section class="border-b border-default/60 bg-elevated/30">
      <UContainer class="py-12 sm:py-16">
        <nav aria-label="Breadcrumb" class="mb-4 text-xs text-muted">
          <ol class="flex flex-wrap items-center gap-1.5">
            <li>
              <NuxtLink to="/" class="hover:text-primary">
                Home
              </NuxtLink>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <NuxtLink :to="`/${categorySlug}`" class="hover:text-primary">
                {{ category!.name }}
              </NuxtLink>
            </li>
            <li aria-hidden="true">/</li>
            <li class="text-default">
              {{ county!.name }} County
            </li>
          </ol>
        </nav>

        <h1 class="text-balance text-4xl font-semibold leading-tight tracking-tight text-highlighted sm:text-5xl lg:text-6xl">
          {{ county!.name }} County {{ category!.name }}
        </h1>
        <p class="mt-3 text-sm text-muted">
          {{ businessCount }} verified {{ businessCount === 1 ? 'listing' : 'listings' }}
          <template v-if="(cities ?? []).length">
            · {{ (cities ?? []).length }} {{ (cities ?? []).length === 1 ? 'city' : 'cities' }}
          </template>
        </p>

        <div v-if="county!.intro_html" class="prose prose-sm mt-6 max-w-3xl text-default" v-html="county!.intro_html" />
        <p v-else class="mt-6 max-w-3xl text-base leading-relaxed text-muted">
          Looking for licensed {{ category!.name.toLowerCase() }} contractors in {{ county!.name }} County, Florida?
          Every business below is reviewed for active state licensing and insurance before we publish it.
          Call directly — no lead forms, no middlemen, and always free for homeowners.
        </p>
      </UContainer>
    </section>

    <UContainer class="py-10 sm:py-14">
      <div v-if="businessCount === 0" class="rounded-2xl border border-default bg-elevated/40 p-8 text-center sm:p-12">
        <UIcon name="i-lucide-construction" class="mx-auto size-10 text-muted" />
        <h2 class="mt-3 text-xl font-semibold text-highlighted">
          We're still verifying {{ category!.name.toLowerCase() }} pros in {{ county!.name }} County
        </h2>
        <p class="mx-auto mt-2 max-w-xl text-sm text-muted">
          Be the first verified {{ category!.name.toLowerCase() }} contractor on this page — submissions are reviewed in about a day.
        </p>
        <div class="mt-5 flex flex-wrap justify-center gap-2">
          <UButton to="/submit-business" color="primary" size="md" icon="i-lucide-plus">
            Submit your business
          </UButton>
          <UButton :to="`/${categorySlug}`" color="neutral" variant="outline" size="md" icon="i-lucide-list">
            All {{ category!.name }} listings
          </UButton>
        </div>
      </div>

      <div v-else class="space-y-4">
        <UCard
          v-for="business in (businessRows ?? [])"
          :key="business.id"
          variant="subtle"
          :ui="{
            root: 'overflow-hidden rounded-2xl bg-default divide-y-0 ring-0 shadow-lg shadow-black/10',
            header: '!p-0',
            body: '!p-0',
            footer: '!p-0'
          }"
        >
          <div class="flex flex-col sm:h-60 sm:flex-row sm:items-stretch">
            <div class="relative h-52 w-full flex-none overflow-hidden bg-elevated sm:h-auto sm:w-44 sm:min-w-44 md:w-52 md:min-w-52">
              <NuxtImg
                :src="logoUrl(business.logo_path)"
                :alt="`${business.name} logo`"
                class="absolute inset-0 size-full object-cover"
                width="240"
                sizes="100vw sm:176px md:208px"
                loading="lazy"
              />
            </div>

            <div class="flex min-w-0 flex-1 flex-col px-5 py-5">
              <div class="space-y-2 min-h-0 sm:flex-1 sm:overflow-hidden">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="truncate text-lg font-semibold tracking-tight text-highlighted sm:text-xl">
                    {{ business.name }}
                  </h2>
                  <UBadge color="success" variant="subtle" size="sm">
                    Verified
                  </UBadge>
                  <UBadge
                    v-if="business.license_number"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-badge-check"
                  >
                    License #{{ business.license_number }}
                  </UBadge>
                  <UBadge
                    v-if="business.serves_statewide"
                    color="info"
                    variant="soft"
                    size="sm"
                    icon="i-lucide-map"
                  >
                    Serves all of FL
                  </UBadge>
                </div>

                <p class="text-sm leading-relaxed text-muted line-clamp-2">
                  {{ business.bio }}
                </p>

                <div class="inline-flex min-w-0 items-start gap-2 text-sm text-muted">
                  <UIcon name="i-lucide-map-pin" class="mt-0.5 size-4 shrink-0 opacity-70" />
                  <span class="line-clamp-2">{{ business.address }}</span>
                </div>
              </div>

              <div class="mt-4 flex flex-col gap-3 sm:mt-auto sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                <div
                  v-if="business.google_rating_count"
                  class="inline-flex items-center gap-1.5 text-sm text-muted"
                >
                  <UIcon name="i-lucide-star" class="size-4 shrink-0 text-amber-400" />
                  <span class="font-medium text-default">{{ business.google_rating?.toFixed(1) ?? '—' }}</span>
                  <span>({{ business.google_rating_count }} {{ business.google_rating_count === 1 ? 'review' : 'reviews' }})</span>
                </div>

                <div class="flex flex-col gap-2 sm:flex-row sm:gap-2">
                  <UButton
                    color="primary"
                    variant="solid"
                    size="md"
                    block
                    class="sm:w-auto"
                    leading-icon="i-lucide-phone"
                    :to="phoneHref(business.phone)"
                  >
                    Call
                  </UButton>

                  <UButton
                    color="neutral"
                    variant="outline"
                    size="md"
                    block
                    class="sm:w-auto"
                    leading-icon="i-lucide-external-link"
                    :to="business.website_url"
                    target="_blank"
                    rel="noopener"
                  >
                    Website
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </UContainer>

    <section class="border-t border-default/60 bg-elevated/30">
      <UContainer class="py-10 sm:py-14">
        <div class="grid gap-10 lg:grid-cols-2">
          <div v-if="(cities ?? []).length">
            <h2 class="text-lg font-semibold text-highlighted">
              {{ category!.name }} by city in {{ county!.name }} County
            </h2>
            <ul class="mt-3 grid gap-2 sm:grid-cols-2">
              <li v-for="c in (cities ?? [])" :key="c.slug">
                <NuxtLink
                  :to="`/${categorySlug}/${c.slug}`"
                  class="inline-flex items-center gap-2 text-sm text-default hover:text-primary"
                >
                  <UIcon name="i-lucide-map-pin" class="size-4 text-primary" />
                  {{ c.name }} {{ category!.name }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div v-if="(siblingCategories ?? []).length">
            <h2 class="text-lg font-semibold text-highlighted">
              Other trades in {{ county!.name }} County
            </h2>
            <ul class="mt-3 grid gap-2 sm:grid-cols-2">
              <li v-for="c in (siblingCategories ?? [])" :key="c.slug">
                <NuxtLink
                  :to="`/${c.slug}/county/${countySlug}`"
                  class="inline-flex items-center gap-2 text-sm text-default hover:text-primary"
                >
                  <UIcon v-if="c.icon_key" :name="c.icon_key" class="size-4 text-primary" />
                  {{ county!.name }} County {{ c.name }}
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </UContainer>
    </section>
  </UPage>
</template>
