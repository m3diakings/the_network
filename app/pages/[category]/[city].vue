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
}

type CategoryRow = {
  id: string
  slug: string
  name: string
  description: string | null
  icon_key: string | null
}

type CityRow = {
  id: string
  slug: string
  name: string
  county: string
  region: string
  population: number | null
  intro_html: string | null
}

const SLUG_RE = /^[a-z0-9-]+$/

const route = useRoute()
const supabase = useSupabaseClient()

const categorySlug = computed(() => String(route.params.category ?? ''))
const citySlug = computed(() => String(route.params.city ?? ''))

if (!SLUG_RE.test(categorySlug.value) || !SLUG_RE.test(citySlug.value)) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { data: ctx } = await useAsyncData(
  `cat-city-${categorySlug.value}-${citySlug.value}`,
  async () => {
    const [catRes, cityRes] = await Promise.all([
      supabase
        .from('categories')
        .select('id, slug, name, description, icon_key')
        .eq('slug', categorySlug.value)
        .maybeSingle(),
      supabase
        .from('cities')
        .select('id, slug, name, county, region, population, intro_html')
        .eq('slug', citySlug.value)
        .maybeSingle()
    ])
    if (catRes.error) throw catRes.error
    if (cityRes.error) throw cityRes.error
    return {
      category: catRes.data as CategoryRow | null,
      city: cityRes.data as CityRow | null
    }
  }
)

const category = computed(() => ctx.value?.category ?? null)
const city = computed(() => ctx.value?.city ?? null)

if (!category.value || !city.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { data: businessRows } = await useAsyncData(
  `cat-city-listings-${categorySlug.value}-${citySlug.value}`,
  async () => {
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, phone, website_url, bio, address, logo_path, license_number, serves_statewide, service_areas, featured, featured_order, created_at')
      .eq('status', 'published')
      .eq('category_id', category.value!.id)
      .or(`serves_statewide.eq.true,service_areas.cs.{${citySlug.value}}`)
      .order('featured', { ascending: false })
      .order('featured_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as BusinessRow[]
  }
)

const { data: nearbyCities } = await useAsyncData(
  `cat-city-nearby-${categorySlug.value}-${citySlug.value}`,
  async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('slug, name, county, population')
      .eq('region', city.value!.region)
      .neq('slug', city.value!.slug)
      .order('population', { ascending: false, nullsFirst: false })
      .limit(8)
    if (error) throw error
    return (data ?? []) as Array<Pick<CityRow, 'slug' | 'name' | 'county' | 'population'>>
  }
)

const { data: siblingCategories } = await useAsyncData(
  `cat-city-siblings-${categorySlug.value}-${citySlug.value}`,
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

const headline = computed(() => `${city.value!.name} ${category.value!.name}`)
const titleTag = computed(() =>
  `${city.value!.name} ${category.value!.name} — Verified & Licensed in ${city.value!.county} County, FL`
)
const descriptionTag = computed(() =>
  `Browse verified, licensed ${category.value!.name.toLowerCase()} contractors serving ${city.value!.name}, FL. Tap-to-call listings — no lead forms, always free for homeowners.`
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
  `${siteOrigin}/${categorySlug.value}/${citySlug.value}`
)

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }]
})

const jsonLd = computed(() => {
  const rows = businessRows.value ?? []
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${headline.value} in ${city.value!.name}, FL`,
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
        areaServed: b.serves_statewide ? 'Florida' : city.value!.name
      }
    }))
  }
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteOrigin}/` },
      { '@type': 'ListItem', position: 2, name: category.value!.name, item: `${siteOrigin}/${categorySlug.value}` },
      { '@type': 'ListItem', position: 3, name: city.value!.name, item: canonicalUrl.value }
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
              {{ city!.name }}
            </li>
          </ol>
        </nav>

        <h1 class="text-balance text-4xl font-semibold leading-tight tracking-tight text-highlighted sm:text-5xl lg:text-6xl">
          {{ city!.name }} {{ category!.name }}
        </h1>
        <p class="mt-3 text-sm text-muted">
          {{ city!.county }} County · {{ businessCount }} verified {{ businessCount === 1 ? 'listing' : 'listings' }}
        </p>

        <div v-if="city!.intro_html" class="prose prose-sm mt-6 max-w-3xl text-default" v-html="city!.intro_html" />
        <p v-else class="mt-6 max-w-3xl text-base leading-relaxed text-muted">
          Looking for licensed {{ category!.name.toLowerCase() }} contractors in {{ city!.name }}, Florida?
          Every business below is reviewed for active state licensing and insurance before we publish it.
          Call directly — no lead forms, no middlemen, and always free for homeowners.
        </p>
      </UContainer>
    </section>

    <UContainer class="py-10 sm:py-14">
      <div v-if="businessCount === 0" class="rounded-2xl border border-default bg-elevated/40 p-8 text-center sm:p-12">
        <UIcon name="i-lucide-construction" class="mx-auto size-10 text-muted" />
        <h2 class="mt-3 text-xl font-semibold text-highlighted">
          We're still verifying {{ category!.name.toLowerCase() }} pros in {{ city!.name }}
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
          <div class="flex flex-col sm:flex-row sm:items-stretch">
            <div class="shrink-0 overflow-hidden bg-elevated sm:w-44 md:w-52">
              <img
                :src="logoUrl(business.logo_path)"
                :alt="`${business.name} logo`"
                class="h-52 w-full object-contain p-4 sm:h-full"
                loading="lazy"
              >
            </div>

            <div class="flex min-w-0 flex-1 flex-col px-5 py-5">
              <div class="space-y-2">
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

                <p class="text-sm leading-relaxed text-muted line-clamp-3">
                  {{ business.bio }}
                </p>

                <div class="inline-flex min-w-0 items-start gap-2 text-sm text-muted">
                  <UIcon name="i-lucide-map-pin" class="mt-0.5 size-4 shrink-0 opacity-70" />
                  <span class="line-clamp-2">{{ business.address }}</span>
                </div>
              </div>

              <div class="mt-4 flex flex-col gap-2 sm:mt-auto sm:flex-row sm:justify-end sm:gap-2">
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
        </UCard>
      </div>
    </UContainer>

    <section class="border-t border-default/60 bg-elevated/30">
      <UContainer class="py-10 sm:py-14">
        <div class="grid gap-10 lg:grid-cols-2">
          <div v-if="(siblingCategories ?? []).length">
            <h2 class="text-lg font-semibold text-highlighted">
              Other trades in {{ city!.name }}
            </h2>
            <ul class="mt-3 grid gap-2 sm:grid-cols-2">
              <li v-for="c in (siblingCategories ?? [])" :key="c.slug">
                <NuxtLink
                  :to="`/${c.slug}/${citySlug}`"
                  class="inline-flex items-center gap-2 text-sm text-default hover:text-primary"
                >
                  <UIcon v-if="c.icon_key" :name="c.icon_key" class="size-4 text-primary" />
                  {{ city!.name }} {{ c.name }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div v-if="(nearbyCities ?? []).length">
            <h2 class="text-lg font-semibold text-highlighted">
              {{ category!.name }} in nearby cities
            </h2>
            <ul class="mt-3 grid gap-2 sm:grid-cols-2">
              <li v-for="n in (nearbyCities ?? [])" :key="n.slug">
                <NuxtLink
                  :to="`/${categorySlug}/${n.slug}`"
                  class="inline-flex items-center gap-2 text-sm text-default hover:text-primary"
                >
                  <UIcon name="i-lucide-map-pin" class="size-4 text-primary" />
                  {{ n.name }} {{ category!.name }}
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </UContainer>
    </section>
  </UPage>
</template>
