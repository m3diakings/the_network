<template>
  <UApp>
    <NuxtRouteAnnouncer />

    <header class="border-b border-default bg-default/95 backdrop-blur">
      <UContainer class="flex items-center justify-between gap-4 py-1">
        <NuxtLink to="/" class="inline-flex items-center" aria-label="Florida Trade Specialists home">
          <img src="/images/logo.svg" alt="Florida Trade Specialists" class="h-20 w-auto">
        </NuxtLink>

        <nav class="flex items-center gap-1 sm:gap-2">
          <UButton to="/listings" color="neutral" variant="ghost" size="sm">
            Listings
          </UButton>
          <UButton to="/blog" color="neutral" variant="ghost" size="sm">
            Blog
          </UButton>
          <UButton to="/submit-business" color="primary" variant="soft" size="sm">
            Submit Business
          </UButton>
        </nav>
      </UContainer>
    </header>

    <main>
      <NuxtPage />
    </main>

    <footer class="mt-10 bg-elevated">
      <UContainer class="pt-16 pb-10 sm:pt-20 sm:pb-12">
        <div class="grid gap-8 md:grid-cols-3">
          <div>
            <NuxtLink to="/" class="inline-flex items-center" aria-label="Florida Trade Specialists home">
              <img src="/images/logo.svg" alt="Florida Trade Specialists" class="h-16 w-auto">
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
              Contact
            </p>
            <a
              href="tel:3059570088"
              class="inline-flex items-center gap-2 text-default hover:text-primary"
            >
              <UIcon name="i-lucide-phone" class="size-4 text-primary" />
              (305) 957-0088
            </a>
            <a
              href="mailto:contact@Floridatradespecialist.com"
              class="inline-flex items-center gap-2 break-all text-default hover:text-primary"
            >
              <UIcon name="i-lucide-mail" class="size-4 shrink-0 text-primary" />
              contact@Floridatradespecialist.com
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
