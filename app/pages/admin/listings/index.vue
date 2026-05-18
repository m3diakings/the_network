<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

useSeoMeta({
  title: 'Admin · Listings',
  robots: 'noindex, nofollow'
})

type BusinessStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived'

type Row = {
  id: string
  name: string
  category_id: string | null
  status: BusinessStatus
  verified: boolean
  featured: boolean
  featured_order: number | null
  logo_path: string | null
  submitter_email: string | null
  created_at: string
  updated_at: string
}

type CategoryRow = {
  id: string
  name: string
  slug: string
}

const supabase = useSupabaseClient()

const { data: categoryRows } = await useAsyncData('admin-categories', async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as CategoryRow[]
})

const { data: rows, refresh, pending } = await useAsyncData('admin-listings', async () => {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, category_id, status, verified, featured, featured_order, logo_path, submitter_email, created_at, updated_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Row[]
})

const statusFilter = ref<BusinessStatus | 'all'>('pending_review')
const searchQuery = ref('')

const statusOptions = [
  { id: 'all', label: 'All' },
  { id: 'pending_review', label: 'Pending review' },
  { id: 'published', label: 'Published' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'draft', label: 'Draft' },
  { id: 'archived', label: 'Archived' }
] as const

const statusColors: Record<BusinessStatus, 'neutral' | 'warning' | 'success' | 'error' | 'info'> = {
  draft: 'neutral',
  pending_review: 'warning',
  published: 'success',
  rejected: 'error',
  archived: 'info'
}

const statusLabels: Record<BusinessStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending',
  published: 'Published',
  rejected: 'Rejected',
  archived: 'Archived'
}

const categoryMap = computed(() => {
  const map = new Map<string, string>()
  for (const c of categoryRows.value ?? []) map.set(c.id, c.name)
  return map
})

const filteredRows = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const status = statusFilter.value
  return (rows.value ?? []).filter((row) => {
    if (!row.id) return false
    if (status !== 'all' && row.status !== status) return false
    if (!q) return true
    return (
      row.name.toLowerCase().includes(q)
      || (row.submitter_email ?? '').toLowerCase().includes(q)
    )
  })
})

const counts = computed(() => {
  const acc: Record<string, number> = { all: 0, draft: 0, pending_review: 0, published: 0, rejected: 0, archived: 0 }
  for (const row of rows.value ?? []) {
    acc.all++
    acc[row.status]++
  }
  return acc
})

function logoUrl(path: string | null) {
  if (!path) return ''
  const { data } = supabase.storage.from('business-logos').getPublicUrl(path)
  return data.publicUrl
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

async function quickStatus(id: string, status: BusinessStatus) {
  const { error } = await supabase
    .from('businesses')
    .update({ status })
    .eq('id', id)
  if (error) {
    alert(`Failed to update status: ${error.message}`)
    return
  }
  await refresh()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-highlighted">
          Listings
        </h1>
        <p class="text-sm text-muted">
          Review submissions and manage published businesses.
        </p>
      </div>
      <UButton
        color="neutral"
        variant="outline"
        size="sm"
        icon="i-lucide-refresh-cw"
        :loading="pending"
        @click="refresh()"
      >
        Refresh
      </UButton>
    </div>

    <div class="flex flex-col gap-3 rounded-2xl border border-default/70 bg-default p-3 sm:flex-row sm:flex-wrap sm:items-center">
      <UInput
        v-model="searchQuery"
        icon="i-lucide-search"
        placeholder="Search by name or submitter email"
        class="flex-1 min-w-[14rem]"
        size="md"
      />
      <USelectMenu
        v-model="statusFilter"
        :items="statusOptions"
        value-key="id"
        label-key="label"
        icon="i-lucide-filter"
        class="w-full sm:w-56"
        size="md"
      />
    </div>

    <div class="flex flex-wrap gap-2 text-xs">
      <UBadge
        v-for="opt in statusOptions"
        :key="opt.id"
        :color="opt.id === 'all' ? 'neutral' : statusColors[opt.id as BusinessStatus]"
        variant="subtle"
        size="md"
        class="cursor-pointer"
        @click="statusFilter = opt.id"
      >
        {{ opt.label }} · {{ counts[opt.id] ?? 0 }}
      </UBadge>
    </div>

    <UCard
      :ui="{
        root: 'rounded-2xl bg-default ring-0 shadow-md shadow-black/5 overflow-hidden',
        body: '!p-0'
      }"
    >
      <div v-if="filteredRows.length === 0" class="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <UIcon name="i-lucide-inbox" class="size-10 text-muted" />
        <p class="text-base font-semibold text-highlighted">
          No listings match
        </p>
        <p class="text-sm text-muted">
          Try a different status filter or search term.
        </p>
      </div>

      <div v-else class="divide-y divide-default/60">
        <div
          v-for="row in filteredRows"
          :key="row.id"
          class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4"
        >
          <div class="flex items-center gap-3 sm:flex-1 sm:min-w-0">
            <img
              v-if="row.logo_path"
              :src="logoUrl(row.logo_path)"
              :alt="`${row.name} logo`"
              class="size-12 shrink-0 rounded-lg object-cover"
              loading="lazy"
            >
            <div v-else class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-elevated text-muted">
              <UIcon name="i-lucide-image" class="size-5" />
            </div>

            <div class="min-w-0">
              <NuxtLink
                :to="`/admin/listings/${row.id}`"
                class="block truncate text-sm font-semibold text-highlighted hover:text-primary"
              >
                {{ row.name }}
              </NuxtLink>
              <p class="truncate text-xs text-muted">
                {{ categoryMap.get(row.category_id ?? '') ?? 'Uncategorized' }}
                <span v-if="row.submitter_email"> · {{ row.submitter_email }}</span>
              </p>
              <p class="mt-0.5 text-xs text-muted">
                Submitted {{ formatDate(row.created_at) }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 sm:shrink-0">
            <UBadge :color="statusColors[row.status]" variant="subtle" size="sm">
              {{ statusLabels[row.status] }}
            </UBadge>
            <UBadge v-if="row.verified" color="success" variant="soft" size="sm" icon="i-lucide-shield-check">
              Verified
            </UBadge>
            <UBadge v-if="row.featured" color="primary" variant="soft" size="sm" icon="i-lucide-star">
              Featured
            </UBadge>
          </div>

          <div class="flex flex-wrap items-center gap-2 sm:shrink-0">
            <UButton
              v-if="row.status === 'pending_review'"
              color="success"
              variant="soft"
              size="sm"
              icon="i-lucide-check"
              @click="quickStatus(row.id, 'published')"
            >
              Approve
            </UButton>
            <UButton
              v-if="row.status === 'pending_review'"
              color="error"
              variant="soft"
              size="sm"
              icon="i-lucide-x"
              @click="quickStatus(row.id, 'rejected')"
            >
              Reject
            </UButton>
            <UButton
              :to="`/admin/listings/${row.id}`"
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-pencil"
            >
              Edit
            </UButton>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
