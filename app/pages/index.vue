<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'

const heroSignals = [
  { icon: 'i-lucide-shield-check', label: 'Licensed & insured' },
  { icon: 'i-lucide-zap', label: 'Avg response 6 min' },
  { icon: 'i-lucide-phone-call', label: 'Tap to call' }
]

type CategoryRow = {
  id: string
  slug: string
  name: string
  description: string | null
  icon_key: string | null
  sort_order: number
}

type HeroBusinessRow = {
  id: string
  name: string
  logo_path: string | null
}

const supabase = useSupabaseClient()

const { data: categoryRows } = await useAsyncData('home-categories', async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name, description, icon_key, sort_order')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as CategoryRow[]
})

const HERO_AVATAR_LIMIT = 4

const { data: heroStats } = await useAsyncData('hero-stats', async () => {
  const [logoQuery, countQuery] = await Promise.all([
    supabase
      .from('businesses')
      .select('id, name, logo_path')
      .eq('status', 'published')
      .not('logo_path', 'is', null)
      .order('featured', { ascending: false })
      .order('featured_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(HERO_AVATAR_LIMIT),
    supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
  ])
  if (logoQuery.error) throw logoQuery.error
  if (countQuery.error) throw countQuery.error
  return {
    featured: (logoQuery.data ?? []) as HeroBusinessRow[],
    publishedCount: countQuery.count ?? 0
  }
})

function logoPublicUrl(path: string) {
  return supabase.storage.from('business-logos').getPublicUrl(path).data.publicUrl
}

function nameInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map(part => part.charAt(0).toUpperCase()).join('') || '?'
}

const heroAvatars = computed(() =>
  (heroStats.value?.featured ?? []).map(row => ({
    id: row.id,
    name: row.name,
    initials: nameInitials(row.name),
    logoUrl: row.logo_path ? logoPublicUrl(row.logo_path) : null
  }))
)

const heroRemainingCount = computed(() => {
  const total = heroStats.value?.publishedCount ?? 0
  return Math.max(0, total - heroAvatars.value.length)
})

const heroPublishedCount = computed(() => heroStats.value?.publishedCount ?? 0)

const categoryImageOverrides: Record<string, string> = {
  plumbing: '/images/categories/plumbing.png',
  electrical: '/images/categories/electrical.png',
  hvac: '/images/categories/hvac.png',
  roofing: '/images/categories/roofing.png'
}

function categoryImage(slug: string) {
  return categoryImageOverrides[slug] ?? `https://picsum.photos/seed/${slug}-trade/900/600`
}

const categories = computed(() =>
  (categoryRows.value ?? []).map(row => ({
    slug: row.slug,
    title: row.name,
    desc: row.description ?? '',
    icon: row.icon_key ?? 'i-lucide-tag',
    image: categoryImage(row.slug)
  }))
)

const discoveryFeatures = [
  {
    title: 'Verified pros only',
    description:
      'Every business on The Network submits proof of license and insurance before their listing goes live.',
    icon: 'i-lucide-shield-check'
  },
  {
    title: 'Call or visit in one tap',
    description: 'Phone numbers and websites sit right on every listing — no forms, no waiting for a callback.',
    icon: 'i-lucide-phone-call'
  },
  {
    title: 'Built for your phone',
    description:
      'Search, filter, and compare local pros from the couch, the driveway, or wherever the problem is.',
    icon: 'i-lucide-smartphone'
  }
]

const businessFeatures = [
  {
    title: 'Credibility built in',
    description:
      'Upload your license, insurance, and logo once. Homeowners see proof of trust before they ever pick up the phone.',
    icon: 'i-lucide-file-badge'
  },
  {
    title: 'Featured placements',
    description: 'Upgrade to a featured spot in the sidebar to stay front-and-center when homeowners are ready to hire.',
    icon: 'i-lucide-sparkles'
  },
  {
    title: 'Found by category',
    description: 'Show up everywhere homeowners look — plumbing, electrical, HVAC, roofing, and more.',
    icon: 'i-lucide-compass'
  }
]

const steps = [
  {
    title: 'Pick your trade',
    description: 'Choose the category that matches what you do — plumbing, electrical, HVAC, roofing, and more.'
  },
  {
    title: 'Upload license & insurance',
    description: 'Drop in your credentials, a logo, and a short bio. We review every submission before it goes public.'
  },
  {
    title: 'Start taking calls',
    description: 'Once approved, your listing is live across The Network with tap-to-call and website links wired up.'
  }
]

const faqItems: AccordionItem[] = [
  {
    label: 'How do you verify businesses?',
    icon: 'i-lucide-badge-check',
    content:
      'Every business uploads a license and insurance document during signup. We review the paperwork before the listing is approved.'
  },
  {
    label: 'Can customers reach me directly?',
    icon: 'i-lucide-phone',
    content:
      'Yes — your phone number and website sit on every listing with tap-to-call buttons. Leads come straight to you, no middleman.'
  },
  {
    label: 'What does a listing cost?',
    icon: 'i-lucide-circle-dollar-sign',
    content:
      'A standard listing is free. Featured placements that pin you to the sidebar are a paid upgrade — pricing details are sent after you submit.'
  },
  {
    label: 'Which trades do you cover?',
    icon: 'i-lucide-cloud-sun',
    content:
      'We currently list plumbing, electrical, HVAC, and roofing across Florida. New trades are added based on demand from homeowners and contractors.'
  }
]

/** Outer stack gap is the only space between major sections */
const landingStackGap = 'gap-24 sm:gap-28 lg:gap-36'

const landingSectionUi = {
  container:
    '!py-0 gap-8 sm:gap-16 flex flex-col lg:grid lg:grid-cols-2 lg:items-center',
  headline: 'text-base font-semibold text-primary sm:text-lg',
  title: 'text-3xl font-semibold tracking-tight text-highlighted lg:text-5xl'
}

const landingCtaUi = {
  root: 'rounded-none ring-0 shadow-none overflow-visible',
  container:
    '!px-0 !py-16 sm:!py-20 lg:!py-28 gap-8 sm:gap-16 flex flex-col',
  title: 'text-3xl font-semibold tracking-tight text-highlighted lg:text-5xl'
}

const ctaLinks = [
  {
    label: 'Submit your business',
    to: '/submit-business',
    icon: 'i-lucide-arrow-right',
    size: 'lg' as const
  },
  {
    label: 'Browse listings',
    to: '/listings',
    color: 'neutral' as const,
    variant: 'outline' as const,
    size: 'lg' as const
  }
]
</script>

<template>
  <UPage class="bg-default">
    <div class="flex flex-col" :class="landingStackGap">
      <section class="relative isolate overflow-hidden">
        <div class="pointer-events-none absolute inset-0 -z-10">
          <div class="absolute -top-48 left-1/2 size-[760px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          <div
            class="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,color-mix(in_oklab,var(--ui-text-muted)_25%,transparent)_1px,transparent_0)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_72%)]"
          />
        </div>

        <UContainer class="py-20 sm:py-28 lg:py-36">
          <div class="mx-auto flex max-w-3xl flex-col items-center text-center">
            <div class="inline-flex items-center gap-2 rounded-full border border-default/70 bg-default/80 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span class="relative inline-flex size-2">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span class="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              <span class="text-muted">
                Verified pros in Florida
              </span>
            </div>

            <h1 class="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-highlighted sm:text-6xl lg:text-7xl">
              Hire local pros.
              <span class="block text-primary">Skip the guesswork.</span>
            </h1>

            <p class="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted sm:text-xl">
              Browse vetted plumbers, electricians, HVAC techs, and roofers — license-backed profiles with one tap to call.
            </p>

            <div class="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <UButton
                to="/listings"
                size="xl"
                color="secondary"
                icon="i-lucide-search"
                trailing-icon="i-lucide-arrow-right"
                block
                class="sm:w-auto"
              >
                Find a pro
              </UButton>
              <UButton
                to="/submit-business"
                size="xl"
                color="neutral"
                variant="outline"
                icon="i-lucide-plus"
                block
                class="sm:w-auto"
              >
                List your business
              </UButton>
            </div>

            <div
              v-if="heroPublishedCount > 0"
              class="mt-12 flex flex-col items-center gap-5 sm:flex-row sm:gap-6"
            >
              <div class="flex -space-x-2">
                <span
                  v-for="avatar in heroAvatars"
                  :key="avatar.id"
                  class="grid size-9 place-items-center overflow-hidden rounded-full border-2 border-default bg-elevated text-[11px] font-semibold text-default shadow-sm"
                  :title="avatar.name"
                >
                  <img
                    v-if="avatar.logoUrl"
                    :src="avatar.logoUrl"
                    :alt="avatar.name"
                    class="size-full object-cover"
                    loading="lazy"
                  >
                  <template v-else>
                    {{ avatar.initials }}
                  </template>
                </span>
                <span
                  v-if="heroRemainingCount > 0"
                  class="grid size-9 place-items-center rounded-full border-2 border-default bg-primary/15 text-[11px] font-semibold text-primary shadow-sm"
                >
                  +{{ heroRemainingCount }}
                </span>
              </div>
              <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted">
                <div
                  v-for="signal in heroSignals"
                  :key="signal.label"
                  class="inline-flex items-center gap-1.5"
                >
                  <UIcon :name="signal.icon" class="size-4 text-primary" />
                  <span class="font-medium text-default">{{ signal.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </UContainer>
      </section>

      <UContainer>
        <section>
          <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-base font-semibold text-primary sm:text-lg">
                Trades we cover
              </p>
              <h2 class="text-3xl font-semibold tracking-tight text-highlighted lg:text-5xl">
                Browse by trade specialty
              </h2>
              <p class="mt-2 max-w-2xl text-muted">
                Tap any trade to see licensed pros covering your area. New categories added as demand grows.
              </p>
            </div>
            <UButton to="/listings" color="neutral" variant="outline" icon="i-lucide-arrow-up-right">
              View all listings
            </UButton>
          </div>

          <UCarousel
            v-slot="{ item }"
            :items="categories"
            arrows
            dots
            :ui="{
              viewport: 'max-w-full overflow-x-hidden',
              container: 'gap-4 !ms-0',
              item:
                '!ps-0 min-w-0 shrink-0 overflow-hidden basis-full sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)]'
            }"
          >
            <NuxtLink
              :to="{ path: '/listings', query: { category: item.slug } }"
              class="group relative block h-80 overflow-hidden rounded-2xl border border-default/70 shadow-lg shadow-black/10 sm:h-96"
            >
              <img
                :src="item.image"
                :alt="item.title"
                class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              >
              <div class="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-transparent" />
              <div class="relative flex h-full flex-col justify-end p-5 text-white">
                <div class="flex size-10 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                  <UIcon :name="item.icon" class="size-5" />
                </div>
                <p class="mt-4 text-2xl font-semibold tracking-tight">
                  {{ item.title }}
                </p>
                <p class="mt-2 text-sm leading-relaxed text-white/80 line-clamp-2">
                  {{ item.desc }}
                </p>
                <span
                  class="mt-4 inline-flex w-fit items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-sm font-medium text-stone-900 transition group-hover:bg-white/90"
                >
                  Explore {{ item.title }}
                  <UIcon name="i-lucide-arrow-right" class="size-4" />
                </span>
              </div>
            </NuxtLink>
          </UCarousel>
        </section>
      </UContainer>

      <UPageSection
        class="mt-12 lg:mt-16"
        headline="Why The Network"
        title="Find the right pro without the spam or guesswork."
        description="Every business on The Network is licensed, insured, and reviewed before they show up in your search. No anonymous reviews, no shady directories — just verified local trades."
        orientation="horizontal"
        reverse
        :features="discoveryFeatures"
        :ui="landingSectionUi"
      >
        <div
          class="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-default/70 shadow-xl lg:aspect-auto lg:h-full lg:self-stretch"
        >
          <img
            src="/images/why_us.png"
            alt="Verified local pros on The Network"
            class="absolute inset-0 size-full object-cover object-center"
            loading="lazy"
          >
        </div>
      </UPageSection>

      <section class="relative isolate overflow-hidden py-20 sm:py-28 lg:py-32">
        <div class="absolute inset-0 -z-10">
          <img
            src="/images/how_it_works.png"
            alt=""
            class="size-full object-cover object-center"
          >
          <div class="absolute inset-0 bg-stone-950/75" />
        </div>

        <UContainer>
          <div class="flex flex-col gap-3 text-center">
            <p class="text-base font-semibold text-primary sm:text-lg">
              How it works
            </p>
            <h2 class="text-3xl font-semibold tracking-tight text-white lg:text-5xl">
              Get listed in three steps
            </h2>
            <p class="mx-auto max-w-3xl text-base text-white/80">
              From submission to live listing, most contractors are up on The Network within a day. Here's the path.
            </p>
          </div>

          <div class="mt-10 grid gap-4 md:grid-cols-3">
            <UCard
              v-for="(step, index) in steps"
              :key="step.title"
              :ui="{ root: 'h-full rounded-2xl border border-default/70 bg-default divide-y-0' }"
            >
              <div class="flex items-start gap-3">
                <div
                  class="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold leading-none tabular-nums text-primary"
                >
                  {{ index + 1 }}
                </div>
                <div class="space-y-2">
                  <p class="text-lg font-semibold text-highlighted">
                    {{ step.title }}
                  </p>
                  <p class="text-sm leading-relaxed text-muted">
                    {{ step.description }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>
        </UContainer>
      </section>

      <UPageSection
        headline="For contractors"
        title="Turn your license into your best marketing asset."
        description="Your credentials already set you apart from the unlicensed crowd. The Network puts them in front of homeowners who are actively searching for a pro."
        orientation="horizontal"
        :features="businessFeatures"
        :ui="landingSectionUi"
      >
        <div
          class="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-default/70 shadow-xl lg:aspect-auto lg:h-full lg:self-stretch"
        >
          <img
            src="/images/for_contractors.png"
            alt="Contractor managing their listing on The Network"
            class="absolute inset-0 size-full object-cover object-center"
            loading="lazy"
          >
        </div>
      </UPageSection>

      <UContainer class="mt-12 lg:mt-16">
        <section>
          <div class="mb-6 text-center">
            <p class="text-base font-semibold text-primary sm:text-lg">
              FAQ
            </p>
            <h2 class="text-3xl font-semibold tracking-tight text-highlighted lg:text-5xl">
              Frequently asked questions
            </h2>
            <p class="mt-2 text-muted">
              The most common questions we hear from homeowners and contractors before they sign up.
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UCard
              v-for="item in faqItems"
              :key="item.label"
              :ui="{ root: 'h-full rounded-2xl border border-default/70 bg-default divide-y-0' }"
            >
              <div class="flex items-start gap-3">
                <div class="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  <UIcon :name="item.icon" class="size-5" />
                </div>
                <div class="space-y-2">
                  <p class="text-lg font-semibold text-highlighted">
                    {{ item.label }}
                  </p>
                  <p class="text-base leading-relaxed text-muted">
                    {{ item.content }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>
        </section>
      </UContainer>

      <UPageCTA
        variant="naked"
        description="Submit your business in minutes. Get verified, get listed, and let homeowners come to you instead of the other way around."
        :links="ctaLinks"
        :ui="landingCtaUi"
      >
        <template #title>
          Stop chasing leads.
          <br>
          Start answering the phone.
        </template>
      </UPageCTA>
    </div>
  </UPage>
</template>
