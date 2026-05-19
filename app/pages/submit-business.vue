<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'

useSeoMeta({
  title: 'List Your Trade Business — Free Florida Directory Listing',
  description: 'Florida licensed contractors: get found by homeowners actively searching. Free standard listings, reviewed in about one business day. Submit your business today.',
  ogTitle: 'Get Listed on Florida Trade Specialists — Free Standard Listings',
  ogDescription: 'Join Florida\'s directory of verified, licensed trade pros. Reviewed in ~1 day. Tap-to-call leads come directly to you.',
  ogImage: '/images/for_contractors.png',
  twitterTitle: 'Get Listed on Florida Trade Specialists',
  twitterDescription: 'Free standard listings for licensed Florida trade pros. Reviewed in about a day.',
  twitterImage: '/images/for_contractors.png'
})

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

const heroSignals = [
  { icon: 'i-lucide-badge-check', label: 'Free standard listing' },
  { icon: 'i-lucide-timer', label: 'Reviewed in ~1 day' },
  { icon: 'i-lucide-shield-check', label: 'Verified pros only' }
]

const contractorSteps = [
  {
    title: 'Pick your trade',
    description: 'Choose the category that matches what you do — plumbing, electrical, HVAC, roofing, and more.'
  },
  {
    title: 'Upload license & insurance',
    description: 'Drop in your credentials, a logo, and a short bio. We review every submission before it goes public.'
  },
  {
    title: 'Start taking calls',
    description: 'Once approved, your listing is live across Florida Trade Specialists with tap-to-call and website links wired up.'
  }
]

const contractorFeatures = [
  {
    title: 'Credibility built in',
    description:
      'Upload your license, insurance, and logo once. Homeowners see proof of trust before they ever pick up the phone.',
    icon: 'i-lucide-file-badge'
  },
  {
    title: 'Featured placements',
    description: 'Upgrade to a featured spot in the sidebar to stay front-and-center when homeowners are ready to hire.',
    icon: 'i-lucide-sparkles'
  },
  {
    title: 'Found by category',
    description: 'Show up everywhere homeowners look — plumbing, electrical, HVAC, roofing, and more.',
    icon: 'i-lucide-compass'
  }
]

const contractorFaqItems: AccordionItem[] = [
  {
    label: 'How long until my listing goes live?',
    icon: 'i-lucide-timer',
    content:
      'Most submissions are reviewed within one business day. You\'ll get an email at the address you submitted as soon as the listing is published.'
  },
  {
    label: 'Can customers reach me directly?',
    icon: 'i-lucide-phone',
    content:
      'Yes — your phone number and website sit on every listing with tap-to-call buttons. Leads come straight to you, no middleman.'
  },
  {
    label: 'What does a listing cost?',
    icon: 'i-lucide-circle-dollar-sign',
    content:
      'A standard listing is free. Featured placements that pin you to the sidebar are a paid upgrade — pricing details are sent after you submit.'
  },
  {
    label: 'What documents do I need to submit?',
    icon: 'i-lucide-file-badge',
    content:
      'A current trade license, proof of insurance, and a business logo. We accept PDF or image uploads for the documents.'
  }
]

const landingStackGap = 'gap-24 sm:gap-28 lg:gap-36'

const landingSectionUi = {
  container:
    '!py-0 gap-8 sm:gap-16 flex flex-col lg:grid lg:grid-cols-2 lg:items-center',
  headline: 'text-base font-semibold text-primary sm:text-lg',
  title: 'text-3xl font-semibold tracking-tight text-highlighted lg:text-5xl'
}

const form = reactive({
  categoryId: '',
  businessName: '',
  phone: '',
  website: '',
  address: '',
  bio: '',
  email: '',
  licenseNumber: '',
  licenseState: 'FL',
  licenseExpiresAt: '',
  insuranceCarrier: '',
  insuranceExpiresAt: '',
  emergencyAvailable: false,
  yearsInBusiness: null as number | null,
  logo: null as File | null,
  licenseDocument: null as File | null,
  insuranceDocument: null as File | null
})

const submitting = ref(false)
const submitted = ref(false)
const errorMessage = ref<string | null>(null)
const honeypot = ref('')
const turnstileToken = ref('')
const turnstileEl = ref<HTMLDivElement | null>(null)
const turnstileWidgetId = ref<string | null>(null)

const runtimeConfig = useRuntimeConfig()
const turnstileSiteKey = runtimeConfig.public.turnstileSiteKey

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string
          callback?: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
        }
      ) => string
      reset: (id: string) => void
    }
  }
}

if (turnstileSiteKey) {
  useHead({
    script: [
      {
        src: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
        async: true,
        defer: true
      }
    ]
  })

  onMounted(() => {
    let tries = 0
    const poll = window.setInterval(() => {
      tries += 1
      if (window.turnstile && turnstileEl.value) {
        turnstileWidgetId.value = window.turnstile.render(turnstileEl.value, {
          sitekey: turnstileSiteKey,
          callback: (token: string) => {
            turnstileToken.value = token
          },
          'expired-callback': () => {
            turnstileToken.value = ''
          },
          'error-callback': () => {
            turnstileToken.value = ''
          }
        })
        window.clearInterval(poll)
      }
      if (tries > 50) window.clearInterval(poll)
    }, 100)
  })
}

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
      && form.licenseNumber.trim()
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

  if (honeypot.value) {
    submitted.value = true
    return
  }

  if (turnstileSiteKey && !turnstileToken.value) {
    errorMessage.value = 'Please complete the CAPTCHA before submitting.'
    return
  }

  errorMessage.value = null
  submitting.value = true

  try {
    const submissionId = crypto.randomUUID()

    const [logoPath, licensePath, insurancePath] = await Promise.all([
      uploadFile('Logo', 'business-logos', submissionId, form.logo!),
      uploadFile('License', 'business-documents', `submissions/${submissionId}`, form.licenseDocument!),
      uploadFile('Insurance', 'business-documents', `submissions/${submissionId}`, form.insuranceDocument!)
    ])

    await $fetch('/api/businesses/submit', {
      method: 'POST',
      body: {
        categoryId: form.categoryId,
        businessName: form.businessName,
        phone: form.phone,
        website: form.website,
        bio: form.bio,
        address: form.address,
        email: form.email,
        licenseNumber: form.licenseNumber.trim(),
        licenseState: form.licenseState.trim() || 'FL',
        licenseExpiresAt: form.licenseExpiresAt || null,
        insuranceCarrier: form.insuranceCarrier.trim() || null,
        insuranceExpiresAt: form.insuranceExpiresAt || null,
        emergencyAvailable: form.emergencyAvailable,
        yearsInBusiness: typeof form.yearsInBusiness === 'number' && Number.isFinite(form.yearsInBusiness)
          ? form.yearsInBusiness
          : null,
        logoPath,
        licensePath,
        insurancePath,
        honeypot: honeypot.value,
        turnstileToken: turnstileToken.value
      }
    })

    submitted.value = true
  } catch (e: unknown) {
    const fetchError = e as { statusMessage?: string; data?: { statusMessage?: string }; message?: string }
    errorMessage.value =
      fetchError.statusMessage
      ?? fetchError.data?.statusMessage
      ?? fetchError.message
      ?? 'Submission failed. Please try again.'

    if (turnstileSiteKey && turnstileWidgetId.value && window.turnstile) {
      window.turnstile.reset(turnstileWidgetId.value)
      turnstileToken.value = ''
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UPage class="min-h-dvh bg-default">
    <section class="relative isolate overflow-hidden">
      <div class="pointer-events-none absolute inset-0 -z-10">
        <div class="absolute -top-48 left-1/2 size-[760px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div
          class="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,color-mix(in_oklab,var(--ui-text-muted)_25%,transparent)_1px,transparent_0)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_72%)]"
        />
      </div>

      <UContainer class="py-20 sm:py-24 lg:py-24">
        <div class="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div class="inline-flex items-center gap-2 rounded-full border border-default/70 bg-default/80 px-3 py-1 text-xs font-semibold backdrop-blur">
            <span class="relative inline-flex size-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span class="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <span class="text-muted">
              List your business
            </span>
          </div>

          <h1 class="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-highlighted sm:text-6xl lg:text-7xl">
            Get listed.
            <span class="block text-primary">Get the call.</span>
          </h1>

          <p class="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted sm:text-xl">
            Join Florida's directory of verified, licensed trade pros. Submit once, review in about a day, and start fielding direct calls from homeowners.
          </p>

          <div class="mt-9">
            <UButton
              to="#submit-form"
              size="xl"
              color="secondary"
              icon="i-lucide-arrow-down"
              class="sm:w-auto"
            >
              Start your listing
            </UButton>
          </div>

          <div class="mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted">
            <div
              v-for="signal in heroSignals"
              :key="signal.label"
              class="inline-flex items-center gap-1.5"
            >
              <UIcon :name="signal.icon" class="size-4 text-primary" />
              <span class="font-medium text-default">{{ signal.label }}</span>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <UContainer id="submit-form" class="scroll-mt-24 pt-2 pb-10">
      <UPageBody class="pb-16">
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

            <div class="space-y-4 rounded-xl border border-default/70 bg-elevated/30 p-4 sm:p-5">
              <div>
                <p class="text-sm font-semibold text-highlighted">
                  License & insurance details
                </p>
                <p class="mt-1 text-xs text-muted">
                  License number is shown publicly. Expiration dates and insurance carrier are kept internal and help us verify faster.
                </p>
              </div>

              <UFormField class="w-full" label="License Number" required>
                <UInput
                  v-model="form.licenseNumber"
                  class="w-full"
                  size="xl"
                  placeholder="CFC1428721"
                  autocomplete="off"
                />
              </UFormField>

              <div class="grid gap-4 md:grid-cols-3">
                <UFormField class="w-full" label="License State">
                  <UInput
                    v-model="form.licenseState"
                    class="w-full"
                    size="xl"
                    maxlength="2"
                    placeholder="FL"
                  />
                </UFormField>

                <UFormField class="w-full" label="License Expiration">
                  <UInput
                    v-model="form.licenseExpiresAt"
                    type="date"
                    class="w-full"
                    size="xl"
                  />
                </UFormField>

                <UFormField class="w-full" label="Years in Business">
                  <UInput
                    v-model.number="form.yearsInBusiness"
                    type="number"
                    min="0"
                    max="200"
                    class="w-full"
                    size="xl"
                    placeholder="12"
                  />
                </UFormField>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <UFormField class="w-full" label="Insurance Carrier">
                  <UInput
                    v-model="form.insuranceCarrier"
                    class="w-full"
                    size="xl"
                    placeholder="State Farm"
                  />
                </UFormField>

                <UFormField class="w-full" label="Insurance Expiration">
                  <UInput
                    v-model="form.insuranceExpiresAt"
                    type="date"
                    class="w-full"
                    size="xl"
                  />
                </UFormField>
              </div>

              <div class="flex items-center justify-between gap-3 rounded-lg bg-default/60 p-3">
                <div>
                  <p class="text-sm font-medium text-default">
                    24/7 emergency availability
                  </p>
                  <p class="text-xs text-muted">
                    Toggle on if your business answers emergency calls outside normal hours.
                  </p>
                </div>
                <USwitch v-model="form.emergencyAvailable" />
              </div>
            </div>

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

            <div aria-hidden="true" class="pointer-events-none absolute left-[-9999px] top-[-9999px] opacity-0">
              <label>
                Leave this field empty
                <input
                  v-model="honeypot"
                  type="text"
                  name="company_homepage"
                  tabindex="-1"
                  autocomplete="off"
                >
              </label>
            </div>

            <div v-if="turnstileSiteKey" class="pt-2">
              <div ref="turnstileEl" />
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

    <div class="flex flex-col pb-20" :class="landingStackGap">
      <section class="relative isolate overflow-hidden py-20 sm:py-28 lg:py-32">
        <div class="absolute inset-0 -z-10">
          <img
            src="/images/how_it_works.png"
            alt=""
            class="size-full object-cover object-center"
          >
          <div class="absolute inset-0 bg-stone-950/75" />
        </div>

        <UContainer>
          <div class="flex flex-col gap-3 text-center">
            <p class="text-base font-semibold text-primary sm:text-lg">
              How it works
            </p>
            <h2 class="text-3xl font-semibold tracking-tight text-white lg:text-5xl">
              Get listed in three steps
            </h2>
            <p class="mx-auto max-w-3xl text-base text-white/80">
              From submission to live listing, most contractors are up on Florida Trade Specialists within a day.
            </p>
          </div>

          <div class="mt-10 grid gap-4 md:grid-cols-3">
            <UCard
              v-for="(step, index) in contractorSteps"
              :key="step.title"
              :ui="{ root: 'h-full rounded-2xl border border-default/70 bg-default divide-y-0' }"
            >
              <div class="flex items-start gap-3">
                <div
                  class="grid size-11 shrink-0 place-items-center rounded-full bg-primary/15 text-base font-semibold leading-none tabular-nums text-primary"
                >
                  {{ index + 1 }}
                </div>
                <div class="space-y-2">
                  <p class="text-xl font-semibold text-highlighted">
                    {{ step.title }}
                  </p>
                  <p class="text-base leading-relaxed text-muted">
                    {{ step.description }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>
        </UContainer>
      </section>

      <UPageSection
        headline="For contractors"
        title="Turn your license into your best marketing asset."
        description="Your credentials already set you apart from the unlicensed crowd. Florida Trade Specialists puts them in front of homeowners who are actively searching for a pro."
        orientation="horizontal"
        :features="contractorFeatures"
        :ui="landingSectionUi"
      >
        <div
          class="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-default/70 shadow-xl lg:aspect-auto lg:h-full lg:self-stretch"
        >
          <img
            src="/images/for_contractors.png"
            alt="Contractor managing their listing on Florida Trade Specialists"
            class="absolute inset-0 size-full object-cover object-center"
            loading="lazy"
          >
        </div>
      </UPageSection>

      <UContainer class="mt-12 lg:mt-16">
        <section>
          <div class="mb-6 text-center">
            <p class="text-base font-semibold text-primary sm:text-lg">
              FAQ
            </p>
            <h2 class="text-3xl font-semibold tracking-tight text-highlighted lg:text-5xl">
              Contractor questions, answered
            </h2>
            <p class="mt-2 text-muted">
              Common questions from contractors before they submit a listing.
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UCard
              v-for="item in contractorFaqItems"
              :key="item.label"
              :ui="{ root: 'h-full rounded-2xl border border-default/70 bg-default divide-y-0' }"
            >
              <div class="flex items-start gap-3">
                <div class="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  <UIcon :name="item.icon" class="size-5" />
                </div>
                <div class="space-y-2">
                  <p class="text-lg font-semibold text-highlighted">
                    {{ item.label }}
                  </p>
                  <p class="text-base leading-relaxed text-muted">
                    {{ item.content }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>
        </section>
      </UContainer>
    </div>
  </UPage>
</template>
