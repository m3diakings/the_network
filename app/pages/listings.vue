<script setup lang="ts">
type BusinessRow = {
  id: string
  category_id: string | null
  name: string
  phone: string
  website_url: string
  bio: string
  address: string
  logo_path: string | null
  featured: boolean
  featured_order: number | null
  created_at: string
}

type Business = {
  id: string
  categoryId: string | null
  name: string
  phone: string
  website: string
  bio: string
  address: string
  logo: string
  createdAt: string
  featured: boolean
}

type CategoryOption = {
  id: string
  label: string
}

const supabase = useSupabaseClient()

const { data: businessRows } = await useAsyncData('listings', async () => {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, category_id, name, phone, website_url, bio, address, logo_path, featured, featured_order, created_at')
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

function logoUrl(path: string | null) {
  if (!path) return 'https://placehold.co/88x88/64748b/ffffff?text=Logo'
  const { data } = supabase.storage.from('business-logos').getPublicUrl(path)
  return data.publicUrl
}

function toBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    phone: row.phone,
    website: row.website_url,
    bio: row.bio,
    address: row.address,
    logo: logoUrl(row.logo_path),
    createdAt: row.created_at,
    featured: row.featured
  }
}

const allBusinesses = computed(() => (businessRows.value ?? []).map(toBusiness))

const categoryOptions = computed<CategoryOption[]>(() => [
  { id: 'all', label: 'All categories' },
  ...(categoryRows.value ?? []).map(row => ({ id: row.id, label: row.name }))
])

const sortOptions = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'name', label: 'Name (A–Z)' }
] as const

type SortId = (typeof sortOptions)[number]['id']

const route = useRoute()
const router = useRouter()

function categoryIdFromSlug(slug: string | undefined) {
  if (!slug) return 'all'
  const match = (categoryRows.value ?? []).find(row => row.slug === slug)
  return match?.id ?? 'all'
}

const initialCategorySlug = typeof route.query.category === 'string' ? route.query.category : undefined

const searchQuery = ref('')
const selectedCategoryId = ref<string>(categoryIdFromSlug(initialCategorySlug))
const selectedSort = ref<SortId>('newest')

watch(
  () => route.query.category,
  (slug) => {
    selectedCategoryId.value = categoryIdFromSlug(typeof slug === 'string' ? slug : undefined)
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

const businesses = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const category = selectedCategoryId.value
  const sort = selectedSort.value

  const matches = allBusinesses.value.filter(business => {
    if (category !== 'all' && business.categoryId !== category) return false
    if (!query) return true
    return (
      business.name.toLowerCase().includes(query)
      || business.bio.toLowerCase().includes(query)
      || business.address.toLowerCase().includes(query)
    )
  })

  if (sort === 'name') {
    matches.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sort === 'oldest') {
    matches.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  } else {
    matches.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  return matches
})

const featuredBusinesses = computed(() => {
  const featured = (businessRows.value ?? [])
    .filter(row => row.featured)
    .sort((a, b) => (a.featured_order ?? 0) - (b.featured_order ?? 0))
    .map(toBusiness)
  return featured.length ? featured : allBusinesses.value.slice(0, 3)
})

const hasActiveFilters = computed(() =>
  searchQuery.value.trim().length > 0
  || selectedCategoryId.value !== 'all'
  || selectedSort.value !== 'newest'
)

function clearFilters() {
  searchQuery.value = ''
  selectedCategoryId.value = 'all'
  selectedSort.value = 'newest'
}

function phoneHref(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return `tel:${digits}`
}
</script>

<template>
  <UPage class="min-h-dvh bg-default">
    <UContainer class="py-10">
      <UPageHeader
        headline="Business Directory"
        title="Trade Companies in Florida"
        description="Browse trusted local businesses with quick access to contact info and websites."
      />
      <div class="mt-4">
        <UButton to="/submit-business" icon="i-lucide-plus">
          Submit Your Business
        </UButton>
      </div>

      <UPageBody class="mt-6 pb-16">
        <div class="mb-6 flex flex-col gap-3 rounded-2xl border border-default/70 bg-elevated/40 p-3 sm:flex-row sm:flex-wrap sm:items-center">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Search by name, bio, or address"
            class="flex-1 min-w-[14rem]"
            size="md"
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
          <div class="space-y-4">
            <p class="text-sm text-muted">
              Showing <span class="font-semibold text-default">{{ businesses.length }}</span>
              of {{ allBusinesses.length }} {{ allBusinesses.length === 1 ? 'business' : 'businesses' }}
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
              v-for="business in businesses"
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
                    :src="business.logo"
                    :alt="`${business.name} logo`"
                    class="h-52 w-full object-cover sm:h-full"
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
                    </div>

                  <p class="text-sm leading-relaxed text-muted line-clamp-3">
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
                          {{ business.phone }}
                        </ULink>
                      </div>

                      <div class="inline-flex min-w-0 items-center gap-2 text-muted">
                        <UIcon name="i-lucide-globe" class="size-4 shrink-0 opacity-70" />
                        <ULink
                          class="truncate font-medium text-default hover:text-primary"
                          :to="business.website"
                          target="_blank"
                        >
                        Website
                        </ULink>
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
                    <img
                      :src="business.logo"
                      :alt="`${business.name} logo`"
                      class="size-14 rounded-lg object-cover"
                      loading="lazy"
                    >

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
                          {{ business.phone }}
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
  </UPage>
</template>
