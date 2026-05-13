<script setup lang="ts">
type Category = {
  id: string
  slug: string
  name: string
}

const supabase = useSupabaseClient()

const { data: categories } = await useAsyncData('submit-categories', async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Category[]
})

const categoryItems = computed(() =>
  (categories.value ?? []).map(c => ({ label: c.name, value: c.id }))
)

const form = reactive({
  categoryId: '',
  businessName: '',
  phone: '',
  website: '',
  address: '',
  bio: '',
  email: '',
  logo: null as File | null,
  licenseDocument: null as File | null,
  insuranceDocument: null as File | null
})

const submitting = ref(false)
const submitted = ref(false)
const errorMessage = ref<string | null>(null)

function onFileChange(event: Event, key: 'logo' | 'licenseDocument' | 'insuranceDocument') {
  const target = event.target as HTMLInputElement
  form[key] = target.files?.[0] ?? null
}

const canSubmit = computed(() =>
  Boolean(
    form.categoryId
      && form.businessName
      && form.phone
      && form.website
      && form.address
      && form.bio
      && form.email
      && form.logo
      && form.licenseDocument
      && form.insuranceDocument
  )
)

function fileExt(file: File) {
  const match = /\.([^.]+)$/.exec(file.name)
  return match ? match[1].toLowerCase() : 'bin'
}

async function uploadFile(label: string, bucket: string, prefix: string, file: File) {
  const path = `${prefix}/${crypto.randomUUID()}.${fileExt(file)}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false
  })
  if (error) throw new Error(`${label} upload failed: ${error.message}`)
  return path
}

async function onSubmit() {
  if (!canSubmit.value || submitting.value) return

  errorMessage.value = null
  submitting.value = true

  try {
    const submissionId = crypto.randomUUID()

    const [logoPath, licensePath, insurancePath] = await Promise.all([
      uploadFile('Logo', 'business-logos', submissionId, form.logo!),
      uploadFile('License', 'business-documents', `submissions/${submissionId}`, form.licenseDocument!),
      uploadFile('Insurance', 'business-documents', `submissions/${submissionId}`, form.insuranceDocument!)
    ])

    const { error } = await supabase.from('businesses').insert({
      category_id: form.categoryId,
      name: form.businessName,
      phone: form.phone,
      website_url: form.website,
      bio: form.bio,
      address: form.address,
      logo_path: logoPath,
      license_document_path: licensePath,
      insurance_document_path: insurancePath,
      submitter_email: form.email,
      status: 'pending_review'
    })

    if (error) throw new Error(`Business insert failed: ${error.message}`)
    submitted.value = true
  } catch (e: unknown) {
    errorMessage.value = e instanceof Error ? e.message : 'Submission failed. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UPage class="min-h-dvh bg-default">
    <UContainer class="py-10">
      <div class="mx-auto w-full max-w-4xl">
        <UPageHeader
          headline="Business Onboarding"
          title="Submit Your Business Listing"
          description="Send your business information for review before publication in the directory."
        />
      </div>

      <UPageBody class="mt-6 pb-16">
        <UCard
          class="mx-auto w-full max-w-4xl"
          :ui="{ root: 'rounded-2xl bg-default shadow-lg shadow-black/10 ring-0 border border-default/60' }"
        >
          <form class="space-y-6" @submit.prevent="onSubmit">
            <UFormField class="w-full" label="Trade Category" required>
              <USelect
                v-model="form.categoryId"
                class="w-full"
                size="xl"
                placeholder="Select a category"
                :items="categoryItems"
              />
            </UFormField>

            <UFormField class="w-full" label="Business Name" required>
              <UInput v-model="form.businessName" class="w-full" size="xl" placeholder="Atlantic Coast Plumbing Co." />
            </UFormField>

            <div class="grid gap-4 md:grid-cols-2">
              <UFormField class="w-full" label="Business Phone" required>
                <UInput v-model="form.phone" class="w-full" size="xl" placeholder="(954) 555-0121" />
              </UFormField>

              <UFormField class="w-full" label="Website" required>
                <UInput v-model="form.website" class="w-full" size="xl" placeholder="https://yourbusiness.com" />
              </UFormField>
            </div>

            <UFormField class="w-full" label="Contact Email" required>
              <UInput
                v-model="form.email"
                type="email"
                class="w-full"
                size="xl"
                placeholder="owner@yourbusiness.com"
              />
            </UFormField>

            <UFormField class="w-full" label="Business Address" required>
              <UInput
                v-model="form.address"
                class="w-full"
                size="xl"
                placeholder="1250 E Sunrise Blvd, Florida 33304"
              />
            </UFormField>

            <UFormField class="w-full" label="Business Bio" required>
              <UTextarea
                v-model="form.bio"
                class="w-full"
                size="xl"
                :rows="5"
                placeholder="Describe your services, coverage area, years in business, and specialties."
              />
            </UFormField>

            <div class="grid gap-4 md:grid-cols-2">
              <UFormField class="w-full" label="Logo Upload" required>
                <input
                  class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm"
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.svg"
                  @change="onFileChange($event, 'logo')"
                >
              </UFormField>

              <UFormField class="w-full" label="License Upload" required>
                <input
                  class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  @change="onFileChange($event, 'licenseDocument')"
                >
              </UFormField>

              <UFormField class="w-full md:col-span-2" label="Insurance Upload" required>
                <input
                  class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  @change="onFileChange($event, 'insuranceDocument')"
                >
              </UFormField>
            </div>

            <div class="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
              <UButton to="/listings" color="neutral" variant="outline">
                Cancel
              </UButton>
              <UButton
                type="submit"
                color="primary"
                :loading="submitting"
                :disabled="!canSubmit || submitting"
              >
                Submit Listing
              </UButton>
            </div>
          </form>
        </UCard>

        <UAlert
          v-if="submitted"
          class="mx-auto mt-4 w-full max-w-4xl"
          color="success"
          variant="subtle"
          icon="i-lucide-check-circle-2"
          title="Submission received"
          description="Thanks! Your listing is in pending_review and will appear once an admin publishes it."
        />

        <UAlert
          v-if="errorMessage"
          class="mx-auto mt-4 w-full max-w-4xl"
          color="error"
          variant="subtle"
          icon="i-lucide-alert-triangle"
          title="Submission failed"
          :description="errorMessage"
        />
      </UPageBody>
    </UContainer>
  </UPage>
</template>
