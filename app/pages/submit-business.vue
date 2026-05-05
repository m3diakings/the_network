<script setup lang="ts">
const form = reactive({
  businessName: '',
  phone: '',
  website: '',
  address: '',
  bio: '',
  logo: null as File | null,
  licenseDocument: null as File | null,
  insuranceDocument: null as File | null
})

const submitted = ref(false)

function onFileChange(event: Event, key: 'logo' | 'licenseDocument' | 'insuranceDocument') {
  const target = event.target as HTMLInputElement
  form[key] = target.files?.[0] ?? null
}

function onSubmit() {
  submitted.value = true
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

            <UFormField class="w-full" label="Business Address" required>
              <UInput
                v-model="form.address"
                class="w-full"
                size="xl"
                placeholder="1250 E Sunrise Blvd, Fort Lauderdale, FL 33304"
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
                :disabled="!form.businessName || !form.phone || !form.website || !form.address || !form.bio || !form.logo || !form.licenseDocument || !form.insuranceDocument"
              >
                Submit Listing
              </UButton>
            </div>
          </form>
        </UCard>

        <UAlert
          v-if="submitted"
          class="mt-4"
          color="success"
          variant="subtle"
          icon="i-lucide-check-circle-2"
          title="Submission received"
          description="Your business details were captured successfully. Next step is connecting this form to your backend/API."
        />
      </UPageBody>
    </UContainer>
  </UPage>
</template>
