<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

useSeoMeta({
  title: 'Admin · Edit listing',
  robots: 'noindex, nofollow'
})

type BusinessStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived'

type Business = {
  id: string
  category_id: string | null
  name: string
  phone: string
  website_url: string
  bio: string
  address: string
  logo_path: string | null
  license_document_path: string | null
  insurance_document_path: string | null
  license_number: string | null
  license_state: string | null
  license_expires_at: string | null
  insurance_carrier: string | null
  insurance_expires_at: string | null
  emergency_available: boolean
  years_in_business: number | null
  status: BusinessStatus
  verified: boolean
  featured: boolean
  featured_order: number | null
  submitter_email: string | null
  owner_user_id: string | null
  created_at: string
  updated_at: string
}

type CategoryRow = {
  id: string
  name: string
  slug: string
}

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()

const rawId = route.params.id
const id = computed(() => (Array.isArray(rawId) ? rawId[0] : rawId) ?? '')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

if (!UUID_RE.test(id.value)) {
  throw createError({ statusCode: 404, statusMessage: 'Listing not found', fatal: true })
}

const { data: business, refresh } = await useAsyncData(`admin-business-${id.value}`, async () => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', id.value)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as Business | null
})

const { data: categoryRows } = await useAsyncData('admin-categories-edit', async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as CategoryRow[]
})

const statusOptions = [
  { id: 'pending_review', label: 'Pending review' },
  { id: 'published', label: 'Published' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'draft', label: 'Draft' },
  { id: 'archived', label: 'Archived' }
] as const

const form = reactive({
  name: '',
  category_id: null as string | null,
  phone: '',
  website_url: '',
  bio: '',
  address: '',
  license_number: '',
  license_state: 'FL',
  license_expires_at: '',
  insurance_carrier: '',
  insurance_expires_at: '',
  emergency_available: false,
  years_in_business: null as number | null,
  status: 'pending_review' as BusinessStatus,
  verified: false,
  featured: false,
  featured_order: null as number | null
})

const newLogoFile = ref<File | null>(null)
const newLogoPreview = ref<string | null>(null)
const saving = ref(false)
const deleting = ref(false)
const saveError = ref<string | null>(null)
const saveSuccess = ref(false)

const licenseSignedUrl = ref<string | null>(null)
const insuranceSignedUrl = ref<string | null>(null)
const docsLoading = ref(false)

function hydrateForm(b: Business) {
  form.name = b.name
  form.category_id = b.category_id
  form.phone = b.phone
  form.website_url = b.website_url
  form.bio = b.bio
  form.address = b.address
  form.license_number = b.license_number ?? ''
  form.license_state = b.license_state ?? 'FL'
  form.license_expires_at = b.license_expires_at ?? ''
  form.insurance_carrier = b.insurance_carrier ?? ''
  form.insurance_expires_at = b.insurance_expires_at ?? ''
  form.emergency_available = Boolean(b.emergency_available)
  form.years_in_business = b.years_in_business
  form.status = b.status
  form.verified = b.verified
  form.featured = b.featured
  form.featured_order = b.featured_order
}

watch(business, (b) => {
  if (b) hydrateForm(b)
}, { immediate: true })

const categoryOptions = computed(() =>
  (categoryRows.value ?? []).map(c => ({ id: c.id, label: c.name }))
)

function logoUrl(path: string | null) {
  if (!path) return ''
  const { data } = supabase.storage.from('business-logos').getPublicUrl(path)
  return data.publicUrl
}

function onLogoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) {
    newLogoFile.value = null
    newLogoPreview.value = null
    return
  }
  newLogoFile.value = file
  newLogoPreview.value = URL.createObjectURL(file)
}

async function uploadNewLogo(): Promise<string | null> {
  if (!newLogoFile.value) return null
  const file = newLogoFile.value
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `admin/${id.value}-${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('business-logos')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  return path
}

async function loadSignedUrls() {
  if (!business.value) return
  docsLoading.value = true
  try {
    if (business.value.license_document_path) {
      const { data } = await supabase.storage
        .from('business-documents')
        .createSignedUrl(business.value.license_document_path, 60 * 5)
      licenseSignedUrl.value = data?.signedUrl ?? null
    }
    if (business.value.insurance_document_path) {
      const { data } = await supabase.storage
        .from('business-documents')
        .createSignedUrl(business.value.insurance_document_path, 60 * 5)
      insuranceSignedUrl.value = data?.signedUrl ?? null
    }
  } finally {
    docsLoading.value = false
  }
}

onMounted(() => {
  loadSignedUrls()
})

async function onSave() {
  saveError.value = null
  saveSuccess.value = false

  if (!form.name.trim() || !form.phone.trim() || !form.website_url.trim() || !form.bio.trim() || !form.address.trim()) {
    saveError.value = 'Name, phone, website, bio, and address are required.'
    return
  }
  if (!/^https?:\/\//i.test(form.website_url.trim())) {
    saveError.value = 'Website must start with http:// or https://'
    return
  }

  saving.value = true
  try {
    let nextLogoPath: string | null | undefined
    if (newLogoFile.value) {
      nextLogoPath = await uploadNewLogo()
    }

    const years = typeof form.years_in_business === 'number' && Number.isFinite(form.years_in_business)
      ? Math.floor(form.years_in_business)
      : null

    const update: Partial<Business> = {
      name: form.name.trim(),
      category_id: form.category_id,
      phone: form.phone.trim(),
      website_url: form.website_url.trim(),
      bio: form.bio.trim(),
      address: form.address.trim(),
      license_number: form.license_number.trim() || null,
      license_state: form.license_state.trim().toUpperCase().slice(0, 2) || 'FL',
      license_expires_at: form.license_expires_at || null,
      insurance_carrier: form.insurance_carrier.trim() || null,
      insurance_expires_at: form.insurance_expires_at || null,
      emergency_available: form.emergency_available,
      years_in_business: years,
      status: form.status,
      verified: form.verified,
      featured: form.featured,
      featured_order: form.featured ? (form.featured_order ?? 0) : null
    }
    if (nextLogoPath !== undefined) update.logo_path = nextLogoPath

    const { error } = await supabase
      .from('businesses')
      .update(update)
      .eq('id', id.value)

    if (error) {
      saveError.value = error.message
      return
    }

    newLogoFile.value = null
    newLogoPreview.value = null
    saveSuccess.value = true
    await refresh()
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Save failed.'
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!confirm('Permanently delete this listing? This cannot be undone.')) return
  deleting.value = true
  try {
    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', id.value)
    if (error) {
      saveError.value = error.message
      return
    }
    await router.replace('/admin/listings')
  } finally {
    deleting.value = false
  }
}

const statusColors: Record<BusinessStatus, 'neutral' | 'warning' | 'success' | 'error' | 'info'> = {
  draft: 'neutral',
  pending_review: 'warning',
  published: 'success',
  rejected: 'error',
  archived: 'info'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <UButton
        to="/admin/listings"
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-arrow-left"
      >
        Back to listings
      </UButton>

      <div v-if="business" class="flex items-center gap-2">
        <UBadge :color="statusColors[business.status]" variant="subtle" size="md">
          {{ business.status.replace('_', ' ') }}
        </UBadge>
        <UButton
          color="error"
          variant="ghost"
          size="sm"
          icon="i-lucide-trash-2"
          :loading="deleting"
          @click="onDelete"
        >
          Delete
        </UButton>
      </div>
    </div>

    <div v-if="!business" class="rounded-2xl border border-default bg-default p-8 text-center">
      <p class="text-base font-semibold text-highlighted">
        Listing not found.
      </p>
      <UButton to="/admin/listings" class="mt-4" color="primary">
        Back to listings
      </UButton>
    </div>

    <form v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" @submit.prevent="onSave">
      <div class="space-y-6">
        <UCard
          :ui="{
            root: 'rounded-2xl bg-default ring-0 shadow-md shadow-black/5'
          }"
        >
          <template #header>
            <h2 class="text-base font-semibold text-highlighted">
              Business details
            </h2>
          </template>

          <div class="space-y-4">
            <UFormField label="Business name" required>
              <UInput v-model="form.name" size="md" class="w-full" />
            </UFormField>

            <UFormField label="Category">
              <USelectMenu
                v-model="form.category_id"
                :items="categoryOptions"
                value-key="id"
                label-key="label"
                placeholder="Select a category"
                class="w-full"
                size="md"
              />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Phone" required>
                <UInput v-model="form.phone" size="md" class="w-full" />
              </UFormField>
              <UFormField label="Website URL" required>
                <UInput v-model="form.website_url" placeholder="https://example.com" size="md" class="w-full" />
              </UFormField>
            </div>

            <UFormField label="Address" required>
              <UInput v-model="form.address" size="md" class="w-full" />
            </UFormField>

            <UFormField label="Bio" required>
              <UTextarea v-model="form.bio" :rows="6" size="md" class="w-full" />
            </UFormField>
          </div>
        </UCard>

        <UCard
          :ui="{
            root: 'rounded-2xl bg-default ring-0 shadow-md shadow-black/5'
          }"
        >
          <template #header>
            <h2 class="text-base font-semibold text-highlighted">
              Logo
            </h2>
          </template>

          <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div class="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-elevated">
              <img
                v-if="newLogoPreview"
                :src="newLogoPreview"
                alt="New logo preview"
                class="size-full object-cover"
              >
              <img
                v-else-if="business.logo_path"
                :src="logoUrl(business.logo_path)"
                alt="Current logo"
                class="size-full object-cover"
              >
              <UIcon v-else name="i-lucide-image" class="size-8 text-muted" />
            </div>

            <div class="space-y-2">
              <p class="text-xs text-muted">
                PNG, JPG, WEBP, or SVG. Max 5MB.
              </p>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                class="block text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-inverted hover:file:bg-primary/90"
                @change="onLogoChange"
              >
              <p v-if="newLogoFile" class="text-xs text-muted">
                Replacing on save: {{ newLogoFile.name }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard
          :ui="{
            root: 'rounded-2xl bg-default ring-0 shadow-md shadow-black/5'
          }"
        >
          <template #header>
            <h2 class="text-base font-semibold text-highlighted">
              License &amp; insurance
            </h2>
          </template>

          <div class="space-y-4">
            <UFormField label="License number" hint="Shown publicly on the listing.">
              <UInput v-model="form.license_number" size="md" class="w-full" placeholder="CFC1428721" />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-3">
              <UFormField label="License state">
                <UInput v-model="form.license_state" size="md" maxlength="2" class="w-full" placeholder="FL" />
              </UFormField>

              <UFormField label="License expiration">
                <UInput v-model="form.license_expires_at" type="date" size="md" class="w-full" />
              </UFormField>

              <UFormField label="Years in business">
                <UInput
                  v-model.number="form.years_in_business"
                  type="number"
                  min="0"
                  max="200"
                  size="md"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Insurance carrier">
                <UInput v-model="form.insurance_carrier" size="md" class="w-full" placeholder="State Farm" />
              </UFormField>

              <UFormField label="Insurance expiration">
                <UInput v-model="form.insurance_expires_at" type="date" size="md" class="w-full" />
              </UFormField>
            </div>

            <div class="flex items-center justify-between rounded-lg bg-elevated/40 p-3">
              <div>
                <p class="text-sm font-medium text-default">
                  24/7 emergency available
                </p>
                <p class="text-xs text-muted">
                  Indicates after-hours availability on the listing.
                </p>
              </div>
              <USwitch v-model="form.emergency_available" />
            </div>
          </div>
        </UCard>

        <UCard
          :ui="{
            root: 'rounded-2xl bg-default ring-0 shadow-md shadow-black/5'
          }"
        >
          <template #header>
            <h2 class="text-base font-semibold text-highlighted">
              Documents
            </h2>
          </template>

          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="font-medium text-default">
                  License
                </p>
                <p class="text-xs text-muted">
                  {{ business.license_document_path ?? 'Not uploaded' }}
                </p>
              </div>
              <UButton
                v-if="licenseSignedUrl"
                :to="licenseSignedUrl"
                target="_blank"
                color="neutral"
                variant="outline"
                size="sm"
                icon="i-lucide-external-link"
              >
                View
              </UButton>
              <UButton
                v-else
                color="neutral"
                variant="ghost"
                size="sm"
                :loading="docsLoading"
                :disabled="!business.license_document_path"
                @click="loadSignedUrls"
              >
                Get link
              </UButton>
            </div>

            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="font-medium text-default">
                  Insurance
                </p>
                <p class="text-xs text-muted">
                  {{ business.insurance_document_path ?? 'Not uploaded' }}
                </p>
              </div>
              <UButton
                v-if="insuranceSignedUrl"
                :to="insuranceSignedUrl"
                target="_blank"
                color="neutral"
                variant="outline"
                size="sm"
                icon="i-lucide-external-link"
              >
                View
              </UButton>
              <UButton
                v-else
                color="neutral"
                variant="ghost"
                size="sm"
                :loading="docsLoading"
                :disabled="!business.insurance_document_path"
                @click="loadSignedUrls"
              >
                Get link
              </UButton>
            </div>

            <p class="pt-2 text-xs text-muted">
              Links expire after 5 minutes.
            </p>
          </div>
        </UCard>
      </div>

      <aside class="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <UCard
          :ui="{
            root: 'rounded-2xl bg-default ring-0 shadow-md shadow-black/5'
          }"
        >
          <template #header>
            <h2 class="text-base font-semibold text-highlighted">
              Moderation
            </h2>
          </template>

          <div class="space-y-4">
            <UFormField label="Status">
              <USelectMenu
                v-model="form.status"
                :items="statusOptions"
                value-key="id"
                label-key="label"
                class="w-full"
                size="md"
              />
            </UFormField>

            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-default">
                  Verified
                </p>
                <p class="text-xs text-muted">
                  Show the verified badge on the listing.
                </p>
              </div>
              <USwitch v-model="form.verified" />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-default">
                  Featured
                </p>
                <p class="text-xs text-muted">
                  Pin to the featured sidebar.
                </p>
              </div>
              <USwitch v-model="form.featured" />
            </div>

            <UFormField
              v-if="form.featured"
              label="Featured order"
              hint="Lower numbers show first."
            >
              <UInput
                v-model.number="form.featured_order"
                type="number"
                min="0"
                size="md"
                class="w-full"
              />
            </UFormField>
          </div>
        </UCard>

        <UCard
          :ui="{
            root: 'rounded-2xl bg-default ring-0 shadow-md shadow-black/5'
          }"
        >
          <template #header>
            <h2 class="text-base font-semibold text-highlighted">
              Metadata
            </h2>
          </template>

          <dl class="space-y-2 text-xs text-muted">
            <div>
              <dt class="font-semibold uppercase tracking-wide">
                Submitter
              </dt>
              <dd class="text-default">
                {{ business.submitter_email ?? '—' }}
              </dd>
            </div>
            <div>
              <dt class="font-semibold uppercase tracking-wide">
                Created
              </dt>
              <dd class="text-default">
                {{ new Date(business.created_at).toLocaleString() }}
              </dd>
            </div>
            <div>
              <dt class="font-semibold uppercase tracking-wide">
                Last updated
              </dt>
              <dd class="text-default">
                {{ new Date(business.updated_at).toLocaleString() }}
              </dd>
            </div>
            <div>
              <dt class="font-semibold uppercase tracking-wide">
                ID
              </dt>
              <dd class="break-all text-default">
                {{ business.id }}
              </dd>
            </div>
          </dl>
        </UCard>

        <UAlert
          v-if="saveError"
          color="error"
          variant="subtle"
          icon="i-lucide-alert-circle"
          :title="saveError"
        />
        <UAlert
          v-if="saveSuccess"
          color="success"
          variant="subtle"
          icon="i-lucide-check-circle"
          title="Changes saved."
        />

        <div class="flex flex-col gap-2">
          <UButton
            type="submit"
            color="primary"
            size="lg"
            block
            :loading="saving"
            :disabled="saving"
            icon="i-lucide-save"
          >
            Save changes
          </UButton>
          <UButton
            to="/admin/listings"
            color="neutral"
            variant="ghost"
            size="md"
            block
          >
            Cancel
          </UButton>
        </div>
      </aside>
    </form>
  </div>
</template>
