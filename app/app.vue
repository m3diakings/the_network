<script setup lang="ts">
const mobileMenuOpen = ref(false)

const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))

watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false
})

watch(mobileMenuOpen, (open) => {
  if (import.meta.client) {
    document.body.style.overflow = open ? 'hidden' : ''
  }
})

const mobileMenuItems = [
  { label: 'Listings', to: '/listings' },
  { label: 'Blog', to: '/blog' },
  { label: 'Business Application', to: '/submit-business', primary: true }
]

const supabase = useSupabaseClient()

const { data: footerCategories } = await useAsyncData('footer-categories', async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('slug, name, sort_order')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as { slug: string, name: string, sort_order: number }[]
})
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />

    <header v-if="!isAdminRoute" class="border-b border-default bg-default/95 backdrop-blur">
      <UContainer class="flex items-center justify-between gap-4 py-5">
        <NuxtLink
          to="/"
          class="cursor-pointer text-base font-extrabold uppercase tracking-wide text-primary sm:text-lg"
        >
          Florida Trade Specialists
        </NuxtLink>

        <nav class="hidden items-center gap-1 md:flex md:gap-2">
          <UButton to="/listings" color="neutral" variant="ghost" size="sm" class="cursor-pointer">
            Listings
          </UButton>
          <UButton to="/submit-business" color="primary" variant="soft" size="sm" class="cursor-pointer">
            Business Application
          </UButton>
        </nav>

        <UButton
          class="cursor-pointer md:hidden"
          color="neutral"
          variant="ghost"
          icon="i-lucide-menu"
          size="md"
          aria-label="Open menu"
          @click="mobileMenuOpen = true"
        />
      </UContainer>
    </header>

    <Teleport v-if="!isAdminRoute" to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="mobileMenuOpen"
          class="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm md:hidden"
          @click="mobileMenuOpen = false"
        />
      </Transition>

      <Transition
        enter-active-class="transition-transform duration-200 ease-out"
        leave-active-class="transition-transform duration-150 ease-in"
        enter-from-class="translate-x-full"
        leave-to-class="translate-x-full"
      >
        <aside
          v-if="mobileMenuOpen"
          class="fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] bg-default p-6 shadow-2xl md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div class="mb-8 flex items-center justify-end">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              size="md"
              aria-label="Close menu"
              class="cursor-pointer"
              @click="mobileMenuOpen = false"
            />
          </div>
          <nav class="flex flex-col gap-2">
            <UButton
              v-for="item in mobileMenuItems"
              :key="item.to"
              :to="item.to"
              :color="item.primary ? 'primary' : 'neutral'"
              :variant="item.primary ? 'solid' : 'ghost'"
              size="lg"
              block
              class="cursor-pointer"
              @click="mobileMenuOpen = false"
            >
              {{ item.label }}
            </UButton>
          </nav>
        </aside>
      </Transition>
    </Teleport>

    <main>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </main>

    <footer v-if="!isAdminRoute" class="mt-10 bg-elevated">
      <UContainer class="pt-16 pb-10 sm:pt-20 sm:pb-12">
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <NuxtLink
              to="/"
              class="text-base font-extrabold uppercase tracking-wide text-primary sm:text-lg"
            >
              Florida Trade Specialists
            </NuxtLink>
            <p class="mt-4 max-w-xs text-sm text-muted">
              Florida's directory of verified, licensed trade pros.
            </p>
          </div>

          <div class="flex flex-col gap-2 text-sm">
            <p class="text-xs font-bold uppercase tracking-wide text-muted">
              Browse
            </p>
            <NuxtLink to="/" class="text-default hover:text-primary">
              Home
            </NuxtLink>
            <NuxtLink to="/listings" class="text-default hover:text-primary">
              Listings
            </NuxtLink>
            <NuxtLink to="/blog" class="text-default hover:text-primary">
              Blog
            </NuxtLink>
            <NuxtLink to="/submit-business" class="text-default hover:text-primary">
              Submit
            </NuxtLink>
          </div>

          <div class="flex flex-col gap-2 text-sm">
            <p class="text-xs font-bold uppercase tracking-wide text-muted">
              Trades
            </p>
            <NuxtLink
              v-for="category in footerCategories ?? []"
              :key="category.slug"
              :to="`/${category.slug}`"
              class="text-default hover:text-primary"
            >
              {{ category.name }}
            </NuxtLink>
          </div>

          <div class="flex flex-col gap-2 text-sm">
            <p class="text-xs font-bold uppercase tracking-wide text-muted">
              Contact
            </p>
            <a
              href="mailto:info@floridatradespecialists.com"
              class="inline-flex items-center gap-2 break-all text-default hover:text-primary"
            >
              <UIcon name="i-lucide-mail" class="size-4 shrink-0 text-primary" />
              info@floridatradespecialists.com
            </a>
            <div class="inline-flex items-start gap-2 text-muted">
              <UIcon name="i-lucide-map-pin" class="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                10800 Biscayne Blvd, Suite 350-B<br>
                Miami, FL 33161
              </span>
            </div>
          </div>
        </div>
      </UContainer>

      <UContainer class="pb-12 text-sm text-muted sm:pb-16">
        <p>© {{ new Date().getFullYear() }} Florida Trade Specialists</p>
      </UContainer>
    </footer>
  </UApp>
</template>
