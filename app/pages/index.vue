<template>
  <UPage class="min-h-dvh bg-default">
    <UContainer class="flex min-h-dvh items-center justify-center py-10">
      <UCard class="w-full max-w-md" :ui="{ root: 'ring ring-default shadow-sm' }">
        <template #header>
          <div class="space-y-1">
            <p class="text-sm font-semibold text-highlighted">
              The Network
            </p>
            <p class="text-sm text-muted">
              Open the business directory listings page.
            </p>
          </div>
        </template>

        <template #footer>
          <UButton to="/listings" block icon="i-lucide-arrow-right">
            Go to Listings
          </UButton>
        </template>
      </UCard>
    </UContainer>
  </UPage>
</template>
