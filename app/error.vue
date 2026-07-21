<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error?.statusCode === 404)

const title = computed(() =>
  isNotFound.value ? 'Page not found' : 'Something went wrong'
)

const description = computed(() =>
  isNotFound.value
    ? "The page you're looking for doesn't exist or may have moved."
    : "An unexpected error occurred on our end. Please try again in a moment."
)

useSeoMeta({
  title: () => `${title.value} | Florida Trade Specialists`,
  robots: 'noindex'
})

function handleClear(redirect = '/') {
  clearError({ redirect })
}
</script>

<template>
  <UApp>
    <div class="flex min-h-dvh flex-col bg-default">
      <header class="border-b border-default bg-default/95 backdrop-blur">
        <UContainer class="flex items-center justify-between gap-4 py-5">
          <NuxtLink
            to="/"
            class="cursor-pointer text-base font-extrabold uppercase tracking-wide text-primary sm:text-lg"
          >
            Florida Trade Specialists
          </NuxtLink>
          <UButton to="/listings" color="neutral" variant="ghost" size="sm">
            Listings
          </UButton>
        </UContainer>
      </header>

      <main class="flex flex-1 items-center justify-center px-4 py-16">
        <div class="flex max-w-md flex-col items-center gap-5 text-center">
          <span class="text-6xl font-extrabold tracking-tight text-primary sm:text-7xl">
            {{ error?.statusCode ?? 500 }}
          </span>
          <UIcon
            :name="isNotFound ? 'i-lucide-map-pin-off' : 'i-lucide-alert-triangle'"
            class="size-10 text-muted"
          />
          <div>
            <h1 class="text-2xl font-semibold text-highlighted sm:text-3xl">
              {{ title }}
            </h1>
            <p class="mt-2 text-base text-muted">
              {{ description }}
            </p>
          </div>
          <div class="mt-2 flex flex-col gap-3 sm:flex-row">
            <UButton color="primary" size="lg" icon="i-lucide-home" @click="handleClear('/')">
              Back to home
            </UButton>
            <UButton color="neutral" variant="outline" size="lg" @click="handleClear('/blog')">
              Read the blog
            </UButton>
          </div>
        </div>
      </main>
    </div>
  </UApp>
</template>
