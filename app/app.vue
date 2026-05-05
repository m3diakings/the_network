<template>
  <UApp>
    <NuxtRouteAnnouncer />

    <header class="border-b border-default bg-default/95 backdrop-blur">
      <UContainer class="flex h-16 items-center justify-between gap-4">
        <NuxtLink to="/" class="text-base font-semibold tracking-tight text-highlighted">
          The Network
        </NuxtLink>

        <nav class="flex items-center gap-1 sm:gap-2">
          <UButton to="/listings" color="neutral" variant="ghost" size="sm">
            Listings
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

    <footer class="mt-10 border-t border-default bg-default">
      <UContainer class="flex flex-col gap-3 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {{ new Date().getFullYear() }} The Network</p>

        <nav class="flex items-center gap-4">
          <NuxtLink to="/" class="hover:text-default">
            Home
          </NuxtLink>
          <NuxtLink to="/listings" class="hover:text-default">
            Listings
          </NuxtLink>
          <NuxtLink to="/submit-business" class="hover:text-default">
            Submit
          </NuxtLink>
        </nav>
      </UContainer>
    </footer>
  </UApp>
</template>
