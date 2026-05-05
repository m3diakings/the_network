<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'

const heroLinks = [
  {
    label: 'Explore listings',
    to: '/listings',
    icon: 'i-lucide-search',
    size: 'xl' as const
  },
  {
    label: 'List your business',
    to: '/submit-business',
    color: 'neutral' as const,
    variant: 'outline' as const,
    icon: 'i-lucide-plus',
    size: 'xl' as const
  }
]

const categories = [
  {
    title: 'Plumbing',
    desc: 'Repairs, leak detection, and water heater services.',
    icon: 'i-lucide-wrench'
  },
  {
    title: 'Electrical',
    desc: 'Panel upgrades, rewiring, and EV charger installs.',
    icon: 'i-lucide-zap'
  },
  {
    title: 'HVAC',
    desc: 'Cooling, heating, and indoor air quality solutions.',
    icon: 'i-lucide-fan'
  },
  {
    title: 'Roofing',
    desc: 'Inspections, storm repair, and full replacements.',
    icon: 'i-lucide-house'
  }
]

const discoveryFeatures = [
  {
    title: 'Verified-first profiles',
    description:
      'Structured listings show what matters—coverage signals, specialties, and fast ways to reach you.',
    icon: 'i-lucide-shield-check'
  },
  {
    title: 'One-tap contact',
    description: 'Tap-to-call and website links reduce friction so homeowners convert while intent is high.',
    icon: 'i-lucide-phone-call'
  },
  {
    title: 'Built for mobile search',
    description:
      'Thumb-friendly layouts and scannable cards mean customers find answers before they bounce.',
    icon: 'i-lucide-smartphone'
  }
]

const businessFeatures = [
  {
    title: 'Submission that respects paperwork',
    description:
      'Collect license and insurance uploads alongside your logo so prospects see credibility upfront.',
    icon: 'i-lucide-file-badge'
  },
  {
    title: 'Premium placement options',
    description: 'Featured sidebar placement keeps high-intent leads focused on your profile.',
    icon: 'i-lucide-sparkles'
  },
  {
    title: 'Always-on discovery',
    description: 'Category browsing keeps your trade visible even when customers start broad.',
    icon: 'i-lucide-compass'
  }
]

const steps = [
  {
    title: 'Claim your trade category',
    description: 'Pick plumbing, electrical, HVAC, roofing, and more so locals land on the right lane.'
  },
  {
    title: 'Upload proof & polish your story',
    description: 'Add credentials and a crisp bio—customers decide faster when details are obvious.'
  },
  {
    title: 'Go live with instant actions',
    description: 'Enable phone and web CTAs that match how homeowners actually hire.'
  }
]

const faqItems: AccordionItem[] = [
  {
    label: 'How do listings stay trustworthy?',
    icon: 'i-lucide-badge-check',
    content:
      'Businesses submit documentation during onboarding so profiles carry the signals homeowners expect before they call.'
  },
  {
    label: 'Can customers reach me instantly?',
    icon: 'i-lucide-phone',
    content:
      'Yes—tap-to-call and website buttons sit beside every listing card so there is no hunting for contact info.'
  },
  {
    label: 'What does it cost to get featured?',
    icon: 'i-lucide-circle-dollar-sign',
    content:
      'Start with the standard directory placement, then graduate to featured sidebar spots as you scale inbound leads.'
  },
  {
    label: 'Do you support seasonal trades?',
    icon: 'i-lucide-cloud-sun',
    content:
      'Categories cover common trades today and we continuously expand coverage based on demand from homeowners.'
  }
]

/** Outer stack gap is the only space between major sections */
const landingStackGap = 'gap-24 sm:gap-28 lg:gap-36'

const landingHeroUi = {
  container:
    '!pt-10 sm:!pt-12 lg:!pt-14 !pb-0 gap-8 sm:gap-y-10 lg:gap-x-12 lg:gap-y-10 flex flex-col lg:grid lg:grid-cols-2 lg:items-center'
}

const landingSectionUi = {
  container:
    '!py-0 gap-8 sm:gap-16 flex flex-col lg:grid lg:grid-cols-2 lg:items-center'
}

const landingCtaUi = {
  root: 'rounded-none ring-0 shadow-none overflow-visible',
  container:
    '!px-0 !py-16 sm:!py-20 lg:!py-28 gap-8 sm:gap-16 flex flex-col'
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
      <UPageHero
        orientation="horizontal"
        headline="Local trades. Serious discovery."
        title="Find trusted contractors without the runaround."
        description="The Network is a conversion-ready directory for homeowners who need speed—and for contractors who want calls, not clicks."
        :links="heroLinks"
        :ui="landingHeroUi"
      >
        <template #default>
          <div class="relative mx-auto max-w-sm lg:max-w-none">
            <div class="absolute inset-x-6 top-6 -z-10 h-64 rounded-[32px] bg-linear-to-br from-primary/25 via-primary/10 to-transparent blur-2xl" />
            <div class="rounded-[32px] border border-default/70 bg-default/95 p-4 shadow-2xl shadow-black/10 backdrop-blur">
              <div class="flex items-center justify-between rounded-2xl bg-elevated/60 px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <UIcon name="i-lucide-bolt" class="size-5" />
                </div>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-muted">
                    Featured contractor
                  </p>
                  <p class="text-sm font-semibold text-highlighted">
                    Summit Electric Co.
                  </p>
                </div>
              </div>
              <UBadge color="primary" variant="subtle" size="sm">
                Verified
              </UBadge>
            </div>

            <div class="mt-4 space-y-3 rounded-2xl border border-default/70 bg-default p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-muted">Today’s bookings</p>
                  <p class="text-2xl font-semibold text-highlighted">
                    18
                  </p>
                </div>
                <div class="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                  +32% week
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <UCard :ui="{ root: 'rounded-xl border border-default/70 bg-elevated/40 divide-y-0' }">
                  <div class="space-y-1">
                    <p class="text-xs text-muted">
                      Call-through rate
                    </p>
                    <p class="text-lg font-semibold text-highlighted">
                      41%
                    </p>
                  </div>
                </UCard>
                <UCard :ui="{ root: 'rounded-xl border border-default/70 bg-elevated/40 divide-y-0' }">
                  <div class="space-y-1">
                    <p class="text-xs text-muted">
                      Avg. response
                    </p>
                    <p class="text-lg font-semibold text-highlighted">
                      6 min
                    </p>
                  </div>
                </UCard>
              </div>
              <div class="rounded-xl bg-primary/10 px-3 py-2 text-sm text-highlighted">
                Homeowners convert faster when phone & web CTAs sit side-by-side.
              </div>
            </div>

            <div class="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-muted">
              <div class="rounded-xl border border-dashed border-default/60 px-2 py-3">
                Licensed pros
              </div>
              <div class="rounded-xl border border-dashed border-default/60 px-2 py-3">
                Photo-ready cards
              </div>
              <div class="rounded-xl border border-dashed border-default/60 px-2 py-3">
                Mobile-first UX
              </div>
            </div>
          </div>
        </div>
        </template>
      </UPageHero>

      <UContainer>
        <section>
          <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-sm font-semibold text-primary">
                Categories in rotation
              </p>
              <h2 class="text-3xl font-semibold tracking-tight text-highlighted">
                Browse by trade specialty
              </h2>
              <p class="mt-2 max-w-2xl text-muted">
                Carousel-friendly cards echo Pocket’s rotating proof strips—built with your neutral surfaces and primary accents.
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
            <UCard class="h-full" :ui="{ root: 'rounded-2xl border border-default/70 bg-default divide-y-0' }">
              <div class="space-y-4">
                <UIcon :name="item.icon" class="size-7 text-primary" />
                <div class="space-y-2">
                  <p class="text-xl font-semibold text-highlighted">
                    {{ item.title }}
                  </p>
                  <p class="text-sm text-muted">
                    {{ item.desc }}
                  </p>
                </div>
                <UButton to="/listings" variant="soft" color="primary" size="sm">
                  Explore {{ item.title }}
                </UButton>
              </div>
            </UCard>
          </UCarousel>
        </section>
      </UContainer>

      <UPageSection
        headline="Why The Network"
        title="Marketing-grade storytelling meets operational rigor."
        description="Borrowing the rhythm of premium app launches—clear hero, proof, workflow, and FAQs—while staying anchored in how homeowners actually hire tradespeople."
        orientation="horizontal"
        reverse
        :features="discoveryFeatures"
        :ui="landingSectionUi"
      >
        <UCard :ui="{ root: 'rounded-3xl border border-default/70 bg-linear-to-br from-default via-default to-primary/5 shadow-xl divide-y-0' }">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-3 rounded-2xl bg-elevated/50 p-4">
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-scan-search" class="size-6 text-primary" />
                <div>
                  <p class="text-sm font-semibold text-highlighted">
                    Structured discovery
                  </p>
                  <p class="text-xs text-muted">
                    Filters map to how people search locally.
                  </p>
                </div>
              </div>
              <div class="space-y-2 rounded-xl border border-default/60 bg-default p-3">
                <div class="flex items-center justify-between text-xs text-muted">
                  <span>Nearby electricians</span>
                  <span class="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    Live
                  </span>
                </div>
                <div class="flex items-center gap-3">
                  <div class="size-12 rounded-lg bg-primary/10" />
                  <div class="flex-1 space-y-2">
                    <div class="h-2 w-3/4 rounded-full bg-default/80" />
                    <div class="h-2 w-1/2 rounded-full bg-default/60" />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-col justify-between gap-4 rounded-2xl border border-default/70 bg-default p-4">
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-mouse-pointer-click" class="size-6 text-primary" />
                <div>
                  <p class="text-sm font-semibold text-highlighted">
                    Conversion-ready cards
                  </p>
                  <p class="text-xs text-muted">
                    Calls and websites stay visible without extra taps.
                  </p>
                </div>
              </div>
              <div class="rounded-xl bg-primary/10 p-3 text-sm text-highlighted">
                Pocket-inspired pacing: hero proof → workflows → social proof → decisive CTA.
              </div>
              <div class="flex flex-wrap gap-2">
                <UBadge color="neutral" variant="outline">
                  Directory SEO
                </UBadge>
                <UBadge color="neutral" variant="outline">
                  Featured placements
                </UBadge>
                <UBadge color="neutral" variant="outline">
                  Launch-ready copy
                </UBadge>
              </div>
            </div>
          </div>
        </UCard>
      </UPageSection>

      <UPageSection
        headline="For contractors"
        title="Turn paperwork into a premium storefront."
        description="Own your lane with documentation-backed profiles, polished visuals, and placements designed for inbound calls."
        orientation="horizontal"
        :features="businessFeatures"
        :ui="landingSectionUi"
      >
        <UCard :ui="{ root: 'rounded-3xl border border-default/70 bg-default divide-y-0 shadow-xl' }">
          <div class="space-y-4">
            <div class="flex items-center justify-between rounded-2xl bg-elevated/60 px-4 py-3">
              <div>
                <p class="text-xs uppercase tracking-wide text-muted">
                  Dashboard pulse
                </p>
                <p class="text-lg font-semibold text-highlighted">
                  Weekly inbound summary
                </p>
              </div>
              <UBadge color="primary" variant="subtle">
                +18 leads
              </UBadge>
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              <div class="rounded-2xl border border-default/70 p-4">
                <p class="text-xs font-semibold text-muted">
                  Documentation
                </p>
                <div class="mt-3 space-y-2">
                  <div class="flex items-center justify-between rounded-lg bg-elevated/50 px-3 py-2 text-sm">
                    <span class="text-muted">License.pdf</span>
                    <UIcon name="i-lucide-check-circle-2" class="size-4 text-success" />
                  </div>
                  <div class="flex items-center justify-between rounded-lg bg-elevated/50 px-3 py-2 text-sm">
                    <span class="text-muted">Insurance.pdf</span>
                    <UIcon name="i-lucide-check-circle-2" class="size-4 text-success" />
                  </div>
                </div>
              </div>

              <div class="rounded-2xl border border-default/70 p-4">
                <p class="text-xs font-semibold text-muted">
                  Placement
                </p>
                <div class="mt-3 space-y-3">
                  <div class="flex items-center gap-2 text-sm text-highlighted">
                    <UIcon name="i-lucide-star" class="size-4 text-primary" />
                    Featured sidebar rotation
                  </div>
                  <div class="flex items-center gap-2 text-sm text-highlighted">
                    <UIcon name="i-lucide-share-2" class="size-4 text-primary" />
                    Share-ready profile links
                  </div>
                  <div class="flex items-center gap-2 text-sm text-highlighted">
                    <UIcon name="i-lucide-life-buoy" class="size-4 text-primary" />
                    Concierge onboarding tips
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </UPageSection>

      <UContainer>
        <section class="rounded-3xl border border-default/70 bg-elevated/30 px-6 py-10 sm:px-10">
          <div class="flex flex-col gap-3 text-center">
            <p class="text-sm font-semibold text-primary">
              Launch playbook
            </p>
            <h2 class="text-3xl font-semibold tracking-tight text-highlighted">
              Ship a credible listing in three moves
            </h2>
            <p class="mx-auto max-w-3xl text-base text-muted">
              Borrowing the cadence of polished marketing sites: headline clarity, proof blocks, and repeated CTAs that actually match your funnel.
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
        </section>
      </UContainer>

      <UContainer>
        <section>
          <div class="mb-6 text-center">
            <p class="text-sm font-semibold text-primary">
              FAQ
            </p>
            <h2 class="text-3xl font-semibold tracking-tight text-highlighted">
              Answers before the sales call
            </h2>
            <p class="mt-2 text-muted">
              Strip away objections with crisp accordion responses—same hierarchy as modern Tailwind Plus marketing pages.
            </p>
          </div>

          <UAccordion
            type="multiple"
            :unmount-on-hide="false"
            :items="faqItems"
            :ui="{ trigger: 'text-base', body: 'text-base text-muted leading-relaxed' }"
          />
        </section>
      </UContainer>

      <UPageCTA
        variant="naked"
        title="Ready to become the brand homeowners recognize first?"
        description="Submit your documentation-backed profile, unlock featured placements, and pair polished storytelling with operational rigor."
        :links="ctaLinks"
        :ui="landingCtaUi"
      />
    </div>
  </UPage>
</template>
