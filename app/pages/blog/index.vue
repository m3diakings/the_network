<script setup lang="ts">
useSeoMeta({
  title: 'Florida Trade Blog — Home Project Tips & Contractor Insights',
  description: 'Practical guides on hiring contractors, hurricane prep, roof repair, leak detection, and home maintenance — straight from Florida\'s licensed trade pros.',
  ogTitle: 'Florida Trade Blog — Tips from Licensed Local Pros',
  ogDescription: 'Hiring guides, repair walkthroughs, and home maintenance advice for Florida homeowners.',
  ogImage: '/images/how_it_works.png',
  twitterTitle: 'Florida Trade Blog — Tips from Licensed Local Pros',
  twitterDescription: 'Hiring guides and home maintenance advice for Florida homeowners.',
  twitterImage: '/images/how_it_works.png'
})

type WpRendered = { rendered: string }

type WpPost = {
  id: number
  slug: string
  date: string
  title: WpRendered
  excerpt: WpRendered
  _embedded?: {
    author?: Array<{ name: string }>
    'wp:featuredmedia'?: Array<{
      source_url: string
      alt_text: string
      media_details?: {
        sizes?: Record<string, { source_url: string }>
      }
    }>
  }
}

const PER_PAGE = 12

const config = useRuntimeConfig()
const route = useRoute()
const router = useRouter()

const currentPage = computed(() => {
  const raw = Number(Array.isArray(route.query.page) ? route.query.page[0] : route.query.page)
  return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1
})

const { data: postsData, error: postsError, pending: postsPending } = await useAsyncData(
  () => `wp-blog-page-${currentPage.value}`,
  async () => {
    const response = await $fetch.raw<WpPost[]>(`${config.public.wpApiBase}/posts`, {
      params: {
        per_page: PER_PAGE,
        page: currentPage.value,
        _embed: 1
      },
      timeout: 8000,
      retry: 2,
      retryDelay: 300
    })
    return {
      posts: response._data ?? [],
      totalPages: Number(response.headers.get('x-wp-totalpages') ?? 1),
      total: Number(response.headers.get('x-wp-total') ?? 0)
    }
  },
  { watch: [currentPage] }
)

const posts = computed(() => postsData.value?.posts ?? [])
const totalPages = computed(() => postsData.value?.totalPages ?? 1)
const total = computed(() => postsData.value?.total ?? 0)

function postImage(post: WpPost) {
  const media = post._embedded?.['wp:featuredmedia']?.[0]
  const sizes = media?.media_details?.sizes
  return (
    sizes?.medium_large?.source_url
    ?? sizes?.medium?.source_url
    ?? media?.source_url
    ?? null
  )
}

function authorName(post: WpPost) {
  return post._embedded?.author?.[0]?.name ?? 'Florida Trade Specialists'
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  router.push({ path: '/blog', query: { ...route.query, page: page === 1 ? undefined : page } })
}
</script>

<template>
  <UPage class="min-h-dvh bg-default">
    <UContainer class="py-10">
      <UPageHeader
        headline="Insights"
        title="Florida Trade Blog"
        description="Guides, tips, and updates from the Florida Trade Specialists team."
        :ui="{ root: 'border-b-0' }"
      />

      <UPageBody class="mt-6 pb-16">
        <p v-if="!postsPending && !postsError && total > 0" class="mb-6 text-sm text-muted">
          Showing
          <span class="font-semibold text-default">{{ posts.length }}</span>
          of {{ total }} {{ total === 1 ? 'post' : 'posts' }}
          — page {{ currentPage }} of {{ totalPages }}
        </p>

        <UAlert
          v-if="postsError"
          color="error"
          variant="subtle"
          icon="i-lucide-alert-triangle"
          title="Couldn't load posts"
          description="The blog feed didn't respond. Try refreshing in a minute."
        />

        <div v-else-if="postsPending && posts.length === 0" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="n in 6"
            :key="n"
            class="h-72 animate-pulse rounded-2xl border border-default/70 bg-elevated/50"
          />
        </div>

        <UCard
          v-else-if="posts.length === 0"
          :ui="{ root: 'rounded-2xl bg-default ring-0 shadow-md shadow-black/5' }"
        >
          <div class="flex flex-col items-center gap-3 py-10 text-center">
            <UIcon name="i-lucide-inbox" class="size-10 text-muted" />
            <p class="text-base font-semibold text-highlighted">
              No posts on this page
            </p>
            <UButton to="/blog" color="neutral" variant="outline">
              Back to first page
            </UButton>
          </div>
        </UCard>

        <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="post in posts"
            :key="post.id"
            :to="`/blog/${post.slug}`"
            class="group flex h-full flex-col overflow-hidden rounded-2xl border border-default/70 bg-default shadow-md shadow-black/5 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div class="relative aspect-[4/3] overflow-hidden bg-elevated">
              <NuxtImg
                v-if="postImage(post)"
                :src="postImage(post)!"
                :alt="post._embedded?.['wp:featuredmedia']?.[0]?.alt_text || stripHtml(post.title.rendered)"
                class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                width="600"
                height="450"
                sizes="100vw sm:50vw lg:33vw"
                format="webp"
                loading="lazy"
              />
              <div v-else class="grid size-full place-items-center text-muted">
                <UIcon name="i-lucide-image" class="size-8 opacity-50" />
              </div>
            </div>

            <div class="flex flex-1 flex-col gap-3 p-5">
              <div class="flex items-center gap-2 text-xs text-muted">
                <UIcon name="i-lucide-calendar" class="size-3.5 opacity-70" />
                <span>{{ formatDate(post.date) }}</span>
                <span class="opacity-40">·</span>
                <span class="truncate">{{ authorName(post) }}</span>
              </div>

              <h2
                class="text-lg font-semibold leading-snug text-highlighted transition-colors group-hover:text-primary"
                v-html="post.title.rendered"
              />

              <p
                class="line-clamp-3 text-sm leading-relaxed text-muted"
              >
                {{ stripHtml(post.excerpt.rendered) }}
              </p>

              <div class="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                Read more
                <UIcon name="i-lucide-arrow-right" class="size-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </NuxtLink>
        </div>

        <div
          v-if="totalPages > 1 && !postsError"
          class="mt-10 flex flex-col items-center justify-between gap-3 sm:flex-row"
        >
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-arrow-left"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
          >
            Previous
          </UButton>

          <span class="text-sm text-muted">
            Page {{ currentPage }} of {{ totalPages }}
          </span>

          <UButton
            color="neutral"
            variant="outline"
            trailing-icon="i-lucide-arrow-right"
            :disabled="currentPage >= totalPages"
            @click="goToPage(currentPage + 1)"
          >
            Next
          </UButton>
        </div>
      </UPageBody>
    </UContainer>
  </UPage>
</template>
