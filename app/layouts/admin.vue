<script setup lang="ts">
const { user, signOut } = useAdminSession()
</script>

<template>
  <div class="min-h-dvh bg-elevated/30">
    <header class="border-b border-default bg-default">
      <UContainer class="flex items-center justify-between gap-4 py-4">
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/admin/listings"
            class="text-sm font-extrabold uppercase tracking-wide text-primary sm:text-base"
          >
            FTS Admin
          </NuxtLink>
          <nav class="hidden items-center gap-1 sm:flex">
            <UButton
              to="/admin/listings"
              color="neutral"
              variant="ghost"
              size="sm"
            >
              Listings
            </UButton>
          </nav>
        </div>

        <div class="flex items-center gap-2">
          <span class="hidden truncate text-xs text-muted sm:inline-block sm:max-w-[14rem]">
            {{ user?.email }}
          </span>
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-log-out"
            @click="signOut"
          >
            Sign out
          </UButton>
        </div>
      </UContainer>
    </header>

    <main>
      <UContainer class="py-8 sm:py-10">
        <slot />
      </UContainer>
    </main>
  </div>
</template>
