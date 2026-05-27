<script setup lang="ts">
definePageMeta({
  key: route => route.fullPath
})

type CategoryRow = {
  id: string
  slug: string
  name: string
  description: string | null
  icon_key: string | null
}

type CityRow = {
  slug: string
  name: string
  county: string
  region: string
  population: number | null
  is_featured: boolean
}

const REGION_LABELS: Record<string, string> = {
  'south': 'South Florida',
  'tampa-bay': 'Tampa Bay',
  'central': 'Central Florida',
  'southwest': 'Southwest Florida',
  'northeast': 'Northeast Florida',
  'north-central': 'North Central Florida',
  'panhandle': 'Panhandle',
  'treasure-coast': 'Treasure Coast',
  'keys': 'Florida Keys'
}

const REGION_ORDER = [
  'south',
  'tampa-bay',
  'central',
  'southwest',
  'northeast',
  'treasure-coast',
  'north-central',
  'keys',
  'panhandle'
]

const SLUG_RE = /^[a-z0-9-]+$/

const route = useRoute()
const supabase = useSupabaseClient()

const categorySlug = computed(() => String(route.params.category ?? ''))

if (!SLUG_RE.test(categorySlug.value)) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { data: category } = await useAsyncData(
  `cat-${categorySlug.value}`,
  async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, slug, name, description, icon_key')
      .eq('slug', categorySlug.value)
      .maybeSingle()
    if (error) throw error
    return data as CategoryRow | null
  }
)

if (!category.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { data: cityRows } = await useAsyncData(
  `cat-${categorySlug.value}-cities`,
  async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('slug, name, county, region, population, is_featured')
      .order('population', { ascending: false, nullsFirst: false })
      .order('name', { ascending: true })
    if (error) throw error
    return (data ?? []) as CityRow[]
  }
)

const { data: counts } = await useAsyncData(
  `cat-${categorySlug.value}-counts`,
  async () => {
    const { count: publishedCount, error: countErr } = await supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('category_id', category.value!.id)
    if (countErr) throw countErr

    const { count: statewideCount, error: stateErr } = await supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('category_id', category.value!.id)
      .eq('serves_statewide', true)
    if (stateErr) throw stateErr

    return {
      published: publishedCount ?? 0,
      statewide: statewideCount ?? 0
    }
  }
)

const featuredCities = computed(() =>
  (cityRows.value ?? []).filter(c => c.is_featured).slice(0, 12)
)

const citiesByRegion = computed(() => {
  const groups = new Map<string, CityRow[]>()
  for (const c of cityRows.value ?? []) {
    const region = c.region || 'other'
    if (!groups.has(region)) groups.set(region, [])
    groups.get(region)!.push(c)
  }
  return REGION_ORDER
    .filter(r => groups.has(r))
    .map(r => ({
      region: r,
      label: REGION_LABELS[r] ?? r,
      cities: groups.get(r)!
    }))
})

const titleTag = computed(() =>
  `${category.value!.name} Contractors in Florida — Verified & Licensed by City`
)
const descriptionTag = computed(() =>
  `Find licensed ${category.value!.name.toLowerCase()} contractors in every Florida city. Verified credentials, tap-to-call listings — always free for homeowners.`
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

const siteOrigin = useRequestURL().origin

useHead({
  link: [{ rel: 'canonical', href: computed(() => `${siteOrigin}/${categorySlug.value}`) }],
  script: computed(() => [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteOrigin}/` },
        { '@type': 'ListItem', position: 2, name: category.value!.name, item: `${siteOrigin}/${categorySlug.value}` }
      ]
    })
  }])
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
            <li class="text-default">
              {{ category!.name }}
            </li>
          </ol>
        </nav>

        <h1 class="text-balance text-4xl font-semibold leading-tight tracking-tight text-highlighted sm:text-5xl lg:text-6xl">
          Florida {{ category!.name }} Contractors
        </h1>

        <p class="mt-3 text-sm text-muted">
          {{ counts?.published ?? 0 }} verified
          {{ (counts?.published ?? 0) === 1 ? 'listing' : 'listings' }}
          ·
          {{ counts?.statewide ?? 0 }} serve statewide
        </p>

        <p class="mt-6 max-w-3xl text-base leading-relaxed text-muted">
          {{ category!.description ?? `Licensed ${category!.name.toLowerCase()} contractors across Florida. Pick a city below to see verified pros in your area, or browse the full directory.` }}
        </p>

        <div class="mt-6 flex flex-wrap gap-2">
          <UButton :to="`/listings?category=${categorySlug}`" color="primary" icon="i-lucide-list">
            See all {{ category!.name.toLowerCase() }} listings
          </UButton>
          <UButton to="/submit-business" color="neutral" variant="outline" icon="i-lucide-plus">
            Submit your business
          </UButton>
        </div>
      </UContainer>
    </section>

    <UContainer v-if="featuredCities.length" class="py-10 sm:py-14">
      <h2 class="text-2xl font-semibold tracking-tight text-highlighted">
        Top cities for {{ category!.name.toLowerCase() }} in Florida
      </h2>
      <p class="mt-1 text-sm text-muted">
        The Florida metros where homeowners search most for {{ category!.name.toLowerCase() }} pros.
      </p>

      <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="c in featuredCities"
          :key="c.slug"
          :to="`/${categorySlug}/${c.slug}`"
          class="group flex items-center justify-between gap-3 rounded-2xl border border-default bg-default p-4 transition-colors hover:border-primary hover:bg-elevated"
        >
          <div>
            <p class="text-base font-semibold text-highlighted group-hover:text-primary">
              {{ c.name }} {{ category!.name }}
            </p>
            <p class="text-xs text-muted">
              {{ c.county }} County
            </p>
          </div>
          <UIcon name="i-lucide-arrow-right" class="size-5 text-muted group-hover:text-primary" />
        </NuxtLink>
      </div>
    </UContainer>

    <UContainer class="pb-16">
      <h2 class="text-2xl font-semibold tracking-tight text-highlighted">
        Browse {{ category!.name.toLowerCase() }} by region
      </h2>
      <p class="mt-1 text-sm text-muted">
        Every Florida city we cover, grouped by region.
      </p>

      <div class="mt-6 space-y-8">
        <div v-for="group in citiesByRegion" :key="group.region">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-primary">
            {{ group.label }}
          </h3>
          <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <li v-for="c in group.cities" :key="c.slug">
              <NuxtLink
                :to="`/${categorySlug}/${c.slug}`"
                class="text-default hover:text-primary"
              >
                {{ c.name }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </UContainer>
  </UPage>
</template>
