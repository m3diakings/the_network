<script setup lang="ts">
useSeoMeta({
  title: 'Florida Contractors Directory — Plumbing, Electrical, HVAC & Roofing',
  description: 'Search Florida\'s directory of licensed plumbers, electricians, HVAC techs, and roofers. Filter by trade, call directly — no lead forms, no middlemen.',
  ogTitle: 'Florida Trade Pros Directory — Verified Contractors',
  ogDescription: 'Licensed plumbers, electricians, HVAC, and roofers across Florida. Verified credentials, tap-to-call contact.',
  ogImage: '/images/whyus.png',
  twitterTitle: 'Florida Trade Pros Directory — Verified Contractors',
  twitterDescription: 'Licensed Florida contractors, ready to take your call. Always free for homeowners.',
  twitterImage: '/images/whyus.png'
})

type BusinessRow = {
  id: string
  category_id: string | null
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

type Business = {
  id: string
  categoryId: string | null
  name: string
  phone: string
  website: string
  bio: string
  address: string
  logo: string | null
  licenseNumber: string | null
  servesStatewide: boolean
  serviceAreaSlugs: string[]
  createdAt: string
  featured: boolean
  featuredOrder: number | null
  googleRating: number | null
  googleRatingCount: number | null
}

type CategoryOption = {
  id: string
  label: string
}

const supabase = useSupabaseClient()

const { data: businessRows } = await useAsyncData('listings', async () => {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, category_id, name, phone, website_url, bio, address, logo_path, license_number, serves_statewide, service_areas, featured, featured_order, created_at, google_rating, google_rating_count')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as BusinessRow[]
})

const { data: categoryRows } = await useAsyncData('listings-categories', async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name, sort_order')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as { id: string, slug: string, name: string, sort_order: number }[]
})

const { data: cityRows } = await useAsyncData('listings-cities', async () => {
  const { data, error } = await supabase
    .from('cities')
    .select('slug, name')
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as { slug: string, name: string }[]
})

function logoUrl(path: string | null) {
  if (!path) return null
  const { data } = supabase.storage.from('business-logos').getPublicUrl(path)
  return data.publicUrl
}

function toBusiness(row: BusinessRow): Business {
  const areas = Array.isArray(row.service_areas) ? row.service_areas : []
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    phone: row.phone,
    website: row.website_url,
    bio: row.bio,
    address: row.address,
    logo: logoUrl(row.logo_path),
    licenseNumber: row.license_number,
    servesStatewide: Boolean(row.serves_statewide),
    serviceAreaSlugs: areas,
    createdAt: row.created_at,
    featured: row.featured,
    featuredOrder: row.featured_order,
    googleRating: row.google_rating,
    googleRatingCount: row.google_rating_count
  }
}

const allBusinesses = computed(() => (businessRows.value ?? []).map(toBusiness))

const categoryOptions = computed<CategoryOption[]>(() => [
  { id: 'all', label: 'All categories' },
  ...(categoryRows.value ?? []).map(row => ({ id: row.id, label: row.name }))
])

type CityOption = {
  id: string
  label: string
}

const cityOptions = computed<CityOption[]>(() =>
  (cityRows.value ?? []).map(c => ({ id: c.slug, label: c.name }))
)

const sortOptions = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'name', label: 'Name (A–Z)' }
] as const

type SortId = (typeof sortOptions)[number]['id']

const route = useRoute()
const router = useRouter()

// Filtering/pagination happens via query params (?category, ?city, ?page) on a
// single client-side page, so every variant serves the same content and title.
// Canonicalize them all to the clean /listings URL to avoid duplicate-title and
// duplicate-content flags; real trade/city landing pages live at /[category]/*.
const siteOrigin = useRequestURL().origin
useHead({
  link: [{ rel: 'canonical', href: `${siteOrigin}/listings` }]
})

function categoryIdFromSlug(slug: string | undefined) {
  if (!slug) return 'all'
  const match = (categoryRows.value ?? []).find(row => row.slug === slug)
  return match?.id ?? 'all'
}

function citySlugFromQuery(slug: string | undefined): string | null {
  if (!slug) return null
  const match = (cityRows.value ?? []).find(row => row.slug === slug)
  return match?.slug ?? null
}

const initialCategorySlug = typeof route.query.category === 'string' ? route.query.category : undefined
const initialCitySlug = typeof route.query.city === 'string' ? route.query.city : undefined

const PAGE_SIZE = 25

function pageFromQuery(raw: unknown): number {
  const n = typeof raw === 'string' ? parseInt(raw, 10) : NaN
  return Number.isFinite(n) && n >= 1 ? n : 1
}

const selectedCitySlug = ref<string | null>(citySlugFromQuery(initialCitySlug))
const selectedCategoryId = ref<string>(categoryIdFromSlug(initialCategorySlug))
const selectedSort = ref<SortId>('newest')
const currentPage = ref<number>(pageFromQuery(route.query.page))

watch(
  () => route.query.category,
  (slug) => {
    selectedCategoryId.value = categoryIdFromSlug(typeof slug === 'string' ? slug : undefined)
  }
)

watch(
  () => route.query.city,
  (slug) => {
    selectedCitySlug.value = citySlugFromQuery(typeof slug === 'string' ? slug : undefined)
  }
)

watch(selectedCategoryId, (id) => {
  const match = (categoryRows.value ?? []).find(row => row.id === id)
  const nextSlug = match?.slug
  const currentSlug = typeof route.query.category === 'string' ? route.query.category : undefined
  if (nextSlug === currentSlug) return
  const { category: _omit, ...rest } = route.query
  router.replace({
    query: nextSlug ? { ...rest, category: nextSlug } : rest
  })
})

watch(selectedCitySlug, (slug) => {
  const currentSlug = typeof route.query.city === 'string' ? route.query.city : undefined
  const nextSlug = slug ?? undefined
  if (nextSlug === currentSlug) return
  const { city: _omit, ...rest } = route.query
  router.replace({
    query: nextSlug ? { ...rest, city: nextSlug } : rest
  })
})

watch(
  () => route.query.page,
  (raw) => {
    const next = pageFromQuery(raw)
    if (next !== currentPage.value) currentPage.value = next
  }
)

watch(currentPage, (page) => {
  const currentRaw = typeof route.query.page === 'string' ? route.query.page : undefined
  const next = page > 1 ? String(page) : undefined
  if (next === currentRaw) return
  const { page: _omit, ...rest } = route.query
  router.replace({
    query: next ? { ...rest, page: next } : rest
  })
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
})

watch([selectedCitySlug, selectedCategoryId, selectedSort], () => {
  if (currentPage.value !== 1) currentPage.value = 1
})

const businesses = computed(() => {
  const city = selectedCitySlug.value
  const category = selectedCategoryId.value
  const sort = selectedSort.value

  const matches = allBusinesses.value.filter(business => {
    if (category !== 'all' && business.categoryId !== category) return false
    if (city) {
      if (!business.servesStatewide && !business.serviceAreaSlugs.includes(city)) return false
    }
    return true
  })

  const secondary = (a: Business, b: Business) => {
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (sort === 'oldest') return a.createdAt.localeCompare(b.createdAt)
    return b.createdAt.localeCompare(a.createdAt)
  }

  matches.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1
    if (a.featured && b.featured) {
      const ao = a.featuredOrder ?? Number.POSITIVE_INFINITY
      const bo = b.featuredOrder ?? Number.POSITIVE_INFINITY
      if (ao !== bo) return ao - bo
    }
    return secondary(a, b)
  })

  return matches
})

const totalPages = computed(() => Math.max(1, Math.ceil(businesses.value.length / PAGE_SIZE)))

const paginatedBusinesses = computed(() => {
  const page = Math.min(Math.max(1, currentPage.value), totalPages.value)
  const start = (page - 1) * PAGE_SIZE
  return businesses.value.slice(start, start + PAGE_SIZE)
})

const pageRangeStart = computed(() =>
  businesses.value.length === 0 ? 0 : (currentPage.value - 1) * PAGE_SIZE + 1
)
const pageRangeEnd = computed(() =>
  Math.min(currentPage.value * PAGE_SIZE, businesses.value.length)
)

watch(totalPages, (total) => {
  if (currentPage.value > total) currentPage.value = total
})

const featuredBusinesses = computed(() => {
  const featured = (businessRows.value ?? [])
    .filter(row => row.featured)
    .sort((a, b) => (a.featured_order ?? 0) - (b.featured_order ?? 0))
    .map(toBusiness)
  return featured.length ? featured : allBusinesses.value.slice(0, 3)
})

const hasActiveFilters = computed(() =>
  selectedCitySlug.value !== null
  || selectedCategoryId.value !== 'all'
  || selectedSort.value !== 'newest'
)

function clearFilters() {
  selectedCitySlug.value = null
  selectedCategoryId.value = 'all'
  selectedSort.value = 'newest'
  currentPage.value = 1
}

function phoneHref(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return `tel:${digits}`
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  const local = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  if (local.length !== 10) return phone
  return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`
}

const listingsCtaUi = {
  root: 'rounded-none ring-0 shadow-none overflow-visible',
  container:
    '!px-0 !py-16 sm:!py-20 lg:!py-28 gap-8 sm:gap-16 flex flex-col',
  title: 'text-3xl font-semibold tracking-tight text-highlighted lg:text-5xl'
}

const listingsCtaLinks = [
  {
    label: 'List your business',
    to: '/submit-business',
    icon: 'i-lucide-arrow-right',
    size: 'lg' as const
  }
]
</script>

<template>
  <UPage class="min-h-dvh bg-default">
    <UContainer class="py-10">
      <UPageHeader
        headline="Business Directory"
        title="Trade Companies in Florida"
        description="Browse trusted local businesses with quick access to contact info and websites."
        :ui="{ root: 'border-b-0' }"
      />

      <UPageBody class="mt-6 pb-16">
        <div class="mb-6 flex flex-col gap-3 rounded-2xl border border-default/70 bg-elevated/40 p-3 sm:flex-row sm:flex-wrap sm:items-center">
          <UInputMenu
            v-model="selectedCitySlug"
            :items="cityOptions"
            value-key="id"
            label-key="label"
            icon="i-lucide-map-pin"
            placeholder="Search a Florida city…"
            class="flex-1 min-w-[14rem]"
            size="md"
            searchable
          />
          <USelectMenu
            v-model="selectedCategoryId"
            :items="categoryOptions"
            value-key="id"
            label-key="label"
            icon="i-lucide-tag"
            class="w-full sm:w-56"
            size="md"
          />
          <USelectMenu
            v-model="selectedSort"
            :items="sortOptions"
            value-key="id"
            label-key="label"
            icon="i-lucide-arrow-up-down"
            class="w-full sm:w-48"
            size="md"
          />
          <UButton
            v-if="hasActiveFilters"
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            size="md"
            @click="clearFilters"
          >
            Clear
          </UButton>
        </div>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div class="min-w-0 space-y-4">
            <p class="text-sm text-muted">
              <template v-if="businesses.length === 0">
                Showing <span class="font-semibold text-default">0</span>
                of {{ allBusinesses.length }} {{ allBusinesses.length === 1 ? 'business' : 'businesses' }}
              </template>
              <template v-else>
                Showing
                <span class="font-semibold text-default">{{ pageRangeStart }}–{{ pageRangeEnd }}</span>
                of {{ businesses.length }} {{ businesses.length === 1 ? 'business' : 'businesses' }}
              </template>
            </p>

            <UCard
              v-if="businesses.length === 0"
              :ui="{ root: 'rounded-2xl bg-default ring-0 shadow-md shadow-black/5' }"
            >
              <div class="flex flex-col items-center gap-3 py-10 text-center">
                <UIcon name="i-lucide-inbox" class="size-10 text-muted" />
                <div>
                  <p class="text-base font-semibold text-highlighted">
                    {{ allBusinesses.length === 0 ? 'No published listings yet' : 'No matches for your filters' }}
                  </p>
                  <p class="mt-1 text-sm text-muted">
                    {{
                      allBusinesses.length === 0
                        ? 'Submitted businesses appear here once they pass review.'
                        : 'Try a different search term or category.'
                    }}
                  </p>
                </div>
                <UButton
                  v-if="allBusinesses.length === 0"
                  to="/submit-business"
                  icon="i-lucide-plus"
                >
                  Submit Your Business
                </UButton>
                <UButton
                  v-else
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-x"
                  @click="clearFilters"
                >
                  Clear filters
                </UButton>
              </div>
            </UCard>

            <UCard
              v-for="business in paginatedBusinesses"
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
                <div class="h-52 w-full flex-none overflow-hidden bg-elevated sm:h-auto sm:w-60 sm:min-w-60 md:w-60 md:min-w-60">
                  <NuxtImg
                    v-if="business.logo"
                    :src="business.logo"
                    :alt="`${business.name} logo`"
                    class="h-full w-full max-w-full object-cover"
                    width="240"
                    height="240"
                    sizes="100vw sm:176px md:208px"
                    loading="lazy"
                  />
                  <div v-else class="grid size-full place-items-center text-muted">
                    <UIcon name="i-lucide-building-2" class="size-14 opacity-40" />
                  </div>
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
                        v-if="business.licenseNumber"
                        color="neutral"
                        variant="outline"
                        size="sm"
                        icon="i-lucide-badge-check"
                      >
                        License #{{ business.licenseNumber }}
                      </UBadge>
                    </div>

                  <p class="text-sm leading-relaxed text-muted line-clamp-2">
                    {{ business.bio }}
                  </p>

                  <div class="inline-flex min-w-0 items-start gap-2 text-sm text-muted">
                    <UIcon name="i-lucide-map-pin" class="mt-0.5 size-4 shrink-0 opacity-70" />
                    <span class="line-clamp-2">{{ business.address }}</span>
                  </div>

                    <div class="flex flex-col gap-1.5 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
                      <div class="inline-flex min-w-0 items-center gap-2 text-muted">
                        <UIcon name="i-lucide-phone" class="size-4 shrink-0 opacity-70" />
                        <ULink
                          class="truncate font-medium text-default hover:text-primary"
                          :to="phoneHref(business.phone)"
                        >
                          {{ formatPhone(business.phone) }}
                        </ULink>
                      </div>

                      <div
                        v-if="business.googleRatingCount"
                        class="inline-flex min-w-0 items-center gap-1.5 text-muted"
                      >
                        <UIcon name="i-lucide-star" class="size-4 shrink-0 text-amber-400" />
                        <span class="font-medium text-default">{{ business.googleRating?.toFixed(1) ?? '—' }}</span>
                        <span class="truncate">
                          ({{ business.googleRatingCount }} {{ business.googleRatingCount === 1 ? 'review' : 'reviews' }})
                        </span>
                      </div>
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
                      :to="business.website"
                      target="_blank"
                    >
                      Website
                    </UButton>
                  </div>
                </div>
              </div>
            </UCard>

            <div v-if="totalPages > 1" class="flex justify-center pt-2">
              <UPagination
                v-model:page="currentPage"
                :total="businesses.length"
                :items-per-page="PAGE_SIZE"
                :sibling-count="1"
                show-edges
              />
            </div>
          </div>

          <aside class="lg:sticky lg:top-6">
            <UCard
              variant="soft"
              :ui="{
                root: 'rounded-2xl bg-elevated/60 shadow-md shadow-black/5',
                header: 'p-3 sm:p-4',
                body: 'p-3 sm:p-4',
                footer: 'p-3 sm:p-4'
              }"
            >
              <template #header>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-primary">
                    Featured
                  </p>
                  <h3 class="mt-1 text-lg font-semibold text-highlighted">
                    Featured Listings
                  </h3>
                </div>
              </template>

              <div class="space-y-4">
                <article
                  v-for="business in featuredBusinesses"
                  :key="`featured-${business.id}`"
                  class="rounded-xl border border-default/60 bg-default p-2.5 shadow-sm"
                >
                  <div class="flex items-start gap-3">
                    <NuxtImg
                      v-if="business.logo"
                      :src="business.logo"
                      :alt="`${business.name} logo`"
                      class="size-14 rounded-lg object-contain p-1"
                      width="112"
                      loading="lazy"
                    />
                    <div
                      v-else
                      class="grid size-14 shrink-0 place-items-center rounded-lg bg-elevated text-muted"
                    >
                      <UIcon name="i-lucide-building-2" class="size-8 opacity-40" />
                    </div>

                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-highlighted">
                        {{ business.name }}
                      </p>
                      <p class="mt-1 text-xs leading-relaxed text-muted line-clamp-2">
                        {{ business.bio }}
                      </p>
                      <div class="mt-2 flex items-center gap-2">
                        <ULink
                          class="text-xs font-medium text-default hover:text-primary"
                          :to="phoneHref(business.phone)"
                        >
                          {{ formatPhone(business.phone) }}
                        </ULink>
                        <UButton
                          size="xs"
                          color="neutral"
                          variant="outline"
                          icon="i-lucide-external-link"
                          :to="business.website"
                          target="_blank"
                        >
                          Website
                        </UButton>
                      </div>
                    </div>
                  </div>
                </article>
              </div>

              <template #footer>
                <UButton
                  block
                  color="neutral"
                  variant="outline"
                  to="#"
                  disabled
                >
                  View All Featured
                </UButton>
              </template>
            </UCard>
          </aside>
        </div>
      </UPageBody>
    </UContainer>

    <UPageCTA
      variant="naked"
      description="Get in front of Florida homeowners actively searching for licensed, insured trade pros. Free standard listings, reviewed in about a day."
      :links="listingsCtaLinks"
      :ui="listingsCtaUi"
    >
      <template #title>
        Run a trade business?
        <br>
        Get on this list.
      </template>
    </UPageCTA>
  </UPage>
</template>
