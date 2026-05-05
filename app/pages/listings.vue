<script setup lang="ts">
type Business = {
  id: number
  name: string
  phone: string
  website: string
  bio: string
  address: string
  logo: string
}

const businesses: Business[] = [
  {
    id: 1,
    name: 'Atlantic Coast Plumbing Co.',
    phone: '(954) 555-0121',
    website: 'https://atlanticcoastplumbing.example.com',
    bio: 'Licensed plumbing contractor focused on residential repairs, water heater installs, emergency leak response, and full home repiping projects. Their team also handles fixture upgrades and preventative maintenance for older properties across Broward County.',
    address: '1250 E Sunrise Blvd, Fort Lauderdale, FL 33304',
    logo: 'https://placehold.co/88x88/f97316/ffffff?text=ACP'
  },
  {
    id: 2,
    name: 'Sunrise Electrical Services',
    phone: '(754) 555-0198',
    website: 'https://sunriseelectrical.example.com',
    bio: 'Full-service electricians handling panel upgrades, indoor and outdoor lighting, code-compliant rewiring, and EV charger installation. They provide same-week appointments for troubleshooting and electrical safety inspections for homes and small commercial units.',
    address: '2201 W Broward Blvd, Fort Lauderdale, FL 33312',
    logo: 'https://placehold.co/88x88/2563eb/ffffff?text=SES'
  },
  {
    id: 3,
    name: 'Broward HVAC & Cooling',
    phone: '(954) 555-0174',
    website: 'https://browardhvac.example.com',
    bio: 'Commercial and residential HVAC company providing maintenance plans, AC installation, same-day diagnostics, and indoor air quality upgrades. Technicians specialize in high-efficiency systems, ductwork balancing, and seasonal tune-ups built for South Florida weather.',
    address: '4100 N Federal Hwy, Fort Lauderdale, FL 33308',
    logo: 'https://placehold.co/88x88/0f766e/ffffff?text=BHC'
  },
  {
    id: 4,
    name: 'Pro Finish Painters',
    phone: '(954) 555-0140',
    website: 'https://profinishpainters.example.com',
    bio: 'Interior and exterior painting specialists known for fast turnaround, clean finishes, and premium coatings.',
    address: '955 SE 17th St, Fort Lauderdale, FL 33316',
    logo: 'https://placehold.co/88x88/7c3aed/ffffff?text=PFP'
  },
  {
    id: 5,
    name: 'South Florida Roofing Group',
    phone: '(954) 555-0113',
    website: 'https://sflroofing.example.com',
    bio: 'Roof inspection, repair, and replacement team with expertise in shingle, tile, and flat roof systems. Services include storm damage assessments, leak tracing, preventative sealing, and complete reroof projects backed by labor and material warranties.',
    address: '301 SW 1st Ave, Fort Lauderdale, FL 33301',
    logo: 'https://placehold.co/88x88/dc2626/ffffff?text=SFR'
  }
]

function phoneHref(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return `tel:${digits}`
}

const featuredBusinesses = businesses.slice(0, 3)
</script>

<template>
  <UPage class="min-h-dvh bg-default">
    <UContainer class="py-10">
      <UPageHeader
        headline="Business Directory"
        title="Trade Companies in Fort Lauderdale, FL"
        description="Browse trusted local businesses with quick access to contact info and websites."
      />
      <div class="mt-4">
        <UButton to="/submit-business" icon="i-lucide-plus">
          Submit Your Business
        </UButton>
      </div>

      <UPageBody class="mt-6 pb-16">
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div class="space-y-4">
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
