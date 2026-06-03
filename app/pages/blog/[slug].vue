<script setup lang="ts">
type WpRendered = { rendered: string }

type WpPost = {
  id: number
  slug: string
  date: string
  modified: string
  link: string
  title: WpRendered
  excerpt: WpRendered
  content: WpRendered
  _embedded?: {
    author?: Array<{ name: string; avatar_urls?: Record<string, string> }>
    'wp:featuredmedia'?: Array<{
      source_url: string
      alt_text: string
      media_details?: {
        sizes?: Record<string, { source_url: string }>
      }
    }>
  }
}

const config = useRuntimeConfig()
const route = useRoute()

const slug = computed(() => {
  const raw = route.params.slug
  return Array.isArray(raw) ? raw[0] : raw
})

const { data: post, error: postError, pending: postPending } = await useAsyncData(
  () => `wp-blog-post-${slug.value}`,
  async () => {
    const list = await $fetch<WpPost[]>(`${config.public.wpApiBase}/posts`, {
      params: {
        slug: slug.value,
        _embed: 1
      }
    })
    return list?.[0] ?? null
  },
  { watch: [slug] }
)

const notFound = computed(() => !postPending.value && !postError.value && !post.value)

const heroImage = computed(() => {
  const media = post.value?._embedded?.['wp:featuredmedia']?.[0]
  const sizes = media?.media_details?.sizes
  return (
    sizes?.full?.source_url
    ?? sizes?.large?.source_url
    ?? sizes?.medium_large?.source_url
    ?? media?.source_url
    ?? null
  )
})

const heroImageAlt = computed(() =>
  post.value?._embedded?.['wp:featuredmedia']?.[0]?.alt_text
  || stripHtml(post.value?.title.rendered ?? '')
)

const authorName = computed(() =>
  post.value?._embedded?.author?.[0]?.name ?? 'Florida Trade Specialists'
)

const authorAvatar = computed(() => {
  const avatars = post.value?._embedded?.author?.[0]?.avatar_urls
  return avatars?.['96'] ?? avatars?.['48'] ?? avatars?.['24'] ?? null
})

function formatDate(value: string | undefined) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

const postTitle = computed(() =>
  post.value ? stripHtml(post.value.title.rendered) : 'Blog'
)

const postDescription = computed(() => {
  const raw = post.value ? stripHtml(post.value.excerpt.rendered) : 'Practical guides and tips from Florida\'s licensed trade pros.'
  return raw.length > 160 ? `${raw.slice(0, 157).trimEnd()}…` : raw
})

useSeoMeta({
  title: () => `${postTitle.value} | Florida Trade Specialists`,
  description: () => postDescription.value,
  ogTitle: () => postTitle.value,
  ogDescription: () => postDescription.value,
  ogType: 'article',
  ogImage: () => heroImage.value ?? '/images/how_it_works.png',
  twitterTitle: () => postTitle.value,
  twitterDescription: () => postDescription.value,
  twitterImage: () => heroImage.value ?? '/images/how_it_works.png',
  articlePublishedTime: () => post.value?.date,
  articleModifiedTime: () => post.value?.modified,
  articleAuthor: () => [authorName.value]
})
</script>

<template>
  <UPage class="min-h-dvh bg-default">
    <UContainer class="py-10">
      <UButton
        to="/blog"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
        class="mb-6"
      >
        All posts
      </UButton>

      <UAlert
        v-if="postError"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        title="Couldn't load this post"
        description="The blog feed didn't respond. Try refreshing in a minute."
      />

      <UCard
        v-else-if="notFound"
        :ui="{ root: 'rounded-2xl bg-default ring-0 shadow-md shadow-black/5' }"
      >
        <div class="flex flex-col items-center gap-3 py-10 text-center">
          <UIcon name="i-lucide-search-x" class="size-10 text-muted" />
          <div>
            <p class="text-base font-semibold text-highlighted">
              Post not found
            </p>
            <p class="mt-1 text-sm text-muted">
              We couldn't find a post with this slug.
            </p>
          </div>
          <UButton to="/blog" color="neutral" variant="outline" icon="i-lucide-arrow-left">
            Back to all posts
          </UButton>
        </div>
      </UCard>

      <div v-else-if="postPending || !post" class="space-y-4">
        <div class="h-10 w-2/3 animate-pulse rounded-md bg-elevated/60" />
        <div class="h-4 w-1/3 animate-pulse rounded-md bg-elevated/60" />
        <div class="mt-6 h-72 animate-pulse rounded-2xl bg-elevated/60" />
        <div class="h-4 w-full animate-pulse rounded-md bg-elevated/60" />
        <div class="h-4 w-full animate-pulse rounded-md bg-elevated/60" />
        <div class="h-4 w-3/4 animate-pulse rounded-md bg-elevated/60" />
      </div>

      <article v-else class="mx-auto max-w-3xl">
        <header>
          <h1
            class="text-balance text-3xl font-semibold leading-tight tracking-tight text-highlighted sm:text-4xl lg:text-5xl"
            v-html="post.title.rendered"
          />

          <div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
            <div class="inline-flex items-center gap-2">
              <NuxtImg
                v-if="authorAvatar"
                :src="authorAvatar"
                :alt="authorName"
                class="size-7 rounded-full"
                width="56"
                loading="lazy"
              />
              <span class="font-medium text-default">{{ authorName }}</span>
            </div>
            <span class="opacity-40">·</span>
            <div class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-calendar" class="size-4 opacity-70" />
              <span>{{ formatDate(post.date) }}</span>
            </div>
          </div>
        </header>

        <div
          v-if="heroImage"
          class="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-default/70 bg-elevated"
        >
          <NuxtImg
            :src="heroImage"
            :alt="heroImageAlt"
            class="size-full object-cover"
            width="1200"
            height="675"
            sizes="(min-width: 768px) 768px, 100vw"
            format="webp"
            loading="lazy"
          />
        </div>

        <div
          class="wp-content mt-10 text-base leading-relaxed text-default"
          v-html="post.content.rendered"
        />

        <footer class="mt-12 flex flex-col items-start justify-between gap-3 border-t border-default pt-6 sm:flex-row sm:items-center">
          <UButton to="/blog" color="neutral" variant="ghost" icon="i-lucide-arrow-left">
            All posts
          </UButton>
          <UButton
            :to="post.link"
            target="_blank"
            rel="noopener"
            color="neutral"
            variant="outline"
            trailing-icon="i-lucide-external-link"
          >
            View on Florida Trade Specialists
          </UButton>
        </footer>
      </article>
    </UContainer>
  </UPage>
</template>

<style scoped>
.wp-content :deep(h1),
.wp-content :deep(h2) {
  margin-top: 2.5rem;
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 600;
  letter-spacing: -0.025em;
  color: var(--ui-text-highlighted);
}
@media (min-width: 640px) {
  .wp-content :deep(h1),
  .wp-content :deep(h2) {
    font-size: 1.875rem;
    line-height: 2.25rem;
  }
}
.wp-content :deep(h3) {
  margin-top: 2rem;
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.025em;
  color: var(--ui-text-highlighted);
}
.wp-content :deep(h4) {
  margin-top: 1.5rem;
  font-size: 1.125rem;
  line-height: 1.75rem;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}
.wp-content :deep(p) {
  margin-top: 1rem;
  margin-bottom: 1rem;
}
.wp-content :deep(a) {
  color: var(--ui-primary);
  text-underline-offset: 4px;
}
.wp-content :deep(a:hover) {
  text-decoration: underline;
}
.wp-content :deep(ul),
.wp-content :deep(ol) {
  margin-top: 1rem;
  margin-bottom: 1rem;
  margin-left: 1.5rem;
}
.wp-content :deep(ul > li),
.wp-content :deep(ol > li) {
  margin-top: 0.5rem;
}
.wp-content :deep(ul) {
  list-style-type: disc;
}
.wp-content :deep(ol) {
  list-style-type: decimal;
}
.wp-content :deep(blockquote) {
  margin: 1.5rem 0;
  padding-left: 1rem;
  border-left: 4px solid color-mix(in oklab, var(--ui-primary) 50%, transparent);
  font-style: italic;
  color: var(--ui-text-muted);
}
.wp-content :deep(img) {
  margin: 1.5rem 0;
  height: auto;
  max-width: 100%;
  border-radius: 0.75rem;
}
.wp-content :deep(figure) {
  margin: 1.5rem 0;
}
.wp-content :deep(figcaption) {
  margin-top: 0.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}
.wp-content :deep(pre) {
  margin: 1.5rem 0;
  overflow-x: auto;
  border-radius: 0.5rem;
  background-color: var(--ui-bg-elevated);
  padding: 1rem;
  font-size: 0.875rem;
}
.wp-content :deep(code) {
  border-radius: 0.25rem;
  background-color: var(--ui-bg-elevated);
  padding: 0.125rem 0.375rem;
  font-size: 0.875rem;
}
.wp-content :deep(hr) {
  margin: 2.5rem 0;
  border-color: var(--ui-border);
}
.wp-content :deep(table) {
  margin: 1.5rem 0;
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.wp-content :deep(th),
.wp-content :deep(td) {
  border: 1px solid var(--ui-border);
  padding: 0.5rem 0.75rem;
  text-align: left;
}
.wp-content :deep(th) {
  background-color: color-mix(in oklab, var(--ui-bg-elevated) 60%, transparent);
  font-weight: 600;
  color: var(--ui-text-highlighted);
}
</style>
